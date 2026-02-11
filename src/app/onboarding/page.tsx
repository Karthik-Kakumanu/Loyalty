"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Star, Coffee, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateInterests } from "@/actions/auth"; // Import the new action

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

  const toggleSelection = (id: string) => {
    setSelections(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // LAST STEP: SAVE DATA & REDIRECT
      setLoading(true);
      try {
        await updateInterests(selections);
        // Add a small delay to ensure cookie is set/processed
        setTimeout(() => router.push("/dashboard"), 500); 
      } catch (e) {
        console.error("Failed to save interests");
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
              animate={{ 
                width: i === step ? 32 : 8,
                backgroundColor: i <= step ? "#C72C48" : "#E4E4E7"
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 text-center border-zinc-100 shadow-xl shadow-zinc-200/50">
              {step === 0 ? (
                // Step 1: Intro
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#C72C48]/10 rounded-2xl flex items-center justify-center text-[#C72C48] mb-6">
                    <Sparkles size={32} />
                  </div>
                  <h1 className="text-2xl font-bold mb-3">{currentStepData.title}</h1>
                  <p className="text-zinc-500 mb-8 leading-relaxed">{currentStepData.desc}</p>
                </div>
              ) : (
                // Step 2: Interests
                <div className="text-left">
                  <h2 className="text-xl font-bold mb-2">{currentStepData.title}</h2>
                  <p className="text-zinc-500 text-sm mb-6">{currentStepData.desc}</p>
                  
                  <div className="space-y-3">
                    {currentStepData.options?.map((opt) => {
                      const isSelected = selections.includes(opt.id);
                      const Icon = opt.icon;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => toggleSelection(opt.id)}
                          className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "border-[#C72C48] bg-[#C72C48]/5 ring-1 ring-[#C72C48]" 
                              : "border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center mr-4 ${isSelected ? "bg-[#C72C48] text-white" : "bg-zinc-100 text-zinc-500"}`}>
                            <Icon size={18} />
                          </div>
                          <span className={`font-medium ${isSelected ? "text-[#C72C48]" : "text-zinc-700"}`}>
                            {opt.label}
                          </span>
                          {isSelected && <Check size={18} className="ml-auto text-[#C72C48]" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button onClick={handleNext} disabled={loading} className="w-full h-12 text-md">
                  {loading ? <Loader2 className="animate-spin" /> : step === STEPS.length - 1 ? "Get Started" : "Continue"}
                  {!loading && <ArrowRight size={16} className="ml-2" />}
                </Button>
                
                {step === 0 && (
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
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