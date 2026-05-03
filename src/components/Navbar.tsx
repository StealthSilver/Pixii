"use client";

import { NotificationBellIcon } from "@/components/icons/NotificationBellIcon";
import { SidebarCollapseIcon } from "@/components/icons/SidebarCollapseIcon";
import { NavbarSearch } from "@/components/NavbarSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Navbar({ sidebarCollapsed, onToggleSidebar }: NavbarProps) {
  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background pl-1.5 pr-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="group inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!sidebarCollapsed}
      >
        <SidebarCollapseIcon
          className="size-[18px] transition-colors"
          flipHorizontal={sidebarCollapsed}
        />
      </button>
      <div className="min-w-0 flex-1" />
      <NavbarSearch />
      <ThemeToggle />
      <button
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
        aria-label="Notifications"
      >
        <NotificationBellIcon className="size-[18px] shrink-0" strokeWidth={1.5} />
      </button>
    </header>
  );
}
