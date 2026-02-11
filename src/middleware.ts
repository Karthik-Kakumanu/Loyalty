import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default-secret-key";
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // Define Paths
  const isProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  const isAuthPath = pathname.startsWith("/auth");

  // 1. Verify Token
  let isValid = false;
  if (session) {
    try {
      await jwtVerify(session, encodedKey);
      isValid = true;
    } catch (err) {
      isValid = false;
    }
  }

  // 2. Redirect Rules
  
  // Rule A: Trying to access Protected Pages (Dashboard/Onboarding) without being logged in
  if (isProtectedPath && !isValid) {
    return NextResponse.redirect(new URL("/auth", req.nextUrl));
  }

  // Rule B: Trying to access Auth Page while already logged in
  if (isAuthPath && isValid) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// 3. Configuration
export const config = {
  matcher: ["/dashboard/:path*", "/auth", "/onboarding"],
};