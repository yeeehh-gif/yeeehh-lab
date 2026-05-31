import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "yeeehh's lab",
    short_name: "yeeehh's lab",
    description: "Your personal English learning companion",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#1e1e1e",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  }
}
