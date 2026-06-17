'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#D92D20',
  high: '#F97316',
  medium: '#F4B400',
  low: '#2563EB',
};

interface MapReport {
  id: string;
  title: string;
  category: string;
  severity: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  author?: { displayName: string };
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [safeRouteActive, setSafeRouteActive] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 6.5244, lng: 3.3792 }) // Default Lagos
    );
    // Check subscription
    const token = localStorage.getItem('ra_token');
    if (token) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      fetch(`${API_URL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setIsPremium(d.active)).catch(() => {});
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || map.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }));

    map.current.on('load', () => setMapReady(true));

    return () => { map.current?.remove(); map.current = null; };
  }, [userLocation]);

  // Load reports
  useEffect(() => {
    if (!userLocation) return;
    (async () => {
      try {
        const data = await api.reports.nearby(userLocation.lat, userLocation.lng, 20);
        setReports(Array.isArray(data) ? data : []);
      } catch {
        const data = await api.reports.feed('NG');
        setReports(Array.isArray(data) ? data : []);
      }
    })();
  }, [userLocation]);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapReady || reports.length === 0) return;

    reports.forEach((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const el = document.createElement('div');
      el.className = 'report-marker';
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${SEVERITY_COLORS[report.severity] || '#2563EB'};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;`;

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);
      el.addEventListener('click', () => {
        setSelectedReport(report);
        map.current?.flyTo({ center: [lng, lat], zoom: 14 });
      });
    });
  }, [reports, mapReady]);

  // Fallback if no Mapbox token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🗺️</p>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Mapbox Token Required</h2>
          <p className="text-gray-500 text-sm">Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your <code>.env.local</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Map */}
      <div ref={mapContainer} className="flex-1 relative">
        {/* Safe Route Toggle */}
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => {
            if (!isPremium) { if(confirm('Safe Route is a Premium feature. Go to subscription page?')) window.location.href = '/subscription'; return; }
            const next = !safeRouteActive;
            setSafeRouteActive(next);
            if (map.current && mapReady) {
              if (next) {
                const dangerReports = reports.filter(r => ['police_security', 'emergency', 'traffic'].includes(r.category));
                const geojson = { type: 'FeatureCollection' as const, features: dangerReports.map(r => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [Number(r.longitude), Number(r.latitude)] }, properties: {} })) };
                if (map.current.getSource('danger-zones')) { (map.current.getSource('danger-zones') as any).setData(geojson); }
                else { map.current.addSource('danger-zones', { type: 'geojson', data: geojson }); map.current.addLayer({ id: 'danger-heatmap', type: 'circle', source: 'danger-zones', paint: { 'circle-radius': 40, 'circle-color': 'rgba(220, 38, 38, 0.25)', 'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(220, 38, 38, 0.5)' } }); }
              } else {
                if (map.current.getLayer('danger-heatmap')) map.current.removeLayer('danger-heatmap');
                if (map.current.getSource('danger-zones')) map.current.removeSource('danger-zones');
              }
            }
          }} className={`px-4 py-2 rounded-lg text-sm font-medium shadow-md transition ${safeRouteActive ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            🛡️ {safeRouteActive ? 'Safe Route ON' : 'Safe Route'}
            {!isPremium && <span className="ml-1 text-[10px]">PRO</span>}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Nearby Reports</h3>
          <p className="text-xs text-gray-500 mt-1">{reports.length} incidents</p>
        </div>
        <div className="divide-y divide-gray-50">
          {reports.map((report) => (
            <div key={report.id} className={`p-4 cursor-pointer transition ${selectedReport?.id === report.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              onClick={() => {
                setSelectedReport(report);
                const lng = Number(report.longitude), lat = Number(report.latitude);
                if (!isNaN(lng) && !isNaN(lat)) map.current?.flyTo({ center: [lng, lat], zoom: 14 });
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[report.severity] || '#2563EB' }} />
                <span className="text-xs text-gray-500 capitalize">{report.category.replace('_', ' ')}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{report.title}</p>
              <p className="text-xs text-gray-400 mt-1">{report.author?.displayName || 'Anonymous'}</p>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No reports in this area yet</div>
          )}
        </div>
      </div>

      {/* Selected report popup */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-sm z-10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: SEVERITY_COLORS[selectedReport.severity] }}>
                {selectedReport.severity.toUpperCase()}
              </span>
              <h4 className="font-semibold text-gray-900 mt-2">{selectedReport.title}</h4>
              <p className="text-xs text-gray-500 mt-1 capitalize">{selectedReport.category.replace('_', ' ')} · {selectedReport.author?.displayName || 'Anonymous'}</p>
            </div>
            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 ml-3">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
