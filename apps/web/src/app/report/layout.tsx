import { Metadata } from 'next';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/[.\\/]+$/, '');

export async function generateMetadata({ searchParams }: { searchParams: { id?: string } }): Promise<Metadata> {
  const id = searchParams?.id;
  if (!id) return { title: 'Report | ReportAfrica' };

  try {
    const res = await fetch(`${API_URL}/reports/${id}`, { next: { revalidate: 60 } });
    const report = await res.json();
    if (!report?.title) return { title: 'Report | ReportAfrica' };

    const ogImage = report.media?.[0]?.url || 'https://reportafrica.africa/logo.png';
    const description = report.description?.substring(0, 200) || 'View this report on ReportAfrica';

    return {
      title: `${report.title} | ReportAfrica`,
      description,
      openGraph: {
        title: report.title,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: report.title }],
        url: `https://reportafrica.africa/report?id=${id}`,
        type: 'article',
        siteName: 'ReportAfrica',
      },
      twitter: {
        card: 'summary_large_image',
        title: report.title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Report | ReportAfrica' };
  }
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
