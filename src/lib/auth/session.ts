import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import type { Role } from "@/lib/constants";

export type SessionData = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  advisorId?: string | null;
  isLoggedIn: boolean;
};

export const defaultSession: SessionData = {
  userId: "",
  email: "",
  name: "",
  role: "advisor",
  advisorId: null,
  isLoggedIn: false,
};

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "opc-crm-dev-secret-change-in-production-32chars",
  cookieName: "opc_crm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}
