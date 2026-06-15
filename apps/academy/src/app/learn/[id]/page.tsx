'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://34-242-14-140.nip.io/api/v1';

function LearnContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIndex = Number(searchParams.get('lesson') || 0);
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('academy_token');
    if (!token) { router.push(`/course/${id}`); return; }
    fetch(`${API_URL}/courses/${id}`).then(r => r.json()).then(setCourse).catch(() => {});
    fetch(`${API_URL}/courses/my-enrollments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        const e = Array.isArray(data) ? data.find((en: any) => en.courseId === id) : null;
        if (e) setEnrollment(e);
        else router.push(`/course/${id}`);
      }).catch(() => {});
  }, [id, router]);

  if (!course || !enrollment) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const lessons = course.lessons?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [];
  const currentLesson = lessons[lessonIndex];
  if (!currentLesson) return <div className="text-center py-20 text-gray-400">Lesson not found</div>;

  const completedLessons = enrollment.completedLessons || [];
  const isLessonComplete = completedLessons.includes(currentLesson.id);
  const progress = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;
  const allDone = completedLessons.length >= lessons.length;

  const markComplete = async () => {
    setCompleting(true);
    const token = localStorage.getItem('academy_token');
    try {
      const res = await fetch(`${API_URL}/courses/${id}/lessons/${currentLesson.id}/complete`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await res.json();
      setEnrollment(updated);
    } catch {}
    setCompleting(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push(`/course/${id}`)} className="text-sm text-[#0F7B6C] mb-4 hover:underline">← Back to course</button>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{completedLessons.length}/{lessons.length} lessons</span>
          <span>{progress}% complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-[#0F7B6C] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-black rounded-xl aspect-video flex items-center justify-center mb-4">
        {currentLesson.videoUrl ? (
          <iframe src={currentLesson.videoUrl} className="w-full h-full rounded-xl" allowFullScreen />
        ) : (
          <div className="text-center text-white">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm opacity-70">Video coming soon</p>
          </div>
        )}
      </div>

      {/* Lesson Info + Complete Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lesson {lessonIndex + 1}: {currentLesson.title}</h1>
          <p className="text-sm text-gray-500">{currentLesson.duration}</p>
        </div>
        {isLessonComplete ? (
          <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">✓ Completed</span>
        ) : (
          <button onClick={markComplete} disabled={completing}
            className="px-4 py-2 bg-[#0F7B6C] text-white text-sm font-medium rounded-lg hover:bg-[#0B6E4F] disabled:opacity-50">
            {completing ? '...' : '✓ Mark Complete'}
          </button>
        )}
      </div>

      {/* Certificate Unlock */}
      {allDone && enrollment.certificateId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-lg font-bold text-amber-800">🏆 Congratulations!</p>
          <p className="text-sm text-amber-700 mt-1">You completed all lessons. Your certificate is ready!</p>
          <p className="text-xs text-amber-600 mt-1 font-mono">ID: {enrollment.certificateId}</p>
          <a href={`/certificate/${id}`} className="inline-block mt-3 px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Download Certificate</a>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {lessonIndex > 0 && <button onClick={() => router.push(`/learn/${id}?lesson=${lessonIndex - 1}`)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">← Previous</button>}
        {lessonIndex < lessons.length - 1 && <button onClick={() => router.push(`/learn/${id}?lesson=${lessonIndex + 1}`)} className="px-4 py-2 bg-[#0F7B6C] text-white rounded-lg text-sm font-medium">Next Lesson →</button>}
      </div>

      {/* Lesson List */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">All Lessons</h3>
        <div className="space-y-2">
          {lessons.map((l: any, i: number) => (
            <button key={l.id} onClick={() => router.push(`/learn/${id}?lesson=${i}`)}
              className={`w-full text-left p-3 rounded-lg text-sm flex items-center gap-2 ${i === lessonIndex ? 'bg-[#0F7B6C] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
              {completedLessons.includes(l.id) ? <span>✅</span> : <span className="opacity-40">○</span>}
              <span className="flex-1">{i + 1}. {l.title}</span>
              <span className="opacity-60 text-xs">{l.duration}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}><LearnContent /></Suspense>;
}
