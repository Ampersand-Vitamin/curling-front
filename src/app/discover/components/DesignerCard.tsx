interface DesignerCardProps {
  name: string;
  role: string;
  languages: string[];
  profileImage: string;
}

export default function DesignerCard({
  name,
  role,
  languages,
  profileImage,
}: DesignerCardProps) {
  return (
    <div className="relative min-w-[180px] h-[120px] rounded-2xl overflow-hidden bg-surface-900">
      <img
        src={profileImage}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div className="relative z-10 p-3 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-h4 text-white">{name}</span>
            <span className="text-caption text-surface-300 ml-2">{role}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {languages.map((lang) => (
            <span
              key={lang}
              className="text-caption text-white bg-white/20 px-2 py-0.5 rounded-full"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
