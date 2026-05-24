export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AccountActions } from "./AccountActions";
import { SettingIcon } from "@/components/icons/SettingIcon";

const LANGUAGE_MAP: Record<string, { label: string; flag?: string }> = {
  ko:  { label: "한국어",   flag: "/images/flags/korean.svg" },
  en:  { label: "English",  flag: "/images/flags/british.svg" },
  zh:  { label: "中文",     flag: "/images/flags/chinese.svg" },
  yue: { label: "广东话",   flag: "/images/flags/hongkong.svg" },
  ja:  { label: "日本語",   flag: "/images/flags/japanese.svg" },
  ar:  { label: "العربية", flag: "/images/flags/saudi.svg" },
  fr:  { label: "Français", flag: "/images/flags/french.svg" },
};

const HAIR_TYPE_LABEL: Record<string, string> = {
  straight: "Straight",
  wavy:     "Wavy Hair",
  curly:    "Curly Hair",
  coily:    "Coily Hair",
};

type Chip = { label: string; flag?: string };

function ProfileChip({ label, flag }: Chip) {
  return (
    <span
      className={`flex items-center h-7 gap-1 rounded-full border border-surface-400 bg-white typo-caption text-surface-800 ${flag ? "pl-1 pr-[10px]" : "px-2"}`}
    >
      {flag && (
        <Image src={flag} alt="" width={20} height={20} className="rounded-full object-cover shrink-0" />
      )}
      {label}
    </span>
  );
}


const QUICK_ACTIONS = [
  ["My Reviews", "Favorite"],
  ["Booking History", "Coupons"],
] as const;

const SUPPORT_ITEMS = ["FAQ", "Customer Service"] as const;
const SETTINGS_ITEMS = ["Setting", "Notification", "Terms and policies", "Version information"] as const;

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { data: profile } = await supabaseAdmin
    .from("hair_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const displayName = (profile?.name as string | null) || session.user.name || "User";
  const avatarUrl = (profile?.avatar_url as string | null) ?? session.user.image;
  const bio = `Hi! This is ${displayName}.`;

  const chips: Chip[] = [];
  if (profile?.gender) chips.push({ label: profile.gender as string });
  for (const code of (profile?.languages ?? []) as string[]) {
    const lang = LANGUAGE_MAP[code];
    chips.push(lang ? { label: lang.label, flag: lang.flag } : { label: code });
  }
  if (profile?.hair_type) {
    chips.push({ label: HAIR_TYPE_LABEL[profile.hair_type as string] ?? (profile.hair_type as string) });
  }
  if (profile?.hair_length) {
    chips.push({ label: (profile.hair_length as string).split(" ")[0] });
  }
  for (const c of (profile?.hair_concerns ?? []) as string[]) chips.push({ label: c });
  for (const h of (profile?.hair_history ?? []) as string[]) chips.push({ label: h });

  return (
    <div className="bg-white min-h-full flex flex-col">

      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px]">
        <p className="typo-h6 text-surface-600 text-center">My</p>
      </div>

      {/* Page content */}
      <div className="flex flex-col gap-2 px-4 pb-6 flex-1">

        {/* Profile section */}
        <div className="flex flex-col items-center gap-6 py-4">

          {/* Avatar + name + bio */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="rounded-full overflow-hidden shrink-0 border border-surface-400 bg-surface-300 text-surface-500 flex items-center justify-center" style={{ width: 120, height: 120, minWidth: 120 }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={120} height={120} className="object-cover w-full h-full" />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                </svg>
              )}
            </div>

            <div className="flex flex-col gap-1 items-center w-full">
              <p className="typo-h4 text-surface-950 text-center">{displayName}</p>
              <p className="typo-body2 text-surface-600 text-center">{bio}</p>
            </div>
          </div>

          {/* Keyword chips — centered wrap */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center w-full">
              {chips.map((chip, i) => (
                <ProfileChip key={i} label={chip.label} flag={chip.flag} />
              ))}
            </div>
          )}

          {/* Edit profile button */}
          <Link
            href="/my/edit"
            className="w-full bg-surface-200 rounded-lg py-3 flex items-center justify-center gap-2 typo-button text-surface-950"
          >
            <SettingIcon className="shrink-0" />
            Edit profile
          </Link>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-2">
          {QUICK_ACTIONS.map((row, ri) => (
            <div key={ri} className="flex gap-2">
              {row.map((label) => (
                <Link
                  key={label}
                  href="#"
                  className="bg-white rounded-lg py-4 flex-1 flex items-center justify-center typo-button text-surface-950 text-center overflow-hidden"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
          <p className="typo-caption text-surface-400">Support</p>
          <div className="flex flex-col gap-1">
            {SUPPORT_ITEMS.map((label) => (
              <Link
                key={label}
                href="#"
                className="bg-white rounded-lg py-3 px-3 flex items-center gap-2 overflow-hidden"
              >
                <span className="typo-button text-surface-950">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
          <p className="typo-caption text-surface-400">Settings</p>
          <div className="flex flex-col gap-1">
            {SETTINGS_ITEMS.map((label) => (
              <Link
                key={label}
                href="#"
                className="bg-white rounded-lg py-3 px-3 flex items-center gap-2 overflow-hidden"
              >
                <span className="typo-button text-surface-950">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Account */}
        <AccountActions />

      </div>
    </div>
  );
}
