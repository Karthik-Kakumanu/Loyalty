import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || "default-secret-key";
const encodedKey = new TextEncoder().encode(secretKey);

type SessionPayload = {
  userId: string;
  phone: string;
  expiresAt: Date;
};

export async function createSession(userId: string, phone: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Create JWT
  const session = await new SignJWT({ userId, phone, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  
  // FIX: Allow HTTP on Localhost/Mobile Network (172.x.x.x)
  // Only enforce Secure (HTTPS) if strictly in Production
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: isProduction, // false in dev = works on phone
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// Fixed Export Name: getSession (was verifySession)
export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey);
    return payload as SessionPayload;
  } catch (error) {
    console.error("Failed to verify session", error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}