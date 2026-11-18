import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, type ReactNode } from 'react';
import { LocateFixed } from 'lucide-react';
import toast from 'react-hot-toast';

// OpenStreetMap tiles: free, no API key. Swap the TileLayer for Google Maps / Mapbox later if required.
const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap contributors';

const pin = (color: string, label = '') => L.divIcon({
  className: '',
  html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">
    <div style="background:${color};color:#fff;border-radius:9999px;padding:6px 8px;font:600 11px 'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25);white-space:nowrap;border:2px solid #fff">${label || '●'}</div>
    <div style="width:2px;height:8px;background:${color}"></div></div>`,
  iconSize: [0, 0],
});

export const kitchenIcon = (label: string) => pin('#217844', label);
export const homeIcon = pin('#F07315', 'You');

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], zoom ?? map.getZoom()); }, [lat, lng]); // eslint-disable-line
  return null;
}

export interface MapMarker { id: number | string; lat: number; lng: number; label: string; popup?: ReactNode; }

export function MapView({ center, markers = [], radiusKm, height = 'h-80', you, zoom = 13 }:
  { center: { lat: number; lng: number }; markers?: MapMarker[]; radiusKm?: number; height?: string; you?: boolean; zoom?: number }) {
  return (
    <div className={`${height} overflow-hidden rounded-2xl ring-1 ring-black/5`}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer url={TILE} attribution={ATTR} />
        <Recenter lat={center.lat} lng={center.lng} />
        {radiusKm && <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000}
          pathOptions={{ color: '#2E9455', weight: 1.5, fillColor: '#2E9455', fillOpacity: 0.06, dashArray: '6 6' }} />}
        {you && <Marker position={[center.lat, center.lng]} icon={homeIcon} />}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={kitchenIcon(m.label)}>
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)) });
  return null;
}

/** GPS location picker: click the map, drag the pin or use the device location. */
export function MapPicker({ value, onChange, radiusKm, height = 'h-72' }:
  { value: { lat?: number | null; lng?: number | null }; onChange: (lat: number, lng: number) => void; radiusKm?: number; height?: string }) {
  const lat = value.lat ?? 11.0168;
  const lng = value.lng ?? 76.9558;
  const useGps = () => {
    if (!navigator.geolocation) return toast.error('Location not supported');
    navigator.geolocation.getCurrentPosition(
      (p) => { onChange(+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6)); toast.success('Location captured'); },
      () => toast.error('Permission denied - click on the map to set your location'),
      { enableHighAccuracy: true, timeout: 10000 });
  };
  return (
    <div className="space-y-2">
      <div className={`relative ${height} overflow-hidden rounded-2xl ring-1 ring-black/5`}>
        <MapContainer center={[lat, lng]} zoom={value.lat ? 15 : 12} className="h-full w-full">
          <TileLayer url={TILE} attribution={ATTR} />
          <Recenter lat={lat} lng={lng} />
          <ClickPicker onPick={onChange} />
          {value.lat != null && (
            <>
              <Marker position={[lat, lng]} icon={kitchenIcon('Kitchen')} draggable
                eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onChange(+ll.lat.toFixed(6), +ll.lng.toFixed(6)); } }} />
              {radiusKm && <Circle center={[lat, lng]} radius={radiusKm * 1000} pathOptions={{ color: '#2E9455', weight: 1, fillOpacity: 0.07 }} />}
            </>
          )}
        </MapContainer>
        <button type="button" onClick={useGps}
          className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-lift hover:bg-brand-50">
          <LocateFixed className="h-4 w-4" /> Use my GPS
        </button>
      </div>
      <p className="text-xs text-charcoal-400">
        {value.lat != null ? `Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)} — drag the pin to adjust.` : 'Click on the map or use GPS to pin the exact location.'}
      </p>
    </div>
  );
}
