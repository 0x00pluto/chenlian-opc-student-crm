"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";

type Crumb = { label: string; href?: string };

function getCrumbs(pathname: string): Crumb[] {
  const routes: { match: string | RegExp; crumbs: Crumb[] }[] = [
    { match: "/dashboard", crumbs: [{ label: "数据仪表盘" }] },
    { match: "/students/import", crumbs: [{ label: "学员管理", href: "/students" }, { label: "互动吧导入" }] },
    { match: /^\/students\/[^/]+$/, crumbs: [{ label: "学员管理", href: "/students" }, { label: "学员详情" }] },
    { match: "/students", crumbs: [{ label: "学员管理" }] },
    { match: /^\/cohorts\/[^/]+$/, crumbs: [{ label: "期班管理", href: "/cohorts" }, { label: "期班详情" }] },
    { match: "/cohorts", crumbs: [{ label: "期班管理" }] },
    { match: "/courses", crumbs: [{ label: "课程树" }] },
    { match: /^\/advisors\/[^/]+\/transfer$/, crumbs: [{ label: "班主任管理", href: "/advisors" }, { label: "离职转移" }] },
    { match: "/advisors", crumbs: [{ label: "班主任管理" }] },
    { match: "/merge", crumbs: [{ label: "导入合并" }] },
    { match: "/audit-logs", crumbs: [{ label: "审计日志" }] },
    { match: "/settings/wecom", crumbs: [{ label: "企微配置" }] },
  ];

  for (const r of routes) {
    if (typeof r.match === "string") {
      if (pathname === r.match) return r.crumbs;
    } else if (r.match.test(pathname)) {
      return r.crumbs;
    }
  }

  return [{ label: "工作台" }];
}

export function AppHeaderNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const leaf = getCrumbs(pathname);
  const crumbs: Crumb[] = [{ label: "工作台", href: "/dashboard" }, ...leaf];

  return <AppHeader crumbs={crumbs} userName={userName} />;
}
