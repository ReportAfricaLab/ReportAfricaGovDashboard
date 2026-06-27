'use client';

export default function SubscribePage() {
  const tiers = [
    { tier: 'Free Trial', price: '$0', period: '30 days', features: ['7 day history', 'View incidents', 'Basic stats'], current: true },
    { tier: 'Agency Basic', price: '$500', period: '/month', features: ['90 day history', 'CSV export', 'Real-time alerts', 'State filter', 'Email notifications'] },
    { tier: 'Agency Pro', price: '$2,000', period: '/month', features: ['1 year history', 'PDF reports', 'Election monitoring', 'API access', 'Priority support', 'Multiple users'], popular: true },
    { tier: 'Enterprise', price: '$5,000', period: '/month', features: ['Unlimited history', 'Full country access', 'Custom integration', 'Webhook alerts', 'Dedicated support', 'Multi-user seats', 'Custom reports'] },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">💎 Subscription Plans</h1>
      <p className="text-gray-400 text-sm mb-8">Upgrade your agency's access to ReportAfrica Intelligence</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiers.map((plan) => (
          <div key={plan.tier} className={`rounded-xl p-6 border ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700'} bg-[#1E293B]`}>
            {plan.popular && <p className="text-[10px] font-bold text-blue-400 mb-2">RECOMMENDED</p>}
            {plan.current && <p className="text-[10px] font-bold text-emerald-400 mb-2">CURRENT PLAN</p>}
            <h3 className="font-bold text-gray-100">{plan.tier}</h3>
            <p className="text-2xl font-bold text-white mt-2">{plan.price}<span className="text-sm font-normal text-gray-400">{plan.period}</span></p>
            <ul className="mt-4 space-y-1.5 text-xs text-gray-300">
              {plan.features.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            {!plan.current && (
              <a href="mailto:gov@reportafrica.africa?subject=Subscription Inquiry" 
                className={`block mt-4 py-2 text-center text-sm font-semibold rounded-lg ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                Contact Sales
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
        <h2 className="font-semibold mb-3">📞 Contact Us</h2>
        <p className="text-sm text-gray-400 mb-4">For subscription inquiries, custom plans, or enterprise integration:</p>
        <div className="space-y-2 text-sm text-gray-300">
          <p>📧 <a href="mailto:gov@reportafrica.africa" className="text-blue-400 hover:underline">gov@reportafrica.africa</a></p>
          <p>🌐 <a href="https://www.reportafrica.africa/government" className="text-blue-400 hover:underline">www.reportafrica.africa/government</a></p>
        </div>
      </div>
    </div>
  );
}
