'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://34-242-14-140.nip.io/api/v1';
const LOGO_URL = 'https://reportafrica-web.vercel.app/logo.png';
const ICON_URL = 'https://reportafrica-web.vercel.app/icon.png';

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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-6 flex gap-3 justify-center print:hidden">
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#0F7B6C] text-white text-sm rounded-lg hover:bg-[#0B6E4F]">🖨️ Print / Save PDF</button>
        <a href={`/verify/${certId}`} className="px-4 py-2 bg-[#0B6E4F] text-white text-sm rounded-lg hover:bg-[#094d38]">🔗 Verification Link</a>
      </div>

      {/* Certificate */}
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl print:shadow-none" style={{ border: '6px solid #0F7B6C' }}>
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
          <img src={ICON_URL} alt="" className="w-[400px] h-[400px] object-contain" />
        </div>

        {/* Top accent bar */}
        <div className="h-3 bg-gradient-to-r from-[#0F7B6C] via-[#0B6E4F] to-[#094d38]" />

        <div className="relative p-12 md:p-16 text-center">
          {/* Logo */}
          <img src={LOGO_URL} alt="ReportAfrica" className="h-12 mx-auto mb-6" />

          {/* Header */}
          <p className="text-xs tracking-[0.3em] uppercase text-[#0F7B6C] font-semibold mb-2">Certificate of Completion</p>
          <div className="w-24 h-[2px] bg-[#0F7B6C] mx-auto mb-8" />

          {/* Body */}
          <p className="text-gray-500 text-sm mb-2">This is to certify that</p>
          <p className="text-3xl font-bold text-[#0F7B6C] mb-6 capitalize">{userName}</p>

          <p className="text-gray-500 text-sm mb-2">has successfully completed</p>
          <p className="text-xl font-bold text-gray-900 mb-2">{isMaster ? '👑' : ''} {title}</p>
          {isMaster && <p className="text-sm text-[#0F7B6C] font-medium mb-4">All courses in the ReportAfrica Academy Program</p>}

          <div className="w-24 h-[2px] bg-gray-200 mx-auto my-8" />

          {/* Date & Details */}
          <p className="text-sm text-gray-600 mb-1">Issued on <strong>{date}</strong></p>
          <p className="text-xs text-gray-400 font-mono mt-4">Certificate ID: {certId}</p>
          <p className="text-xs text-gray-400 mt-1">Verify at: reportafrica-academy-amber.vercel.app/verify/{certId}</p>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2">
              <img src={ICON_URL} alt="" className="w-5 h-5 opacity-60" />
              <p className="text-xs text-gray-400">ReportAfrica — Africa&apos;s Citizen-Powered Reporting Platform</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-3 bg-gradient-to-r from-[#094d38] via-[#0B6E4F] to-[#0F7B6C]" />
      </div>
    </div>
  );
}
