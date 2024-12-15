import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFT Animation',
  description: 'Create and manage NFT animations',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 