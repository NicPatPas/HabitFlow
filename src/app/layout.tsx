import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { ThemeProvider } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HabitFlow — Track Your Daily Habits",
  description: "Build powerful habits with streaks, analytics, and daily check-ins.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          .main-layout-offset {
            margin-left: 0;
            padding-top: calc(3.5rem + 2rem);
            padding-left: 1.25rem;
            padding-right: 1.25rem;
            padding-bottom: 2.5rem;
          }
          @media (min-width: 768px) {
            .main-layout-offset {
              margin-left: 16rem;
              padding-top: 1.5rem;
              padding-left: 2rem;
              padding-right: 2rem;
            }
          }
        `}</style>
      </head>
      <body className={cn(inter.variable, "font-sans antialiased bg-background min-h-screen")}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 min-h-screen">
              <div className="main-layout-offset max-w-6xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
