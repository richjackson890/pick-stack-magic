import { useState, useEffect, useRef, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_install_dismissed";

let sharedPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

// Single global listener so multiple components stay in sync
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    sharedPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });

  window.addEventListener("appinstalled", () => {
    sharedPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

export function usePwaInstall() {
  const [installable, setInstallable] = useState(!!sharedPrompt);
  const [isStandalone, setIsStandalone] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
  );
  const [isDismissed, setIsDismissed] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem(DISMISSED_KEY) === "true"
  );

  useEffect(() => {
    const sync = () => setInstallable(!!sharedPrompt);
    listeners.add(sync);
    sync();
    return () => { listeners.delete(sync); };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | null> => {
    if (!sharedPrompt) return null;
    await sharedPrompt.prompt();
    const { outcome } = await sharedPrompt.userChoice;
    if (outcome === "accepted") {
      sharedPrompt = null;
      setInstallable(false);
      setIsStandalone(true);
      listeners.forEach((fn) => fn());
    }
    return outcome;
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsDismissed(true);
  }, []);

  return { installable, isStandalone, isDismissed, promptInstall, dismiss };
}
