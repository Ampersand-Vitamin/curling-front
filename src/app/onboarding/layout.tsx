export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full max-w-[400px] h-full overflow-hidden bg-white">
      {children}
    </div>
  );
}
