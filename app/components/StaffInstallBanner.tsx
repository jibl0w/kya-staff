"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function StaffInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios) {
      setTimeout(() => setShowBanner(true), 1000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowBanner(false);
        setIsInstalled(true);
      }
    }
  }

  if (!showBanner || isInstalled || dismissed) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(8, 12, 20, 0.95)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#0D1420",
        border: "1px solid rgba(201, 168, 76, 0.3)",
        borderRadius: "20px",
        padding: "40px 32px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "20px",
          background: "linear-gradient(135deg, #1A2540, #080C14)",
          border: "2px solid rgba(201, 168, 76, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "28px", fontWeight: 900, color: "white",
          fontFamily: "Georgia, serif",
        }}>
          KY<span style={{ color: "#C9A84C" }}>A</span>
        </div>

        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "8px" }}>
          KYA Digital Services
        </p>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
          Install Staff Portal
        </h2>
        <p style={{ fontSize: "14px", color: "#8A9AB5", lineHeight: 1.6, marginBottom: "32px" }}>
          Install the KYA Staff Portal on your device for quick access to document review, transaction management, and customer oversight.
        </p>

        {isIOS ? (
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", color: "#E8E0D0", lineHeight: 1.6 }}>
              Tap the <strong style={{ color: "#C9A84C" }}>Share</strong> button at the bottom of Safari, then tap <strong style={{ color: "#C9A84C" }}>Add to Home Screen</strong>
            </p>
          </div>
        ) : (
          <button onClick={handleInstall} style={{
            width: "100%", padding: "16px",
            background: "#C9A84C", color: "#080C14",
            borderRadius: "12px", border: "none",
            fontSize: "15px", fontWeight: 700,
            cursor: "pointer", marginBottom: "12px",
            letterSpacing: "0.02em",
          }}>
            Install App
          </button>
        )}

        <button onClick={() => setDismissed(true)} style={{
          background: "transparent", border: "none",
          color: "#4A5568", fontSize: "13px",
          cursor: "pointer", padding: "8px",
        }}>
          Continue in browser
        </button>

        <p style={{ fontSize: "11px", color: "#4A5568", marginTop: "16px" }}>
          Restricted access — authorised KYA staff only
        </p>
      </div>
    </div>
  );
}