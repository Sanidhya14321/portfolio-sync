import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio Sync Agent',
  description: 'AI-powered portfolio management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <nav className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold hover:text-blue-400 transition">
              📊 Sync Agent
            </Link>

            <div className="flex gap-6">
              <Link href="/" className="hover:text-blue-400 transition">
                Dashboard
              </Link>
              <Link href="/projects" className="hover:text-blue-400 transition">
                Projects
              </Link>
              <Link href="/settings" className="hover:text-blue-400 transition">
                Settings
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
