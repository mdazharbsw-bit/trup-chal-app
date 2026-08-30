import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { triggerHaptic, isStandalone, setHapticsEnabled, getHapticsEnabled } from "@/lib/mobile-native";
import { sfx } from "@/lib/audio";

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AndroidAppModal({ isOpen, onClose }: AndroidAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"install" | "apk" | "features">("install");
  const [hapticsOn, setHapticsOn] = useState(true);

  useEffect(() => {
    setHapticsOn(getHapticsEnabled());
    setInstalled(isStandalone());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  async function handleInstallPwa() {
    triggerHaptic("tap");
    sfx.tap();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install on Android:\n1. Tap the 3 dots (⋮) in Chrome menu.\n2. Tap 'Add to Home screen' or 'Install app'.");
    }
  }

  function toggleHaptics() {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticsEnabled(next);
    if (next) triggerHaptic("trump");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink p-6 shadow-2xl text-cream">
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic("tap");
            onClose();
          }}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-cream/10 text-cream/70 hover:bg-cream/20 hover:text-cream"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/20 border border-sage/40">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-sage" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm11.4045-6.02l1.9973-3.4592c.1197-.207.0483-.4721-.1587-.5918-.207-.1197-.4721-.0483-.5918.1587l-2.0284 3.513c-1.4682-.672-3.1118-1.0487-4.8989-1.0487s-3.4307.3767-4.8989 1.0487l-2.0284-3.513c-.1197-.207-.3848-.2784-.5918-.1587-.207.1197-.2784.3848-.1587.5918l1.9973 3.4592c-3.1557 1.7042-5.321 4.9085-5.6175 8.6791h22.096c-.2965-3.7706-2.4618-6.9749-5.6175-8.6791z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-cream">Android App</h2>
            <p className="text-xs text-sage">Trup Chal (Court Piece / Rang) on Mobile</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex border-b border-line">
          <button
            onClick={() => setActiveTab("install")}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors ${
              activeTab === "install" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"
            }`}
          >
            Direct Install (PWA)
          </button>
          <button
            onClick={() => setActiveTab("apk")}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors ${
              activeTab === "apk" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"
            }`}
          >
            Build Android APK
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors ${
              activeTab === "features" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"
            }`}
          >
            Mobile Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 text-sm leading-relaxed text-cream-dim">
          {activeTab === "install" && (
            <div className="space-y-4">
              <p>
                Install Trup Chal directly to your Android home screen as a full-screen, fast standalone app without needing the Google Play Store.
              </p>
              {installed ? (
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-3 text-emerald-300 text-xs flex items-center gap-2">
                  <span className="text-base">✓</span>
                  Trup Chal is already installed on your home screen!
                </div>
              ) : (
                <Button className="w-full h-12 text-base font-semibold" onClick={handleInstallPwa}>
                  📲 Install App to Home Screen
                </Button>
              )}
              <div className="rounded-lg bg-ink/60 p-3 text-xs text-sage border border-line space-y-1.5">
                <p className="font-semibold text-cream">Manual Steps on Android Chrome / Edge:</p>
                <ol className="list-decimal pl-4 space-y-1 text-sage/90">
                  <li>Tap the 3 dots <strong>(⋮)</strong> in Chrome menu (top-right).</li>
                  <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
                  <li>Launch Trup Chal from your home screen for full-screen play!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "apk" && (
            <div className="space-y-3">
              <p>
                This project includes complete <strong>Capacitor 6</strong> config to build a native Android APK file using Android Studio or Gradle.
              </p>
              <div className="rounded-lg bg-black/40 border border-line p-3 font-mono text-xs text-sage space-y-1.5 overflow-x-auto">
                <div className="text-cream font-sans font-semibold">Build Native APK Commands:</div>
                <div className="text-amber-300"># 1. Build web assets</div>
                <div>npm run build</div>
                <div className="text-amber-300"># 2. Add Android platform & sync</div>
                <div>npx cap add android</div>
                <div>npx cap sync android</div>
                <div className="text-amber-300"># 3. Open in Android Studio or compile APK</div>
                <div>npx cap open android</div>
              </div>
              <p className="text-xs text-sage">
                Capacitor configuration file <code className="text-cream">capacitor.config.json</code> is ready in the root workspace!
              </p>
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-ink/60 border border-line p-3">
                <div>
                  <div className="font-semibold text-cream">Vibration Haptics</div>
                  <div className="text-xs text-sage">Feel haptic feedback on card play, trump call & trick win.</div>
                </div>
                <button
                  onClick={toggleHaptics}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    hapticsOn ? "bg-emerald-600" : "bg-sage/30"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-cream transition-transform ${
                      hapticsOn ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-lg bg-ink/60 border border-line p-3 text-xs space-y-2 text-sage">
                <div className="font-semibold text-cream text-sm">Android App Capabilities</div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Offline Practice Mode (Play vs 3 AI Bots without internet)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Responsive Touch Layout (Portrait & Landscape)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Screen Wake Lock (Keeps display lit during matches)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Sound Effects & Custom Card Deck Animations
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="h-10 px-5">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
