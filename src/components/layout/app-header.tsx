import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Crumb = { label: string; href?: string };

export function AppHeader({
  crumbs,
  userName,
}: {
  crumbs: Crumb[];
  userName: string;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="contents">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {c.href ? (
                      <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <span className="shrink-0 text-sm text-zinc-500">{userName}</span>
      </div>
    </header>
  );
}
