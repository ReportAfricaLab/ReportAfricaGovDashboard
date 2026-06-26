const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function govFetch(endpoint: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gov_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const govAPI = {
  login: (email: string, password: string) =>
    fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then((r) => r.json()),
  dashboard: (country: string, state?: string) => govFetch(`/analytics/dashboard?country=${country}${state ? `&state=${state}` : ''}`),
  hotspots: (country: string, category?: string) => govFetch(`/analytics/hotspots?country=${country}${category ? `&category=${category}` : ''}`),
  trending: (country: string) => govFetch(`/analytics/trending?country=${country}`),
  donations: (country: string) => govFetch(`/analytics/donations?country=${country}`),
  mapData: (country: string, state?: string) => govFetch(`/reports/feed?country=${country}${state ? `&state=${state}` : ''}&page=1`),
};
