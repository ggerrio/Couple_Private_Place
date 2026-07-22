/**
 * SandboxPage.tsx
 *
 * DEV-ONLY login-free path into the Birthday Experience.
 *
 * Visit:
 *   • http://localhost:5173/?sandbox              → opens with the
 *     default recipientName ("Nicola" from BIRTHDAY_CONTENT)
 *   • http://localhost:5173/?sandbox=Name        → opens with the
 *     supplied name override (overrides BIRTHDAY_CONTENT.recipientName
 *     end-to-end so every scene and the dialog aria-label see it)
 *
 * Architectural property (intentional):
 *   • This component renders the BirthdayExperience OUTSIDE the
 *     normal CoupleProvider tree. The production auth flow is
 *     not touched at all — LoginView / OnboardingView / Firebase
 *     auth state continues to behave exactly as before for every
 *     other page in the app.
 *   • Production bundles tree-shake the entire `src/App.tsx`
 *     sandbox branch + this module behind `import.meta.env.DEV`
 *     (false at build time). Production builds cannot enable this.
 *
 * The cleanup model: the Exit button strips `?sandbox` from the
 * URL via `window.location.href` reload so the regular auth-gated
 * app takes over cleanly.
 *
 * Lazy-loaded so its chunk stays out of the prod initial bundle.
 */

import React, { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Gift, X } from "lucide-react";
import { BirthdayExperience } from "./BirthdayExperience";

export interface SandboxPageProps {
  /**
   * Optional recipient-name override captured from `?sandbox=<name>`.
   * Threads into BirthdayExperience so all scenes + dialog aria-label
   * use the override when set.
   */
  recipientNameOverride?: string;
  /**
   * Optional exit callback. If omitted, the default strips `?sandbox`
   * from the URL and reloads — works without any state threading.
   */
  onExit?: () => void;
}

export function SandboxPage({
  recipientNameOverride,
  onExit,
}: SandboxPageProps) {
  const defaultExit = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("sandbox");
    window.location.href = url.toString();
  }, []);
  const exit = onExit ?? defaultExit;

  // Memo so the prop change doesn't recreate the experience subtree
  // on every unrelated parent render (cheap stability for safety).
  const experienceProps = useMemo(
    () => ({ recipientNameOverride }),
    [recipientNameOverride],
  );

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900">
      {/* Birthday experience rendered directly — no CoupleProvider
          gate, no LoginView, no auth listeners. Lazy chunk. */}
      <BirthdayExperience
        isOpen={true}
        onClose={exit}
        onComplete={exit}
        {...experienceProps}
      />

      {/* Top-right Exit badge — always visible so test engineer can
          escape back to normal app without DevTools. */}
      <motion.button
        type="button"
        onClick={exit}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="fixed top-4 right-4 z-[200] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-rose-700 text-xs font-bold shadow-lg border border-rose-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
        aria-label="Exit sandbox and reload without ?sandbox"
      >
        <X className="w-3.5 h-3.5" />
        Exit Sandbox
      </motion.button>

      {/* Bottom-left Sandbox badge — instant visual confirmation that
          the user is in non-prod mode. */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="fixed bottom-4 left-4 z-[200] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200/90 backdrop-blur-sm text-amber-900 text-xs font-bold shadow-lg border border-amber-300"
      >
        <Gift className="w-3.5 h-3.5" />
        SANDBOX · auto-opened for testing
        {recipientNameOverride ? (
          <span className="text-amber-700/80 ml-1">
            · recipient={recipientNameOverride}
          </span>
        ) : null}
      </motion.div>
    </div>
  );
}
