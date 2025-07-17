"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-[orientation=vertical]:h-4"
        />
        <Link href="/" className="text-base font-medium">
          CoFi
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {/* Display user name if authenticated, otherwise Login button */}
          {status === "authenticated" && session.user?.name && (
            <span className="text-sm font-medium">
              {session.user.name}
            </span>
          )}
          {status === "unauthenticated" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          {/* A logout button could be added here for authenticated users */}
        </div>
      </div>
    </header>
  );
}
