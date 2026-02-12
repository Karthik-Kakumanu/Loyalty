"use server";

import { db } from "@/lib/db";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";

// 1. Check User (Frontend Check)
export async function checkUserExists(phone: string, countryCode: string) {
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) cleanPhone = cleanPhone.slice(2);
  const fullPhone = `${countryCode}${cleanPhone}`;

  const user = await db.user.findUnique({ where: { phone: fullPhone } });
  return { exists: !!user };
}

// 2. Send OTP (Using Quick Route as per Fast2SMS Support)
export async function sendOtp(formData: FormData) {
  const phone = formData.get("phone") as string;
  const countryCode = formData.get("countryCode") as string;
  
  // Clean phone number logic
  let cleanPhone = phone.replace(/\D/g, ""); 
  if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) cleanPhone = cleanPhone.slice(2);
  const fullPhone = `${countryCode}${cleanPhone}`;

  // Generate Real OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes expiry

  // Always log for Render Dashboard debugging
  console.log(`[DEBUG] Generated OTP: ${otpCode} for ${cleanPhone}`);

  // Send SMS via Fast2SMS
  const apiKey = process.env.OTP_API_KEY;
  
  if (apiKey && countryCode === "+91") {
    try {
      console.log("[Fast2SMS] Attempting to send SMS via Quick Route...");
      
      // SWITCHED BACK TO "q" ROUTE based on Support recommendation
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { "authorization": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "q", 
          message: `Your Loyalty OTP is ${otpCode}`, // "q" uses 'message', not 'variables_values'
          flash: 0,
          numbers: cleanPhone,
        })
      });

      // Log the actual response from the SMS provider
      const result = await response.json();
      console.log("[Fast2SMS] Response:", JSON.stringify(result, null, 2));

    } catch (error) {
      console.error("[Fast2SMS] Request Failed:", error);
    }
  } else {
    console.log("[DEBUG] Skipping SMS: No API Key found or Non-Indian number.");
  }

  // Save OTP to Database
  await db.otp.upsert({
    where: { phone: fullPhone },
    update: { code: otpCode, expiresAt },
    create: { phone: fullPhone, code: otpCode, expiresAt },
  });
  
  return { success: true };
}

// 3. Verify OTP (Does NOT create session yet - prevents race condition)
export async function verifyOtpAndLogin(phone: string, code: string) {
  const otpRecord = await db.otp.findUnique({ where: { phone } });
  
  if (!otpRecord || otpRecord.code !== code) {
    return { success: false, error: "Invalid OTP" };
  }
  
  if (new Date() > otpRecord.expiresAt) {
    return { success: false, error: "OTP Expired" };
  }
  
  const user = await db.user.findUnique({ where: { phone } });
  
  // Consume the OTP so it can't be used again
  await db.otp.delete({ where: { phone } }); 
  
  return { success: true, isNewUser: !user };
}

// 4. Complete Signup (Create User -> Create Session)
export async function completeSignup(data: any) {
  try {
    const user = await db.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        dob: new Date(data.dob),
        state: data.state,
        city: data.city,
      }
    });
    await createSession(user.id, user.phone);
    return { success: true };
  } catch (error) {
    console.error("Signup Error", error);
    return { success: false, error: "Failed to create account" };
  }
}

// 5. Complete Login (Find User -> Create Session)
export async function completeLogin(phone: string) {
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) return { success: false, error: "User not found" };
  
  await createSession(user.id, user.phone);
  return { success: true };
}

// 6. Save Onboarding Interests
export async function updateInterests(interests: string[]) {
  const session = await getSession();
  if (!session || !session.userId) return { success: false, error: "Unauthorized" };

  try {
    await db.user.update({
      where: { id: session.userId },
      data: { interests: interests }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save" };
  }
}

// 7. Logout
export async function logoutUser() {
  await deleteSession();
  redirect("/auth");
}