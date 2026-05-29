import { redirect } from "next/navigation";

import { AppHeaderNav } from "@/components/layout/app-header-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureDb } from "@/lib/db/bootstrap";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  ensureDb();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset className="bg-zinc-50">
        <AppHeaderNav userName={user.name} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
