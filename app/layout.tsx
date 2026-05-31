import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "English Lab",
  description: "Your personal English learning companion",
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English Lab",
  },
}

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-body antialiased">{children}</body>
    </html>
  )
}
