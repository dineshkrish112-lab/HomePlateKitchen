import { useState } from 'react';
import { Play } from 'lucide-react';
import type { CookingVideo } from '../types';
import StatusBadge from './StatusBadge';
import { fmtDate } from '../utils/format';

/** Video preview card. Seeded demo records only have a thumbnail; uploaded videos play inline. */
export default function VideoCard({ v, footer, showKitchen }: { v: CookingVideo; footer?: React.ReactNode; showKitchen?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const dur = v.durationSeconds ? `${Math.floor(v.durationSeconds / 60)}:${String(v.durationSeconds % 60).padStart(2, '0')}` : '';
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video bg-charcoal-900">
        {playing && v.videoUrl ? <video src={v.videoUrl} controls autoPlay className="h-full w-full object-contain" /> : (
          <button className="group relative h-full w-full" onClick={() => v.videoUrl && setPlaying(true)}>
            <img src={v.thumbnailUrl || '/images/pan-cooking.jpg'} alt="" className="h-full w-full object-cover opacity-90" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lift transition group-hover:scale-110"><Play className="ml-1 h-6 w-6 fill-brand-700 text-brand-700" /></span>
            </span>
            {dur && <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">{dur}</span>}
            {!v.videoUrl && <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Demo record (no file)</span>}
          </button>
        )}
        <span className="absolute left-2 top-2"><StatusBadge status={v.status} className="bg-white/95" /></span>
      </div>
      <div className="p-4">
        {showKitchen && <p className="text-sm font-semibold">{v.kitchen.name} <span className="font-normal text-charcoal-400">· {v.kitchen.area}</span></p>}
        <p className="text-xs font-semibold uppercase text-charcoal-400">Prepared {fmtDate(v.preparationDate)}</p>
        <p className="mt-1 line-clamp-2 text-sm text-charcoal-700">{v.description}</p>
        {v.adminRemarks && <p className="mt-2 rounded-lg bg-cream-100 p-2 text-xs text-charcoal-600"><b>Admin:</b> {v.adminRemarks}</p>}
        {footer}
      </div>
    </div>
  );
}
