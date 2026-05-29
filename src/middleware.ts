import { getIronSession } from "iron-session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultSession, type SessionData } from "@/lib/auth/session";

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "opc-crm-dev-secret-change-in-production-32chars",
  cookieName: "opc_crm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

const publicPaths = [
  "/login",
  "/api/auth/login",
  ...(process.env.NODE_ENV !== "production" ? ["/api/dev/seed"] : []),
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p),
  );

  if (!session.isLoggedIn && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session.isLoggedIn ? "/dashboard" : "/login", request.url),
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
