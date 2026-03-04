export type SupportedCountryCode = "+91" | "+1" | "+44" | "+61";

export type CountryPhoneConfig = {
  code: string;
  dial: SupportedCountryCode;
  label: string;
  limit: number;
  placeholder: string;
};

export const COUNTRY_PHONE_CONFIG: readonly CountryPhoneConfig[] = [
  { code: "in", dial: "+91", label: "IN", limit: 10, placeholder: "98765 43210" },
  { code: "us", dial: "+1", label: "US", limit: 10, placeholder: "202 555 0123" },
  { code: "gb", dial: "+44", label: "UK", limit: 10, placeholder: "7911 123456" },
  { code: "au", dial: "+61", label: "AU", limit: 9, placeholder: "412 345 678" },
] as const;

const countryConfigByDial = new Map<SupportedCountryCode, CountryPhoneConfig>(
  COUNTRY_PHONE_CONFIG.map((country) => [country.dial, country]),
);

export function isSupportedCountryCode(value: string): value is SupportedCountryCode {
  return countryConfigByDial.has(value as SupportedCountryCode);
}

export function getCountryByDial(dial: SupportedCountryCode): CountryPhoneConfig {
  return countryConfigByDial.get(dial) ?? COUNTRY_PHONE_CONFIG[0];
}
