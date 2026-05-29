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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <Sidebar className="border-r border-zinc-200">
      <SidebarHeader className="border-b border-zinc-200 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-zinc-900">宸联教育</span>
          <span className="text-xs text-zinc-500">OPC 学员孵化管理系统</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-zinc-500">
            工作台
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  >
                    <Link href={item.href} className="text-sm">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {filterByRole(adminNav).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-zinc-500">
              管理
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(adminNav).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    >
                      <Link href={item.href} className="text-sm">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-200 p-2">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          )}
        >
          <LogOut className="size-4" />
          退出登录
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
