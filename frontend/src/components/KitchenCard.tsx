import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, MapPin, Star, Video } from 'lucide-react';
import type { KitchenCard as K } from '../types';
import { Badge, VegMark, cx } from './ui';
import { fmtTime, rupee } from '../utils/format';

export default function KitchenCard({ k }: { k: K }) {
  const videoToday = k.lastVideoVerifiedOn && (Date.now() - new Date(k.lastVideoVerifiedOn).getTime()) < 3 * 86400000;
  return (
    <Link to={`/kitchens/${k.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={k.coverImage || '/images/hero-leaf-meal.jpg'} alt={k.name} loading="lazy"
          className={cx('h-full w-full object-cover transition duration-500 group-hover:scale-105', !k.acceptingNow && 'grayscale-[40%]')} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {k.verified && <Badge tone="green" icon={BadgeCheck} className="bg-white/95">Verified</Badge>}
          {videoToday && <Badge tone="purple" icon={Video} className="bg-white/95">Kitchen video checked</Badge>}
        </div>
        {!k.acceptingNow && <span className="absolute right-3 top-3 rounded-full bg-charcoal-900/80 px-2.5 py-1 text-xs font-semibold text-white">
          {k.openNow ? 'Not accepting orders' : `Opens ${fmtTime(k.openTime)}`}</span>}
        {k.todaySpecial && (
          <p className="absolute bottom-3 left-3 right-3 truncate text-sm font-semibold text-white">
            <span className="mr-1.5 rounded bg-saffron-500 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Today</span>{k.todaySpecial}
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-charcoal-900">{k.name}</h3>
            <p className="truncate text-xs text-charcoal-400">by {k.ownerName}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-xs font-bold text-white">
            {k.rating ? k.rating.toFixed(1) : 'New'}<Star className="h-3 w-3 fill-current" />
          </span>
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-charcoal-500">{k.cuisines.join(' • ')}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-500">
          {k.distanceKm != null && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{k.distanceKm} km · {k.area}</span>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{k.etaMinutes} min</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-cream-300 pt-3 mt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-500">
            {k.foodType !== 'NON_VEG' && <VegMark veg />}{k.foodType !== 'VEG' && <VegMark veg={false} />}
            {k.foodType === 'VEG' ? 'Pure veg' : k.foodType === 'NON_VEG' ? 'Non-veg' : 'Veg & non-veg'}
          </span>
          {k.minPrice != null && <span className="text-xs text-charcoal-500">from <b className="text-charcoal-800">{rupee(k.minPrice)}</b></span>}
        </div>
      </div>
    </Link>
  );
}
