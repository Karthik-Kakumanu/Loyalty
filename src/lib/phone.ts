import {
  COUNTRY_PHONE_CONFIG,
  getCountryByDial,
  isSupportedCountryCode,
  type SupportedCountryCode,
} from "@/config/countries";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhone(phone: string, countryCode: SupportedCountryCode): string {
  const country = getCountryByDial(countryCode);
  const digits = digitsOnly(phone);
  const countryDigits = countryCode.replace("+", "");

  let local = digits;

  if (digits.startsWith(countryDigits) && digits.length === country.limit + countryDigits.length) {
    local = digits.slice(countryDigits.length);
  }

  return `${countryCode}${local}`;
}

export function splitNormalizedPhone(phone: string): {
  countryCode: SupportedCountryCode;
  local: string;
} | null {
  const trimmed = phone.trim();
  const country = COUNTRY_PHONE_CONFIG.find((item) => trimmed.startsWith(item.dial));

  if (!country) return null;

  const local = digitsOnly(trimmed.slice(country.dial.length));
  return {
    countryCode: country.dial,
    local,
  };
}

export function isValidPhoneForCountry(phone: string, countryCode: string): boolean {
  if (!isSupportedCountryCode(countryCode)) return false;
  const country = getCountryByDial(countryCode);
  return digitsOnly(phone).length === country.limit;
}
