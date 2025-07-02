import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/context/ThemeContext";
import MobileZoomFix from "@/components/MobileZoomFix";
// import { TestReminder } from "@/src/components/TestReminder";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adaptonia - Chat & Collaboration",
  description: "Chat, collaborate, and manage tasks with Adaptonia",
  manifest: "/manifest.json",
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
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-status-bar" content="#4F46E5" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased h-full overscroll-none full-screen`}
      >
        <Providers>
          <ThemeProvider>
              {children}
              {/* Mobile Zoom Fix - prevents and resets mobile zoom on input focus */}
              <MobileZoomFix />
            {/* Test Reminder Component - for debugging (remove in production) */}
            {/* <div className="fixed bottom-4 right-4 z-50">
              <TestReminder />
            </div> */}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
