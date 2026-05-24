"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingIcon } from "@/components/icons/SettingIcon";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";

// ── Constants ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];

const LANGUAGE_OPTIONS = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "yue", label: "广东话" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
];
const LANG_BY_CODE: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.code, l.label])
);
const LANG_BY_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.label, l.code])
);
const LANGUAGE_LABELS = LANGUAGE_OPTIONS.map((l) => l.label);

const HAIR_TYPE_LABELS = ["Straight", "Wavy Hair", "Curly Hair", "Coily Hair"];
const HAIR_TYPE_ID: Record<string, string> = {
  Straight: "straight",
  "Wavy Hair": "wavy",
  "Curly Hair": "curly",
  "Coily Hair": "coily",
};
const HAIR_TYPE_LABEL: Record<string, string> = {
  straight: "Straight",
  wavy: "Wavy Hair",
  curly: "Curly Hair",
  coily: "Coily Hair",
};

const HAIR_LENGTH_OPTIONS = [
  "Short (above shoulders)",
  "Medium (collarbone)",
  "Long (chest to waist)",
  "Extra Long (below waist)",
];

const HAIR_COLOR_OPTIONS = [
  "Natural Black", "Dark Brown", "Medium Brown", "Light Brown",
  "Dirty Blonde", "Blonde", "Platinum Blonde",
  "Red", "Auburn", "Gray / Silver", "White / Platinum",
  "Highlighted", "Bleached", "Color-treated",
];

const HAIR_CONCERN_OPTIONS = [
  "None right now", "Frizz", "Damage", "Volume", "Scalp issues",
  "Thin Hair", "Color care", "Split ends", "Dryness", "Heat Damage",
  "Oiliness", "Breakage", "Dandruff", "Porosity", "Graying",
  "Curl definition", "Other",
];

const TREATMENT_OPTIONS = [
  "Bleach / Lightening", "Dark or black coloring", "Red coloring",
  "Chemical straightening", "Perm / Wave", "Keratin treatment",
  "None of the above",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  account_mode: string | null;
  name: string | null;
  bio: string | null;
  age: string | null;
  gender: string | null;
  hair_type: string | null;
  hair_length: string | null;
  hair_color: string | null;
  hair_concerns: string[] | null;
  hair_history: string[] | null;
  languages: string[] | null;
  preferred_styles: string[] | null;
  avatar_url: string | null;
  created_at: string | null;
} | null;

type Props = { profile: Profile; email: string; avatarUrl: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSignUpDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}.${d.getFullYear()}`;
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function Dropdown({
  id, label, placeholder, options, multi, selected, onChange, open, onToggle,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  multi: boolean;
  selected: string[];
  onChange: (values: string[]) => void;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  const displayValue = selected.length > 0 ? selected.join(", ") : "";

  function handleSelect(opt: string) {
    if (multi) {
      onChange(
        selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt]
      );
    } else {
      onChange([opt]);
      onToggle(id);
    }
  }

  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p className="typo-button text-surface-950">{label}</p>
      <div className="bg-surface-200 rounded-[16px] overflow-hidden w-full">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="h-[44px] flex items-center gap-[10px] pl-4 pr-[10px] w-full"
        >
          <span
            className={`flex-1 typo-button text-left truncate ${
              displayValue ? "text-surface-950" : "text-surface-400"
            }`}
          >
            {displayValue || placeholder}
          </span>
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`shrink-0 text-surface-600 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <path d="M5.84 9L4.5 10.365L12 18L19.5 10.365L18.16 9L12 15.27L5.84 9Z" />
          </svg>
        </button>

        {open && (
          <div className="px-3 pb-3 flex flex-col gap-4 max-h-[260px] overflow-y-auto scrollbar-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`rounded-[8px] p-[10px] w-full text-left typo-body2 transition-colors ${
                  selected.includes(opt)
                    ? "bg-surface-800 text-white"
                    : "bg-white text-surface-800"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TextInput ─────────────────────────────────────────────────────────────────

function TextInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p className="typo-button text-surface-950">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-surface-200 rounded-[16px] h-[44px] pl-4 pr-[10px] typo-button text-surface-950 placeholder:text-surface-400 outline-none w-full"
      />
    </div>
  );
}

// ── ReadRow ───────────────────────────────────────────────────────────────────

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white py-3 flex items-center gap-2">
      <span className="typo-button text-surface-950 shrink-0 whitespace-nowrap">{label}</span>
      <span className="flex-1 typo-button text-surface-600 text-right truncate">{value || "—"}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function EditProfileForm({ profile, email, avatarUrl }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [age, setAge] = useState(profile?.age ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [hairType, setHairType] = useState(profile?.hair_type ?? "");
  const [hairLength, setHairLength] = useState(profile?.hair_length ?? "");
  const [hairColor, setHairColor] = useState(profile?.hair_color ?? "");
  const [hairConcerns, setHairConcerns] = useState<string[]>(profile?.hair_concerns ?? []);
  const [hairHistory, setHairHistory] = useState<string[]>(profile?.hair_history ?? []);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayAvatar = localAvatarUrl ?? avatarUrl;

  function toggleDropdown(id: string) {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setLocalAvatarUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        const r = await fetch("/api/profile/avatar", { method: "POST", body: fd });
        if (!r.ok) console.error("Avatar upload failed:", await r.text());
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountMode: profile?.account_mode,
          name,
          bio,
          age,
          gender,
          hairType,
          hairLength,
          hairColor,
          hairConcerns,
          hairHistory,
          languages,
          preferredStyles: profile?.preferred_styles ?? [],
        }),
      });
      if (res.ok) router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white min-h-full flex flex-col">

      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 pt-16 pb-[10px] relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute left-4 p-1 text-surface-950"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <p className="typo-h6 text-surface-600">Profile Setting</p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 pb-6 flex-1">

        {/* Profile Info */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-[100px] h-[100px] shrink-0 rounded-full overflow-hidden border border-surface-400 bg-surface-300 text-surface-500 flex items-center justify-center">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="object-cover w-full h-full"
                  unoptimized={!!localAvatarUrl}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                </svg>
              )}
            </div>
            <button
              type="button"
              aria-label="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-surface-400 flex items-center justify-center text-surface-600"
            >
              <SettingIcon size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-col items-center gap-1 w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="typo-h4 text-surface-950 text-center bg-transparent outline-none w-full py-0 placeholder:text-surface-400"
            />
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={`Hi! This is ${name || "User"}.`}
              className="typo-body2 text-surface-600 text-center bg-transparent outline-none w-full py-0 placeholder:text-surface-400"
            />
          </div>
        </div>

        {/* About you */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-4">
          <p className="typo-caption text-surface-400">About you</p>
          <Dropdown
            id="gender"
            label="Gender"
            placeholder="Choose your gender"
            options={GENDER_OPTIONS}
            multi={false}
            selected={gender ? [gender] : []}
            onChange={(vals) => setGender(vals[0] ?? "")}
            open={openDropdown === "gender"}
            onToggle={toggleDropdown}
          />
          <TextInput
            label="Age"
            value={age}
            onChange={setAge}
            placeholder="Your age"
          />
          <Dropdown
            id="languages"
            label="Preferred Language"
            placeholder="Preferred Language"
            options={LANGUAGE_LABELS}
            multi={true}
            selected={languages.map((code) => LANG_BY_CODE[code] ?? code)}
            onChange={(labels) => setLanguages(labels.map((l) => LANG_BY_LABEL[l] ?? l))}
            open={openDropdown === "languages"}
            onToggle={toggleDropdown}
          />
        </div>

        {/* Hair */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-4">
          <p className="typo-caption text-surface-400">Hair</p>
          <Dropdown
            id="hairType"
            label="Hair Type*"
            placeholder="Choose your hair type"
            options={HAIR_TYPE_LABELS}
            multi={false}
            selected={hairType ? [HAIR_TYPE_LABEL[hairType] ?? hairType] : []}
            onChange={(vals) => setHairType(vals[0] ? (HAIR_TYPE_ID[vals[0]] ?? vals[0]) : "")}
            open={openDropdown === "hairType"}
            onToggle={toggleDropdown}
          />
          <Dropdown
            id="hairLength"
            label="Hair Length*"
            placeholder="Choose your hair length"
            options={HAIR_LENGTH_OPTIONS}
            multi={false}
            selected={hairLength ? [hairLength] : []}
            onChange={(vals) => setHairLength(vals[0] ?? "")}
            open={openDropdown === "hairLength"}
            onToggle={toggleDropdown}
          />
          <Dropdown
            id="hairColor"
            label="Hair Color"
            placeholder="Choose your hair color"
            options={HAIR_COLOR_OPTIONS}
            multi={false}
            selected={hairColor ? [hairColor] : []}
            onChange={(vals) => setHairColor(vals[0] ?? "")}
            open={openDropdown === "hairColor"}
            onToggle={toggleDropdown}
          />
          <Dropdown
            id="hairConcerns"
            label="Hair Concern"
            placeholder="Select hair concerns"
            options={HAIR_CONCERN_OPTIONS}
            multi={true}
            selected={hairConcerns}
            onChange={setHairConcerns}
            open={openDropdown === "hairConcerns"}
            onToggle={toggleDropdown}
          />
          <Dropdown
            id="hairHistory"
            label="Treatment History"
            placeholder="Select treatment history"
            options={TREATMENT_OPTIONS}
            multi={true}
            selected={hairHistory}
            onChange={setHairHistory}
            open={openDropdown === "hairHistory"}
            onToggle={toggleDropdown}
          />
        </div>

        {/* Account */}
        <div className="border-t border-surface-200 py-2 flex flex-col gap-2">
          <p className="typo-caption text-surface-400">Account</p>
          <div className="flex flex-col">
            <ReadRow label="Email" value={email} />
            <ReadRow label="Sign up" value={formatSignUpDate(profile?.created_at ?? null)} />
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-surface-800 rounded-lg py-3 flex items-center justify-center typo-button text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>

      </div>
    </div>
  );
}
