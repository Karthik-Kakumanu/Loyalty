"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if iOS (since iOS doesn't support beforeinstallprompt)
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isDeviceIOS);

    // 2. Listen for the install event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent mini-infobar
      setDeferredPrompt(e);
      setShowPrompt(true); // Show our custom button
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

  if (!showPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:w-96"
        >
          <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-xl shadow-zinc-900/20 border border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C72C48] rounded-xl flex items-center justify-center">
                <Download size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Install App</p>
                <p className="text-xs text-zinc-400">For a better experience</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPrompt(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleInstallClick}
                className="bg-white text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}