'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function CampaignsPage() {
  const { country } = useJurisdiction();
  const [data, setData] = useState<any>(null);

  useEffect(() => { govAPI.donations(country).then(setData).catch(() => {}); }, [country]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">💰 Humanitarian Campaigns</h1>
      <p className="text-gray-400 text-sm mb-6">Active donation campaigns — {country}</p>
      <div className="space-y-3">
        {data?.campaigns?.map((c: any) => (
          <div key={c.id} className="bg-[#1E293B] rounded-xl p-5 border border-gray-700">
            <h3 className="font-medium text-gray-100">{c.title}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>Target: {c.currency} {Number(c.targetAmount).toLocaleString()}</span>
              <span>Raised: {c.currency} {Number(c.currentAmount).toLocaleString()}</span>
              <span className={c.isActive ? 'text-emerald-400' : 'text-gray-500'}>{c.isActive ? '● Active' : '○ Closed'}</span>
            </div>
          </div>
        ))}
        {(!data?.campaigns || data.campaigns.length === 0) && <p className="text-gray-500 text-center py-12">No campaigns in this region</p>}
      </div>
    </div>
  );
}
