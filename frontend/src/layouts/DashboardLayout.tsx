import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { Avatar, cx } from '../components/ui';

export interface NavItem { to: string; label: string; icon: LucideIcon; badge?: number | string; end?: boolean; }

/** Shared shell for the Admin and Kitchen Owner portals: left sidebar + top bar. */
export default function DashboardLayout({ nav, portalLabel, topRight, banner }:
  { nav: NavItem[]; portalLabel: string; topRight?: ReactNode; banner?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const home = nav[0]?.to ?? '/';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5"><Logo to={home} light sub={portalLabel} />
        <button className="text-white lg:hidden" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-50/80 hover:bg-white/10 hover:text-white')}>
            <n.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.badge != null && n.badge !== 0 && <span className="rounded-full bg-saffron-500 px-2 py-0.5 text-[10px] font-bold text-white">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.fullName}</p><p className="truncate text-xs text-brand-100/70">@{user?.username}</p></div>
          <button title="Logout" onClick={() => { logout(); navigate(portalLabel === 'Super Admin' ? '/admin/login' : '/kitchen/login'); }}
            className="rounded-lg p-2 text-brand-50 hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <aside className="fixed inset-y-0 left-0 z-[700] hidden w-64 bg-gradient-to-b from-brand-800 to-brand-900 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-[900] bg-charcoal-900/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 bg-gradient-to-b from-brand-800 to-brand-900" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-[600] flex h-16 items-center gap-3 border-b border-cream-200 bg-cream-100/90 px-4 backdrop-blur-lg sm:px-6">
          <button className="rounded-xl p-2 hover:bg-cream-200 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <p className="text-sm text-charcoal-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="ml-auto flex items-center gap-2">{topRight}</div>
        </header>
        {banner}
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
