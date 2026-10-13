import type { MetadataRoute } from "next";

/** Installable sur l'écran d'accueil : indispensable aux notifications sur iPhone et iPad. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LesTakam",
    short_name: "LesTakam",
    description: "Le tableau de bord de la famille : calendrier, rituels, courses et météo.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf3ec",
    theme_color: "#fdf3ec",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
