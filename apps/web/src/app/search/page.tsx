'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#D92D20',
  high: '#F97316',
  medium: '#F4B400',
  low: '#2563EB',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => loadSuggestions(), 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadTrending = async () => {
    try {
      const res = await fetch(`${API_URL}/search/trending?country=NG`);
      const data = await res.json();
      setTrending(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadSuggestions = async () => {
    try {
      const res = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(query)}&country=NG`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {}
  };

  const search = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/search/reports?q=${encodeURIComponent(searchQuery)}&country=NG`);
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Reports</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search incidents, reports, locations..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F7B6C] outline-none" />
          <button onClick={() => search()} className="px-6 py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg hover:bg-[#0B6E4F]">
            Search
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setQuery(s); search(s); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading && <div className="text-center py-12 text-gray-400">Searching...</div>}

      {!loading && searched && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{total} result{total !== 1 ? 's' : ''} found</p>
          {results.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r: any) => (
                <Link key={r.id} href={`/report?id=${r.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[r.severity] || '#2563EB' }} />
                    <span className="text-xs text-gray-500 capitalize">{r.category?.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">· {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{r.author?.displayName || 'Anonymous'} · ▲ {r.upvotes || 0}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trending (shown before search) */}
      {!searched && !loading && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🔥 Trending Now</h2>
          {trending.length === 0 ? (
            <p className="text-sm text-gray-400">No trending reports right now</p>
          ) : (
            <div className="space-y-3">
              {trending.map((r: any) => (
                <Link key={r.id} href={`/report?id=${r.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[r.severity] || '#2563EB' }} />
                    <span className="text-xs text-gray-500 capitalize">{r.category?.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{r.author?.displayName || 'Anonymous'} · ▲ {r.upvotes || 0}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
