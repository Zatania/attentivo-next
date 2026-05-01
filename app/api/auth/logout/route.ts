import { NextResponse } from "next/server";
import { authCookieName, getClearAuthCookieOptions } from "@/lib/cookie-options";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out."
  });

  response.cookies.set(authCookieName, "", getClearAuthCookieOptions());

  return response;
}