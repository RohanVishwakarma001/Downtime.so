import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://downtime.so'),
  title: {
    default: 'Downtime.so — Incident Communication Infrastructure',
    template: '%s | Downtime.so',
  },
  description:
    'Affordable, developer-first status pages & incident timelines. Like Statuspage.io but actually affordable. Get status.yourapp.com in minutes.',
  keywords: ['status page', 'incident management', 'uptime monitoring', 'developer tools'],
  openGraph: {
    title: 'Downtime.so — Incident Communication Infrastructure',
    description: 'Status pages & incident timelines for indie hackers and small teams.',
    type: 'website',
    url: 'https://downtime.so',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Downtime.so',
    description: 'Developer-first status pages & incident timelines.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
