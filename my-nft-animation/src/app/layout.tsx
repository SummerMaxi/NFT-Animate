import { config } from "@/config/accountKit";
import { cookieToInitialState } from "@account-kit/core";
import { headers } from "next/headers";
import { Providers } from "@/components/Providers";
import './globals.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialState = cookieToInitialState(
    config,
    headers().get("cookie") ?? ""
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers initialState={initialState}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 