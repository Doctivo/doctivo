import { AdminSidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen p-4 md:p-10 w-full">
        {children}
      </main>
    </div>
  );
}


