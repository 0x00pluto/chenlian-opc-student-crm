import type { CSSProperties } from "react";
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
        } as CSSProperties
      }
    >
      <AppSidebar role={user.role} />
      <SidebarInset>
        <AppHeaderNav userName={user.name} />
        <main className="flex-1 overflow-auto bg-zinc-50 p-4 md:p-5">{children}</main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
