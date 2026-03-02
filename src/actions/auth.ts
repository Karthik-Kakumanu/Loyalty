// file: src/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession, getSession } from "@/lib/session";

type CheckUserResult = {
  exists: boolean;
};

type OtpResult = {
  success: boolean;
  error?: string;
};

type VerifyOtpResult = {
  success: boolean;
  error?: string;
  isNewUser?: boolean;
};

type MutationResult = {
  success: boolean;
  error?: string;
};

type SignupPayload = {
  name: string;
  phone: string;
  dob: string;
  state: string;
  city: string;
};

function normalizePhone(rawPhone: string, countryCode: string): string {
  let clean = rawPhone.replace(/\D/g, "");
  if (countryCode === "+91" && clean.length === 12 && clean.startsWith("91")) {
    clean = clean.slice(2);
  }
  return `${countryCode}${clean}`;
}

export async function checkUserExists(
  phone: string,
  countryCode: string
): Promise<CheckUserResult> {
  const normalized = normalizePhone(phone, countryCode);
  const user = await db.user.findUnique({ where: { phone: normalized } });
  return { exists: Boolean(user) };
}

export async function sendOtp(formData: FormData): Promise<OtpResult> {
  const phone = String(formData.get("phone") ?? "");
  const countryCode = String(formData.get("countryCode") ?? "");
  const normalized = normalizePhone(phone, countryCode);

  if (!phone || !countryCode) {
    return { success: false, error: "Invalid phone" };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Debug logging only
  // eslint-disable-next-line no-console
  console.log("[OTP] Generated", normalized, code);

  const apiKey = process.env.OTP_API_KEY;

  if (apiKey && countryCode === "+91") {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: `Your Revistra OTP is ${code}`,
          flash: 0,
          numbers: normalized.replace(/^\+91/, "")
        })
      });

      // eslint-disable-next-line no-console
      console.log("[Fast2SMS]", response.status);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Fast2SMS] failed", error);
    }
  }

  await db.otp.upsert({
    where: { phone: normalized },
    update: { code, expiresAt },
    create: { phone: normalized, code, expiresAt }
  });

  return { success: true };
}

export async function verifyOtpAndLogin(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const record = await db.otp.findUnique({ where: { phone } });
  if (!record || record.code !== code) {
    return { success: false, error: "Invalid code" };
  }
  if (new Date() > record.expiresAt) {
    return { success: false, error: "Code expired" };
  }

  const user = await db.user.findUnique({ where: { phone } });

  await db.otp.delete({ where: { phone } });

  return { success: true, isNewUser: !user };
}

export async function completeSignup(data: SignupPayload): Promise<MutationResult> {
  try {
    const user = await db.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        dob: new Date(data.dob),
        state: data.state,
        city: data.city
      }
    });
    await createSession(user.id, user.phone);
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Signup error", error);
    return { success: false, error: "Unable to create account" };
  }
}

export async function completeLogin(phone: string): Promise<MutationResult> {
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    return { success: false, error: "User not found" };
  }
  await createSession(user.id, user.phone);
  return { success: true };
}

export async function updateInterests(interests: string[]): Promise<MutationResult> {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    await db.user.update({
      where: { id: session.userId },
      data: { interests }
    });
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save interests", error);
    return { success: false, error: "Unable to save preferences" };
  }
}

export async function logoutUser(): Promise<never> {
  await deleteSession();
  redirect("/auth");
}