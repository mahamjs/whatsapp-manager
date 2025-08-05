// app/layout.tsx
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

export const metadata = {
  title: "WhatsApp Manager",
  description: "Manage your WhatsApp templates",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
