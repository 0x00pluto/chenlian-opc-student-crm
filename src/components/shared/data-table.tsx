import * as React from "react";

import { Button } from "@/components/ui/button";
import { TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const tableCellPrimary =
  "px-4 py-2 text-sm font-medium text-zinc-900";
export const tableCellSecondary = "px-4 py-2 text-sm text-zinc-500";
export const tableCellActions = "px-4 py-2 text-right";
export const tableCellEmpty =
  "px-4 py-8 text-center text-sm text-zinc-500";

export function DataTableShell({
  children,
  toolbar,
  className,
}: {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm",
        className,
      )}
    >
      {toolbar ? (
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
          {toolbar}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function DataTableHeaderRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn(
        "border-b border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50/50",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn("h-9 px-4 text-xs font-medium text-zinc-500", className)}
      {...props}
    />
  );
}

export function DataTableBodyRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn("border-b border-zinc-200 hover:bg-zinc-50/50", className)}
      {...props}
    />
  );
}

export function TableRowActionButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-zinc-500 hover:text-zinc-900", className)}
      {...props}
    />
  );
}
