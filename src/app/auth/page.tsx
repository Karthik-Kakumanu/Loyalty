"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { 
  Loader2, User, ArrowRight, CheckCircle2, 
  Hash, ChevronLeft, Fingerprint, MapPin, Calendar as CalendarIcon, RefreshCw
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { sendOtp, verifyOtpAndLogin, completeLogin, completeSignup, checkUserExists } from "@/actions/auth";

// --- Configuration ---
const THEME = {
  primary: "#C72C48",
  primaryHover: "#A61F38",
};

const COUNTRIES = [
  { code: "in", dial: "+91", label: "IN", limit: 10, placeholder: "98765 43210" },
  { code: "us", dial: "+1",  label: "US", limit: 10, placeholder: "202 555 0123" },
  { code: "gb", dial: "+44", label: "UK", limit: 10, placeholder: "7911 123456" },
  { code: "au", dial: "+61", label: "AU", limit: 9,  placeholder: "412 345 678" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Schemas ---
const phoneRefinement = (val: string, ctx: z.RefinementCtx, countryCode: string) => {
  const country = COUNTRIES.find(c => c.dial === countryCode) || COUNTRIES[0];
  if (val.length !== country.limit) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Phone number must be exactly ${country.limit} digits` });
  }
};

const loginSchema = z.object({
  countryCode: z.string(),
  phone: z.string(),
}).superRefine((data, ctx) => phoneRefinement(data.phone, ctx, data.countryCode));

// FULL SIGNUP SCHEMA (All details upfront)
const signupSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  countryCode: z.string(),
  phone: z.string(),
  dob: z.string().min(1, "Date of birth is required"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
}).superRefine((data, ctx) => phoneRefinement(data.phone, ctx, data.countryCode));

const otpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type LoginSchema = z.infer<typeof loginSchema>;
type SignupSchema = z.infer<typeof signupSchema>;
type OtpSchema = z.infer<typeof otpSchema>;

// --- Components ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  isPhone?: boolean;
  selectedCountry?: string; 
  countryCodeProps?: any; 
}

const AuthInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, isPhone, selectedCountry = "+91", countryCodeProps, ...props }, ref) => {
    const currentCountry = COUNTRIES.find(c => c.dial === selectedCountry) || COUNTRIES[0];
    return (
      <div className="space-y-1.5 w-full group">
        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1 transition-colors group-focus-within:text-[#C72C48]">{label}</label>
        <div className="relative">
          {icon && !isPhone && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#C72C48] transition-colors duration-300 pointer-events-none">{icon}</div>
          )}
          {isPhone && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center h-full z-20">
               <img src={`https://flagcdn.com/w40/${currentCountry.code}.png`} alt={currentCountry.label} className="w-5 h-auto rounded-[2px] shadow-sm object-cover" />
               <select {...countryCodeProps} className="bg-transparent text-sm font-semibold text-zinc-700 focus:outline-none cursor-pointer appearance-none ml-2 py-1" style={{ textAlignLast: 'center' }}>
                 {COUNTRIES.map((c) => (<option key={c.code} value={c.dial}>{c.dial}</option>))}
               </select>
               <div className="h-5 w-[1px] bg-zinc-300 ml-2 mr-0" />
            </div>
          )}
          <input ref={ref} maxLength={isPhone ? currentCountry.limit : undefined} suppressHydrationWarning={true} className={cn("flex w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C72C48]/20 focus-visible:border-[#C72C48] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-sm hover:border-zinc-300", icon && !isPhone ? "pl-10" : "pl-3", isPhone ? "pl-[7rem]" : "", "h-11", error && "border-red-500 focus-visible:ring-red-500/10", className)} {...props} />
          <AnimatePresence>{error && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"><AlertCircle size={16} /></motion.div>)}</AnimatePresence>
        </div>
        <AnimatePresence>{error && <motion.p initial={{ height: 0 }} animate={{ height: "auto" }} className="text-[10px] font-medium text-red-500 ml-1">{error}</motion.p>}</AnimatePresence>
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

const DatePicker = React.forwardRef<HTMLInputElement, { error?: string, value?: string, onChange?: (e: any) => void }>(({ error, value, onChange, ...props }, ref) => {
  const internalRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-1.5 w-full group">
       <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1 transition-colors group-focus-within:text-[#C72C48]">Date of Birth</label>
       <div className="relative cursor-pointer" onClick={() => internalRef.current?.showPicker()}>
          <div className={cn("flex w-full items-center rounded-xl border border-zinc-200 bg-white px-3 py-2.5 h-11 text-sm ring-offset-white transition-all duration-300 shadow-sm hover:border-zinc-300 group-focus-within:ring-2 group-focus-within:ring-[#C72C48]/20 group-focus-within:border-[#C72C48]", error && "border-red-500 group-focus-within:ring-red-500/10")}>
            <CalendarIcon size={18} className="text-zinc-400 group-focus-within:text-[#C72C48] mr-3" />
            <span className={cn("flex-1", !value ? "text-zinc-400" : "text-zinc-900")}>{value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Select Date"}</span>
            <input 
                type="date" 
                ref={(e) => {
                    internalRef.current = e;
                    if (typeof ref === 'function') ref(e);
                    else if (ref) ref.current = e;
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                onChange={onChange} 
                value={value} 
                {...props} 
            />
          </div>
       </div>
       <AnimatePresence>{error && <motion.p initial={{ height: 0 }} animate={{ height: "auto" }} className="text-[10px] font-medium text-red-500 ml-1">{error}</motion.p>}</AnimatePresence>
    </div>
  )
})
DatePicker.displayName = "DatePicker";

const AuthButton = ({ children, isLoading, onClick, type = "button", variant = "primary", disabled }: any) => (
  <motion.button whileHover={!disabled ? { scale: 1.01 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} type={type} onClick={onClick} disabled={isLoading || disabled} className={cn("relative w-full h-11 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center overflow-hidden", variant === "primary" ? "bg-[#C72C48] hover:bg-[#A61F38] text-white shadow-lg shadow-[#C72C48]/25 focus:ring-[#C72C48]" : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 focus:ring-zinc-200", (isLoading || disabled) && "opacity-60 cursor-not-allowed")}>
    <AnimatePresence mode="wait">{isLoading ? <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="w-5 h-5 animate-spin" /></motion.div> : <motion.div key="content" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2">{children}</motion.div>}</AnimatePresence>
  </motion.button>
);

// --- MAIN AUTH PAGE ---

export default function AuthPage() {
  const router = useRouter(); 
  
  // Views: 'login' | 'signup' | 'otp'
  const [view, setView] = useState<"login" | "signup" | "otp">("login");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login"); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState<string>("");
  const [timer, setTimer] = useState(30);
  
  // Store signup details temporarily while verifying OTP
  const [tempSignupData, setTempSignupData] = useState<SignupSchema | null>(null);

  const loginForm = useForm<LoginSchema>({ resolver: zodResolver(loginSchema), defaultValues: { countryCode: "+91", phone: "" } });
  const signupForm = useForm<SignupSchema>({ resolver: zodResolver(signupSchema), defaultValues: { countryCode: "+91", phone: "", name: "", dob: "", state: "", city: "" } });
  const otpForm = useForm<OtpSchema>({ resolver: zodResolver(otpSchema) });

  const loginCountry = useWatch({ control: loginForm.control, name: "countryCode" });
  const signupCountry = useWatch({ control: signupForm.control, name: "countryCode" });
  const dobValue = useWatch({ control: signupForm.control, name: "dob" });

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  // --- HANDLERS ---

  // 1. Handle Login Submit (Phone Only)
  const handleLoginSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setAuthMode("login");

    // Check if user exists
    const check = await checkUserExists(data.phone, data.countryCode);
    if (!check.exists) {
        alert("Account does not exist. Please Sign Up.");
        setView("signup"); // Switch to Signup
        setLoading(false);
        return;
    }

    // Send OTP
    const formData = new FormData();
    formData.append("countryCode", data.countryCode);
    formData.append("phone", data.phone);

    const result = await sendOtp(formData);
    
    if (result.success) {
      setPhoneForOtp(`${data.countryCode}${data.phone}`);
      setLoading(false);
      setView("otp");
      setTimer(30);
    } else {
      setLoading(false);
      alert("Error sending OTP");
    }
  };

  // 2. Handle Signup Submit (All Details)
  const handleSignupSubmit = async (data: SignupSchema) => {
    setLoading(true);
    setAuthMode("signup");

    // Check if user exists
    const check = await checkUserExists(data.phone, data.countryCode);
    if (check.exists) {
        alert("Account already exists. Please Login.");
        setView("login"); // Switch to Login
        setLoading(false);
        return;
    }

    // Save details to state (wait for OTP verification)
    setTempSignupData(data);

    // Send OTP
    const formData = new FormData();
    formData.append("countryCode", data.countryCode);
    formData.append("phone", data.phone);

    const result = await sendOtp(formData);
    
    if (result.success) {
      setPhoneForOtp(`${data.countryCode}${data.phone}`);
      setLoading(false);
      setView("otp");
      setTimer(30);
    } else {
      setLoading(false);
      alert("Error sending OTP");
    }
  };

  // 3. Resend OTP
  const handleResend = () => {
    if (timer > 0) return;
    const rawPhone = phoneForOtp.slice(3); // Remove +91
    const formData = new FormData();
    formData.append("countryCode", "+91");
    formData.append("phone", rawPhone);
    sendOtp(formData);
    setTimer(30);
  };

  // 4. Verify OTP & Finalize
  const onOtpVerify = async (data: OtpSchema) => {
    setLoading(true);
    
    // Verify Code
    const result = await verifyOtpAndLogin(phoneForOtp, data.code);

    if (result.success) {
        if (authMode === "signup" && tempSignupData) {
            // --- SIGNUP FLOW: Create Account with Saved Details ---
            const createRes = await completeSignup({
                name: tempSignupData.name,
                phone: phoneForOtp,
                dob: tempSignupData.dob,
                state: tempSignupData.state,
                city: tempSignupData.city
            });

            if (createRes.success) {
                setSuccess(true);
                setTimeout(() => router.push("/onboarding"), 1500);
            } else {
                alert("Signup Failed");
                setLoading(false);
            }

        } else {
            // --- LOGIN FLOW: Direct Dashboard ---
            const loginRes = await completeLogin(phoneForOtp);
            if (loginRes.success) {
                setSuccess(true);
                setTimeout(() => router.push("/dashboard"), 1500);
            } else {
                alert("Login Failed");
                setLoading(false);
            }
        }
    } else {
        otpForm.setError("code", { message: result.error || "Invalid Code" });
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden font-sans text-zinc-900">
      <div className="absolute inset-0 w-full h-full pointer-events-none"><div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-50/50 rounded-full blur-[120px]" /><div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-zinc-50/80 rounded-full blur-[120px]" /></div>
      <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-[420px] px-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative z-10">
          
          {/* Header Section */}
          <div className="pt-10 pb-4 px-8 flex flex-col items-center">
            <motion.div layout className="relative w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-[#C72C48] to-[#9F1E35] flex items-center justify-center text-white shadow-lg shadow-[#C72C48]/20">
               {success ? <CheckCircle2 size={32} /> : view === 'otp' ? <Hash size={28} /> : <Fingerprint size={32} />}
            </motion.div>
            <motion.div layout className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {success ? "Success!" : view === "otp" ? "Verification" : view === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {success ? "Redirecting..." : view === "otp" ? `Enter OTP sent to ${phoneForOtp}` : view === "login" ? "Enter your mobile number to login." : "Fill in your details to get started."}
              </p>
            </motion.div>
          </div>

          <div className="px-8 pb-10">
             <AnimatePresence mode="wait">
              {success ? (
                 <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 space-y-4"><motion.div className="w-12 h-12 border-4 border-[#C72C48] border-t-transparent rounded-full animate-spin" /></motion.div>
              ) : view === "otp" ? (
                // OTP VIEW
                <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={otpForm.handleSubmit(onOtpVerify)} className="space-y-6 pt-4">
                  <AuthInput label="One-Time Password" placeholder="• • • • • •" className="text-center text-2xl tracking-[0.5em] font-bold h-14" maxLength={6} error={otpForm.formState.errors.code?.message} {...otpForm.register("code")} />
                  <div className="space-y-3 pt-2">
                    <AuthButton type="submit" isLoading={loading}>Verify OTP</AuthButton>
                    <button type="button" onClick={handleResend} disabled={timer > 0} className="w-full text-xs font-medium text-zinc-500 hover:text-[#C72C48] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                       {timer > 0 ? `Resend code in ${timer}s` : <><RefreshCw size={14} /> Resend Code</>}
                    </button>
                    <AuthButton variant="secondary" onClick={() => setView(authMode)}><ChevronLeft size={16} className="mr-1"/> Wrong Number?</AuthButton>
                  </div>
                </motion.form>
              ) : view === "login" ? (
                // LOGIN VIEW (Phone Only)
                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-6 pt-4">
                  <AuthInput label="Mobile Number" type="tel" isPhone selectedCountry={loginCountry} placeholder={COUNTRIES.find(c => c.dial === loginCountry)?.placeholder} countryCodeProps={loginForm.register("countryCode")} error={loginForm.formState.errors.phone?.message} {...loginForm.register("phone")} />
                  <AuthButton type="submit" isLoading={loading}>Get OTP <ArrowRight size={16} className="ml-2 opacity-60" /></AuthButton>
                </motion.form>
              ) : (
                // SIGNUP VIEW (FULL DETAILS)
                <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4 pt-2">
                  <AuthInput label="Full Name" placeholder="Your Name" icon={<User size={18} />} error={signupForm.formState.errors.name?.message} {...signupForm.register("name")} />
                  
                  <AuthInput label="Mobile Number" type="tel" isPhone selectedCountry={signupCountry} placeholder={COUNTRIES.find(c => c.dial === signupCountry)?.placeholder} countryCodeProps={signupForm.register("countryCode")} error={signupForm.formState.errors.phone?.message} {...signupForm.register("phone")} />
                  
                  <DatePicker value={dobValue} error={signupForm.formState.errors.dob?.message} {...signupForm.register("dob")} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 w-full group"><label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">State</label><div className="relative">{signupCountry === "+91" ? (<select className={cn("flex w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C72C48]/20 focus:border-[#C72C48] appearance-none h-11", signupForm.formState.errors.state && "border-red-500")} {...signupForm.register("state")}><option value="">Select State</option>{INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}</select>) : (<input placeholder="State" className={cn("flex w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C72C48]/20 focus:border-[#C72C48] h-11", signupForm.formState.errors.state && "border-red-500")} {...signupForm.register("state")}/>)}</div></div>
                     <AuthInput label="City" placeholder="City" icon={<MapPin size={18} />} error={signupForm.formState.errors.city?.message} {...signupForm.register("city")} />
                  </div>
                  <div className="pt-4"><AuthButton type="submit" isLoading={loading}>Get OTP & Sign Up</AuthButton></div>
                </motion.form>
              )}
             </AnimatePresence>

             {/* Footer Toggle */}
             {!success && view !== "otp" && (
               <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-500">
                 {view === "login" ? "Don't have an account?" : "Already have an account?"}
                 <button onClick={() => { setView(view === "login" ? "signup" : "login"); setAuthMode(view === "login" ? "signup" : "login"); }} className="font-bold text-[#C72C48] hover:underline transition-all">
                    {view === "login" ? "Create Account" : "Login"}
                 </button>
               </div>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}