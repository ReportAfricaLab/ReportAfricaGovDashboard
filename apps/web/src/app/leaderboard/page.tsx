'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const PERIODS = ['week', 'month', 'all'] as const;

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [data, setData] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.leaderboard.getTop('NG', period).then(setData).finally(() => setLoading(false));
    if (token) {
      api.leaderboard.getMyRank(token, 'NG', period).then(setMyRank).catch(() => {});
    }
  }, [period, token]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
      <p className="text-gray-500 text-sm mb-6">Top reporters in your country</p>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${period === p ? 'bg-[#0F7B6C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {myRank?.rank && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-green-700 font-medium">Your Rank</p>
          <p className="text-lg font-bold text-gray-900">{getRankEmoji(myRank.rank)} #{myRank.rank} · Score: {myRank.score}</p>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading...</p>
      ) : (
        <div className="space-y-2">
          {data.map((item: any) => (
            <div key={item.userId} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4">
              <span className="text-lg font-bold w-10 text-center">{getRankEmoji(item.rank)}</span>
              <div className="w-9 h-9 rounded-full bg-[#0F7B6C] flex items-center justify-center text-white font-bold text-sm">
                {item.displayName?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.displayName || item.username}</p>
                <p className="text-xs text-gray-500">{item.reportCount} reports · {item.totalUpvotes} upvotes</p>
              </div>
              <span className="text-lg font-bold text-[#0F7B6C]">{item.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
