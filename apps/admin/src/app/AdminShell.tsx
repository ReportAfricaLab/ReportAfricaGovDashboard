'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Users', href: '/users', icon: '👥' },
  { label: 'Reports', href: '/reports', icon: '📰' },
  { label: 'Campaigns', href: '/campaigns', icon: '🤝' },
  { label: 'Businesses', href: '/businesses', icon: '🏪' },
  { label: 'Promo Challenges', href: '/challenges', icon: '🎯' },
  { label: 'Livestreams', href: '/livestreams', icon: '🔴' },
  { label: 'Elections', href: '/elections', icon: '🗳️' },
  { label: 'Notifications', href: '/notifications', icon: '🔔' },
  { label: 'Tips & Earnings', href: '/tips', icon: '💰' },
  { label: 'Academy', href: '/courses', icon: '🎓' },
  { label: 'Revenue', href: '/revenue', icon: '💎' },
  { label: 'Moderation', href: '/moderation', icon: '⚠️' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (pathname === '/login') { setAuthed(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.replace('/login'); return; }
    setAuthed(true);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.replace('/login');
  };

  if (!authed) return null;
  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex">
      <aside className="w-64 min-h-screen bg-gray-950 border-r border-gray-800 p-5 fixed overflow-y-auto">
        <h1 className="text-lg font-bold text-emerald-400 mb-6">🛡️ RA Admin</h1>
        <nav className="space-y-0.5 text-sm">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-3 py-2 rounded transition ${pathname === item.href ? 'bg-emerald-600/20 text-emerald-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
              {item.icon} {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded text-left">
            🚪 Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
