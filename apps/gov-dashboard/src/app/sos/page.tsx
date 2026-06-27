'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function SOSPage() {
  const { country } = useJurisdiction();
  const [alerts, setAlerts] = useState<any[]>([]);

  const load = () => {
    govAPI.sosLive(country).then(d => {
      const newAlerts = Array.isArray(d) ? d : [];
      if (newAlerts.length > alerts.length && alerts.length > 0) {
        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play().catch(() => {}); } catch {}
      }
      setAlerts(newAlerts);
    }).catch(() => {});
  };

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [country]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🚨 Live SOS Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">Auto-refreshes every 15 seconds — {country}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400">LIVE</span>
        </div>
      </div>
      <div className="space-y-3">
        {alerts.map((r: any) => (
          <a key={r.id} href={`/report/${r.id}`} className="block bg-red-950/30 rounded-xl p-5 border border-red-800 hover:border-red-500 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">EMERGENCY</span>
              <span className="text-xs text-gray-400 capitalize">{r.category?.replace('_', ' ')}</span>
              <span className="text-xs text-gray-500 ml-auto">{new Date(r.createdAt).toLocaleTimeString()}</span>
            </div>
            <h3 className="font-medium text-gray-100">{r.title}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{r.description}</p>
            <p className="text-xs text-gray-500 mt-2">📍 {r.state || r.city || ''} {r.latitude ? `· ${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}` : ''}</p>
          </a>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-16 bg-[#1E293B] rounded-xl border border-gray-700">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-300 font-medium">No active emergencies</p>
            <p className="text-gray-500 text-sm mt-1">SOS alerts from the last hour will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
