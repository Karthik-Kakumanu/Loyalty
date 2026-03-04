const MIN_SECRET_LENGTH = 32;

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getSessionSecret(): string {
  const secret = readEnv("SESSION_SECRET");

  if (!secret) {
    throw new Error("SESSION_SECRET is required.");
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  return secret;
}

export function getOtpApiKey(): string | null {
  return readEnv("OTP_API_KEY");
}
