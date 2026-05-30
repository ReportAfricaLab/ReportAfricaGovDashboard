export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
      <p className="text-gray-600 mb-8">ReportAfrica is built on trust. These guidelines ensure our platform remains safe, accurate, and useful for all citizens.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-[#0F7B6C] mb-3">✅ Do</h2>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex gap-2"><span>•</span> Report only what you personally witness or can verify</li>
            <li className="flex gap-2"><span>•</span> Provide accurate location and details</li>
            <li className="flex gap-2"><span>•</span> Use appropriate categories for your reports</li>
            <li className="flex gap-2"><span>•</span> Verify other reports honestly — confirm what you can see, dispute what seems false</li>
            <li className="flex gap-2"><span>•</span> Respect the privacy of individuals in your reports</li>
            <li className="flex gap-2"><span>•</span> Use face blur when bystanders are visible</li>
            <li className="flex gap-2"><span>•</span> Report emergencies to authorities first, then to the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#D92D20] mb-3">❌ Don&apos;t</h2>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex gap-2"><span>•</span> Submit false, fabricated, or misleading reports</li>
            <li className="flex gap-2"><span>•</span> Post hate speech, ethnic slurs, or incitement to violence</li>
            <li className="flex gap-2"><span>•</span> Harass, threaten, or doxx other users</li>
            <li className="flex gap-2"><span>•</span> Spam the platform with duplicate or irrelevant content</li>
            <li className="flex gap-2"><span>•</span> Impersonate authorities, journalists, or other users</li>
            <li className="flex gap-2"><span>•</span> Manipulate trust scores through fake verifications</li>
            <li className="flex gap-2"><span>•</span> Create fraudulent donation campaigns</li>
            <li className="flex gap-2"><span>•</span> Share graphic violence without content warnings</li>
            <li className="flex gap-2"><span>•</span> Upload, share, or distribute pornographic, sexually explicit, or nude content — this results in an immediate permanent ban with no prior warning</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Enforcement</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">Violations are handled progressively:</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="font-semibold text-yellow-800 text-sm">Warning</p>
              <p className="text-yellow-700 text-xs mt-1">First minor violation — trust score reduced</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="font-semibold text-orange-800 text-sm">Temporary Suspension</p>
              <p className="text-orange-700 text-xs mt-1">Repeated violations — 7-30 day suspension</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="font-semibold text-red-800 text-sm">Permanent Ban</p>
              <p className="text-red-700 text-xs mt-1">Severe or repeated violations — account terminated</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Reporting Violations</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            If you see content that violates these guidelines, use the report button on any post or contact us at moderation@reportafrica.com.
          </p>
        </section>
      </div>
    </div>
  );
}
