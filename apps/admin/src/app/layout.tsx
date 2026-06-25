import type { Metadata } from 'next';
import './globals.css';
import AdminShell from './AdminShell';

export const metadata: Metadata = {
  title: 'ReportAfrica Admin',
  description: 'Internal admin portal for ReportAfrica platform management',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 min-h-screen">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
