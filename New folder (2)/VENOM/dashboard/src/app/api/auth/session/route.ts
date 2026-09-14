import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getAuthRequestContext,
  refreshAuthTokens,
  verifyAuthToken
} from "@/lib/auth";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME
} from "@/lib/authConstants";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
  const context = getAuthRequestContext(new Headers(request.headers));
  const session = await verifyAuthToken(accessToken, context);

  if (session) {
    return NextResponse.json({ session }, { status: 200 });
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value || null;
  const refreshed = await refreshAuthTokens(refreshToken, context);
  if (!refreshed) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  const response = NextResponse.json({ session: refreshed.session }, { status: 200 });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: refreshed.accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshed.refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS
  });
  return response;
}
