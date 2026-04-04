import DesignerCard from "./DesignerCard";

const MOCK_DESIGNERS = [
  {
    id: "1",
    name: "Sejin",
    role: "Designer",
    languages: ["Korean", "English"],
    profileImage: "/placeholder.jpg",
  },
  {
    id: "2",
    name: "Yuna",
    role: "Designer",
    languages: ["Korean", "English"],
    profileImage: "/placeholder.jpg",
  },
];

export default function DesignerCarousel() {
  return (
    <div>
      <h2 className="text-h4 text-surface-900 mb-3">
        Popular Designer with Curly hair
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {MOCK_DESIGNERS.map((designer) => (
          <DesignerCard key={designer.id} {...designer} />
        ))}
      </div>
    </div>
  );
}
