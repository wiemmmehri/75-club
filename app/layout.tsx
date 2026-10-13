import type { Metadata, Viewport } from "next";
import "./globals.css";
import Splash from "@/components/Splash";
import PwaRegister from "@/components/PwaRegister";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "The 75 Club",
  description: "Private club. Public glow-up. Le challenge 75 jours de Hajer, Wiem, Roua & Amani.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "75 Club", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
};

export const viewport: Viewport = {
  themeColor: "#ffd0e0", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" href="/fonts/InstrumentSerif-Italic.ttf" as="font" type="font/ttf" crossOrigin="" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
      </head>
      <body>
        <ToastProvider>
          <div className="shell">
            <div className="aura" aria-hidden><i /><i /><i /></div>
            {children}
          </div>
          <Splash />
        </ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
