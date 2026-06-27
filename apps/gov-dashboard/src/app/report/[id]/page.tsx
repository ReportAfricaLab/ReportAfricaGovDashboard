'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/reports/${id}`).then(r => r.json()).then(setReport).catch(() => {});
    fetch(`${API_URL}/comments/report/${id}`).then(r => r.json()).then(d => setComments(d.data || [])).catch(() => {});
    fetch(`${API_URL}/report-updates/report/${id}`).then(r => r.json()).then(d => setUpdates(d.data || [])).catch(() => {});
  }, [id]);

  // Report detail with map coordinates display
  if (!report) return <p className="text-gray-400 text-center py-20">Loading...</p>;

  const mapUrl = report.latitude ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+ff0000(${report.longitude},${report.latitude})/${report.longitude},${report.latitude},13,0/600x200@2x?access_token=pk.eyJ1IjoicmVwb3J0YWZyaWNhIiwiYSI6ImNsdnh4eHh4eDAifQ.placeholder` : null;

  return (
    <div className="max-w-3xl">
      <a href="/incidents" className="text-sm text-blue-400 hover:underline mb-4 block">← Back to Incidents</a>
      <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded text-white ${report.severity === 'critical' ? 'bg-red-600' : report.severity === 'high' ? 'bg-orange-600' : 'bg-blue-600'}`}>{report.severity?.toUpperCase()}</span>
          <span className="text-xs text-gray-400 capitalize">{report.category?.replace('_', ' ')}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${report.verificationLevel === 'community_verified' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>{report.verificationLevel}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">{report.title}</h1>
        {report.aiHeadline && <p className="text-sm text-blue-300 mb-3">🤖 {report.aiHeadline}</p>}
        {report.aiModerationScore != null && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">AI Score:</span>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${report.aiModerationScore > 70 ? 'bg-red-500' : report.aiModerationScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${report.aiModerationScore}%` }} />
            </div>
            <span className="text-xs text-gray-400">{report.aiModerationScore}%</span>
          </div>
        )}
        <p className="text-gray-300 leading-relaxed mb-4">{report.description}</p>

        {/* Location Map */}
        {report.latitude && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-800 p-3">
            <p className="text-xs text-gray-400 mb-2">📍 Location</p>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-200">{report.state || report.city || 'Unknown area'}</p>
              <p className="text-xs text-gray-400 mt-1">{Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}</p>
              <a href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`} target="_blank" className="text-xs text-blue-400 mt-2 inline-block hover:underline">Open in Google Maps →</a>
            </div>
          </div>
        )}

        {report.media?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {report.media.map((m: any, i: number) => (
              <div key={i} className="rounded-lg overflow-hidden bg-gray-800">
                {m.type?.startsWith('video') ? (
                  <video src={m.url} controls className="w-full aspect-video object-cover" />
                ) : (
                  <img src={m.url} alt="" className="w-full aspect-video object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg text-xs">
          <div><span className="text-gray-500">Location:</span> <span className="text-gray-200">{report.state || report.city || 'Unknown'}</span></div>
          <div><span className="text-gray-500">Coords:</span> <span className="text-gray-200">{report.latitude ? `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}` : 'N/A'}</span></div>
          <div><span className="text-gray-500">Reporter:</span> <span className="text-gray-200">{report.author?.displayName || 'Anonymous'}</span></div>
          <div><span className="text-gray-500">Trust:</span> <span className="text-gray-200">{report.author?.trustLevel || 'Unknown'}</span></div>
          <div><span className="text-gray-500">Upvotes:</span> <span className="text-emerald-400">{report.upvotes}</span></div>
          <div><span className="text-gray-500">Disputes:</span> <span className="text-red-400">{report.downvotes}</span></div>
          <div><span className="text-gray-500">Views:</span> <span className="text-gray-200">{report.viewCount}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="text-gray-200">{new Date(report.createdAt).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700 mt-4">
          <h2 className="font-semibold mb-3">💬 Comments ({comments.length})</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {comments.map((c: any) => (
              <div key={c.id} className="border-b border-gray-700 pb-2">
                <p className="text-sm text-gray-200">{c.text}</p>
                <p className="text-xs text-gray-500 mt-1">{c.user?.displayName || 'User'} · {new Date(c.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Updates/Timeline */}
      {updates.length > 0 && (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700 mt-4">
          <h2 className="font-semibold mb-3">📝 Updates Timeline ({updates.length})</h2>
          <div className="space-y-2">
            {updates.map((u: any) => (
              <div key={u.id} className="border-l-2 border-blue-500 pl-3 py-1">
                <p className="text-xs text-blue-400 capitalize">{u.type}</p>
                <p className="text-sm text-gray-200">{u.text}</p>
                <p className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
