'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ChallengesPage() {
  const { token, user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/challenges/feed?country=${user?.country || 'NG'}`)
      .then(r => r.json())
      .then(d => setChallenges(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎯 Promo Challenges</h1>
          <p className="text-gray-500 text-sm mt-1">Make videos about products. Top creators win from the pot.</p>
        </div>
        {token && (
          <Link href="/challenges/create" className="px-4 py-2 text-sm font-semibold text-white bg-[#0F7B6C] rounded-lg hover:bg-[#0B6E4F]">
            + Create Challenge
          </Link>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 font-medium">💡 How it works</p>
        <p className="text-xs text-amber-700 mt-1">Businesses post challenges with a prize pot. Reporters make video reports about the product. Top 5 by views split 70% of the pot. You need Academy courses 1-3 to participate.</p>
      </div>

      {loading && <p className="text-center text-gray-400 py-12">Loading...</p>}

      {!loading && challenges.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-700 font-medium">No active challenges yet</p>
          <p className="text-gray-500 text-sm mt-1">Business owners can create promo challenges for reporters</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {challenges.map((c: any) => (
          <Link key={c.id} href={`/challenges/${c.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition block">
            {c.productImageUrl && <img src={c.productImageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />}
            <h3 className="font-bold text-gray-900 mb-1">{c.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{c.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F7B6C]">{c.currency} {Number(c.potAmount).toLocaleString()} pot</span>
              <span className="text-gray-400">{c.entryCount} entries</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-gray-500">📦 {c.productName}</span>
              <span className="text-red-500">⏰ {Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000))}d left</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
