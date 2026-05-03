"use client";

import { NotificationBellIcon } from "@/components/icons/NotificationBellIcon";
import { SidebarCollapseIcon } from "@/components/icons/SidebarCollapseIcon";
import { NavbarSearch } from "@/components/NavbarSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
};

export function Navbar({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}: NavbarProps) {
  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 lg:pl-1.5 lg:pr-4">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <span className="text-xl leading-none text-foreground/90" aria-hidden>
          ☰
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="group hidden size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:inline-flex"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!sidebarCollapsed}
      >
        <SidebarCollapseIcon
          className="size-[18px] transition-colors"
          flipHorizontal={sidebarCollapsed}
        />
      </button>
      <div className="min-w-0 flex-1" />
      <div className="hidden shrink-0 sm:block">
        <NavbarSearch />
      </div>
      <ThemeToggle />
      <button
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 sm:size-10"
        aria-label="Notifications"
      >
        <NotificationBellIcon className="size-[18px] shrink-0" />
      </button>
    </header>
  );
}
