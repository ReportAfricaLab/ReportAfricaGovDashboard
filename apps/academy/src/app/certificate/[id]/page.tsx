'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://34-242-14-140.nip.io/api/v1';

export default function CertificatePage() {
  const { id } = useParams();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('academy_user');
    if (stored) setUser(JSON.parse(stored));
    const token = localStorage.getItem('academy_token');
    if (token) {
      fetch(`${API_URL}/courses/my-enrollments`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => {
          const e = Array.isArray(data) ? data.find((en: any) => en.courseId === id) : null;
          setEnrollment(e);
        }).catch(() => {});
    }
  }, [id]);

  const userName = user?.email?.split('@')[0] || 'Student';
  const isMaster = id === 'master';
  const title = isMaster ? 'Certified Citizen Journalist — Complete Program' : enrollment?.course?.title || 'Course';
  const certId = enrollment?.certificateId;
  const date = enrollment?.completedAt ? new Date(enrollment.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();

  if (!enrollment?.completedAt) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Complete all lessons to earn your certificate.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-6 flex gap-3 justify-center">
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#0F7B6C] text-white text-sm rounded-lg hover:bg-[#0B6E4F]">🖨️ Print</button>
        <a href={`/verify/${certId}`} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">🔗 Share Verification Link</a>
      </div>

      {/* Certificate */}
      <div className="bg-white border-4 border-[#0F7B6C] rounded-2xl p-12 text-center print:border-2">
        <div className="border-2 border-gray-200 rounded-xl p-10">
          <p className="text-sm text-gray-500 tracking-widest uppercase mb-4">Certificate of Completion</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isMaster ? '👑' : '🎓'} ReportAfrica Academy</h1>
          <div className="w-16 h-0.5 bg-[#0F7B6C] mx-auto my-6" />
          <p className="text-gray-500 mb-2">This certifies that</p>
          <p className="text-2xl font-bold text-[#0F7B6C] mb-4 capitalize">{userName}</p>
          <p className="text-gray-500 mb-2">has successfully completed</p>
          <p className="text-xl font-bold text-gray-900 mb-6">{title}</p>
          <div className="w-16 h-0.5 bg-gray-200 mx-auto my-6" />
          <p className="text-sm text-gray-400">{date}</p>
          <p className="text-xs text-gray-400 mt-4 font-mono">Certificate ID: {certId}</p>
          <p className="text-xs text-gray-400 mt-1">Verify: reportafrica-academy-amber.vercel.app/verify/{certId}</p>
          <p className="text-xs text-gray-400 mt-4">ReportAfrica — Africa&apos;s Citizen-Powered Reporting Platform</p>
        </div>
      </div>
    </div>
  );
}
