import { auth } from "@/lib/auth";
import BottomNav from "@/components/ui/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const avatarUrl = session?.user?.image ?? null;

  return (
    <div className="w-full max-w-[400px] h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hidden">{children}</div>
      <div className="sticky bottom-0 z-50">
        <BottomNav avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
