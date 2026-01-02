import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PrivacyToggle } from "@/components/layout/privacy-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dompetku - Personal Finance",
  description: "Aplikasi pembukuan mandiri dengan sistem Double-Entry",
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
      <body className={`${inter.className} antialiased min-h-screen bg-background overflow-x-hidden`}>
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
            <main className="flex-1 pb-20 md:pb-0 relative overflow-x-hidden w-full max-w-full md:h-screen md:overflow-y-auto">
              <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-4 w-full">
                  <div className="md:hidden font-bold text-primary text-xl">Dompetku</div>
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-1 shrink-0">
                    <PrivacyToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                {children}
              </div>
            </main>
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}

