'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { adminAPI.overview().then(setData).catch(() => {}); }, []);

  const stats = [
    { label: 'Total Users', value: data?.totalUsers || '—', color: 'text-emerald-400' },
    { label: 'Total Reports', value: data?.totalReports || '—', color: 'text-blue-400' },
    { label: 'Active Campaigns', value: data?.activeCampaigns || '—', color: 'text-orange-400' },
    { label: 'Platform Revenue', value: data?.revenue || '—', color: 'text-yellow-400' },
    { label: 'Businesses', value: data?.totalBusinesses || '—', color: 'text-purple-400' },
    { label: 'Active Challenges', value: data?.activeChallenges || '—', color: 'text-pink-400' },
    { label: 'Live Streams', value: data?.liveStreams || '—', color: 'text-red-400' },
    { label: 'Tips Today', value: data?.tipsToday || '—', color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/users', icon: '👥', label: 'Users' },
            { href: '/reports', icon: '📰', label: 'Reports' },
            { href: '/notifications', icon: '🔔', label: 'Send Notification' },
            { href: '/moderation', icon: '⚠️', label: 'Moderation Queue' },
            { href: '/businesses', icon: '🏪', label: 'Businesses' },
            { href: '/challenges', icon: '🎯', label: 'Challenges' },
            { href: '/livestreams', icon: '🔴', label: 'Livestreams' },
            { href: '/courses', icon: '🎓', label: 'Academy' },
          ].map((a) => (
            <a key={a.href} href={a.href} className="p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-emerald-500 transition text-center">
              <p className="text-lg">{a.icon}</p><p className="text-xs text-gray-300 mt-1">{a.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
