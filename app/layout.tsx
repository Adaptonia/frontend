import type { Metadata } from "next";
import { Poppins } from "next/font/google"; 
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adaptonia - Chat & Collaboration",
  description: "Chat, collaborate, and manage tasks with Adaptonia",
  manifest: "/manifest.json",
  themeColor: "#229FDB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Adaptonia",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

// Root layout - this is where the app starts for each page navigation
// The AuthContext in Providers will check for existing Appwrite sessions
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta name="application-name" content="Adaptonia" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Adaptonia" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#229FDB" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased h-full overscroll-none`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
