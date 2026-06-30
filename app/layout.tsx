import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Human + Machine Sadhana",
  description: "Daily ritual tracker for wellbeing, happiness quotient, energy, gratitude, revenue work and human-machine partnership."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
