import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { AuthProvider } from "@/components/auth-provider"
import { EnvCheck } from "@/components/env-check"
import { EnvDebug } from "@/components/env-debug"
import { StorageDebug } from "@/components/storage-debug"
import { SupabaseDebug } from "@/components/supabase-debug"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Målerjakt | Moth Hunt",
  description: "Citizen science app for tracking and identifying moths",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LanguageProvider>
              <div className="container mx-auto p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <EnvDebug />
                  <StorageDebug />
                  <SupabaseDebug />
                </div>
                <EnvCheck />
                {children}
              </div>
              <Toaster />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
