'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Path = null | 'business' | 'reporter';

export default function ChallengesPage() {
  const { token, user } = useAuth();
  const [path, setPath] = useState<Path>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (path === 'reporter') {
      setLoading(true);
      fetch(`${API_URL}/challenges/feed?country=${user?.country || 'NG'}`)
        .then(r => r.json())
        .then(d => setChallenges(Array.isArray(d) ? d : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [path, user]);

  // Landing — two paths
  if (!path) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">💰 Promo Gigs</h1>
          <p className="text-gray-500 mt-2">Get your product promoted by thousands of citizen reporters — or earn money promoting brands.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <button onClick={() => setPath('business')}
            className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-[#0F7B6C] hover:shadow-lg transition group">
            <span className="text-4xl block mb-4">🏢</span>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#0F7B6C]">I'm a Business</h2>
            <p className="text-sm text-gray-500 mt-2">I want reporters to promote my product or service with video content.</p>
            <p className="text-xs text-[#0F7B6C] font-semibold mt-4">Create a Promo Gig →</p>
          </button>

          <button onClick={() => setPath('reporter')}
            className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-[#0F7B6C] hover:shadow-lg transition group">
            <span className="text-4xl block mb-4">🎬</span>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#0F7B6C]">I'm a Reporter</h2>
            <p className="text-sm text-gray-500 mt-2">I want to earn money by making video reports about products and brands.</p>
            <p className="text-xs text-[#0F7B6C] font-semibold mt-4">Find Promo Gigs →</p>
          </button>
        </div>
      </div>
    );
  }

  // Business Path
  if (path === 'business') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setPath(null)} className="text-sm text-[#0F7B6C] hover:underline mb-6 block">← Back</button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">🏢 Promo Gigs for Businesses</h1>
        <p className="text-gray-500 text-sm mb-8">Get dozens of video reviews and promotions for your product — from real citizen reporters across Africa.</p>

        {/* How it works */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl block mb-2">1️⃣</span>
              <p className="text-sm font-medium text-gray-900">Post a Promo Gig</p>
              <p className="text-xs text-gray-500 mt-1">Set your product, prize pot (min $200), and deadline (min 14 days)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl block mb-2">2️⃣</span>
              <p className="text-sm font-medium text-gray-900">Reporters Create Videos</p>
              <p className="text-xs text-gray-500 mt-1">Trained reporters make video reports showcasing your product to their audience</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl block mb-2">3️⃣</span>
              <p className="text-sm font-medium text-gray-900">Top 5 Win, You Win</p>
              <p className="text-xs text-gray-500 mt-1">Top reporters by views get paid. You get multiple organic video ads for your brand</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-[#0F7B6C]/5 rounded-xl border border-[#0F7B6C]/10 p-6 mb-6">
          <h2 className="font-bold text-[#0F7B6C] mb-3">Why Promo Gigs?</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Multiple video reviews from different creators (not just one)</li>
            <li>✅ Organic reach — reporters share with their own followers</li>
            <li>✅ Pay for results — only top performers earn from the pot</li>
            <li>✅ Trained reporters (Academy certified) = quality content</li>
            <li>✅ Reach audiences across Africa — Nigeria, Ghana, Kenya, and more</li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">💰 Pricing</h2>
          <p className="text-sm text-gray-600">You set the prize pot (minimum ≈$200 in your currency). Platform takes 30% as service fee. The remaining 70% is split among the top 5 reporters by views:</p>
          <div className="flex gap-2 mt-3">
            {[['#1', '34%'], ['#2', '24%'], ['#3', '19%'], ['#4', '13%'], ['#5', '10%']].map(([rank, pct]) => (
              <div key={rank} className="flex-1 bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-amber-900">{rank}</p>
                <p className="text-xs text-amber-700">{pct}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link href="/challenges/create"
          className="block w-full py-4 text-center bg-[#0F7B6C] text-white font-bold rounded-xl hover:bg-[#0B6E4F] transition text-lg">
          Create a Promo Gig
        </Link>
        <p className="text-xs text-gray-400 text-center mt-3">You need to <Link href="/business" className="text-[#0F7B6C] underline">register a business</Link> first.</p>
      </div>
    );
  }

  // Reporter Path
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => setPath(null)} className="text-sm text-[#0F7B6C] hover:underline mb-6 block">← Back</button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">🎬 Promo Gigs for Reporters</h1>
      <p className="text-gray-500 text-sm mb-8">Make video reports about products. Top 5 by views win cash from the prize pot.</p>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <span className="text-2xl block mb-2">1️⃣</span>
            <p className="text-sm font-medium text-gray-900">Find a Gig</p>
            <p className="text-xs text-gray-500 mt-1">Browse active promo gigs below and pick one that interests you</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <span className="text-2xl block mb-2">2️⃣</span>
            <p className="text-sm font-medium text-gray-900">Make a Video Report</p>
            <p className="text-xs text-gray-500 mt-1">Create a report with a video showcasing the product. Be creative!</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <span className="text-2xl block mb-2">3️⃣</span>
            <p className="text-sm font-medium text-gray-900">Get Views, Get Paid</p>
            <p className="text-xs text-gray-500 mt-1">Top 5 reporters by views split 70% of the pot when deadline ends</p>
          </div>
        </div>
      </div>

      {/* Requirements + Prize split */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs font-bold text-amber-800 mb-2">⚠️ Requirements</p>
          <p className="text-xs text-amber-700">You must complete Academy courses 1, 2, and 3 to participate.</p>
          <Link href="https://academy.reportafrica.africa" className="text-xs text-[#0F7B6C] font-medium mt-2 block">Go to Academy →</Link>
        </div>
        <div className="flex-1 bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs font-bold text-green-800 mb-2">💰 Prize Split</p>
          <div className="text-xs text-green-700 space-y-0.5">
            <p>#1 → 34% &nbsp; #2 → 24%</p>
            <p>#3 → 19% &nbsp; #4 → 13%</p>
            <p>#5 → 10%</p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <h2 className="font-bold text-gray-900 mb-4">🔥 Active Promo Gigs</h2>

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

      {!loading && challenges.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-gray-700 font-medium">No active gigs right now</p>
          <p className="text-gray-500 text-sm mt-1">Check back soon — businesses are posting new gigs regularly</p>
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
