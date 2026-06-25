'use client';
import { useState } from 'react';
import { adminAPI } from '@/lib/api';

export default function NotificationsAdminPage() {
  const [target, setTarget] = useState<'all' | 'country' | 'businesses' | 'user'>('all');
  const [country, setCountry] = useState('NG');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSend = async () => {
    if (!title || !body) { setResult('Title and body required'); return; }
    setSending(true);
    try {
      await adminAPI.sendNotification({ target, country: target === 'country' ? country : undefined, username: target === 'user' ? username : undefined, title, body });
      setResult('✅ Notification sent successfully!');
      setTitle(''); setBody('');
    } catch (e: any) { setResult('❌ ' + (e.message || 'Failed')); }
    setSending(false);
    setTimeout(() => setResult(''), 5000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🔔 Send Notifications</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-lg space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-2">Target Audience</label>
          <div className="grid grid-cols-2 gap-2">
            {([['all', '🌍 All Users'], ['country', '🏳️ By Country'], ['businesses', '🏪 Business Owners'], ['user', '👤 Single User']] as [typeof target, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTarget(key)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border ${target === key ? 'border-emerald-500 bg-emerald-600/20 text-emerald-400' : 'border-gray-700 text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {target === 'country' && (
          <div>
            <label className="text-sm text-gray-400">Country Code</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="NG"
              className="w-full mt-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none" />
          </div>
        )}

        {target === 'user' && (
          <div>
            <label className="text-sm text-gray-400">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe"
              className="w-full mt-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none" />
          </div>
        )}

        <div>
          <label className="text-sm text-gray-400">Notification Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Important Update"
            className="w-full mt-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none" />
        </div>

        <div>
          <label className="text-sm text-gray-400">Message Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your message here..." rows={3}
            className="w-full mt-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none resize-none" />
        </div>

        {result && <p className="text-sm">{result}</p>}

        <button onClick={handleSend} disabled={sending}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50">
          {sending ? 'Sending...' : '🔔 Send Notification'}
        </button>
      </div>
    </div>
  );
}
