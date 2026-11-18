import type { ReactNode } from 'react';
import Logo from '../../components/Logo';

/** Split-screen auth layout with a food photo panel. */
export default function AuthShell({ image, eyebrow, title, text, children, points }:
  { image: string; eyebrow: string; title: string; text: string; children: ReactNode; points?: string[] }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/50 to-brand-900/20" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo light />
          <div className="max-w-md text-white">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-saffron-300">{eyebrow}</p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-white">{title}</h2>
            <p className="mt-4 text-brand-50/85">{text}</p>
            {points && <ul className="mt-6 space-y-2 text-sm text-brand-50/90">{points.map((p) => <li key={p} className="flex gap-2"><span className="text-saffron-300">✓</span>{p}</li>)}</ul>}
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-cream-50">
        <div className="p-6 lg:hidden"><Logo /></div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>
      </div>
    </div>
  );
}
