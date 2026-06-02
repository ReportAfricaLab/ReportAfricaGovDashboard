'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/feed');
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="pt-12 sm:pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#0F7B6C] bg-[#0F7B6C]/10 rounded-full mb-6">
            Africa&apos;s Real-Time Citizen Reporting Network
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            See It. Report It.<br />
            <span className="text-[#0F7B6C]">Change It.</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Empower your community with real-time reporting. Report traffic, emergencies, corruption, and more — instantly from your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="px-8 py-4 text-lg font-semibold text-white bg-[#0F7B6C] rounded-xl hover:bg-[#0B6E4F] transition">
              Start Reporting
            </a>
            <a href="/feed" className="px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Browse Reports
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">Platform Features</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'Live Reporting', desc: 'Go live instantly from any incident scene. Broadcast events in real time.', emoji: '📡' },
              { title: 'Geo-Based Map', desc: 'Interactive incident map showing live events, traffic, and emergencies near you.', emoji: '🗺️' },
              { title: 'AI Verification', desc: 'AI-powered content verification to combat fake news and misinformation.', emoji: '🤖' },
              { title: 'Emergency SOS', desc: 'One-tap emergency reporting with automatic location sharing and alerts.', emoji: '🚨' },
              { title: 'Community Helping Hands', desc: 'Help fellow citizens through verified humanitarian fundraising campaigns.', emoji: '🤝' },
              { title: 'Anonymous Reports', desc: 'Report safely with identity protection, face blur, and voice masking.', emoji: '🕵️' },
              { title: 'Election Monitoring', desc: 'Real-time election reporting, incident tracking, and live result updates.', emoji: '🗳️' },
              { title: 'Media Licensing', desc: 'Monetize your citizen journalism. Media houses can license your content.', emoji: '💰' },
              { title: 'Trust & Reputation', desc: 'Build your reporter credibility with AI-scored trust levels and verification badges.', emoji: '🛡️' },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-gray-100 hover:shadow-lg transition">
                <span className="text-2xl mb-3 block">{feature.emoji}</span>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Available Across Africa</h3>
          <p className="text-gray-600 mb-8">Covering 32+ African countries. Download the app or use the web platform to start reporting.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="px-8 py-4 text-lg font-semibold text-white bg-[#0F7B6C] rounded-xl hover:bg-[#0B6E4F] transition">
              Get Started Free
            </a>
            <a href="/feed" className="px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Browse Reports
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
