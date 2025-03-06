import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { ThemeSwitcher } from "@/components/layout/theme-switcher"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/layout/sidebar"
import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fond Rozvoje",
  description: "Platform for creating and funding projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col">
              <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center justify-between border-b">
                    <div className="flex items-center gap-2 px-4">
                      <SidebarTrigger className="-ml-1" />
                      <Separator orientation="vertical" className="mr-2 h-4" />
                      <Breadcrumbs />
                    </div>
                    <div className="px-4">
                      <ThemeSwitcher />
                    </div>
                  </header>
                  <main className="flex-1 p-6">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
