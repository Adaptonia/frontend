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
};

// Root layout - this is where the app starts for each page navigation
// The AuthContext in Providers will check for existing Appwrite sessions
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
