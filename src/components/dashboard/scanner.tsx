"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";

interface ScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function Scanner({ isOpen, onClose, onScan }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side mounting for camera to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

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
            <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
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
                      // Trigger the callback with the scanned data
                      onScan(result[0].rawValue);
                      // Close the scanner automatically on success
                      onClose(); 
                    }
                  }}
                  onError={(error) => {
                    console.error("Scanner Error:", error);
                    setError("Camera permission denied or error.");
                  }}
                  components={{ 
                    audio: false, 
                    finder: false // We use our own custom finder overlay below
                  }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                    video: { objectFit: "cover" }
                  }}
               />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-red-500/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{error}</span>
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
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-4 right-4 h-0.5 bg-[#C72C48] shadow-[0_0_20px_#C72C48,0_0_10px_#C72C48]"
              />
            </div>

            <p className="absolute bottom-24 text-white/80 text-sm font-medium bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-20">
              Align QR code within the frame
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}