import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Judge Joody AI',
  description: 'Settle disputes. Real stakes. No lawyers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Pixel font - Press Start 2P */}
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-900">{children}</body>
    </html>
  );
}
