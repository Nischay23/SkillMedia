import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { ToastProvider } from "@/components/admin/Toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0b0f19]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="pl-64">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
