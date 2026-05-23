import { create } from "zustand";

type AccountMode = "client" | "designer";
type Gender = "Female" | "Male" | "Non-binary" | "Prefer not to say";
type HairType = "straight" | "wavy" | "curly" | "coily";

interface OnboardingState {
  accountMode: AccountMode | null;
  name: string;
  gender: Gender | null;
  hairType: HairType | null;
  hairLength: string | null;
  hairConcerns: string[];
  hairHistory: string[];
  languages: string[];
  preferredStyles: string[];
  setAccountMode: (mode: AccountMode) => void;
  setName: (name: string) => void;
  setGender: (gender: Gender) => void;
  setHairType: (type: HairType) => void;
  setHairLength: (length: string) => void;
  toggleHairConcern: (concern: string) => void;
  setHairHistory: (history: string[]) => void;
  setLanguages: (langs: string[]) => void;
  setPreferredStyles: (styles: string[]) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  accountMode: null,
  name: "",
  gender: null,
  hairType: null,
  hairLength: null,
  hairConcerns: [],
  hairHistory: [],
  languages: [],
  preferredStyles: [],
  setAccountMode: (mode) => set({ accountMode: mode }),
  setName: (name) => set({ name }),
  setGender: (gender) => set({ gender }),
  setHairType: (type) => set({ hairType: type }),
  setHairLength: (length) => set({ hairLength: length }),
  toggleHairConcern: (concern) =>
    set((s) => ({
      hairConcerns: s.hairConcerns.includes(concern)
        ? s.hairConcerns.filter((c) => c !== concern)
        : [...s.hairConcerns, concern],
    })),
  setHairHistory: (history) => set({ hairHistory: history }),
  setLanguages: (langs) => set({ languages: langs }),
  setPreferredStyles: (styles) => set({ preferredStyles: styles }),
}));
