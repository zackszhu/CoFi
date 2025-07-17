"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  BarChart3,
  Scale,
  Users,
  LogOut,
  PieChart,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: ListChecks },
  {
    title: "Statistics",
    icon: BarChart3,
    subItems: [
      { title: "Balance", href: "/statistics/balance", icon: Scale },
      { title: "Category", href: "/statistics/category", icon: PieChart },
      { title: "Monthly Report", href: "/statistics/monthly-report", icon: ClipboardList },
    ],
  },
  { title: "User Management", href: "/user-management", icon: Users },
];

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar
      collapsible="offcanvas"
      className={cn("border-r", className)} // Added border-r for visual separation
      {...props}
    >
      <SidebarHeader className="p-2 group-data-[state=closed]:p-0">
        <div className="flex h-10 items-center justify-center group-data-[state=closed]:hidden">
          <span className="font-semibold text-lg">CoFi</span>
        </div>
        <div className="hidden h-10 items-center justify-center group-data-[state=closed]:flex">
          {/* You can use a compact logo/icon here */}
          <span className="font-semibold text-lg">CB</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isParentButtonActive =
                item.href &&
                (pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href)));
              const isSubItemActive = item.subItems?.some(
                (subItem) =>
                  pathname === subItem.href ||
                  (subItem.href && subItem.href !== "/" && pathname.startsWith(subItem.href))
              );

              return (
                <React.Fragment key={item.title}>
                  {item.subItems ? (
                    // Item with sub-items (e.g., Statistics) - make it collapsible
                    <Collapsible
                      asChild
                      defaultOpen={Boolean(isSubItemActive)} // Open if any sub-item is active
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={Boolean(isSubItemActive)} // Group header is active if sub-item is active
                            className="w-full justify-start font-semibold"
                          >
                            <item.icon className="mr-2 h-5 w-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                          <div className="pl-7 pt-1"> {/* Indentation and slight top padding for sub-items */}
                            <SidebarMenu>
                              {item.subItems.map((subItem) => {
                                const isCurrentSubItemActive =
                                  subItem.href &&
                                  (pathname === subItem.href ||
                                    (subItem.href !== "/" && pathname.startsWith(subItem.href)));
                                return (
                                  <SidebarMenuItem key={subItem.title}>
                                    <SidebarMenuButton
                                      asChild
                                      tooltip={subItem.title}
                                      isActive={Boolean(isCurrentSubItemActive)}
                                      className="w-full justify-start text-sm"
                                      aria-current={subItem.href && pathname === subItem.href ? "page" : undefined}
                                    >
                                      <Link href={subItem.href!}> {/* subItem.href will exist */}
                                        <subItem.icon className="mr-2 h-4 w-4 shrink-0" />
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </SidebarMenu>
                          </div>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    // Item without sub-items (e.g., Dashboard) - regular link
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={Boolean(isParentButtonActive)} // isParentButtonActive is correct here
                        className="w-full justify-start"
                        aria-current={item.href && pathname === item.href ? "page" : undefined}
                      >
                        <Link href={item.href!}> {/* item.href will exist here */}
                          <item.icon className="mr-2 h-5 w-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0">
        {session?.user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={`Logout ${session.user.name || session.user.email}`}
                isActive={true}
                className="w-full justify-start"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-5 w-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
