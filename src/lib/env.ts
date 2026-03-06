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

// optionally override the SMS sender identification that appears on the
// recipient's phone.  Some providers require you to pre‑register the
// sender name (also called "sender id") before it will be used; if you
// don't supply one the account default will be used.
export function getOtpSenderId(): string {
  // fall back to a sensible default so you don't have to set an env var
  return readEnv("OTP_SENDER_ID") || "Revistra";
}
