"use client";

import KeywordFilter from "./KeywordFilter";

interface FilterCategory {
  title: string;
  keywords: string[];
}

//TODO: DB에 저장된 키워드로 변경
const FILTER_CATEGORIES: FilterCategory[] = [
  {
    title: "Recommended Keywords",
    keywords: [
      "English Speaker",
      "Curly Hair Expert",
      "Foreigner Friendly",
      "Balayage",
      "Blonde Highlights",
      "Head Spa",
    ],
  },
  {
    title: "Hair Type",
    keywords: ["Straight Hair", "Wavy Hair", "Curly Hair", "Coily Hair"],
  },
  {
    title: "Treatment",
    keywords: [
      "Haircut",
      "Head Spa",
      "Hair Extension",
      "Highlight",
      "Perm",
      "Root Touch-up",
      "Blow-dry",
      "Down Perm",
      "Wig",
      "Coloring",
      "Grey Coverage",
      "Cornrow",
    ],
  },
  {
    title: "Style",
    keywords: [
      "Trendy",
      "K-Pop",
      "Classic",
      "Wedding",
      "Party",
      "Graduation",
      "Photoshoot",
      "Elegant",
      "Unique",
    ],
  },
  {
    title: "Hair Concern",
    keywords: [
      "Thick Hair",
      "Thin Hair",
      "Damaged Hair",
      "Dark Coloring",
      "Flat Hair",
      "Scalp Care",
      "Frizzy Hair",
      "Previously Bleached",
      "Permed",
    ],
  },
  {
    title: "Languages",
    keywords: [
      "Korean",
      "English",
      "Chinese",
      "Japanese",
      "Spanish",
      "French",
      "Italian",
      "German",
      "Indonesian",
      "Others",
    ],
  },
  {
    title: "Special Offers",
    keywords: [
      "Promotion",
      "Pet Friendly",
      "Vegan Products",
      "Private Room",
      "Tax-free",
      "Pregnancy-safe",
      "Foreigner Friendly",
    ],
  },
  {
    title: "Current Hair Color",
    keywords: [
      "Blonde",
      "Brown",
      "Dark Brown",
      "Black",
      "Ginger",
      "Bleached",
      "Colored",
      "Others",
    ],
  },
  {
    title: "Current Hair Length",
    keywords: [
      "Pixie Cut",
      "Short",
      "Medium (Shoulder Length)",
      "Long (Chest Length)",
      "Extra Long (Waist)",
    ],
  },
  {
    title: "Treatment History",
    keywords: [
      "Dark Coloring",
      "Previously Bleached",
      "Permed",
      "History of Dark Dye",
      "Wig",
      "Cornrowed",
    ],
  },
];

interface FilterPopupProps {
  activeKeywords: Set<string>;
  onToggle: (keyword: string) => void;
  onClose: () => void;
}

export default function FilterPopup({
  activeKeywords,
  onToggle,
}: FilterPopupProps) {
  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-surface-50/95 backdrop-blur-[10px] px-[10px] pt-3 pb-5">
      <div className="flex flex-col gap-6">
        {FILTER_CATEGORIES.map((category) => (
          <div key={category.title} className="flex flex-col gap-2">
            <h3 className="typo-h6 text-surface-900">{category.title}</h3>
            <div className="flex flex-wrap gap-1">
              {category.keywords.map((keyword) => (
                <KeywordFilter
                  key={keyword}
                  label={keyword}
                  variant="filled"
                  activated={activeKeywords.has(keyword)}
                  onClick={() => onToggle(keyword)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
