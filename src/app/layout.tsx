import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Viewport Settings (Critical for Mobile App Feel)
// userScalable: false -> Prevents zooming (native feel)
// interactiveWidget: 'resizes-content' -> Handles virtual keyboard nicely
export const viewport: Viewport = {
  themeColor: "#C72C48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  interactiveWidget: "resizes-content",
};

// 2. PWA Metadata
export const metadata: Metadata = {
  title: "Revistra - Your Loyalty Companion",
  description: "Your favorite cafes in one app.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon/icon-192x193.png",
    apple: "/icon/icon-192x193.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Revistra",
  },
  formatDetection: {
    telephone: false, // Prevents blue links on phone numbers (we style them ourselves)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh overflow-x-hidden bg-[var(--bg-app)] text-[var(--foreground)] antialiased`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
        <InstallPrompt />
      </body>
    </html>
  );
}
