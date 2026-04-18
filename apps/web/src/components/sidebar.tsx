'use client';

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

export default function Sidebar({ user }: { user: AdminMe }) {
  const pathname = usePathname();
  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE['dispatcher'];
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <aside className="w-60 min-h-screen bg-brand-900 flex flex-col">
      <Link href="/" className="h-16 flex items-center px-5 gap-3 border-b border-brand-800 hover:opacity-80 transition-opacity">
        <Logo height={32} />
        <span className="text-brand-100 font-medium leading-tight">
          <span className="text-base">Veritek</span><br />
          <span className="text-xs">Back Office System</span>
        </span>
      </Link>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.filter(({ adminOnly }) => !adminOnly || user.role === 'admin').map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-100 hover:bg-brand-800 hover:text-white'
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User identity card */}
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
    </aside>
  );
}
