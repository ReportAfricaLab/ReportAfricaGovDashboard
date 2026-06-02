export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F7B6C] mb-6">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-sm text-gray-700">
        <p><strong>Last updated:</strong> June 2026</p>

        <h2 className="text-lg font-semibold mt-6">1. Information We Collect</h2>
        <p>We collect the following when you use ReportAfrica:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account info:</strong> name, email, username, phone number, country</li>
          <li><strong>Reports:</strong> text, photos, videos, location data you submit</li>
          <li><strong>Device info:</strong> browser type, IP address, device identifiers</li>
          <li><strong>Location:</strong> GPS coordinates (only when you grant permission)</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">2. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide and improve the ReportAfrica service</li>
          <li>To verify reports and calculate trust scores</li>
          <li>To send notifications about reports in your area</li>
          <li>To process donations and payments</li>
          <li>To prevent fraud and enforce our terms</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">3. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Payment processors (Paystack) for transactions</li>
          <li>Cloud service providers (AWS) for hosting</li>
          <li>Law enforcement when legally required</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">4. Data Security</h2>
        <p>We use encryption, secure servers, and access controls to protect your data. Passwords are hashed and never stored in plain text.</p>

        <h2 className="text-lg font-semibold mt-6">5. Your Rights</h2>
        <p>You can:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access and download your data</li>
          <li>Update or correct your information</li>
          <li>Delete your account and associated data</li>
          <li>Opt out of non-essential notifications</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">6. Contact</h2>
        <p>For privacy concerns, contact us at privacy@reportafrica.com</p>
      </div>
    </div>
  );
}
