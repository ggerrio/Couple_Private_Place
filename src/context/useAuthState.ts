/**
 * useAuthState.ts — Auth state, current user, onboarding, slot management
 * Extracted from CoupleContext for modularity.
 */
import { useState, useEffect } from "react";
import { auth, getDb } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { DEFAULT_AVATAR_A, DEFAULT_AVATAR_B } from "./defaults";

export function useAuthState() {
  const [session, setSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("dev_bypass_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<"user_a" | "user_b">("user_a");

  const partnerId: "user_a" | "user_b" = currentUser === "user_a" ? "user_b" : "user_a";

  // Resolve slots for active bypass user on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dev_bypass_user");
      if (saved) {
        const mockUser = JSON.parse(saved);
        resolveSlot(mockUser).catch(console.error);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── Auth listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // If we have an active developer/sandbox bypass session, ignore standard firebase auth listener
      if (localStorage.getItem("dev_bypass_user")) {
        return;
      }
      if (user) {
        resolveSlot(user)
          .then(async () => {
            setSession(user);
            const db = await getDb();
            const { doc, setDoc } = await import("firebase/firestore");
            setDoc(doc(db, "settings", "shared_song"), { is_playing: false }, { merge: true }).catch(console.error);
          })
          .catch((e: any) => {
            console.error("[Auth] resolveSlot error:", e);
            localStorage.setItem("auth_error_msg", e.message || "Access Denied.");
            signOut(auth).then(() => {
              setSession(null);
              setIsOnboarding(false);
            });
          });
      } else {
        setSession(null);
        setIsOnboarding(false);
      }
    });
    return () => unsub();
  }, []);

  const resolveSlot = async (user: any) => {
    const db = await getDb();
    const { doc, getDoc, setDoc, deleteDoc } = await import("firebase/firestore");

    const uid = user.uid;
    const userEmail = user.email;
    const userDisplayName = user.displayName;

    const adminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || "pratamagerrio@gmail.com";

    const isGerrio = userEmail && userEmail.toLowerCase() === adminEmail.toLowerCase();
    const isNicole = !isGerrio;

    if (!isGerrio && !isNicole) {
      throw new Error("Access Denied. Only Gerrio & Nicola are allowed to enter the Treehouse. 🔒");
    }

    let valA = null;
    let valB = null;

    try {
      const [snapA, snapB] = await Promise.all([
        getDoc(doc(db, "profiles", "user_a")),
        getDoc(doc(db, "profiles", "user_b")),
      ]);
      valA = snapA.exists() ? snapA.data() : null;
      valB = snapB.exists() ? snapB.data() : null;
    } catch (err) {
      console.warn("[Auth] Firestore profile loading failed, using offline/local fallback:", err);
    }

    if (!valA) {
      valA = { id: "user_a", auth_id: isGerrio ? uid : null, name: isGerrio ? (userDisplayName || "Gerrio") : "Partner A (Empty)", avatar_url: DEFAULT_AVATAR_A, status: "Waiting for connection...", mood: "happy", updated_at: new Date().toISOString() };
      try {
        await setDoc(doc(db, "profiles", "user_a"), valA);
      } catch (err) {
        console.warn("[Auth] setDoc user_a failed:", err);
      }
    }
    if (!valB) {
      valB = { id: "user_b", auth_id: isNicole ? uid : null, name: isNicole ? (userDisplayName || "Nicola") : "Nicola", avatar_url: DEFAULT_AVATAR_B, status: "Waiting for connection...", mood: "happy", updated_at: new Date().toISOString() };
      try {
        await setDoc(doc(db, "profiles", "user_b"), valB);
      } catch (err) {
        console.warn("[Auth] setDoc user_b failed:", err);
      }
    }

    // Helper: safely update a profile document; fallback to delete+recreate if merge fails
    // This handles the case where a Firebase Auth account was deleted and re-created
    // with a new UID — the old auth_id in the Firestore doc doesn't match the new UID,
    // which would cause the security rule `request.auth.uid == resource.data.auth_id` to reject.
    const safeSetProfile = async (slotId: string, data: any) => {
      try {
        await setDoc(doc(db, "profiles", slotId), data, { merge: true });
      } catch (err) {
        console.warn(`[Auth] setDoc ${slotId} merge failed, trying delete+recreate:`, err);
        try {
          await deleteDoc(doc(db, "profiles", slotId));
          await setDoc(doc(db, "profiles", slotId), data);
          console.log(`[Auth] ${slotId} successfully recreated after delete.`);
        } catch (err2) {
          console.error(`[Auth] ${slotId} delete+recreate also failed:`, err2);
        }
      }
    };

    // Auto-link logic for whitelisted accounts
    if (isGerrio) {
      if (valA.auth_id !== uid) {
        valA.auth_id = uid;
        valA.name = userDisplayName || "Gerrio";
        valA.avatar_url = user.photoURL || valA.avatar_url;
        valA.status = "Online 💖";
        valA.updated_at = new Date().toISOString();
        await safeSetProfile("user_a", valA);
      }
      setCurrentUser("user_a");
      setIsOnboarding(false);
      return;
    }

    if (isNicole) {
      if (valB.auth_id !== uid) {
        valB.auth_id = uid;
        valB.name = userDisplayName || "Nicola";
        valB.avatar_url = user.photoURL || valB.avatar_url;
        valB.status = "Online 💖";
        valB.updated_at = new Date().toISOString();
        await safeSetProfile("user_b", valB);
      }
      setCurrentUser("user_b");
      setIsOnboarding(false);
      return;
    }

    // Fallback onboarding
    if (valA.auth_id === uid) { setCurrentUser("user_a"); setIsOnboarding(false); }
    else if (valB.auth_id === uid) { setCurrentUser("user_b"); setIsOnboarding(false); }
    else { setIsOnboarding(true); }
  };

  const claimProfileSlot = async (slotId: "user_a" | "user_b") => {
    const user = auth.currentUser || session;
    if (!user) throw new Error("No active session");
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    const { displayName, photoURL, uid } = user;
    try {
      await setDoc(doc(db, "profiles", slotId), {
        id: slotId,
        auth_id: uid,
        name: displayName || (slotId === "user_a" ? "Partner A" : "Partner B"),
        avatar_url: photoURL || (slotId === "user_a" ? DEFAULT_AVATAR_A : DEFAULT_AVATAR_B),
        status: "Online 💖",
        mood: "happy",
        gender: slotId === "user_a" ? "pria" : "wanita",
        updated_at: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn("[Auth] claimProfileSlot setDoc failed:", err);
    }
    setCurrentUser(slotId);
    setIsOnboarding(false);
  };

  const loginAsDev = (role: "user_a" | "user_b") => {
    const mockUser = role === "user_a" ? {
      uid: "dev_gerrio_uid",
      email: "pratamagerrio@gmail.com",
      displayName: "Gerrio (Dev Bypass)",
      photoURL: DEFAULT_AVATAR_A,
    } : {
      uid: "dev_nicole_uid",
      email: "nicola.aliciazkim@gmail.com",
      displayName: "Nicola (Dev Bypass)",
      photoURL: DEFAULT_AVATAR_B,
    };

    localStorage.setItem("dev_bypass_user", JSON.stringify(mockUser));
    setSession(mockUser);
    resolveSlot(mockUser).catch(console.error);
  };

  const logout = () => {
    localStorage.removeItem("dev_bypass_user");
    return signOut(auth).then(() => setSession(null));
  };

  return {
    session, setSession,
    isOnboarding, setIsOnboarding,
    currentUser, setCurrentUser,
    partnerId,
    logout, claimProfileSlot, resolveSlot, loginAsDev,
  };
}
