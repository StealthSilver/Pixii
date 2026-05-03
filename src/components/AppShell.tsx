"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/share")) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-background">
        {children}
      </div>
    );
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="hidden h-full shrink-0 lg:flex">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={
          "fixed left-0 top-0 z-50 flex h-full w-72 max-w-full transform shadow-xl transition-transform duration-300 ease-out lg:hidden " +
          (sidebarOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-full")
        }
        aria-hidden={!sidebarOpen}
      >
        <Sidebar
          collapsed={false}
          drawer
          onLinkClick={() => setSidebarOpen(false)}
          onDrawerClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
        />
        <main
          className={
            "min-h-0 w-full flex-1 overflow-x-hidden scroll-smooth overflow-y-auto " +
            (sidebarOpen ? "max-lg:overflow-y-hidden " : "")
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}

