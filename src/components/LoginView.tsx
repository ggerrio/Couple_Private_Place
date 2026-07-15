/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebaseClient";
import { signInWithPopup } from "firebase/auth";
import { Heart, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { triggerHaptic } from "../lib/haptics";
import { motion } from "motion/react";
import { ScrapbookPage, WashiTapeDivider, StickerButton } from "./scrapbook";
import { useCouple } from "../context/CoupleContext";

export default function LoginView() {
  const { loginAsDev } = useCouple();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cachedErr = localStorage.getItem("auth_error_msg");
    if (cachedErr) {
      setErrorMsg(cachedErr);
      localStorage.removeItem("auth_error_msg");
    }
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);
    setErrorMsg("");
    setIsUnauthorizedDomain(false);
    triggerHaptic("medium");

    signInWithPopup(auth, googleProvider)
      .then(() => {
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Firebase Sign-In Error:", err);

        let friendlyError = "Google Sign-In failed. Please try again.";
        if (err.code === "auth/popup-closed-by-user") {
          friendlyError = "Login popup closed before authentication completed.";
        } else if (err.code === "auth/configuration-not-found") {
          friendlyError = "Google Sign-In is not enabled. Go to Firebase Console > Authentication > Providers to enable it.";
        } else if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
          setIsUnauthorizedDomain(true);
          friendlyError = `This domain (${window.location.hostname}) is not authorized in your Firebase Project.`;
        } else if (err.message) {
          friendlyError = err.message;
        }

        setErrorMsg(friendlyError);
        setLoading(false);
      });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Warm treehouse light */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 12%, transparent)' }} />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <ScrapbookPage>
          {/* Doodle decorations */}
          <div className="absolute -top-3 -left-3 w-8 h-8 opacity-30 pointer-events-none select-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-rose)" strokeWidth="2" strokeLinecap="round">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--color-accent-rose)" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 opacity-20 pointer-events-none select-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="var(--color-accent-gold)" />
            </svg>
          </div>
          <div className="absolute bottom-8 -right-1 w-5 h-5 opacity-25 pointer-events-none select-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>

          <div className="flex flex-col items-center">
            {/* Typewriter-style stamp */}
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#8B7355] dark:text-[#B8B0A4] border border-dashed border-[#8B7355]/30 dark:border-white/20 px-2 py-0.5 rounded mb-3 select-none">
              SECURE LOG — EST. 2024
            </span>
            {/* Wooden carved heart emblem */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4 border animate-float"
              style={{
                backgroundColor: "var(--color-secondary, #D4A574)",
                borderColor: "rgba(45, 42, 38, 0.1)"
              }}
            >
              <Heart className="w-7 h-7 fill-current text-white dark:text-[#1A1A2E] animate-heartbeat" />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-[#2D2A26] dark:text-[#F5F0EB] flex items-center gap-2 text-center">
              <span>Welcome to the Treehouse</span>
              <Sparkles className="w-5 h-5 text-[#F4C542] animate-pulse" />
            </h2>
            <p className="text-base text-[#8B7355] dark:text-[#B8B0A4] font-handwrite mt-1">
              Our Little Universe • Gerrio & Nicole
            </p>
          </div>

          <WashiTapeDivider color="gold" label="Enter" />

          <div className="space-y-4">
            <StickerButton
              onClick={handleGoogleLogin}
              disabled={loading}
              color="primary"
              size="lg"
              className="w-full"
              aria-label={loading ? "Signing in with Google" : "Sign in with Google to enter the treehouse"}
              icon={
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.84 2.98C6.01 7.2 8.76 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.37-4.87 3.37-8.5z" />
                  <path fill="#FBBC05" d="M5.08 14.7L1.24 17.68C3.2 21.67 7.24 24 12 24c3.08 0 5.67-.99 7.56-2.69l-3.65-2.83c-1.01.68-2.3 1.08-3.91 1.08-3.24 0-5.99-2.16-6.92-5.66z" />
                  <path fill="#34A853" d="M12 18.56c1.61 0 2.9-.4 3.91-1.08l3.65 2.83C17.67 23.01 15.08 24 12 24c-4.76 0-8.8-2.33-10.76-6.32l3.84-2.98c.93 3.5 3.68 5.66 6.92 5.66z" />
                </svg>
              }
            >
              {loading ? "Climbing the rope ladder..." : "Climb up with Google"}
            </StickerButton>

            {isUnauthorizedDomain ? (
              <div role="alert" className="p-4 rounded-xl text-left text-xs font-medium leading-relaxed space-y-3 border transition-all duration-300"
                style={{ backgroundColor: 'rgba(168, 50, 68, 0.04)', borderColor: 'rgba(168, 50, 68, 0.2)', color: 'var(--color-destructive)' }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-red-800 mb-1">Unauthorized Domain</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      Firebase blocked this login because your preview/app domain is not whitelisted.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-red-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[11px] text-gray-500 font-sans">
                    To fix this, please follow these steps:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-400 font-sans text-[11px]">
                    <li>Go to your <a href={`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID || '_'}/authentication/settings`} target="_blank" rel="noopener noreferrer" className="underline font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)]">Firebase Console Settings</a></li>
                    <li>Look for the <strong>Authorized domains</strong> section under Settings.</li>
                    <li>Click <strong>Add domain</strong> and copy-paste the hostname below:</li>
                  </ol>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-gray-100 dark:bg-zinc-800 px-2 py-1.5 rounded font-mono text-xs text-red-600 break-all select-all flex-1 border border-gray-200 dark:border-zinc-700">
                      {window.location.hostname}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs rounded font-sans transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-rose-100/50 dark:bg-rose-950/20 p-3 rounded-lg border border-red-200/30 space-y-2">
                  <p className="text-[11px] font-bold text-red-800 flex items-center gap-1 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-600 animate-pulse shrink-0" />
                    Sandbox / Development Bypass:
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 font-sans">
                    Or bypass this restriction during testing and log in instantly:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        loginAsDev("user_a");
                      }}
                      className="px-2.5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-[11px] font-bold rounded-lg transition-all duration-300 shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
                    >
                      As Gerrio <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        loginAsDev("user_b");
                      }}
                      className="px-2.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] font-bold rounded-lg transition-all duration-300 shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
                    >
                      As Nicola <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : errorMsg ? (
              <div role="alert" className="p-3 rounded-xl text-left text-xs font-medium leading-relaxed flex items-start gap-2"
                style={{ backgroundColor: 'rgba(168, 50, 68, 0.08)', border: '1px solid rgba(168, 50, 68, 0.2)', color: 'var(--color-destructive)' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-4 text-xs text-[var(--text-muted)] font-mono border-t" style={{ borderColor: 'var(--border-color)' }}>
            🔒 Only for Gerrio & Nicole
          </div>
        </ScrapbookPage>
      </motion.div>
    </div>
  );
}
