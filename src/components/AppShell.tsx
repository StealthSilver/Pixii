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

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </>
  );
}

