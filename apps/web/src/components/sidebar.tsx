'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',               label: 'Dashboard',      icon: '⊞' },
  { href: '/service-orders', label: 'Service Orders', icon: '📋' },
  { href: '/dispatch',       label: 'Dispatch',        icon: '📡' },
  { href: '/materials',      label: 'Materials',       icon: '🔧' },
  { href: '/engineers',      label: 'Engineers',       icon: '👷' },
  { href: '/reports',        label: 'Reports',         icon: '📊' },
  { href: '/webhooks',       label: 'Webhooks',        icon: '🔗' },
  { href: '/api-keys',       label: 'API Keys',        icon: '🔑' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-brand-900 flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-brand-800">
        <span className="text-white font-bold text-lg tracking-tight">Veritek</span>
        <span className="ml-2 text-brand-100 text-xs font-medium">Back Office</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon }) => {
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
    </aside>
  );
}
