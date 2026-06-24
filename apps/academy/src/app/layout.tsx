import './globals.css';

export const metadata = { title: 'ReportAfrica Academy', description: 'Citizen Journalism Training' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <span className="font-bold text-gray-900">ReportAfrica <span className="text-[#0F7B6C]">Academy</span></span>
            </a>
            <a href="https://www.reportafrica.africa/feed" className="text-xs text-gray-500 hover:text-[#0F7B6C]">← Back to ReportAfrica</a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

