import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PrivacyToggle } from "@/components/layout/privacy-toggle";
import { DebugMenu } from "@/components/layout/debug-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LiveClock } from "@/components/layout/live-clock";
import { DrawerNavigation } from "@/components/layout/drawer-navigation";
import { Toaster } from "sonner";
import { ConditionalFAB } from "@/components/layout/conditional-fab";
import { SWRegister } from "@/components/pwa/sw-register";
import { RecurringTriggerProvider } from "@/components/pwa/recurring-trigger-provider";

// Optimized Inter font for mobile readability
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Dompetku - Personal Finance",
  description: "Aplikasi pembukuan mandiri dengan sistem Double-Entry",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dompetku",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background overflow-x-hidden text-xs md:text-sm`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
            {/* Sidebar - Fixed on desktop */}
            <Sidebar />

            {/* Main Content - Scrollable */}
            <main id="main-content" className="flex-1 pb-24 md:pb-0 relative overflow-x-hidden w-full max-w-full md:h-screen md:overflow-y-auto">
              <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-4 w-full">
                  <div className="flex items-center gap-2">
                    <DrawerNavigation />
                    <div className="md:hidden font-bold text-primary text-lg">Dompetku</div>
                  </div>
                  <div className="flex-1 items-center hidden md:flex">
                    <LiveClock />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <NotificationBell />
                    <DebugMenu />
                    <PrivacyToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="p-3 md:p-6 w-full max-w-full overflow-x-hidden">
                {children}
              </div>
            </main>
          </div>

          <ConditionalFAB />
          <Toaster position="top-center" richColors closeButton />
          <SWRegister />
          <RecurringTriggerProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
