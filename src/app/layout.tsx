import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/supabase/session";
import "./globals.css";

// Une seule famille, géométrique et ronde, très lisible de loin sur la
// tablette de la cuisine (référence : l'application Jow).
const lexend = Lexend({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Adresse publique : l'image de partage (src/app/opengraph-image.jpg)
  // doit être référencée par une URL complète dans les aperçus de lien.
  metadataBase: new URL("https://lestakam.vercel.app"),
  title: "LesTakam",
  description: "Le tableau de bord de la famille : calendrier, rituels, courses et météo.",
  applicationName: "LesTakam",
  openGraph: {
    title: "LesTakam",
    description: "Le tableau de bord de la famille : calendrier, rituels, courses et météo.",
    siteName: "LesTakam",
    locale: "fr_FR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "LesTakam",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf3ec",
  width: "device-width",
  initialScale: 1,
  // La tablette de la cuisine reste sur un affichage stable, sans zoom accidentel.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${lexend.variable} antialiased`}>
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
