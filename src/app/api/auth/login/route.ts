import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, getSessionSecret, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  console.log("[auth/login] POST received from", req.headers.get("user-agent")?.slice(0, 60));

  let username: string, password: string;
  try {
    ({ username, password } = await req.json());
  } catch (e) {
    console.log("[auth/login] Failed to parse body:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  console.log("[auth/login] Checking credentials for user:", username);
  console.log("[auth/login] AUTH_USERNAME set:", !!process.env.AUTH_USERNAME);
  console.log("[auth/login] AUTH_PASSWORD set:", !!process.env.AUTH_PASSWORD);
  console.log("[auth/login] AUTH_SECRET set:", !!process.env.AUTH_SECRET);

  if (!checkCredentials(username, password)) {
    console.log("[auth/login] Credentials invalid");
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = getSessionSecret();
  if (!secret) {
    console.log("[auth/login] AUTH_SECRET missing");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  console.log("[auth/login] Login successful, setting cookie");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
