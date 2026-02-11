export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
