"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOtpApiKey } from "@/lib/env";
import { normalizePhone, splitNormalizedPhone } from "@/lib/phone";
import { createSession, deleteSession, getSession } from "@/lib/session";
import {
  checkUserExistsSchema,
  completeSignupSchema,
  sendOtpSchema,
  updateInterestsSchema,
  verifyOtpSchema,
} from "@/lib/validation/auth";

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

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_HASH_ROUNDS = 10;

function getValidationErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

function getPhoneFromFormData(formData: FormData) {
  return {
    countryCode: String(formData.get("countryCode") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
}

function getOtpCooldownSeconds(expiresAt: Date): number {
  const estimatedLastSent = expiresAt.getTime() - OTP_EXPIRY_MS;
  const cooldownEndsAt = estimatedLastSent + OTP_RESEND_COOLDOWN_MS;
  const remainingMs = cooldownEndsAt - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function checkUserExists(
  phone: string,
  countryCode: string,
): Promise<CheckUserResult> {
  const parsed = checkUserExistsSchema.safeParse({ phone, countryCode });
  if (!parsed.success) return { exists: false };

  const normalized = normalizePhone(parsed.data.phone, parsed.data.countryCode);

  try {
    const user = await db.user.findUnique({ where: { phone: normalized } });
    return { exists: Boolean(user) };
  } catch {
    return { exists: false };
  }
}

export async function sendOtp(formData: FormData): Promise<OtpResult> {
  const parsed = sendOtpSchema.safeParse(getPhoneFromFormData(formData));

  if (!parsed.success) {
    return { success: false, error: getValidationErrorMessage(parsed.error) };
  }

  const normalized = normalizePhone(parsed.data.phone, parsed.data.countryCode);

  try {
    const existingOtp = await db.otp.findUnique({
      where: { phone: normalized },
      select: { expiresAt: true },
    });

    if (existingOtp) {
      const cooldownSeconds = getOtpCooldownSeconds(existingOtp.expiresAt);
      if (cooldownSeconds > 0) {
        return {
          success: false,
          error: `Please wait ${cooldownSeconds}s before requesting another OTP.`,
        };
      }
    }

    const code = generateOtpCode();
    const hashedCode = await bcrypt.hash(code, OTP_HASH_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const apiKey = getOtpApiKey();

    if (apiKey && parsed.data.countryCode === "+91") {
      await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Your Revistra OTP is ${code}`,
          flash: 0,
          numbers: normalized.replace(/^\+91/, ""),
        }),
      });
    }

    await db.otp.upsert({
      where: { phone: normalized },
      update: { code: hashedCode, expiresAt },
      create: { phone: normalized, code: hashedCode, expiresAt },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Unable to send OTP right now. Please try again." };
  }
}

export async function verifyOtpAndLogin(
  phone: string,
  code: string,
): Promise<VerifyOtpResult> {
  const parsed = verifyOtpSchema.safeParse({ phone, code });

  if (!parsed.success) {
    return { success: false, error: getValidationErrorMessage(parsed.error) };
  }

  try {
    const otpRecord = await db.otp.findUnique({ where: { phone: parsed.data.phone } });
    if (!otpRecord) {
      return { success: false, error: "Invalid code." };
    }

    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await db.otp.delete({ where: { phone: parsed.data.phone } }).catch(() => undefined);
      return { success: false, error: "Code expired. Please request a new OTP." };
    }

    const matches =
      otpRecord.code === parsed.data.code || (await bcrypt.compare(parsed.data.code, otpRecord.code));

    if (!matches) {
      return { success: false, error: "Invalid code." };
    }

    const user = await db.user.findUnique({ where: { phone: parsed.data.phone } });
    await db.otp.delete({ where: { phone: parsed.data.phone } });

    return { success: true, isNewUser: !user };
  } catch {
    return { success: false, error: "Unable to verify OTP." };
  }
}

export async function completeSignup(data: SignupPayload): Promise<MutationResult> {
  const parsed = completeSignupSchema.safeParse({
    ...data,
    dob: data.dob,
  });

  if (!parsed.success) {
    return { success: false, error: getValidationErrorMessage(parsed.error) };
  }

  try {
    const existing = await db.user.findUnique({ where: { phone: parsed.data.phone } });
    if (existing) {
      return { success: false, error: "Account already exists. Please login." };
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        dob: parsed.data.dob,
        state: parsed.data.state,
        city: parsed.data.city,
      },
    });

    await createSession(user.id, user.phone);
    return { success: true };
  } catch {
    return { success: false, error: "Unable to create account." };
  }
}

export async function completeLogin(phone: string): Promise<MutationResult> {
  const normalized = splitNormalizedPhone(phone);
  if (!normalized) {
    return { success: false, error: "Invalid phone number." };
  }

  const canonicalPhone = normalizePhone(normalized.local, normalized.countryCode);

  try {
    const user = await db.user.findUnique({ where: { phone: canonicalPhone } });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    await createSession(user.id, user.phone);
    return { success: true };
  } catch {
    return { success: false, error: "Unable to login." };
  }
}

export async function updateInterests(interests: string[]): Promise<MutationResult> {
  const parsed = updateInterestsSchema.safeParse(interests);
  if (!parsed.success) {
    return { success: false, error: getValidationErrorMessage(parsed.error) };
  }

  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    await db.user.update({
      where: { id: session.userId },
      data: { interests: parsed.data },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Unable to save preferences." };
  }
}

export async function logoutUser(): Promise<never> {
  await deleteSession();
  redirect("/auth");
}
