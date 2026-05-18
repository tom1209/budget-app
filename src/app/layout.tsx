import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SESSION_COOKIE } from "@/lib/auth";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  title: "Budget App",
  description: "Family budget tracker for Tom & Justine",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET ?? "";
  const isLoggedIn = !!secret && session === secret;

  return (
    <html lang="en" className={`font-mono ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans">
        <TooltipProvider>
          {isLoggedIn ? (
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                {/* Mobile-only sticky header with sidebar trigger */}
                <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">B</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">Budget</span>
                  </div>
                </header>
                {children}
              </SidebarInset>
            </SidebarProvider>
          ) : (
            children
          )}
        </TooltipProvider>
      </body>
    </html>
  );
}
