import { z } from "zod";
import { getCountryByDial, isSupportedCountryCode } from "@/config/countries";
import { isValidPhoneForCountry } from "@/lib/phone";

const countryCodeSchema = z.string().refine(isSupportedCountryCode, {
  message: "Unsupported country code.",
});

const phonePayloadSchema = z.object({
  countryCode: countryCodeSchema,
  phone: z.string().trim().min(1, "Phone is required."),
});

export const checkUserExistsSchema = phonePayloadSchema.superRefine((data, ctx) => {
  if (!isValidPhoneForCountry(data.phone, data.countryCode)) {
    ctx.addIssue({
      code: "custom",
      message: normalizePhoneValidationError(data.countryCode),
      path: ["phone"],
    });
  }
});

export const sendOtpSchema = phonePayloadSchema.superRefine((data, ctx) => {
  if (!isValidPhoneForCountry(data.phone, data.countryCode)) {
    ctx.addIssue({
      code: "custom",
      message: normalizePhoneValidationError(data.countryCode),
      path: ["phone"],
    });
  }
});

export const verifyOtpSchema = z.object({
  phone: z.string().trim().min(1, "Phone is required."),
  code: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits."),
});

export const completeSignupSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80, "Name is too long."),
  phone: z.string().trim().min(1, "Phone is required."),
  dob: z.coerce.date(),
  state: z.string().trim().min(2, "State is required.").max(80, "State is too long."),
  city: z.string().trim().min(2, "City is required.").max(80, "City is too long."),
});

export const updateInterestsSchema = z
  .array(z.enum(["coffee", "shopping", "finance"]))
  .max(5, "Too many interests selected.");

export function normalizePhoneValidationError(countryCode: string): string {
  if (!isSupportedCountryCode(countryCode)) return "Unsupported country code.";
  const country = getCountryByDial(countryCode);
  return `Phone number must be exactly ${country.limit} digits.`;
}
