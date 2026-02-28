"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { joinCafeWithSerial } from "@/actions/cafe"; 

interface ScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function Scanner({ isOpen, onClose, onScan }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // --- THE FIX: RESET STATE ON OPEN ---
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setError(null);
    }
  }, [isOpen]);

  const handleScan = async (rawValue: string) => {
    if (isProcessing || !rawValue) return; 
    
    // Prevent scanning if just https:// (wait for specific format)
    // Optional: Add specific checks if needed
    
    setIsProcessing(true);

    try {
      // Parse ID: Clean up the URL scheme
      const cafeId = rawValue
        .replace("REVISTRA://cafe/", "")
        .replace("loyaltyapp://cafe/", ""); 

      const result = await joinCafeWithSerial(cafeId);

      if (result.success) {
        onScan(cafeId); 
        onClose(); 
        router.refresh();
        // Redirect to the newly created stamp card
        router.push(`/dashboard/cards/${result.cardId}`); 
      } else {
        setError(result.error || "Invalid QR Code");
        // Reset after 3 seconds so they can try again
        setTimeout(() => { 
            setError(null); 
            setIsProcessing(false); 
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to process code");
      setTimeout(() => { 
          setError(null); 
          setIsProcessing(false); 
      }, 3000);
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-lg font-bold text-white pl-2">Scan Cafe QR</h2>
            <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <X size={24} />
            </button>
          </div>

          {/* Camera */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
               <QrScanner
                  onScan={(result) => {
                    if (result && result.length > 0) handleScan(result[0].rawValue);
                  }}
                  onError={(error) => console.error(error)}
                  components={{ finder: false }}
                  styles={{ container: { width: "100%", height: "100%" } }}
               />
            </div>

            {/* Error UI */}
            <AnimatePresence>
                {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl">
                    <AlertCircle size={20} /> <span className="text-sm font-bold">{error}</span>
                </motion.div>
                )}
            </AnimatePresence>

            {/* Loading UI */}
            {isProcessing && !error && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-md text-white px-8 py-4 rounded-2xl flex flex-col items-center gap-3">
                 <Loader2 className="w-8 h-8 animate-spin text-[#C72C48]" />
                 <span className="text-xs font-bold uppercase tracking-widest text-white/90">Creating Card...</span>
               </div>
            )}
            
            {/* Custom Frame */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-[2rem] z-10 pointer-events-none border-2 border-white/20">
              <div className="absolute top-0 left-0 w-10 h-10 border-l-[4px] border-t-[4px] border-[#C72C48] rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-r-[4px] border-t-[4px] border-[#C72C48] rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-l-[4px] border-b-[4px] border-[#C72C48] rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-r-[4px] border-b-[4px] border-[#C72C48] rounded-br-2xl" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}