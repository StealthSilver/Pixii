"use client";

import { FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";

type NavbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Navbar({ sidebarCollapsed, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-background px-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="group inline-flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? (
          <FaAngleDoubleRight
            className="size-4 text-neutral-500 transition-colors group-hover:text-primary"
            aria-hidden
          />
        ) : (
          <FaAngleDoubleLeft
            className="size-4 text-neutral-500 transition-colors group-hover:text-primary"
            aria-hidden
          />
        )}
      </button>

      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-lg text-black transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
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
