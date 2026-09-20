export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      {/* Wide enough for the split layout on desktop; the form alone stays
          centered and narrow on smaller screens. */}
      <div className="w-full max-w-md lg:max-w-5xl">{children}</div>
    </main>
  );
}
