import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/layout/sidebar";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { UserBalance } from "@/components/layout/user-balance";
import { DynamicBreadcrumbs } from "@/components/navigation/dynamic-breadcrumbs";
import { Providers } from "@/app/providers";
import { Toaster } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthGuard>
        <Providers>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center justify-between border-b">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <DynamicBreadcrumbs />
                </div>
                <div className="flex items-center gap-2 px-4">
                  <UserBalance />
                  <ThemeSwitcher />
                </div>
              </header>
              <main className="flex-1 p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
        </AuthGuard>
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </div>
  );
} 