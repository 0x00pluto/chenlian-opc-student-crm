import type { SessionData } from "@/lib/auth/session";
import type { Role } from "@/lib/constants";

export function isAdminRole(role: Role) {
  return role === "admin" || role === "super_admin";
}

export function canViewAllStudents(session: SessionData) {
  return isAdminRole(session.role);
}

export function canManageCourseTree(session: SessionData) {
  return isAdminRole(session.role);
}

export function canTransferAdvisors(session: SessionData) {
  return isAdminRole(session.role);
}

export function canManageUsers(session: SessionData) {
  return session.role === "super_admin";
}

export function canViewAuditLogs(session: SessionData) {
  return session.role === "super_admin";
}

export function canConfigureWecom(session: SessionData) {
  return session.role === "super_admin";
}

export function canAccessStudent(
  session: SessionData,
  assignedAdvisorId: string,
) {
  if (canViewAllStudents(session)) return true;
  return session.advisorId === assignedAdvisorId;
}

export function studentFilterAdvisorId(session: SessionData) {
  if (canViewAllStudents(session)) return null;
  return session.advisorId ?? "__none__";
}
