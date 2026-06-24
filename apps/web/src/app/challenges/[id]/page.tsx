'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reportId, setReportId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_URL}/challenges/${id}`).then(r => r.json()),
      fetch(`${API_URL}/challenges/${id}/leaderboard`).then(r => r.json()),
    ]).then(([c, lb]) => {
      setChallenge(c);
      setLeaderboard(Array.isArray(lb) ? lb : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleEnter = async () => {
    if (!token || !reportId.trim()) { setMessage('Paste your report ID'); return; }
    try {
      const res = await fetch(`${API_URL}/challenges/${id}/enter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reportId.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setMessage('Entry submitted! 🎉'); setReportId(''); }
      else setMessage(data.message || 'Failed to enter');
    } catch { setMessage('Failed'); }
    setTimeout(() => setMessage(''), 4000);
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>;
  if (!challenge) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">Challenge not found</div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / 86400000));
  const pool70 = Number(challenge.potAmount) * 0.7;
  const splits = [0.34, 0.24, 0.19, 0.13, 0.10];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href="/challenges" className="text-sm text-[#0F7B6C] hover:underline mb-4 block">← All Challenges</a>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {challenge.productImageUrl && <img src={challenge.productImageUrl} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{challenge.title}</h1>
        <p className="text-gray-600 mb-4">{challenge.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-[#0F7B6C]">{challenge.currency} {Number(challenge.potAmount).toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Total Pot</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{challenge.entryCount}</p>
            <p className="text-[10px] text-gray-500">Entries</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600">{daysLeft}d</p>
            <p className="text-[10px] text-gray-500">Remaining</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">📦</p>
            <p className="text-[10px] text-gray-500">{challenge.productName}</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">💰 Prize Split (70% of pot)</p>
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            {splits.map((s, i) => (
              <div key={i}>
                <p className="font-bold text-amber-900">#{i + 1}</p>
                <p className="text-amber-700">{challenge.currency} {Math.round(pool70 * s).toLocaleString()}</p>
                <p className="text-amber-600 text-[10px]">{s * 100}%</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">By: {challenge.creator?.displayName || 'Business'} · Deadline: {new Date(challenge.deadline).toLocaleDateString()}</p>
      </div>

      {/* Enter Challenge */}
      {token && challenge.status === 'active' && daysLeft > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">🎬 Submit Your Entry</h2>
          <p className="text-xs text-gray-500 mb-3">Create a video report about this product, then paste the report ID here. You need Academy courses 1-3 completed.</p>
          <div className="flex gap-2">
            <input value={reportId} onChange={e => setReportId(e.target.value)} placeholder="Paste your report ID"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            <button onClick={handleEnter} className="px-4 py-2.5 bg-[#0F7B6C] text-white rounded-lg text-sm font-medium hover:bg-[#0B6E4F]">Submit</button>
          </div>
          {message && <p className="text-xs mt-2 text-green-600">{message}</p>}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">No entries yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry: any, i: number) => (
              <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <span className="text-lg font-bold text-gray-400 w-8">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{entry.reporter?.displayName || 'Reporter'}</p>
                  <p className="text-xs text-gray-500">👁 {entry.viewCount} views</p>
                </div>
                {entry.paidOut && <span className="text-xs font-bold text-green-600">{challenge.currency} {Number(entry.payoutAmount).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
