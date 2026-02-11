"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { joinCafe } from "@/actions/dashboard"; // Import the real server action

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
    if (isProcessing) return; // Prevent double scans
    setIsProcessing(true);

    try {
      // 1. Check if the scanned code is a valid Cafe ID or App URL
      // Example format expected: "loyaltyapp://cafe/cl123456" OR just "cl123456"
      const cafeId = rawValue.replace("loyaltyapp://cafe/", ""); 

      // 2. Call Server Action to Join
      const result = await joinCafe(cafeId);

      if (result.success) {
        // Success! Close scanner and redirect/refresh
        onScan(cafeId); // Notify parent
        onClose(); 
        router.refresh(); // Refresh data on dashboard
        // Optional: Trigger a success toast here
      } else {
        setError(result.error || "Invalid QR Code");
        setTimeout(() => setError(null), 3000); // Clear error after 3s
        setIsProcessing(false); // Allow re-scanning
      }
    } catch (e) {
      console.error(e);
      setError("Failed to process code");
      setIsProcessing(false);
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
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-lg font-bold text-white">Scan to Join</h2>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            
            {/* REAL CAMERA FEED */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
                  components={{ 
                    audio: false, 
                    finder: false 
                  }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                    video: { objectFit: "cover" }
                  }}
               />
            </div>

            {/* Status / Error Message */}
            {error && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-red-500/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-pulse">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {isProcessing && !error && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex flex-col items-center gap-2 shadow-lg">
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 <span className="text-xs font-bold uppercase tracking-wide">Verifying...</span>
               </div>
            )}
            
            {/* Custom Scanner Frame (Overlay UI) */}
            <div className="relative w-72 h-72 rounded-3xl overflow-hidden z-10 pointer-events-none">
              {/* Glowing Borders */}
              <div className="absolute inset-0 border-[3px] border-[#C72C48]/50 rounded-3xl" />
              
              {/* Corner Markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#C72C48] rounded-tl-xl shadow-[0_0_10px_#C72C48]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#C72C48] rounded-tr-xl shadow-[0_0_10px_#C72C48]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#C72C48] rounded-bl-xl shadow-[0_0_10px_#C72C48]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#C72C48] rounded-br-xl shadow-[0_0_10px_#C72C48]" />

              {/* Scanning Laser Animation */}
              {!isProcessing && (
                <motion.div 
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-4 right-4 h-0.5 bg-[#C72C48] shadow-[0_0_20px_#C72C48,0_0_10px_#C72C48]"
                />
              )}
            </div>

            <p className="absolute bottom-24 text-white/80 text-sm font-medium bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-20">
              Align Cafe QR code within the frame
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}