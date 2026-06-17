'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function VerifyCertificatePage() {
  const { id } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/courses/certificates/verify/${id}`)
      .then(r => r.json()).then(setResult).catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Verifying...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {result?.valid ? (
        <div className="bg-white border-2 border-green-200 rounded-2xl p-8">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-green-800 mb-2">Certificate Verified</h1>
          <p className="text-gray-600 mb-6">This is an authentic ReportAfrica Academy certificate.</p>
          <div className="bg-green-50 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm"><span className="text-gray-500">Issued to:</span> <strong className="text-gray-900">{result.userName}</strong></p>
            <p className="text-sm"><span className="text-gray-500">Course:</span> <strong className="text-gray-900">{result.courseTitle}</strong></p>
            <p className="text-sm"><span className="text-gray-500">Completed:</span> <strong className="text-gray-900">{new Date(result.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
            <p className="text-sm"><span className="text-gray-500">Certificate ID:</span> <strong className="text-gray-900 font-mono">{result.certificateId}</strong></p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-red-200 rounded-2xl p-8">
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-red-800 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600">This certificate ID does not exist or is invalid.</p>
        </div>
      )}
    </div>
  );
}
