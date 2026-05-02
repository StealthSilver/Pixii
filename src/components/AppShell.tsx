"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-white">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </>
  );
}
