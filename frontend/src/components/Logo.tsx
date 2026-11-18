import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, sub }: { to?: string; light?: boolean; sub?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0">
        <circle cx="32" cy="32" r="30" fill={light ? '#FBF7EF' : '#217844'} />
        <circle cx="32" cy="35" r="17" fill={light ? '#217844' : '#FBF7EF'} />
        <path d="M20 31c4-8 20-8 24 0" stroke="#F07315" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M27 11c0 4 3 4 3 8M35 11c0 4 3 4 3 8" stroke={light ? '#217844' : '#FBF7EF'} strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="leading-tight">
        <span className={`block font-display text-xl font-semibold ${light ? 'text-white' : 'text-charcoal-900'}`}>Home<span className="text-saffron-500">Plate</span></span>
        {sub && <span className={`block text-[10px] font-semibold uppercase tracking-[.14em] ${light ? 'text-brand-100' : 'text-charcoal-400'}`}>{sub}</span>}
      </span>
    </Link>
  );
}
