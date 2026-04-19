import BottomNav from "@/components/ui/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[400px] h-full flex flex-col bg-surface-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="sticky bottom-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
