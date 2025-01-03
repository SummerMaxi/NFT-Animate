import { config } from "@/config/accountKit";
import { cookieToInitialState } from "@account-kit/core";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/Providers";
import { SignerContainer } from "@/components/SignerContainer";
import './globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://your-domain.com'),
  title: "NFT Animation",
  description: "Create and manage NFT animations",
  openGraph: {
    title: 'NFT Animation',
    description: 'Create and manage NFT animations',
    url: 'your-url-here',
    siteName: 'NFT Animation',
    images: [
      {
        url: 'your-og-image-url',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
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
  const initialState = cookieToInitialState(
    config,
    headers().get("cookie") ?? ""
  );

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers initialState={initialState}>
          <SignerContainer />
          {children}
        </Providers>
      </body>
    </html>
  );
} 