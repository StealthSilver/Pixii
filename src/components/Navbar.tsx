"use client";

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
      <ThemeToggle />
      <div className="min-w-0 flex-1" />
      <NavbarSearch />
      <button
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        aria-label="Notifications"
      >
        <BellIcon className="size-5" />
      </button>
    </header>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
