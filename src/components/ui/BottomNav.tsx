"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  isProfile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Discover",
    href: "/discover",
    icon: "/icons/map.svg",
  },
  {
    label: "Style",
    href: "/style",
    icon: "/icons/style.svg",
  },
  {
    label: "Messages",
    href: "/messages",
    icon: "/icons/chat.svg",
  },
  {
    label: "My",
    href: "/my",
    icon: "",
    isProfile: true,
  },
];

function DefaultAvatar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="9" r="4" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
    </svg>
  );
}

export default function BottomNav({ avatarUrl }: { avatarUrl?: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white">
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
                  <div className="size-[20px] rounded-full overflow-hidden bg-surface-300 text-surface-500 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="My"
                        width={20}
                        height={20}
                        className="object-cover size-full"
                      />
                    ) : (
                      <DefaultAvatar />
                    )}
                  </div>
                ) : (
                  <img
                    src={item.icon}
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
