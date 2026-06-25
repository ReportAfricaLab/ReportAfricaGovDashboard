'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import ReportCard from '@/components/ReportCard';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' }, { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' }, { code: 'UG', name: 'Uganda' }, { code: 'RW', name: 'Rwanda' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'ET', name: 'Ethiopia' }, { code: 'SN', name: 'Senegal' },
  { code: 'CM', name: 'Cameroon' }, { code: 'EG', name: 'Egypt' }, { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' }, { code: 'TN', name: 'Tunisia' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'AO', name: 'Angola' }, { code: 'MZ', name: 'Mozambique' }, { code: 'CD', name: 'DR Congo' },
  { code: 'SD', name: 'Sudan' }, { code: 'LY', name: 'Libya' }, { code: 'ZW', name: 'Zimbabwe' },
  { code: 'ZM', name: 'Zambia' }, { code: 'MW', name: 'Malawi' }, { code: 'BJ', name: 'Benin' },
  { code: 'TG', name: 'Togo' }, { code: 'ML', name: 'Mali' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'NE', name: 'Niger' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'LR', name: 'Liberia' },
  { code: 'SO', name: 'Somalia' }, { code: 'MG', name: 'Madagascar' },
];

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: '_news', label: '📰 News' },
  { key: '_events', label: '🎉 Events' },
  { key: '_business', label: '🏢 Business' },
  { key: 'traffic', label: '🚗 Traffic' },
  { key: 'police_security', label: '🚨 Security' }, { key: 'government', label: '🏛️ Government' },
  { key: 'election', label: '🗳️ Election' }, { key: 'emergency', label: '🚨 Emergency' },
  { key: 'environmental', label: '🌍 Environment' }, { key: 'gender_violence', label: '⚠️ GBV' },
  { key: 'health', label: '🏥 Health' }, { key: 'corruption', label: '💸 Corruption' },
  { key: 'utilities', label: '⚡ Utilities' }, { key: 'missing_persons', label: '🔍 Missing' },
];

const FILTER_GROUPS: Record<string, string[]> = {
  '_news': ['traffic', 'police_security', 'government', 'emergency', 'health', 'corruption', 'utilities', 'missing_persons', 'environmental', 'gender_violence'],
  '_events': ['election'],
  '_business': ['market_consumer'],
};

const NAV_LINKS = [
  { href: '/feed', icon: '📰', label: 'Feed' },
  { href: '/map', icon: '🗺️', label: 'Map' },
  { href: '/live', icon: '🔴', label: 'Live' },
  { href: '/elections', icon: '🗳️', label: 'Elections' },
  { href: '/donations', icon: '🤝', label: 'Helping Hands' },
  { href: '/challenges', icon: '💰', label: 'Promo Gigs' },
  { href: '/business', icon: '🏪', label: 'Business' },
  { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { href: '/watchlist', icon: '📍', label: 'Watchlists' },
];

function SponsoredPost({ business }: { business?: any }) {
  if (!business) return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 relative">
      <span className="absolute top-3 right-3 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Sponsored</span>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">Ad</div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Advertise Here</p>
          <p className="text-xs text-gray-400">Reach millions of Africans</p>
        </div>
      </div>
      <div className="w-full h-32 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-400">Ad Space Available</p>
      </div>
      <p className="text-xs text-gray-400 mt-2">Want to advertise? <Link href="/contact" className="text-[#0F7B6C] font-medium">Contact us</Link></p>
    </div>
  );
  return (
    <div className="bg-white rounded-xl border border-green-100 p-5 relative">
      <span className="absolute top-3 right-3 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">✓ Verified Business</span>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-[#0F7B6C] flex items-center justify-center text-white text-sm font-bold">{business.name?.[0]}</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{business.name}</p>
          <p className="text-xs text-gray-500 capitalize">{business.category?.replace('_', ' ')} · {business.city || business.state || ''}</p>
        </div>
      </div>
      {business.description && <p className="text-xs text-gray-600 line-clamp-2">{business.description}</p>}
      {business.phone && <p className="text-xs text-gray-500 mt-2">📞 {business.phone}</p>}
    </div>
  );
}

function SidebarAdSlot({ slot }: { slot: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-[10px] font-medium text-gray-400 mb-2">Sponsored</p>
      <div className="w-full h-24 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-xs text-gray-400">Ad Slot {slot}</p>
      </div>
      <p className="text-[10px] text-gray-400 mt-2"><Link href="/contact" className="text-[#0F7B6C]">Advertise here →</Link></p>
    </div>
  );
}

export default function FeedPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [country, setCountry] = useState('NG');
  const [category, setCategory] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [promoted, setPromoted] = useState<any[]>([]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ country });
    if (location) { params.set('lat', String(location.lat)); params.set('lng', String(location.lng)); }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/businesses/promoted?${params}`)
      .then(r => r.json()).then(d => setPromoted(Array.isArray(d) ? d : [])).catch(() => {});
  }, [country, location]);

  useEffect(() => {
    setLoading(true);
    let fetchReports;
    if (category && category.startsWith('_')) {
      // Group filter — fetch all and filter client-side
      fetchReports = api.reports.feed(country, 1, location?.lat, location?.lng);
    } else if (category) {
      fetchReports = api.reports.byCategory(country, category);
    } else {
      fetchReports = api.reports.feed(country, 1, location?.lat, location?.lng);
    }

    fetchReports
      .then((res: any) => {
        let data = Array.isArray(res) ? res : res.data || [];
        // Apply group filter
        if (category && FILTER_GROUPS[category]) {
          data = data.filter((r: any) => FILTER_GROUPS[category].includes(r.category));
        }
        setReports(data);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [country, category, location]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex gap-6">

        {/* Left Sidebar - Navigation (desktop only) */}
        <aside className="hidden xl:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <hr className="my-3 border-gray-200" />
                <Link href="/trust" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition">
                  <span>🛡️</span><span>Trust Profile</span>
                </Link>
                <Link href="/earnings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition">
                  <span>💰</span><span>Earnings</span>
                </Link>
                <Link href="/referral" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition">
                  <span>🎁</span><span>Referral</span>
                </Link>
              </>
            )}
          </div>
        </aside>

        {/* Center - Feed */}
        <main className="flex-1 min-w-0 max-w-2xl">
          {/* Country Selector */}
          <div className="flex items-center gap-3 mb-6">
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-[#0F7B6C] cursor-pointer">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">Live Reports</span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${category === cat.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Reports */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">{t('feed.empty', 'Loading reports...')}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">{t('feed.empty', 'No reports yet')}</p>
              <p className="text-gray-300 text-sm mt-2">{t('report.create', 'Be the first to report what\'s happening in your area')}</p>
              {isAuthenticated ? (
                <Link href="/create-report" className="inline-block mt-4 px-6 py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg hover:bg-[#0B6E4F] transition">Create Report</Link>
              ) : (
                <Link href="/register" className="inline-block mt-4 px-6 py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg hover:bg-[#0B6E4F] transition">Sign up to report</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report: any, index: number) => (
                <div key={report.id}>
                  <ReportCard report={report} />
                  {/* Insert promoted business every 5th position */}
                  {(index + 1) % 5 === 0 && <div className="mt-4"><SponsoredPost business={promoted[Math.floor(index / 5) % promoted.length]} /></div>}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar - Trending + Ads (desktop only) */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">

            {/* Trending Reports */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">🔥 Trending in {COUNTRIES.find(c => c.code === country)?.name}</h3>
              {reports.slice(0, 3).map((r: any, i: number) => (
                <Link key={r.id} href={`/report?id=${r.id}`} className="block py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">{r.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">↑ {r.upvotes} · 💬 {r.commentCount}</p>
                </Link>
              ))}
              {reports.length === 0 && <p className="text-xs text-gray-400">No trending reports yet</p>}
            </div>

            {/* Ad Slot 1 */}
            <SidebarAdSlot slot={1} />

            {/* Top Reporters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">🏆 Top Reporters</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <span className="text-xs font-bold text-gray-400 w-4">#{i}</span>
                    <div className="w-7 h-7 rounded-full bg-[#0F7B6C]/10 flex items-center justify-center text-[10px] font-bold text-[#0F7B6C]">?</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">—</p>
                      <p className="text-[10px] text-gray-400">Loading...</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="block mt-3 text-xs text-[#0F7B6C] font-medium hover:underline">View full leaderboard →</Link>
            </div>

            {/* Ad Slot 2 */}
            <SidebarAdSlot slot={2} />

            {/* Emergency Alerts */}
            <div className="bg-red-50 rounded-xl border border-red-100 p-4">
              <h3 className="text-sm font-bold text-red-800 mb-2">🚨 Active Emergencies</h3>
              <p className="text-xs text-red-600">No active emergencies in your area</p>
              <Link href="/emergency" className="block mt-2 text-xs text-red-700 font-medium hover:underline">Report emergency →</Link>
            </div>

            {/* App Download CTA */}
            <div className="bg-[#0F7B6C]/5 rounded-xl border border-[#0F7B6C]/10 p-4 text-center">
              <p className="text-sm font-semibold text-[#0F7B6C]">📱 Get the App</p>
              <p className="text-xs text-gray-500 mt-1">Report faster on mobile</p>
              <div className="flex gap-2 mt-3 justify-center">
                <span className="px-3 py-1.5 bg-black text-white text-[10px] font-medium rounded">App Store</span>
                <span className="px-3 py-1.5 bg-black text-white text-[10px] font-medium rounded">Play Store</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
