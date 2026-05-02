import Image from "next/image";

const DEMO_USER_NAME = "Demo User";

/** Primary tint for demo avatar (matches --primary). */
const AVATAR_BG = "BF4F30";

type SidebarProps = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={
        "flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-background transition-[width] duration-200 ease-out " +
        (collapsed ? "w-[72px]" : "w-60")
      }
    >
      <div className="flex h-14 shrink-0 items-center border-b border-neutral-200 px-3">
        <div
          className={
            "flex min-w-0 flex-1 items-center " +
            (collapsed ? "justify-center px-0.5" : "")
          }
        >
          <Image
            src={collapsed ? "/small.ico" : "/logo.svg"}
            alt="Pixii"
            width={collapsed ? 32 : 824}
            height={collapsed ? 32 : 219}
            unoptimized
            priority
            className={
              collapsed
                ? "size-6 object-contain"
                : "h-6 w-auto max-w-full object-contain"
            }
          />
        </div>
      </div>

      <div className="min-h-0 flex-1" />

      <div className="shrink-0 border-t border-neutral-200 p-3">
        <div
          className={
            "flex items-center gap-3 " + (collapsed ? "justify-center" : "")
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- demo avatar from stable URL */}
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(DEMO_USER_NAME)}&background=${AVATAR_BG}&color=fff&size=128`}
            alt={DEMO_USER_NAME}
            className="size-10 shrink-0 rounded-full ring-2 ring-white"
            width={40}
            height={40}
          />
          {!collapsed && (
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-black">
              {DEMO_USER_NAME}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
