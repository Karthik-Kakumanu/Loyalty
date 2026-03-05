"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, PlusSquare, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_DISMISSED_KEY = "revistra.installPrompt.dismissed";
const INSTALL_COMPLETED_KEY = "revistra.installPrompt.installed";

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function detectStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

function readInstallPromptFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeInstallPromptFlag(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // no-op when storage is blocked
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSuppressed, setIsSuppressed] = useState(() => {
    if (typeof window === "undefined") return true;
    if (detectStandaloneMode()) {
      writeInstallPromptFlag(INSTALL_COMPLETED_KEY);
      return true;
    }
    const dismissed = readInstallPromptFlag(INSTALL_DISMISSED_KEY);
    const installed = readInstallPromptFlag(INSTALL_COMPLETED_KEY);
    return dismissed || installed;
  });
  const isIOS = useMemo(() => detectIOS(), []);
  const isStandalone = useMemo(() => detectStandaloneMode(), []);

  useEffect(() => {
    if (isStandalone || isSuppressed) return;

    let iosPromptTimeout: ReturnType<typeof setTimeout> | null = null;
    let installPromptTimeout: ReturnType<typeof setTimeout> | null = null;

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      installPromptTimeout = setTimeout(() => setShowPrompt(true), 2000);
    };

    const onAppInstalled = () => {
      writeInstallPromptFlag(INSTALL_COMPLETED_KEY);
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsSuppressed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (isIOS) {
      iosPromptTimeout = setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (iosPromptTimeout) clearTimeout(iosPromptTimeout);
      if (installPromptTimeout) clearTimeout(installPromptTimeout);
    };
  }, [isIOS, isStandalone, isSuppressed]);

  const closePrompt = () => {
    writeInstallPromptFlag(INSTALL_DISMISSED_KEY);
    setShowPrompt(false);
    setIsSuppressed(true);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      writeInstallPromptFlag(INSTALL_COMPLETED_KEY);
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsSuppressed(true);
      return;
    }

    writeInstallPromptFlag(INSTALL_DISMISSED_KEY);
    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsSuppressed(true);
  };

  if (!showPrompt || isStandalone || isSuppressed) return null;

  const isIOSInstructions = isIOS && !deferredPrompt;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePrompt}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          aria-label="Close install prompt"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 18 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm rounded-[var(--radius-xl)] border border-zinc-800 bg-zinc-950 p-6 text-center text-white shadow-2xl"
        >
          <button
            type="button"
            onClick={closePrompt}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Dismiss install prompt"
          >
            <X size={16} />
          </button>

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] shadow-lg">
            <Smartphone size={30} />
          </div>

          <h3 className="text-xl font-bold tracking-tight">Install Revistra</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {isIOSInstructions
              ? "Use Safari Share menu to add Revistra to your Home Screen."
              : "Install the app for faster launch, better offline support, and full-screen experience."}
          </p>

          {isIOSInstructions ? (
            <div className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 text-left">
              <p className="text-xs uppercase tracking-wide text-zinc-400">iOS Instructions</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <PlusSquare size={16} className="text-[var(--brand)]" />
                Tap Share, then choose <strong>Add to Home Screen</strong>.
              </p>
            </div>
          ) : (
            <Button onClick={handleInstallClick} className="mt-6 w-full" size="lg">
              <Download size={16} />
              Install App
            </Button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
