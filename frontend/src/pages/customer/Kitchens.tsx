import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, Star, X } from 'lucide-react';
import KitchenCard from '../../components/KitchenCard';
import { MapView } from '../../components/Maps';
import { useLocationCtx } from '../../context/LocationContext';
import { useFetch } from '../../components/useFetch';
import type { KitchenCard as K } from '../../types';
import { EmptyState, ErrorState, Skeleton, cx } from '../../components/ui';
import { rupee } from '../../utils/format';

const CUISINES = ['Kongu', 'Chettinad', 'Madurai', 'Kerala', 'Andhra', 'North Indian', 'Tiffin'];

export default function Kitchens() {
  const { location } = useLocationCtx();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const view = get('view') || 'list';

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v == null || v === '' || p.get(k) === v) p.delete(k); else p.set(k, v);
    setParams(p, { replace: true });
  };

  const url = useMemo(() => {
    const p = new URLSearchParams({ lat: String(location.lat), lng: String(location.lng) });
    ['radius', 'foodType', 'minRating', 'openNow', 'budget', 'cuisine', 'q', 'sort'].forEach((k) => params.get(k) && p.set(k, params.get(k)!));
    return `/public/kitchens?${p}`;
  }, [location, params]);
  const { data, loading, error, reload } = useFetch<K[]>(url);

  const chips: { key: string; value: string; label: string }[] = [
    { key: 'radius', value: '1', label: 'Within 1 km' }, { key: 'radius', value: '3', label: 'Within 3 km' }, { key: 'radius', value: '5', label: 'Within 5 km' },
    { key: 'foodType', value: 'VEG', label: 'Pure veg' }, { key: 'foodType', value: 'NON_VEG', label: 'Non-veg' },
    { key: 'budget', value: 'true', label: 'Budget (under ₹100)' }, { key: 'minRating', value: '4', label: 'Rating 4.0+' },
    { key: 'openNow', value: 'true', label: 'Accepting orders now' },
  ];
  const activeCount = ['radius', 'foodType', 'budget', 'minRating', 'openNow', 'cuisine', 'q'].filter((k) => params.get(k)).length;

  return (
    <div className="container-x py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Home kitchens near {location.label}</h1>
          <p className="mt-1 text-sm text-charcoal-500">
            {loading ? 'Finding kitchens…' : `${data?.length ?? 0} kitchens deliver to you`}
            {get('q') && <> matching "<b>{get('q')}</b>"</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto py-2" value={get('sort') || 'distance'} onChange={(e) => set('sort', e.target.value === 'distance' ? null : e.target.value)}>
            <option value="distance">Sort: Nearest</option><option value="rating">Sort: Top rated</option><option value="price">Sort: Lowest price</option>
          </select>
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-cream-300">
            <button onClick={() => set('view', null)} className={cx('rounded-lg p-2', view === 'list' && 'bg-brand-600 text-white')} aria-label="List view"><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => set('view', 'map')} className={cx('rounded-lg p-2', view === 'map' && 'bg-brand-600 text-white')} aria-label="Map view"><MapIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="scrollbar-none -mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-charcoal-400" />
        {chips.map((c) => (
          <button key={c.label} onClick={() => set(c.key, c.value)} className={cx('chip shrink-0', get(c.key) === c.value && 'chip-active')}>
            {c.key === 'minRating' && <Star className="h-3.5 w-3.5" />}{c.label}
          </button>
        ))}
        {activeCount > 0 && <button onClick={() => setParams(view === 'map' ? { view: 'map' } : {})} className="chip shrink-0 text-red-600"><X className="h-3.5 w-3.5" />Clear</button>}
      </div>
      <div className="scrollbar-none -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <span className="shrink-0 text-xs font-semibold text-charcoal-400">Hometown style:</span>
        {CUISINES.map((c) => (
          <button key={c} onClick={() => set('cuisine', c)} className={cx('chip shrink-0 py-1 text-xs', get('cuisine') === c && 'chip-active')}>{c}</button>
        ))}
        {get('q') && <button onClick={() => set('q', null)} className="chip chip-active shrink-0 py-1 text-xs">"{get('q')}" <X className="h-3 w-3" /></button>}
      </div>

      <div className="mt-6">
        {error ? <ErrorState message={error} onRetry={reload} />
          : loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-80" />)}</div>
          : !data?.length ? <EmptyState image="/images/spices.jpg" title="No kitchens match these filters" text="Try widening the distance or clearing filters. You can also request a dish and nearby kitchens will send offers."
              action={<div className="flex gap-2"><button className="btn-outline" onClick={() => setParams({})}>Clear filters</button><Link to="/request" className="btn-primary">Request a dish</Link></div>} />
          : view === 'map' ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
              <MapView center={{ lat: location.lat, lng: location.lng }} you radiusKm={Number(get('radius')) || 5} height="h-[620px]"
                markers={data.filter((k) => k.latitude).map((k) => ({
                  id: k.id, lat: k.latitude!, lng: k.longitude!, label: `${k.name.split(' ')[0]} ★${k.rating}`,
                  popup: <div className="w-44"><img src={k.coverImage} className="mb-2 h-20 w-full rounded-lg object-cover" alt="" /><b>{k.name}</b><br />{k.distanceKm} km · from {rupee(k.minPrice)}<br /><a href={`/kitchens/${k.id}`} style={{ color: '#217844', fontWeight: 600 }}>View kitchen →</a></div>,
                }))} />
              <div className="max-h-[620px] space-y-4 overflow-y-auto pr-1">{data.map((k) => <KitchenCard key={k.id} k={k} />)}</div>
            </div>
          ) : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((k) => <KitchenCard key={k.id} k={k} />)}</div>}
      </div>
    </div>
  );
}
