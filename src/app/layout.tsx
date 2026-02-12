import type { Metadata, Viewport } from "next";
// ... other imports
import { InstallPrompt } from "@/components/pwa/InstallPrompt"; // Ensure you created this from the previous step

export const viewport: Viewport = {
  themeColor: "#C72C48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Loyalty Cafe App",
  description: "Your favorite cafes in one app.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png", // This must match the folder you created
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loyalty App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ... fonts ... */}
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}