"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getOtpApiKey,
  getOtpFast2SmsRoute,
  getOtpMessageTemplate,
  getOtpSenderId,
} from "@/lib/env";
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
const FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2";
const OTP_PROVIDER_TIMEOUT_MS = 8000;
const OTP_PROVIDER_RETRY_DELAY_MS = 1200;
const OTP_PROVIDER_MAX_ATTEMPTS = 2;
const FAST2SMS_OTP_ROUTE_BLOCKER_PATTERN =
  /complete website verification|visit otp message menu|use dlt sms api/i;

type Fast2SmsRoute = "otp" | "q" | "dlt";

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

type Fast2SmsResult = {
  return?: boolean | string | number;
  message?: unknown;
  request_id?: string;
  [key: string]: unknown;
};

function getFast2SmsError(payload: Fast2SmsResult | null): string | null {
  const message = payload?.message;

  if (Array.isArray(message)) {
    const normalized = message
      .map((part) => String(part).trim())
      .filter(Boolean)
      .join(", ");
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof message === "string") {
    const normalized = message.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (message && typeof message === "object") {
    try {
      const normalized = JSON.stringify(message);
      return normalized !== "{}" ? normalized : null;
    } catch {
      return null;
    }
  }

  return null;
}

async function sendFast2SmsRequest(
  apiKey: string,
  body: Record<string, string | number>,
): Promise<{
  success: boolean;
  error?: string;
  requestId?: string;
  statusCode?: number;
  providerMessage?: string | null;
}> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OTP_PROVIDER_TIMEOUT_MS);

  try {
    response = await fetch(FAST2SMS_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: `OTP provider timed out after ${Math.floor(OTP_PROVIDER_TIMEOUT_MS / 1000)}s.`,
      };
    }
    const message = error instanceof Error ? error.message : "Unknown network error";
    return { success: false, error: `Unable to reach OTP provider: ${message}` };
  } finally {
    clearTimeout(timeout);
  }

  let payload: Fast2SmsResult | null = null;
  try {
    payload = (await response.json()) as Fast2SmsResult;
  } catch {
    payload = null;
  }
  const requestId = typeof payload?.request_id === "string" ? payload.request_id : undefined;
  const providerError = getFast2SmsError(payload);

  if (!response.ok) {
    return {
      success: false,
      error: providerError || `OTP provider returned HTTP ${response.status}.`,
      requestId,
      statusCode: response.status,
      providerMessage: providerError,
    };
  }

  const accepted =
    payload?.return === true ||
    payload?.return === 1 ||
    payload?.return === "1" ||
    payload?.return === "true";

  if (!accepted) {
    return {
      success: false,
      error: providerError || "OTP provider rejected the request.",
      requestId,
      statusCode: response.status,
      providerMessage: providerError,
    };
  }

  return {
    success: true,
    requestId,
    statusCode: response.status,
    providerMessage: providerError,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryProviderRequest(result: {
  success: boolean;
  error?: string;
  statusCode?: number;
}): boolean {
  if (result.success) return false;

  if (typeof result.statusCode === "number" && result.statusCode >= 500) {
    return true;
  }

  const normalizedError = (result.error || "").toLowerCase();
  return normalizedError.includes("timed out") || normalizedError.includes("unable to reach otp provider");
}

async function sendFast2SmsRequestWithRetry(
  apiKey: string,
  body: Record<string, string | number>,
): ReturnType<typeof sendFast2SmsRequest> {
  let latest = await sendFast2SmsRequest(apiKey, body);

  for (let attempt = 2; attempt <= OTP_PROVIDER_MAX_ATTEMPTS; attempt += 1) {
    if (!shouldRetryProviderRequest(latest)) {
      return latest;
    }

    await sleep(OTP_PROVIDER_RETRY_DELAY_MS);
    latest = await sendFast2SmsRequest(apiKey, body);
  }

  return latest;
}

async function deliverOtp(
  apiKey: string | null,
  countryCode: string,
  normalizedPhone: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const senderId = getOtpSenderId();
  const preferredRoute = getOtpFast2SmsRoute();
  const otpMessage = getOtpMessageTemplate().replace(/{{\s*OTP\s*}}/gi, code);

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[OTP DEV] ${normalizedPhone} => ${code}`);
      return { success: true };
    }
    return { success: false, error: "OTP service is not configured." };
  }

  if (countryCode !== "+91") {
    return { success: false, error: "OTP delivery is currently available only for India numbers." };
  }

  const phone10 = normalizedPhone.replace(/^\+91/, "");
  const attempts: Fast2SmsRoute[] =
    preferredRoute === "otp" ? ["otp", "q"] : [preferredRoute];

  let lastError: string | undefined;

  for (const route of attempts) {
    const body: Record<string, string | number> = {
      route,
      numbers: phone10,
      flash: 0,
    };

    if (route === "otp") {
      // OTP route uses Fast2SMS's own template; no sender_id needed.
      body.variables_values = code;
    } else if (route === "dlt") {
      // DLT route requires a 6-char DLT-registered sender ID.
      body.message = otpMessage;
      if (senderId) body.sender_id = senderId;
    } else {
      // Quick route (q): sender_id is not a valid parameter; omit it.
      body.message = otpMessage;
    }

    const providerResult = await sendFast2SmsRequestWithRetry(apiKey, body);

    if (providerResult.success) {
      console.info("OTP provider request success", {
        route,
        phone: normalizedPhone,
        countryCode,
        requestId: providerResult.requestId ?? null,
        statusCode: providerResult.statusCode ?? null,
      });
      return { success: true };
    }

    console.warn("OTP provider request failed", {
      route,
      phone: normalizedPhone,
      countryCode,
      requestId: providerResult.requestId ?? null,
      statusCode: providerResult.statusCode ?? null,
      providerMessage: providerResult.providerMessage ?? null,
      error: providerResult.error ?? null,
    });

    lastError = providerResult.error || "Unable to deliver OTP.";

    if (
      route === "otp" &&
      preferredRoute === "otp" &&
      providerResult.error &&
      FAST2SMS_OTP_ROUTE_BLOCKER_PATTERN.test(providerResult.error)
    ) {
      continue;
    }

    // Stop retries for non-OTP routes or non-route-verification errors.
    break;
  }

  return { success: false, error: lastError || "Unable to deliver OTP." };
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

    const delivery = await deliverOtp(getOtpApiKey(), parsed.data.countryCode, normalized, code);
    if (!delivery.success) {
      console.warn("OTP delivery failed", {
        phone: normalized,
        countryCode: parsed.data.countryCode,
        error: delivery.error,
      });
      return { success: false, error: delivery.error || "Unable to deliver OTP." };
    }

    await db.otp.upsert({
      where: { phone: normalized },
      update: { code: hashedCode, expiresAt },
      create: { phone: normalized, code: hashedCode, expiresAt },
    });

    return { success: true };
  } catch (error) {
    console.error("sendOtp failed", error);
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
