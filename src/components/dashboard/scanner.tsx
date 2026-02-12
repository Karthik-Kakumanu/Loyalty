"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { joinCafe } from "@/actions/dashboard"; 

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

  // Ensure client-side mounting for camera
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle successful scan
  const handleScan = async (rawValue: string) => {
    if (isProcessing || !rawValue) return; 
    
    setIsProcessing(true);

    try {
      // 1. Clean the ID
      const cafeId = rawValue.replace("loyaltyapp://cafe/", ""); 

      // 2. Call Server Action to Join
      const result = await joinCafe(cafeId);

      if (result.success) {
        onScan(cafeId); // Notify parent
        onClose(); 
        router.refresh(); 
      } else {
        setError(result.error || "Invalid QR Code");
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-lg font-bold text-white pl-2">Scan to Join</h2>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors active:scale-95"
            >
              <X size={24} />
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            
            {/* REAL CAMERA FEED */}
            <div className="absolute inset-0 w-full h-full">
               <QrScanner
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      handleScan(result[0].rawValue);
                    }
                  }}
                  onError={(error) => {
                    console.error("Scanner Error:", error);
                    setError("Camera permission denied.");
                  }}
                  // --- FIX: Removed 'audio' and 'tracker' to fix build errors ---
                  components={{ 
                    finder: false,
                  }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                    video: { width: "100%", height: "100%", objectFit: "cover" }
                  }}
               />
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl"
                >
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">{error}</span>
                </motion.div>
                )}
            </AnimatePresence>

            {/* Processing State */}
            {isProcessing && !error && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-md text-white px-8 py-4 rounded-2xl flex flex-col items-center gap-3 shadow-2xl border border-white/10">
                 <Loader2 className="w-8 h-8 animate-spin text-[#C72C48]" />
                 <span className="text-xs font-bold uppercase tracking-widest text-white/90">Verifying...</span>
               </div>
            )}
            
            {/* Custom Scanner Frame (Overlay UI) */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-[2rem] z-10 pointer-events-none">
              
              {/* Corner Markers */}
              <div className="absolute top-0 left-0 w-10 h-10 border-l-[4px] border-t-[4px] border-[#C72C48] rounded-tl-2xl shadow-[0_0_15px_#C72C48]" />
              <div className="absolute top-0 right-0 w-10 h-10 border-r-[4px] border-t-[4px] border-[#C72C48] rounded-tr-2xl shadow-[0_0_15px_#C72C48]" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-l-[4px] border-b-[4px] border-[#C72C48] rounded-bl-2xl shadow-[0_0_15px_#C72C48]" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-r-[4px] border-b-[4px] border-[#C72C48] rounded-br-2xl shadow-[0_0_15px_#C72C48]" />

              {/* Scanning Laser Animation */}
              {!isProcessing && !error && (
                <motion.div 
                  animate={{ top: ["5%", "95%", "5%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-2 right-2 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)] opacity-80"
                />
              )}
            </div>

            <p className="absolute bottom-12 text-white/90 text-sm font-medium bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-20">
              Align QR code within the frame
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}