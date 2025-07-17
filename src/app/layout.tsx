import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoFi",
  description: "Family finance tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <QueryProvider>
            <SidebarProvider
              className="group/sidebar-wrapper"
              style={{
                "--sidebar-width": "calc(var(--spacing) * 18)",
              } as React.CSSProperties}
            >
              <div className="flex h-full w-full">
                <AppSidebar />
                <SidebarInset>
                  <SiteHeader />
                  <div className="flex-grow overflow-y-auto w-full">
                    <div className="p-4 md:p-6">
                      {children}
                    </div>
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
