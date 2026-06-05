'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) { setError('No response from Google'); return; }

    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');

    if (!idToken) { setError('No token received from Google'); return; }

    api.auth.oauth('google', idToken)
      .then((data) => {
        login(data.user, data.token, data.refreshToken);
        router.push('/feed');
      })
      .catch((err) => {
        setError(err.message || 'Google sign-in failed');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-[#0F7B6C] font-semibold hover:underline">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <p className="text-gray-500">Signing in with Google...</p>
    </div>
  );
}
