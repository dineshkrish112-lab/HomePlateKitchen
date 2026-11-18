import FileUpload from '../../components/FileUpload';
import { MapPicker } from '../../components/Maps';
import { Field, Toggle, VegMark, cx } from '../../components/ui';
import type { Kitchen } from '../../types';

export type KitchenFormState = {
  ownerName: string; email: string; name: string; description: string; coverImage: string; gallery: string[];
  cuisines: string[]; foodType: 'VEG' | 'NON_VEG' | 'BOTH';
  state: string; district: string; city: string; area: string; address: string; pincode: string;
  latitude: number | null; longitude: number | null; deliveryRadiusKm: number;
  idProofType: string; idProofNumber: string; idProofUrl: string; fssaiNumber: string; fssaiType: string; fssaiCertificateUrl: string;
  openTime: string; closeTime: string; workingDays: string[]; breakfastAvailable: boolean; lunchAvailable: boolean; dinnerAvailable: boolean;
  maxDailyOrders: number; selfDelivery: boolean; avgPrepMinutes: number; todaySpecial: string;
};

export const CUISINES = ['South Indian', 'Kongu', 'Chettinad', 'Madurai', 'Kerala', 'Andhra', 'North Indian', 'Tiffin', 'Snacks'];
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const AREAS = ['SITRA', 'Saravanampatti', 'Peelamedu', 'Gandhipuram', 'Kalapatti', 'Hope College', 'Singanallur', 'Vilankurichi', 'RS Puram', 'Ganapathy', 'Other'];

export function toForm(k: Kitchen): KitchenFormState {
  return {
    ownerName: k.owner?.fullName ?? '', email: k.owner?.email ?? '', name: k.name ?? '', description: k.description ?? '',
    coverImage: k.coverImage ?? '', gallery: (k.galleryImages ?? '').split(',').filter(Boolean),
    cuisines: (k.cuisines ?? '').split(',').map((c) => c.trim()).filter(Boolean), foodType: k.foodType ?? 'BOTH',
    state: k.state ?? 'Tamil Nadu', district: k.district ?? 'Coimbatore', city: k.city ?? 'Coimbatore', area: k.area ?? '',
    address: k.address ?? '', pincode: k.pincode ?? '', latitude: k.latitude ?? null, longitude: k.longitude ?? null,
    deliveryRadiusKm: k.deliveryRadiusKm ?? 5, idProofType: k.idProofType ?? 'Aadhaar', idProofNumber: k.idProofNumber ?? '',
    idProofUrl: k.idProofUrl ?? '', fssaiNumber: k.fssaiNumber ?? '', fssaiType: k.fssaiType ?? 'FSSAI Basic Registration',
    fssaiCertificateUrl: k.fssaiCertificateUrl ?? '', openTime: (k.openTime ?? '07:00').slice(0, 5), closeTime: (k.closeTime ?? '21:00').slice(0, 5),
    workingDays: (k.workingDays ?? 'MON,TUE,WED,THU,FRI,SAT').split(','), breakfastAvailable: k.breakfastAvailable ?? true,
    lunchAvailable: k.lunchAvailable ?? true, dinnerAvailable: k.dinnerAvailable ?? true, maxDailyOrders: k.maxDailyOrders ?? 40,
    selfDelivery: k.selfDelivery ?? true, avgPrepMinutes: k.avgPrepMinutes ?? 35, todaySpecial: k.todaySpecial ?? '',
  };
}

export function toPayload(f: KitchenFormState, step?: number) {
  return {
    ...f, gallery: undefined, galleryImages: f.gallery.join(','), cuisines: f.cuisines.join(','), workingDays: f.workingDays.join(','),
    openTime: f.openTime.length === 5 ? `${f.openTime}:00` : f.openTime, closeTime: f.closeTime.length === 5 ? `${f.closeTime}:00` : f.closeTime,
    onboardingStep: step,
  };
}

type Props = { f: KitchenFormState; set: <K extends keyof KitchenFormState>(k: K, v: KitchenFormState[K]) => void };

export function KitchenInfoSection({ f, set }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kitchen name"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Owner name"><input className="input" value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></Field>
      </div>
      <Field label="Kitchen description" hint="Tell customers what makes your food special (min 30 characters).">
        <textarea className="input min-h-[110px]" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Home-style Kongu cooking with fresh vegetables from the local market…" />
      </Field>
      <Field label="Food type">
        <div className="flex gap-2">
          {(['VEG', 'NON_VEG', 'BOTH'] as const).map((t) => (
            <button key={t} type="button" onClick={() => set('foodType', t)} className={cx('chip flex-1 justify-center py-2.5', f.foodType === t && 'chip-active')}>
              {t !== 'NON_VEG' && <VegMark veg />}{t !== 'VEG' && <VegMark veg={false} />}{t === 'VEG' ? 'Pure veg' : t === 'NON_VEG' ? 'Non-veg' : 'Both'}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Food categories / cuisines">
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <button key={c} type="button" onClick={() => set('cuisines', f.cuisines.includes(c) ? f.cuisines.filter((x) => x !== c) : [...f.cuisines, c])}
              className={cx('chip py-1.5', f.cuisines.includes(c) && 'chip-active')}>{c}</button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <Field label="Cover photo (shown to customers)"><FileUpload value={f.coverImage} onChange={(u) => set('coverImage', u)} label="Upload your best food photo" /></Field>
        <Field label="Kitchen photos">
          <div className="grid grid-cols-2 gap-2">
            {f.gallery.map((g, i) => (
              <div key={g + i} className="relative"><img src={g} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <button type="button" onClick={() => set('gallery', f.gallery.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 text-xs font-bold">✕</button></div>
            ))}
            {f.gallery.length < 6 && <FileUpload aspect="aspect-square" value="" onChange={(u) => u && set('gallery', [...f.gallery, u])} label="Add" />}
          </div>
        </Field>
      </div>
    </div>
  );
}

export function LocationSection({ f, set }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="State"><input className="input" value={f.state} onChange={(e) => set('state', e.target.value)} /></Field>
        <Field label="District"><input className="input" value={f.district} onChange={(e) => set('district', e.target.value)} /></Field>
        <Field label="City"><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <Field label="Area"><select className="input" value={f.area} onChange={(e) => set('area', e.target.value)}><option value="">Select area</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Pincode"><input className="input" maxLength={6} value={f.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
      <Field label="Full address"><textarea className="input min-h-[70px]" value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Door no, street, landmark" /></Field>
      <Field label="GPS location (pin your kitchen)">
        <MapPicker value={{ lat: f.latitude, lng: f.longitude }} radiusKm={f.deliveryRadiusKm} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
      </Field>
      <Field label={`Delivery radius: ${f.deliveryRadiusKm} km`} hint="You deliver yourself, so choose a distance you're comfortable with (max 10 km). Customers see kitchens within 5 km.">
        <input type="range" min={1} max={10} step={0.5} value={f.deliveryRadiusKm} onChange={(e) => set('deliveryRadiusKm', Number(e.target.value))} className="w-full accent-green-700" />
      </Field>
    </div>
  );
}

export function ComplianceSection({ f, set }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-800">Identity verification and food safety verification are reviewed separately. Your documents are visible only to the HomePlate verification team.</div>
      <div>
        <h3 className="mb-3 font-semibold">1. Identity proof</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID type"><select className="input" value={f.idProofType} onChange={(e) => set('idProofType', e.target.value)}>{['Aadhaar', 'PAN', 'Voter ID', 'Driving Licence', 'Passport'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="ID number"><input className="input" value={f.idProofNumber} onChange={(e) => set('idProofNumber', e.target.value)} placeholder="XXXX XXXX 1234" /></Field>
        </div>
        <FileUpload className="mt-3" kind="document" value={f.idProofUrl} onChange={(u) => set('idProofUrl', u)} label="Upload ID proof (photo or PDF)" aspect="aspect-[3/1]" />
      </div>
      <div>
        <h3 className="mb-3 font-semibold">2. FSSAI registration / licence <span className="text-xs font-normal text-charcoal-400">(where applicable)</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type"><select className="input" value={f.fssaiType} onChange={(e) => set('fssaiType', e.target.value)}>{['FSSAI Basic Registration', 'FSSAI State Licence', 'Applied - pending'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="FSSAI number"><input className="input" maxLength={14} value={f.fssaiNumber} onChange={(e) => set('fssaiNumber', e.target.value.replace(/\D/g, ''))} placeholder="14-digit number" /></Field>
        </div>
        <FileUpload className="mt-3" kind="document" value={f.fssaiCertificateUrl} onChange={(u) => set('fssaiCertificateUrl', u)} label="Upload FSSAI certificate" aspect="aspect-[3/1]" />
      </div>
    </div>
  );
}

export function OperationsSection({ f, set }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opening time"><input className="input" type="time" value={f.openTime} onChange={(e) => set('openTime', e.target.value)} /></Field>
        <Field label="Closing time"><input className="input" type="time" value={f.closeTime} onChange={(e) => set('closeTime', e.target.value)} /></Field>
      </div>
      <Field label="Weekly working days">
        <div className="flex flex-wrap gap-2">{DAYS.map((d) => (
          <button key={d} type="button" onClick={() => set('workingDays', f.workingDays.includes(d) ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d])}
            className={cx('chip w-14 justify-center', f.workingDays.includes(d) && 'chip-active')}>{d.slice(0, 3)}</button>
        ))}</div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cream-300 p-3"><Toggle checked={f.breakfastAvailable} onChange={(v) => set('breakfastAvailable', v)} label="Breakfast" /></div>
        <div className="rounded-xl border border-cream-300 p-3"><Toggle checked={f.lunchAvailable} onChange={(v) => set('lunchAvailable', v)} label="Lunch" /></div>
        <div className="rounded-xl border border-cream-300 p-3"><Toggle checked={f.dinnerAvailable} onChange={(v) => set('dinnerAvailable', v)} label="Dinner" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Maximum orders per day"><input className="input" type="number" min={1} value={f.maxDailyOrders} onChange={(e) => set('maxDailyOrders', Number(e.target.value))} /></Field>
        <Field label="Average preparation time (min)"><input className="input" type="number" min={5} value={f.avgPrepMinutes} onChange={(e) => set('avgPrepMinutes', Number(e.target.value))} /></Field>
      </div>
      <div className="rounded-xl border border-cream-300 p-3"><Toggle checked={f.selfDelivery} onChange={(v) => set('selfDelivery', v)} label="I will deliver orders myself (required for version 1)" /></div>
    </div>
  );
}
