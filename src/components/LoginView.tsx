/// <reference types="vite/client" />
import React, { useState } from "react";
import { auth, googleProvider } from "../firebaseClient";
import { signInWithPopup } from "firebase/auth";
import { Heart, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function LoginView() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const triggerHaptic = (type: "light" | "medium" | "success" = "light") => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        if (type === "light") window.navigator.vibrate(12);
        else if (type === "medium") window.navigator.vibrate(35);
        else if (type === "success") window.navigator.vibrate([20, 40, 20]);
      } catch {
        // ignore
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    triggerHaptic("medium");

    try {
      await signInWithPopup(auth, googleProvider);
      triggerHaptic("success");
    } catch (err: any) {
      console.error("Firebase Sign-In Error:", err);
      
      let friendlyError = "Google Sign-In failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        friendlyError = "Login popup closed before authentication completed.";
      } else if (err.code === "auth/configuration-not-found") {
        friendlyError = "Google Sign-In is not enabled. Go to Firebase Console > Authentication > Providers to enable it.";
      } else if (err.message) {
        friendlyError = err.message;
      }
      
      setErrorMsg(friendlyError);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)", backgroundAttachment: "fixed" }}
    >
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-300/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-300/10 rounded-full blur-3xl animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 glass-panel rounded-[32px] border border-white/80 shadow-2xl relative z-10 text-center space-y-8"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/20 animate-float mb-3">
            <Heart className="w-6 h-6 fill-current animate-heartbeat text-rose-100" />
          </div>
          <h2 className="text-2xl font-black font-display uppercase tracking-widest text-[var(--text-main)] flex items-center gap-1">
            <span>Sanctuary Login</span>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono mt-1">
            Access our private couple space
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Connecting to Google...</span>
            ) : (
              <>
                {/* Official Google SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.84 2.98C6.01 7.2 8.76 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.37-4.87 3.37-8.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.08 14.7L1.24 17.68C3.2 21.67 7.24 24 12 24c3.08 0 5.67-.99 7.56-2.69l-3.65-2.83c-1.01.68-2.3 1.08-3.91 1.08-3.24 0-5.99-2.16-6.92-5.66z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 18.56c1.61 0 2.9-.4 3.91-1.08l3.65 2.83C17.67 23.01 15.08 24 12 24c-4.76 0-8.8-2.33-10.76-6.32l3.84-2.98c.93 3.5 3.68 5.66 6.92 5.66z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-left text-[11px] text-rose-500 font-medium leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-400 font-mono">
          Powered by Firebase Authentication
        </div>
      </motion.div>
    </div>
  );
}
