"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, getSessionSecret, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const username = (formData.get("username") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;

  if (!checkCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  const secret = getSessionSecret();
  if (!secret) {
    return { error: "Server misconfigured — AUTH_SECRET not set." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}
