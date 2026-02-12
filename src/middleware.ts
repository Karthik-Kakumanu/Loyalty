import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default-secret-key";
const encodedKey = new TextEncoder().encode(secretKey);

// The function name MUST be 'middleware' for Next.js to run it
export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  const isProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
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

  // 1. If trying to access Dashboard/Onboarding without a valid session -> Go to Auth
  if (isProtectedPath && !isValid) {
    return NextResponse.redirect(new URL("/auth", req.nextUrl));
  }

  // 2. If trying to access Auth (Login) but ALREADY logged in -> Go to Dashboard
  if (isAuthPath && isValid) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Run middleware only on these paths
export const config = {
  matcher: ["/dashboard/:path*", "/auth", "/onboarding"],
};