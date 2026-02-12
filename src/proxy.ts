import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default-secret-key";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  const isAuthPath = pathname.startsWith("/auth");

  let isValid = false;
  if (session) {
    try {
      await jwtVerify(session, encodedKey);
      isValid = true;
    } catch (err) {
      isValid = false;
    }
  }

  if (isProtectedPath && !isValid) {
    return NextResponse.redirect(new URL("/auth", req.nextUrl));
  }

  if (isAuthPath && isValid) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth", "/onboarding"],
};
