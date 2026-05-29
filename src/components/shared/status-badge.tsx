import { Badge } from "@/components/ui/badge";
import {
  alumniStatusLabels,
  cohortStatusLabels,
  enrollmentStatusLabels,
  labelAlumni,
  labelCohort,
  labelEnrollment,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const enrollmentStyles: Record<string, string> = {
  pending_interview: "bg-amber-50 text-amber-700 border-amber-200",
  interview_failed: "bg-red-50 text-red-700 border-red-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-zinc-100 text-zinc-600 border-zinc-200",
  lead: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const alumniStyles: Record<string, string> = {
  none: "bg-zinc-50 text-zinc-500 border-zinc-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-orange-50 text-orange-700 border-orange-200",
};

const cohortStyles: Record<string, string> = {
  recruiting: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ended: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function EnrollmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", enrollmentStyles[status] ?? "")}
    >
      {labelEnrollment(status)}
    </Badge>
  );
}

export function AlumniStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", alumniStyles[status] ?? "")}
    >
      {labelAlumni(status)}
    </Badge>
  );
}

export function CohortStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", cohortStyles[status] ?? "")}
    >
      {labelCohort(status)}
    </Badge>
  );
}

export { enrollmentStatusLabels, alumniStatusLabels, cohortStatusLabels };
