import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { LanguageProvider } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Play it Forward | RBS Game Sharing",
  description: "Free board game sharing across Ramat Beit Shemesh — keeping kids happy during tough times",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider>
          <LanguageToggle />
          <main className="mx-auto min-h-screen max-w-md pb-20">{children}</main>
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
