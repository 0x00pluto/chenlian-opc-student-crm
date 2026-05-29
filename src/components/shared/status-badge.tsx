import {
  alumniStatusLabels,
  cohortStatusLabels,
  enrollmentStatusLabels,
  labelAlumni,
  labelCohort,
  labelEnrollment,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const statusPillClass =
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium";

const enrollmentStyles: Record<string, string> = {
  pending_interview: "bg-amber-50 text-amber-700",
  interview_failed: "bg-red-50 text-red-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  refunded: "bg-zinc-100 text-zinc-600",
  lead: "bg-zinc-50 text-zinc-600",
};

const alumniStyles: Record<string, string> = {
  none: "bg-zinc-50 text-zinc-500",
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-orange-50 text-orange-700",
};

const cohortStyles: Record<string, string> = {
  recruiting: "bg-blue-50 text-blue-700",
  in_progress: "bg-emerald-50 text-emerald-700",
  ended: "bg-zinc-100 text-zinc-600",
};

export function EnrollmentStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(statusPillClass, enrollmentStyles[status] ?? "")}>
      {labelEnrollment(status)}
    </span>
  );
}

export function AlumniStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(statusPillClass, alumniStyles[status] ?? "")}>
      {labelAlumni(status)}
    </span>
  );
}

export function CohortStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(statusPillClass, cohortStyles[status] ?? "")}>
      {labelCohort(status)}
    </span>
  );
}

export { enrollmentStatusLabels, alumniStatusLabels, cohortStatusLabels };
