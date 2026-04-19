'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './logo';
import type { AdminMe } from '@/lib/api';

const NAV = [
  { href: '/',               label: 'Dashboard',      icon: '⊞',  adminOnly: false },
  { href: '/service-orders', label: 'Service Orders', icon: '📋', adminOnly: false },
  { href: '/dispatch',       label: 'Dispatch',        icon: '📡', adminOnly: false },
  { href: '/materials',      label: 'Materials',       icon: '🔧', adminOnly: false },
  { href: '/engineers',      label: 'Users',           icon: '👷', adminOnly: false },
  { href: '/sites',          label: 'Sites',           icon: '📍', adminOnly: false },
  { href: '/reports',        label: 'Reports',         icon: '📊', adminOnly: false },
  { href: '/webhooks',       label: 'Webhooks',        icon: '🔗', adminOnly: true  },
  { href: '/api-keys',       label: 'API Keys',        icon: '🔑', adminOnly: true  },
];

const ROLE_BADGE: Record<string, { label: string; colours: string }> = {
  admin:      { label: 'Admin',      colours: 'bg-violet-500/20 text-violet-200 ring-violet-500/30' },
  dispatcher: { label: 'Dispatcher', colours: 'bg-blue-500/20 text-blue-200 ring-blue-500/30' },
  engineer:   { label: 'Engineer',   colours: 'bg-emerald-500/20 text-emerald-200 ring-emerald-500/30' },
};

function NavItems({ user, onNavigate }: { user: AdminMe; onNavigate?: () => void }) {
  const pathname = usePathname();
  const filteredNav = NAV.filter(({ adminOnly }) => !adminOnly || user.role === 'admin');

  return (
    <nav className="flex-1 py-4 space-y-0.5 px-2">
      {filteredNav.map(({ href, label, icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-700 text-white'
                : 'text-brand-100 hover:bg-brand-800 hover:text-white'
            }`}
          >
            <span className="w-5 text-center text-base">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user: AdminMe }) {
  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE['dispatcher'];
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  return (
    <div className="px-3 pb-4 pt-2 border-t border-brand-800">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user.firstName} {user.lastName}
          </p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset mt-0.5 ${badge.colours}`}>
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ user }: { user: AdminMe }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 min-h-screen bg-brand-900 flex-col shrink-0">
        <Link href="/" className="h-16 flex items-center px-5 gap-3 border-b border-brand-800 hover:opacity-80 transition-opacity">
          <Logo height={32} />
          <span className="text-brand-100 font-medium leading-tight">
            <span className="text-base">Veritek</span><br />
            <span className="text-xs">Back Office System</span>
          </span>
        </Link>
        <NavItems user={user} />
        <UserCard user={user} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-brand-900 flex items-center px-4 gap-3 shadow-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-brand-100 hover:text-white p-1.5 rounded-lg hover:bg-brand-800 transition-colors"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Logo height={28} />
          <span className="text-brand-100 font-medium text-base">Veritek</span>
        </Link>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-brand-900 flex flex-col transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-brand-800">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <Logo height={28} />
            <span className="text-brand-100 font-medium leading-tight">
              <span className="text-base">Veritek</span><br />
              <span className="text-xs">Back Office System</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-brand-100 hover:text-white p-1.5 rounded-lg hover:bg-brand-800 transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <NavItems user={user} onNavigate={() => setMobileOpen(false)} />
        <UserCard user={user} />
      </aside>
    </>
  );
}
