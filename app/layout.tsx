import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "English Lab",
  description: "Your personal English learning companion",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-body antialiased">{children}</body>
    </html>
  )
}
