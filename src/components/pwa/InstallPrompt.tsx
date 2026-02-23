"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if iOS
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isDeviceIOS);

    // 2. Listen for the install event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent default browser banner
      setDeferredPrompt(e);
      
      // Delay showing the prompt slightly for a smoother UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  // Only render if we have a prompt to show
  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* 1. Dark Backdrop (Highlight Effect) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowPrompt(false)} // Close when clicking background
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all"
          />

          {/* 2. Centered Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xs bg-[#18181B] text-white p-6 rounded-[32px] shadow-2xl shadow-black/50 border border-zinc-800 flex flex-col items-center text-center z-10"
          >
            
            {/* Close Button (X Mark) */}
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* App Icon / Visual */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#C72C48] to-[#9F1E35] rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-red-900/40 ring-4 ring-[#C72C48]/10">
               <Smartphone size={32} className="text-white drop-shadow-md" />
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold mb-2 tracking-tight">Install App</h3>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed px-2">
              Add <strong>Revistra</strong> to your home screen for the best fullscreen experience and faster access.
            </p>

            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-bold text-sm hover:bg-zinc-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Download size={18} strokeWidth={3} className="text-[#C72C48]" />
              Install Now
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}