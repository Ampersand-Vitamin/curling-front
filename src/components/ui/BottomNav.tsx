"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storageUrl } from "@/lib/storage";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  iconActive: string;
  isProfile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Discover",
    href: "/discover",
    icon: "asset/nav/discover.svg",
    iconActive: "asset/nav/discover_active.svg",
  },
  {
    label: "Style",
    href: "/style",
    icon: "asset/nav/style.svg",
    iconActive: "asset/nav/style_active.svg",
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "asset/nav/messages.svg",
    iconActive: "asset/nav/messages_active.svg",
  },
  {
    label: "My",
    href: "/my",
    icon: "",
    iconActive: "",
    isProfile: true,
  },
];

function DefaultAvatar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="4" fill="currentColor" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="currentColor" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white">
      {/* Nav items */}
      <div className="flex items-start justify-center gap-1 pb-5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center w-[84px] h-[56px] py-1"
            >
              <div className={`flex items-center justify-center size-8 ${isActive ? "" : "opacity-50"}`}>
                {item.isProfile ? (
                  <div className="size-7 rounded-full bg-surface-200 text-surface-400 flex items-center justify-center overflow-hidden">
                    <DefaultAvatar />
                  </div>
                ) : (
                  <img
                    src={storageUrl(isActive ? item.iconActive : item.icon)}
                    alt={item.label}
                    width={24}
                    height={24}
                  />
                )}
              </div>
              <span
                className={`typo-caption tracking-[-0.5px] ${
                  isActive ? "text-surface-950" : "text-surface-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
