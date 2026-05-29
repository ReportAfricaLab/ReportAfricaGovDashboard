'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-[#D92D20] text-white',
  high: 'bg-[#F97316] text-white',
  medium: 'bg-[#F4B400] text-gray-900',
  low: 'bg-[#2563EB] text-white',
};

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { token } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.reports.getById(id).then(setReport).finally(() => setLoading(false));
    api.comments.getByReport(id).then((data) => setComments(data.data || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!token || !report?.author?.id) return;
    api.follows.isFollowing(token, report.author.id).then(setIsFollowing).catch(() => {});
  }, [token, report]);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!token || !id) return;
    const updated = type === 'upvote' ? await api.reports.upvote(token, id) : await api.reports.downvote(token, id);
    setReport(updated);
  };

  const handleFollow = async () => {
    if (!token || !report?.author?.id) return;
    if (isFollowing) {
      await api.follows.unfollow(token, report.author.id);
      setIsFollowing(false);
    } else {
      await api.follows.follow(token, report.author.id);
      setIsFollowing(true);
    }
  };

  const handleComment = async () => {
    if (!token || !id || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await api.comments.create(token, { reportId: id, text: commentText.trim() });
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch {}
    setSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    if (!token) return;
    await api.comments.like(token, commentId);
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>;
  if (!report) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Report not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Report Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 text-xs font-bold rounded ${SEVERITY_COLORS[report.severity]}`}>
            {report.severity.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500 capitalize">{report.category.replace('_', ' ')}</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded ${report.verificationLevel === 'unverified' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
            {report.verificationLevel.replace('_', ' ')}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{report.title}</h1>
        <p className="text-gray-600 leading-relaxed mb-6">{report.description}</p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg">
          <span>📍</span>
          <span>{report.city || report.state || `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`}</span>
          <span className="ml-auto text-xs">{report.country}</span>
        </div>

        {/* Author + Follow */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-6">
          <div className="text-sm">
            <span className="text-gray-500">Reported by </span>
            <span className="font-medium text-gray-900">{report.author?.displayName || 'Anonymous'}</span>
          </div>
          <div className="flex items-center gap-2">
            {report.author?.id && token && (
              <button onClick={handleFollow}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-[#0F7B6C] text-white hover:bg-[#0B6E4F]'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Voting */}
        <div className="flex items-center gap-4">
          <button onClick={() => handleVote('upvote')}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium">
            ↑ Confirm ({report.upvotes})
          </button>
          <button onClick={() => handleVote('downvote')}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
            ↓ Dispute ({report.downvotes})
          </button>
          <span className="ml-auto text-sm text-gray-400">👁️ {report.viewCount} views</span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">💬 Comments ({comments.length})</h2>

        {/* Comment Input */}
        {token && (
          <div className="flex gap-2 mb-6">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..." maxLength={1000}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F7B6C]"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
            <button onClick={handleComment} disabled={submitting}
              className="px-4 py-2.5 bg-[#0F7B6C] text-white rounded-lg text-sm font-medium hover:bg-[#0B6E4F] transition disabled:opacity-50">
              Post
            </button>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment: any) => (
              <div key={comment.id} className="border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#0F7B6C] flex items-center justify-center text-white text-xs font-bold">
                    {comment.user?.displayName?.[0] || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{comment.user?.displayName || 'User'}</span>
                  <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => handleLike(comment.id)} className="ml-auto text-xs text-gray-400 hover:text-red-500">
                    ♥ {comment.likes || 0}
                  </button>
                </div>
                <p className="text-sm text-gray-700 ml-8">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
