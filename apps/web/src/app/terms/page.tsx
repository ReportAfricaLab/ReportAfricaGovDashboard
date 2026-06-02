export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F7B6C] mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-sm text-gray-700">
        <p><strong>Last updated:</strong> June 2026</p>

        <h2 className="text-lg font-semibold mt-6">1. Acceptance of Terms</h2>
        <p>By creating an account or using ReportAfrica, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>

        <h2 className="text-lg font-semibold mt-6">2. User Accounts</h2>
        <p>You must provide accurate information when registering. You are responsible for maintaining the security of your account and password. You must be at least 16 years old to use ReportAfrica.</p>

        <h2 className="text-lg font-semibold mt-6">3. Content Guidelines</h2>
        <p>You agree not to post content that:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Contains hate speech, threats, or incites violence</li>
          <li>Is deliberately false or misleading</li>
          <li>Violates any person&apos;s privacy or intellectual property</li>
          <li>Contains spam or commercial advertising</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">4. Trust System</h2>
        <p>ReportAfrica uses an AI-powered trust scoring system. Verified, accurate reports increase your trust score. Reports flagged as false or spam will decrease your score and may result in account restrictions.</p>

        <h2 className="text-lg font-semibold mt-6">5. Donations & Payments</h2>
        <p>Donations made through the platform are processed by third-party payment providers. ReportAfrica is not responsible for refunds once a donation is confirmed. Campaign creators must use funds for stated purposes.</p>

        <h2 className="text-lg font-semibold mt-6">6. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>

        <h2 className="text-lg font-semibold mt-6">7. Contact</h2>
        <p>For questions about these terms, contact us at legal@reportafrica.com</p>
      </div>
    </div>
  );
}
