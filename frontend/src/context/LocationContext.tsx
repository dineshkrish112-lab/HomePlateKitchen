import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface DeliveryLocation { label: string; address: string; lat: number; lng: number; detected?: boolean; }

interface LocationState {
  location: DeliveryLocation;
  setLocation: (l: DeliveryLocation) => void;
  detect: () => Promise<void>;
  detecting: boolean;
}

const DEFAULT: DeliveryLocation = {
  label: 'SITRA', address: 'SITRA, Coimbatore', lat: 11.0335, lng: 77.031,
};
const KEY = 'homeplate.location';
const LocationContext = createContext<LocationState | null>(null);

/** Coimbatore areas used to give a friendly name to GPS coordinates. */
const AREAS = [
  { name: 'SITRA', lat: 11.0335, lng: 77.031 }, { name: 'Saravanampatti', lat: 11.079, lng: 76.999 },
  { name: 'Peelamedu', lat: 11.027, lng: 77.006 }, { name: 'Gandhipuram', lat: 11.0168, lng: 76.9674 },
  { name: 'Kalapatti', lat: 11.061, lng: 77.04 }, { name: 'Hope College', lat: 11.0265, lng: 77.0185 },
  { name: 'Singanallur', lat: 10.999, lng: 77.032 }, { name: 'Vilankurichi', lat: 11.064, lng: 77.017 },
  { name: 'RS Puram', lat: 11.008, lng: 76.95 }, { name: 'Ganapathy', lat: 11.04, lng: 76.975 },
];

export function nearestArea(lat: number, lng: number) {
  let best = AREAS[0]; let bestD = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestD) { bestD = d; best = a; }
  }
  return { name: best.name, far: Math.sqrt(bestD) > 0.15 };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLoc] = useState<DeliveryLocation>(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
    return DEFAULT;
  });
  const [detecting, setDetecting] = useState(false);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(location)); } catch { /* ignore */ } }, [location]);

  const detect = () => new Promise<void>((resolve) => {
    if (!navigator.geolocation) { toast.error('Location is not supported in this browser'); resolve(); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const near = nearestArea(latitude, longitude);
        setLoc({
          label: near.far ? 'Current location' : near.name,
          address: near.far ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : `Near ${near.name}, Coimbatore`,
          lat: latitude, lng: longitude, detected: true,
        });
        if (near.far) toast('You seem to be outside Coimbatore. HomePlate is currently live only in Coimbatore.', { icon: '📍' });
        else toast.success(`Location set to ${near.name}`);
        setDetecting(false); resolve();
      },
      () => { toast.error('Location permission denied. Pick your area instead.'); setDetecting(false); resolve(); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  return (
    <LocationContext.Provider value={{ location, setLocation: setLoc, detect, detecting }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationCtx() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationCtx must be used inside LocationProvider');
  return ctx;
}
