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
  title: "NFT Animation",
  description: "Create and manage NFT animations",
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