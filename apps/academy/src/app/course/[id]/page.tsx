'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLocalPrice } from '@/lib/courses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('academy_user');
    if (stored) setUser(JSON.parse(stored));
    const enrollments = JSON.parse(localStorage.getItem('academy_enrollments') || '[]');
    if (enrollments.includes(id) || enrollments.includes('bundle')) setEnrolled(true);
    // Fetch course from API
    fetch(`${API_URL}/courses/${id}`).then(r => r.json()).then(data => { setCourse(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>;
  if (!course) return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Course not found</div>;

  const country = user?.country || 'NG';
  const { price, currency } = getLocalPrice(Number(course.usdPrice), country);
  const lessons = course.lessons?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [];

  const handlePurchase = async () => {
    if (!user) { window.location.href = 'https://reportafrica-web.vercel.app/login'; return; }
    // Simulate enrollment (in production, integrate Paystack)
    const enrollments = JSON.parse(localStorage.getItem('academy_enrollments') || '[]');
    enrollments.push(id);
    localStorage.setItem('academy_enrollments', JSON.stringify(enrollments));
    setEnrolled(true);
    alert('Enrollment successful! You now have access to the course.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => router.push('/')} className="text-sm text-[#0F7B6C] mb-6 hover:underline">← All Courses</button>

      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.icon} {course.title}</h1>
        <p className="text-gray-600 mb-6">{course.description}</p>

        {!enrolled ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center mb-6">
            <p className="text-3xl font-bold text-gray-900">{currency} {price.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">One-time payment • Lifetime access</p>
            <button onClick={handlePurchase} className="mt-4 px-8 py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg hover:bg-[#0B6E4F] transition">
              Enroll Now
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-green-800">✓ You are enrolled! Start learning below.</p>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-900 mb-4">📚 Lessons ({lessons.length})</h2>
        <div className="space-y-3">
          {lessons.map((lesson: any, i: number) => (
            <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-lg border ${enrolled ? 'border-green-200 bg-green-50 cursor-pointer hover:bg-green-100' : 'border-gray-100 bg-gray-50'}`}
              onClick={() => enrolled && router.push(`/learn/${id}?lesson=${i}`)}>
              <span className="w-7 h-7 rounded-full bg-gray-200 text-xs font-bold flex items-center justify-center text-gray-600">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                <p className="text-xs text-gray-500">{lesson.duration}</p>
              </div>
              {enrolled ? <span className="text-xs text-green-600">▶ Play</span> : <span className="text-xs text-gray-400">🔒</span>}
            </div>
          ))}
        </div>

        {enrolled && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-sm font-semibold text-amber-800">🏆 Complete all lessons to earn your certificate</p>
            <a href={`/certificate/${id}`} className="text-xs text-amber-600 underline mt-1 inline-block">View Certificate</a>
          </div>
        )}
      </div>
    </div>
  );
}
