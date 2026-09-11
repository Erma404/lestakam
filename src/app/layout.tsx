import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/supabase/session";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Titres joufflus et arrondis, pour donner à l'appli un vrai grain de fantaisie
// plutôt que de tout empiler dans la même graisse de Nunito.
const baloo = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LesTakam",
  description: "Le tableau de bord de la famille : calendrier, rituels, repas et météo.",
  applicationName: "LesTakam",
  appleWebApp: {
    capable: true,
    title: "LesTakam",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
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
      <body className={`${nunito.variable} ${baloo.variable} antialiased`}>
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
