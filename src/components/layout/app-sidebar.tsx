"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Merge,
  Settings,
  Shield,
  Upload,
  UserCog,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const mainNav: NavItem[] = [
  { title: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { title: "学员管理", href: "/students", icon: Users },
  { title: "期班管理", href: "/cohorts", icon: GraduationCap },
  { title: "考勤管理", href: "/attendance", icon: ClipboardList },
  { title: "课程树", href: "/courses", icon: BookOpen },
];

const adminNav: NavItem[] = [
  { title: "互动吧导入", href: "/students/import", icon: Upload, roles: ["admin", "super_admin"] },
  { title: "导入合并", href: "/merge", icon: Merge, roles: ["admin", "super_admin"] },
  { title: "用户管理", href: "/users", icon: UserCog, roles: ["super_admin"] },
  { title: "班主任管理", href: "/advisors", icon: UserCog, roles: ["super_admin"] },
  { title: "审计日志", href: "/audit-logs", icon: Shield, roles: ["super_admin"] },
  { title: "企微配置", href: "/settings/wecom", icon: Settings, roles: ["super_admin"] },
];

const navButtonClass = cn(
  "h-10 gap-3 rounded-md px-3 text-sm",
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  "data-[active=true]:bg-zinc-100 data-[active=true]:font-medium data-[active=true]:text-zinc-900",
  "hover:data-[active=true]:bg-zinc-100",
  "[&_svg]:size-[18px]",
);

function NavItems({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarMenu className="gap-1">
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            className={navButtonClass}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });

  const adminItems = filterByRole(adminNav);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <Sidebar className="border-r border-zinc-200 bg-zinc-50/50">
      <SidebarHeader className="px-4 pb-2 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-900">宸联教育</span>
          <span className="text-sm text-zinc-500">OPC 学员孵化管理系统</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-3 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <NavItems items={mainNav} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        {adminItems.length > 0 && (
          <>
            <SidebarSeparator className="my-3 bg-zinc-200/70" />
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <NavItems items={adminItems} pathname={pathname} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-200/70 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-zinc-600",
            "hover:bg-zinc-100 hover:text-zinc-900",
            "[&_svg]:size-[18px]",
          )}
        >
          <LogOut />
          退出登录
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
