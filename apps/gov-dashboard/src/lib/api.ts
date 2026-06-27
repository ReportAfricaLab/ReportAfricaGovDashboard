const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

async function govFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gov_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('gov_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const govAPI = {
  login: (email: string, password: string) =>
    fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then((r) => r.json()),

  register: (agencyName: string, jurisdiction: string, contactEmail: string) =>
    govFetch('/gov/register', { method: 'POST', body: JSON.stringify({ agencyName, jurisdiction, contactEmail }) }),

  // Dashboard
  dashboard: (country: string, state?: string) => govFetch(`/analytics/dashboard?country=${country}${state ? `&state=${state}` : ''}`),
  hotspots: (country: string, category?: string) => govFetch(`/analytics/hotspots?country=${country}${category ? `&category=${category}` : ''}`),
  trending: (country: string) => govFetch(`/analytics/trending?country=${country}`),
  donations: (country: string) => govFetch(`/gov/campaigns?country=${country}`),
  mapData: (country: string, state?: string) => govFetch(`/reports/feed?country=${country}${state ? `&state=${state}` : ''}&page=1`),

  // Dedicated gov endpoints
  reportDetail: (id: string) => govFetch(`/gov/reports/${id}`),
  elections: (country: string) => govFetch(`/gov/elections?country=${country}`),
  sosLive: (country: string) => govFetch(`/gov/sos/live?country=${country}`),
  exportData: (country: string, category?: string, severity?: string, state?: string, dateFrom?: string) => {
    const params = new URLSearchParams({ country });
    if (category) params.set('category', category);
    if (severity) params.set('severity', severity);
    if (state) params.set('state', state);
    if (dateFrom) params.set('dateFrom', dateFrom);
    return govFetch(`/gov/export/csv?${params}`);
  },
};
