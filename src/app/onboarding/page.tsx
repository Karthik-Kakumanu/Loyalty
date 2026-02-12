"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Star, Coffee, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { updateInterests } from "@/actions/auth";

// --- STEPS CONFIGURATION ---
const STEPS = [
  {
    id: "intro",
    title: "Welcome to LoyaltyApp",
    desc: "Discover exclusive rewards, manage your cards, and find the best cafes near you.",
    icon: Sparkles
  },
  {
    id: "interests",
    title: "What do you love?",
    desc: "Select your interests so we can personalize your rewards.",
    options: [
      { id: "coffee", label: "Coffee & Cafes", icon: Coffee },
      { id: "shopping", label: "Shopping Rewards", icon: Star },
      { id: "finance", label: "Card Management", icon: CreditCard },
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentStepData = STEPS[step];

  // Toggle selection for interests
  const toggleSelection = (id: string) => {
    setSelections(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Next / Submit
  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // LAST STEP: SAVE DATA & REDIRECT
      setLoading(true);
      try {
        await updateInterests(selections);
        // Add a small delay for smoother transition
        setTimeout(() => router.push("/dashboard"), 800); 
      } catch (e) {
        console.error("Failed to save interests", e);
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-zinc-900 font-sans">
      <div className="w-full max-w-md">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <motion.div 
              key={i}
              initial={false}
              animate={{ 
                width: i === step ? 32 : 8,
                backgroundColor: i <= step ? "#C72C48" : "#E4E4E7"
              }}
              className="h-1.5 rounded-full transition-all duration-300"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="p-8 text-center border-zinc-100 shadow-xl shadow-zinc-200/50 bg-white rounded-[2rem]">
              
              {step === 0 ? (
                // --- STEP 1: INTRO ---
                <div className="flex flex-col items-center py-4">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-[#C72C48] mb-6 shadow-sm ring-4 ring-rose-50/50">
                    <Sparkles size={36} />
                  </div>
                  <h1 className="text-2xl font-bold mb-3 tracking-tight text-zinc-900">{currentStepData.title}</h1>
                  <p className="text-zinc-500 mb-8 leading-relaxed max-w-xs mx-auto text-sm">{currentStepData.desc}</p>
                </div>
              ) : (
                // --- STEP 2: INTERESTS ---
                <div className="text-left py-2">
                  <h2 className="text-xl font-bold mb-2 tracking-tight">{currentStepData.title}</h2>
                  <p className="text-zinc-500 text-sm mb-6">{currentStepData.desc}</p>
                  
                  <div className="space-y-3">
                    {currentStepData.options?.map((opt) => {
                      const isSelected = selections.includes(opt.id);
                      const Icon = opt.icon;
                      return (
                        <motion.div 
                          key={opt.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleSelection(opt.id)}
                          className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "border-[#C72C48] bg-[#C72C48]/5 ring-1 ring-[#C72C48]" 
                              : "border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${isSelected ? "bg-[#C72C48] text-white shadow-md shadow-red-200" : "bg-zinc-100 text-zinc-400"}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`font-bold text-sm ${isSelected ? "text-[#C72C48]" : "text-zinc-700"}`}>
                            {opt.label}
                          </span>
                          {isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto text-[#C72C48]">
                              <Check size={20} strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 space-y-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext} 
                  disabled={loading} 
                  className="w-full h-12 bg-[#C72C48] hover:bg-[#A61F38] text-white font-bold rounded-xl shadow-lg shadow-red-200/50 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (step === STEPS.length - 1 ? "Get Started" : "Continue")}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
                
                {step === 0 && (
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors py-2"
                  >
                    Skip to Dashboard
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}