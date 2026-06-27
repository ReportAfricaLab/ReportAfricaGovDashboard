'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV = [
  { label: 'Overview', href: '/', icon: '📊' },
  { label: 'Incidents', href: '/incidents', icon: '⚠️' },
  { label: 'Live SOS', href: '/sos', icon: '🚨' },
  { label: 'Elections', href: '/elections', icon: '🗳️' },
  { label: 'Hotspots', href: '/hotspots', icon: '🔥' },
  { label: 'Trends', href: '/trends', icon: '📈' },
  { label: 'Campaigns', href: '/campaigns', icon: '💰' },
  { label: 'Livestreams', href: '/livestreams', icon: '🔴' },
  { label: 'Export', href: '/export', icon: '📥' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function GovShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [govUser, setGovUser] = useState<any>(null);

  useEffect(() => {
    if (pathname === '/login') { setAuthed(true); return; }
    const token = localStorage.getItem('gov_token');
    if (!token) { router.replace('/login'); return; }

    // Verify role
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';
    fetch(`${API_URL}/gov/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.isGov) { localStorage.removeItem('gov_token'); router.replace('/login'); return; }
        setGovUser(data);
        setAuthed(true);
      })
      .catch(() => { localStorage.removeItem('gov_token'); router.replace('/login'); });
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('gov_token');
    router.replace('/login');
  };

  if (!authed) return null;
  if (pathname === '/login') return <>{children}</>;

  // Pass jurisdiction to pages via data attribute
  const jurisdiction = govUser?.jurisdiction || { country: 'NG', state: '' };
  if (typeof window !== 'undefined' && govUser) {
    (window as any).__govJurisdiction = jurisdiction;
    (window as any).__govUser = govUser;
  }

  return (
    <div className="flex">
      <aside className="w-60 h-screen bg-[#0B1120] border-r border-gray-800 p-5 fixed overflow-y-auto">
        <h1 className="text-lg font-bold text-blue-400 mb-2">🏛️ Gov Intel</h1>
        {govUser?.jurisdiction?.country && (
          <p className="text-[10px] text-gray-500 mb-4">📍 {govUser.jurisdiction.state || ''} {govUser.jurisdiction.country}</p>
        )}
        {govUser?.trialActive && govUser?.trialDaysLeft != null && (
          <div className="mb-4 px-2 py-1.5 bg-amber-900/30 border border-amber-700/30 rounded text-[10px] text-amber-400">
            🕐 Trial: {govUser.trialDaysLeft} days left
          </div>
        )}
        <nav className="space-y-0.5 text-sm">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-3 py-2 rounded transition ${pathname === item.href ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
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
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
