/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useCouple } from "../context/CoupleContext";
import { uploadBase64Image, db, uploadToCloudinary, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../firebaseClient";
import { useCamera } from "../hooks/useCamera";
import { doc, setDoc, updateDoc, onSnapshot, deleteDoc, getDoc, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Layers,
  Palette,
  Sparkles,
  Download,
  BookOpen,
  Calendar,
  Smile,
  MapPin,
  Tag,
  Plus,
  Send,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Lock,
  Heart,
  Edit2,
  AlertTriangle,
} from "lucide-react";

// Pre-seeded cute couple photos for photobooth simulator
const photoboothSamplePhotos = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
];

const userAPresets = [
  { id: "h1", emoji: "🌸", label: "Sweet Smile", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" },
  { id: "h2", emoji: "🫶", label: "Heart Cheek", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop" },
  { id: "h3", emoji: "😉", label: "Cute Wink", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop" },
  { id: "h4", emoji: "✌️", label: "Double Peace", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop" },
  { id: "h5", emoji: "😘", label: "Blow Kiss", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop" },
  { id: "h6", emoji: "🧸", label: "Pouting Face", url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&auto=format&fit=crop" },
];

const userBPresets = [
  { id: "m1", emoji: "☕", label: "Warm Smile", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
  { id: "m2", emoji: "🫶", label: "Cheek Heart", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
  { id: "m3", emoji: "😉", label: "Cool Wink", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop" },
  { id: "m4", emoji: "✌️", label: "V-Sign", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&auto=format&fit=crop" },
  { id: "m5", emoji: "☕", label: "Sip Coffee", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
  { id: "m6", emoji: "🤫", label: "Shy Look", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
];

const availableBackgrounds = [
  { value: "white", label: "Pure White", class: "bg-white text-gray-800" },
  { value: "pink", label: "Sakura Pink", class: "bg-pink-100 text-pink-700" },
  { value: "beige", label: "Warm Beige", class: "bg-amber-50 text-amber-900" },
  { value: "sakura", label: "Cherry Petals", class: "bg-sakura-photo text-rose-800" },
  { value: "retro", label: "Sunset Retro", class: "bg-retro-photo text-pink-800" },
  { value: "pixel", label: "Cosmic Neon", class: "bg-pixel-photo text-white" },
  { value: "cafe", label: "Brew Cafe", class: "bg-cafe-photo text-amber-950" },
  { value: "night", label: "Midnight", class: "bg-night-photo text-indigo-100" },
];

const bgStylesMap: Record<string, React.CSSProperties> = {
  white: { backgroundColor: "#ffffff", color: "#1f2937" },
  pink: { backgroundColor: "#fdf2f8", color: "#be185d" },
  beige: { backgroundColor: "#fffbeb", color: "#78350f" },
  sakura: { backgroundImage: "radial-gradient(circle, #fff5f5 20%, #fbb6b6 80%)", color: "#9f1239" },
  retro: { backgroundImage: "linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", color: "#9d174d" },
  pixel: { backgroundImage: "conic-gradient(from 180deg at 50% 50%, #4f46e5 0deg, #ec4899 120deg, #3b82f6 240deg, #4f46e5 360deg)", color: "#ffffff" },
  cafe: { backgroundImage: "linear-gradient(to right, #eeddbb 0%, #cca980 100%)", color: "#451a03" },
  night: { backgroundImage: "radial-gradient(circle, #1e3a8a 0%, #030712 100%)", color: "#e0e7ff" }
};

const availableFilters = [
  { value: "none", label: "Natural", class: "" },
  { value: "vintage", label: "Vintage Sepia", class: "filter-vintage" },
  { value: "kodak", label: "Kodak Film", class: "filter-kodak" },
  { value: "disposable", label: "Disposable Cam", class: "filter-disposable" },
  { value: "vhs", label: "VHS Glitch", class: "filter-vhs" },
  { value: "soft-blur", label: "Dreamy Blur", class: "filter-soft-blur" },
  { value: "warm-tone", label: "Warm Milk", class: "filter-warm-tone" },
];

const availableStickers = ["🌸", "💖", "✨", "💫", "🍿", "🍋", "🧸", "🎉", "🌈", "🐱", "🥂", "🎬"];

export default function MemoriesView() {
  const {
    currentUser,
    userA,
    userB,
    memories,
    userReactions,
    addMemory,
    addReactionToMemory,
    addCommentToMemory,
    deleteMemory,
    updateMemory,
    journals,
    addJournal,
    deleteJournal,
    awardXp,
    cloudinaryCloudName,
    cloudinaryUploadPreset,
  } = useCouple();

  const [activeSubTab, setActiveSubTab] = useState<"timeline" | "photobooth" | "journal">("timeline");

  // PHOTOBOOTH STATE
  const [layout, setLayout] = useState<"2-cut" | "4-cut" | "6-cut" | "polaroid">("4-cut");
  const [selectedBg, setSelectedBg] = useState("sakura");
  const [selectedFilter, setSelectedFilter] = useState("natural");
  const [photos, setPhotos] = useState<string[]>([]);
  const [customTextStamp, setCustomTextStamp] = useState("");
  const [selectedStamp, setSelectedStamp] = useState("Us 💖");
  const [isSnapping, setIsSnapping] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPrintAnimation, setShowPrintAnimation] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  // LDR COLLABORATIVE STATES
  const [colabMode, setColabMode] = useState<"split" | "alternating" | "solo">("split");
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [partnerSource, setPartnerSource] = useState<"mock" | "preset" | "upload">("preset");
  const [selectedPartnerPreset, setSelectedPartnerPreset] = useState<string>("");
  const [partnerUpload, setPartnerUpload] = useState<string | null>(null);
  const [mySource, setMySource] = useState<"webcam" | "upload">("webcam");
  const [myUpload, setMyUpload] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // NEW ROMANTIC COLLABORATIVE SYNC STATES
  const [roomId, setRoomId] = useState("love-nest");
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isBotPartner, setIsBotPartner] = useState(false); // disabled AI companion bot
  const [loveMeter, setLoveMeter] = useState(40);
  const [myActiveBubble, setMyActiveBubble] = useState("");
  const [partnerActiveBubble, setPartnerActiveBubble] = useState("");
  const [floatingEffects, setFloatingEffects] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [isPartnerSmiling, setIsPartnerSmiling] = useState(false);
  const [partnerWebcamMock, setPartnerWebcamMock] = useState<string>("");

  const myPhotosRef = useRef<string[]>([]);
  const partnerPhotosRef = useRef<string[]>([]);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Refs for tracking values inside BroadcastChannel event listeners to prevent loop reconstruction
  const selectedBgRef = useRef(selectedBg);
  const selectedFilterRef = useRef(selectedFilter);
  const selectedStampRef = useRef(selectedStamp);
  const layoutRef = useRef(layout);
  const myUploadRef = useRef(myUpload);
  const mySourceRef = useRef(mySource);
  const isBotPartnerRef = useRef(isBotPartner);

  useEffect(() => { selectedBgRef.current = selectedBg; }, [selectedBg]);
  useEffect(() => { selectedFilterRef.current = selectedFilter; }, [selectedFilter]);
  useEffect(() => { selectedStampRef.current = selectedStamp; }, [selectedStamp]);
  useEffect(() => { layoutRef.current = layout; }, [layout]);
  useEffect(() => { myUploadRef.current = myUpload; }, [myUpload]);
  useEffect(() => { mySourceRef.current = mySource; }, [mySource]);
  useEffect(() => { isBotPartnerRef.current = isBotPartner; }, [isBotPartner]);

  useEffect(() => {
    setSelectedPartnerPreset(
      currentUser === "user_a" ? userBPresets[0].url : userAPresets[0].url
    );
  }, [currentUser]);

  // Safe helper to post to BroadcastChannel
  const safeBroadcast = (type: string, payload?: any) => {
    try {
      if (broadcastRef.current && broadcastRef.current.name) {
        broadcastRef.current.postMessage({
          roomId,
          sender: currentUser,
          type,
          payload
        });
      }
    } catch (e) {
      console.warn(`Failed to broadcast ${type}:`, e);
    }
  };

  // Sync state modifications in real-time
  const broadcastSettings = (updates: { bg?: string; filter?: string; stamp?: string; lay?: string }) => {
    safeBroadcast("SYNC_SETTINGS", {
      selectedBg: updates.bg,
      selectedFilter: updates.filter,
      selectedStamp: updates.stamp,
      layout: updates.lay,
    });
  };
  // Broadcast settings whenever local changes happen
  useEffect(() => {
    broadcastSettings({ bg: selectedBg, filter: selectedFilter, stamp: selectedStamp, lay: layout });
  }, [selectedBg, selectedFilter, selectedStamp, layout]);

  const sendChatPrompt = (text: string) => {
    if (!text.trim()) return;
    safeBroadcast("CHAT_PROMPT", { text });
    setMyActiveBubble(text);
    setLoveMeter((prev) => Math.min(100, prev + 10));
    triggerHaptic("light");
    setTimeout(() => {
      setMyActiveBubble((curr) => curr === text ? "" : curr);
    }, 4000);
  };

  const sendReaction = (emoji: string) => {
    safeBroadcast("REACTION", { emoji });
    const newEmoji = { id: Date.now() + Math.random(), emoji, x: Math.random() * 80 + 10 };
    setFloatingEffects((prev) => [...prev, newEmoji]);
    setLoveMeter((prev) => Math.min(100, prev + 8));
    triggerHaptic("medium");
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 3000);
  };


  // Initialize BroadcastChannel & listeners
  useEffect(() => {
    const channel = new BroadcastChannel("ldr_love_photobox");
    broadcastRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.roomId !== roomId || msg.sender === currentUser) return;

      switch (msg.type) {
        case "HEARTBEAT":
          setIsPartnerOnline(true);
          setIsBotPartner(false); // real partner connected, disable bot
          if (msg.payload.isSmiling !== undefined) {
            setIsPartnerSmiling(msg.payload.isSmiling);
          }
          if (msg.payload.photo) {
            setPartnerWebcamMock(msg.payload.photo);
          }
          break;
        case "CHAT_PROMPT":
          setPartnerActiveBubble(msg.payload.text);
          setLoveMeter((prev) => Math.min(100, prev + 10));
          triggerHaptic("light");
          // Clear bubble after 4s
          setTimeout(() => {
            setPartnerActiveBubble((curr) => curr === msg.payload.text ? "" : curr);
          }, 4000);
          break;
        case "SYNC_SETTINGS":
          if (msg.payload.selectedBg !== undefined && msg.payload.selectedBg !== selectedBgRef.current) setSelectedBg(msg.payload.selectedBg);
          if (msg.payload.selectedFilter !== undefined && msg.payload.selectedFilter !== selectedFilterRef.current) setSelectedFilter(msg.payload.selectedFilter);
          if (msg.payload.selectedStamp !== undefined && msg.payload.selectedStamp !== selectedStampRef.current) setSelectedStamp(msg.payload.selectedStamp);
          if (msg.payload.layout !== undefined && msg.payload.layout !== layoutRef.current) setLayout(msg.payload.layout);
          break;
        case "START_COUNTDOWN":
          triggerSnapsLocal();
          break;
        case "SNAP_PHOTO":
          partnerPhotosRef.current[msg.payload.slotIndex] = msg.payload.photo;
          setPartnerPhotos([...partnerPhotosRef.current]);
          break;
        case "REACTION":
          const newEmoji = { id: Date.now() + Math.random(), emoji: msg.payload.emoji, x: Math.random() * 80 + 10 };
          setFloatingEffects((prev) => [...prev, newEmoji]);
          setLoveMeter((prev) => Math.min(100, prev + 8));
          triggerHaptic("medium");
          setTimeout(() => {
            setFloatingEffects((prev) => prev.filter((e) => e.id !== newEmoji.id));
          }, 3000);
          break;
        default:
          break;
      }
    };

    channel.addEventListener("message", handleMessage);

    // Initial heartbeat
    try {
      channel.postMessage({
        roomId,
        sender: currentUser,
        type: "HEARTBEAT",
        payload: { isSmiling: false }
      });
    } catch (e) {
      console.warn("Failed to send initial heartbeat:", e);
    }

    const heartbeatInterval = setInterval(() => {
      try {
        channel.postMessage({
          roomId,
          sender: currentUser,
          type: "HEARTBEAT",
          payload: {
            isSmiling: false,
            photo: mySourceRef.current === "upload" && myUploadRef.current ? myUploadRef.current : undefined
          }
        });
      } catch (e) {
        console.warn("Failed to send heartbeat:", e);
      }
    }, 2000);

    return () => {
      channel.removeEventListener("message", handleMessage);
      try {
        channel.close();
      } catch (e) {
        // already closed
      }
      broadcastRef.current = null;
      clearInterval(heartbeatInterval);
    };
  }, [roomId, currentUser]);

  const setupDataChannel = (dc: RTCDataChannel) => {
    dc.onopen = () => console.log("[DataChannel] Channel opened");
    dc.onclose = () => console.log("[DataChannel] Channel closed");
    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "PHOTO") {
          console.log(`[DataChannel] Received photo for slot ${msg.index}`);
          partnerPhotosRef.current[msg.index] = msg.data;
          setPartnerPhotos([...partnerPhotosRef.current]);
        }
      } catch (err) {
        console.warn("Failed to parse DataChannel message:", err);
      }
    };
  };

  // WebRTC peer connection initializer
  useEffect(() => {
    if (activeSubTab !== "photobooth" || !webcamStream) {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      dataChannelRef.current = null;
      return;
    }

    const roomDocRef = doc(db, "rooms", roomId);

    const initWebRTC = async () => {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ],
      };

      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;

      // Add local stream tracks
      webcamStream.getTracks().forEach((track) => {
        pc.addTrack(track, webcamStream);
      });

      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote stream track");
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      if (currentUser === "user_a") {
        console.log("[WebRTC] Initiating offer as user_a");
        const dc = pc.createDataChannel("photos");
        dataChannelRef.current = dc;
        setupDataChannel(dc);

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            const candidateData = event.candidate.toJSON();
            const docSnap = await getDoc(roomDocRef);
            const data = docSnap.exists() ? docSnap.data() : {};
            const candidatesA = data.candidatesA || [];
            await setDoc(roomDocRef, { candidatesA: [...candidatesA, candidateData] }, { merge: true });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await setDoc(roomDocRef, {
          offer: { type: offer.type, sdp: offer.sdp },
          sender: "user_a",
          status: "waiting",
          candidatesA: [],
          candidatesB: []
        }, { merge: true });

        const unsub = onSnapshot(roomDocRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          if (data.answer && pc.signalingState === "have-local-offer") {
            console.log("[WebRTC] Setting remote description answer");
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }

          if (data.candidatesB && data.candidatesB.length > 0) {
            console.log("[WebRTC] Adding ICE candidates B");
            for (const cand of data.candidatesB) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn("[WebRTC] Error adding ICE candidate:", e);
              }
            }
          }
        });
        return unsub;

      } else {
        console.log("[WebRTC] Preparing answer as user_b");
        pc.ondatachannel = (event) => {
          const dc = event.channel;
          dataChannelRef.current = dc;
          setupDataChannel(dc);
        };

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            const candidateData = event.candidate.toJSON();
            const docSnap = await getDoc(roomDocRef);
            const data = docSnap.exists() ? docSnap.data() : {};
            const candidatesB = data.candidatesB || [];
            await setDoc(roomDocRef, { candidatesB: [...candidatesB, candidateData] }, { merge: true });
          }
        };

        let sdpOfferSet = false;
        const unsub = onSnapshot(roomDocRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          if (data.offer && !sdpOfferSet) {
            sdpOfferSet = true;
            console.log("[WebRTC] Setting remote description offer");
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(roomDocRef, {
              answer: { type: answer.type, sdp: answer.sdp },
              status: "ready"
            });
          }

          if (data.candidatesA && data.candidatesA.length > 0) {
            console.log("[WebRTC] Adding ICE candidates A");
            for (const cand of data.candidatesA) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn("[WebRTC] Error adding ICE candidate:", e);
              }
            }
          }
        });
        return unsub;
      }
    };

    let unsubSignaling: (() => void) | null = null;
    initWebRTC().then((unsub) => {
      if (unsub) unsubSignaling = unsub;
    });

    return () => {
      if (unsubSignaling) unsubSignaling();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      dataChannelRef.current = null;
    };
  }, [activeSubTab, webcamStream, roomId, currentUser]);

  // Firestore Room state listener
  useEffect(() => {
    if (activeSubTab !== "photobooth") return;
    const roomDocRef = doc(db, "rooms", roomId);

    const unsub = onSnapshot(roomDocRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      // 1. Sync Countdown
      if (data.countdown !== undefined) {
        setCountdown(data.countdown === null || data.countdown < 0 ? null : data.countdown);
      } else {
        setCountdown(null);
      }

      // 2. Sync Status
      if (data.status) {
        if (data.status === "counting" || data.status === "capturing") {
          setIsSnapping(true);
        } else if (data.status === "completed") {
          setIsSnapping(false);
          setShowPrintAnimation(true);
        } else if (data.status === "idle") {
          setIsSnapping(false);
          setCountdown(null);
        }
      }

      // 3. Sync Captured Photos (Fallback)
      const myKey = currentUser === "user_a" ? "capturedPhotosA" : "capturedPhotosB";
      const partnerKey = currentUser === "user_a" ? "capturedPhotosB" : "capturedPhotosA";

      if (data[myKey]) {
        const myPhotosList: string[] = [];
        Object.keys(data[myKey]).sort().forEach((k) => {
          myPhotosList.push(data[myKey][k]);
        });
        if (JSON.stringify(myPhotosList) !== JSON.stringify(myPhotosRef.current)) {
          myPhotosRef.current = myPhotosList;
          setPhotos(myPhotosList);
        }
      }

      if (data[partnerKey]) {
        const partnerPhotosList: string[] = [];
        Object.keys(data[partnerKey]).sort().forEach((k) => {
          partnerPhotosList.push(data[partnerKey][k]);
        });
        if (JSON.stringify(partnerPhotosList) !== JSON.stringify(partnerPhotosRef.current)) {
          partnerPhotosRef.current = partnerPhotosList;
          setPartnerPhotos(partnerPhotosList);
        }
      }

      // 4. Sync Settings
      if (data.sessionLayout) setLayout(data.sessionLayout);
      if (data.sessionBg) setSelectedBg(data.sessionBg);
      if (data.sessionFilter) setSelectedFilter(data.sessionFilter);
      if (data.sessionStamp) setSelectedStamp(data.sessionStamp);
    });

    return () => unsub();
  }, [activeSubTab, roomId, currentUser]);

  // Designated Master (the user who started the session) runs the decrementing countdown interval in Firestore
  useEffect(() => {
    if (activeSubTab !== "photobooth") return;
    const roomDocRef = doc(db, "rooms", roomId);

    let intervalId: any = null;

    const unsub = onSnapshot(roomDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (data.sessionMaster !== currentUser) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      if (data.status === "counting" && !intervalId) {
        console.log("[Master] Starting countdown loop for index:", data.currentIndex);
        let count = 3;
        intervalId = setInterval(async () => {
          count--;
          if (count > 0) {
            await updateDoc(roomDocRef, { countdown: count });
          } else {
            clearInterval(intervalId);
            intervalId = null;
            await updateDoc(roomDocRef, { status: "capturing", countdown: 0 });
          }
        }, 1000);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      unsub();
    };
  }, [activeSubTab, roomId, currentUser]);

  // Listen for the "capturing" state to take a local snapshot simultaneously
  useEffect(() => {
    if (activeSubTab !== "photobooth") return;
    const roomDocRef = doc(db, "rooms", roomId);

    const unsub = onSnapshot(roomDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (data.status === "capturing") {
        const slotsCount = data.sessionLayout === "polaroid" ? 1 : data.sessionLayout === "2-cut" ? 2 : data.sessionLayout === "6-cut" ? 6 : 4;
        const currentIdx = data.currentIndex;

        const myKey = currentUser === "user_a" ? "capturedPhotosA" : "capturedPhotosB";
        const myCapturedPhotos = data[myKey] || {};
        if (myCapturedPhotos[currentIdx]) {
          return;
        }

        console.log(`[Photobooth] Snapping slot index ${currentIdx}`);
        triggerHaptic("heavy");

        const flash = document.createElement("div");
        flash.className = "fixed inset-0 bg-white z-50 opacity-100 pointer-events-none transition-opacity duration-300";
        document.body.appendChild(flash);
        setTimeout(() => {
          flash.style.opacity = "0";
          setTimeout(() => flash.remove(), 300);
        }, 50);

        let localPhoto = "";
        if (mySourceRef.current === "webcam" && useWebcam && webcamStream && videoElementRef.current) {
          const video = videoElementRef.current;
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            localPhoto = canvas.toDataURL("image/webp", 0.7);
          }
        } else if (mySourceRef.current === "upload" && myUploadRef.current) {
          localPhoto = myUploadRef.current;
        } else {
          localPhoto = photoboothSamplePhotos[currentIdx % photoboothSamplePhotos.length];
        }

        myPhotosRef.current[currentIdx] = localPhoto;
        setPhotos([...myPhotosRef.current]);

        if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
          try {
            dataChannelRef.current.send(JSON.stringify({
              type: "PHOTO",
              index: currentIdx,
              data: localPhoto
            }));
            console.log("[DataChannel] Sent photo to partner");
          } catch (e) {
            console.warn("Failed to send via DataChannel:", e);
          }
        }

        await updateDoc(roomDocRef, {
          [`${myKey}.${currentIdx}`]: localPhoto
        });

        if (data.sessionMaster === currentUser) {
          let retries = 0;
          let partnerKey = currentUser === "user_a" ? "capturedPhotosB" : "capturedPhotosA";
          let docSnap = await getDoc(roomDocRef);
          let currentRoomData = docSnap.exists() ? docSnap.data() : {};

          while (
            (!currentRoomData[partnerKey] || !currentRoomData[partnerKey][currentIdx]) &&
            retries < 40
          ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            docSnap = await getDoc(roomDocRef);
            currentRoomData = docSnap.exists() ? docSnap.data() : {};
            retries++;
          }

          if (!currentRoomData[partnerKey] || !currentRoomData[partnerKey][currentIdx]) {
            const fallbackPhoto = photoboothSamplePhotos[(currentIdx + 2) % photoboothSamplePhotos.length];
            await updateDoc(roomDocRef, {
              [`${partnerKey}.${currentIdx}`]: fallbackPhoto
            });
          }

          const nextIdx = currentIdx + 1;
          if (nextIdx < slotsCount) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await updateDoc(roomDocRef, {
              status: "counting",
              countdown: 3,
              currentIndex: nextIdx
            });
          } else {
            await updateDoc(roomDocRef, {
              status: "completed",
              countdown: null
            });
          }
        }
      }
    });

    return () => unsub();
  }, [activeSubTab, roomId, currentUser, useWebcam, webcamStream]);

  // Generate final strip, auto-compress to WebP under 200 KB, upload to Cloudinary, and save
  useEffect(() => {
    if (activeSubTab !== "photobooth") return;
    const roomDocRef = doc(db, "rooms", roomId);

    const unsub = onSnapshot(roomDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (data.status === "completed" && !data.uploadedImageUrl && !data.isUploading) {
        await updateDoc(roomDocRef, { isUploading: true });

        try {
          console.log("[Photobooth] Starting final strip generation & Cloudinary upload...");

          const photosA: string[] = [];
          const photosB: string[] = [];
          const capA = data.capturedPhotosA || {};
          const capB = data.capturedPhotosB || {};
          const slotsCount = data.sessionLayout === "polaroid" ? 1 : data.sessionLayout === "2-cut" ? 2 : data.sessionLayout === "6-cut" ? 6 : 4;

          for (let i = 0; i < slotsCount; i++) {
            photosA.push(capA[i] || photoboothSamplePhotos[i % photoboothSamplePhotos.length]);
            photosB.push(capB[i] || photoboothSamplePhotos[(i + 2) % photoboothSamplePhotos.length]);
          }

          const myPhotos = currentUser === "user_a" ? photosA : photosB;
          const partnerPhotos = currentUser === "user_a" ? photosB : photosA;

          const canvas = await generateCanvasStrip(
            data.sessionLayout,
            data.sessionBg,
            data.sessionFilter,
            data.sessionStamp,
            myPhotos,
            partnerPhotos,
            colabMode,
            new Date().toISOString()
          );

          let quality = 0.85;
          let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
          if (!blob) throw new Error("Blob generation failed");

          while (blob.size > 200 * 1024 && quality > 0.3) {
            quality -= 0.1;
            const nextBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
            if (nextBlob) blob = nextBlob;
          }

          console.log(`[Photobooth] Combined strip compressed successfully. Size: ${(blob.size / 1024).toFixed(1)} KB`);

          const cloudName = cloudinaryCloudName || CLOUDINARY_CLOUD_NAME;
          const uploadPreset = cloudinaryUploadPreset || CLOUDINARY_UPLOAD_PRESET;
          const filename = `photostrip-${Date.now()}.webp`;

          const finalUrl = await uploadToCloudinary(blob, filename, cloudName, uploadPreset);
          console.log("[Photobooth] Cloudinary upload successful:", finalUrl);

          await addMemory({
            type: "photobooth",
            title: data.sessionStamp || `${data.sessionLayout.toUpperCase()} Colab Photostrip`,
            description: `Collaborative LDR Photobox strip (${colabMode === "split" ? "Split-Screen" : colabMode === "alternating" ? "Turn-Based" : "Solo"}). Backdrop: ${availableBackgrounds.find((b) => b.value === data.sessionBg)?.label}.`,
            imageUrl: finalUrl,
            date: new Date().toISOString(),
            creatorId: currentUser,
            bgStyle: data.sessionBg,
            filterClass: data.sessionFilter,
            layout: data.sessionLayout,
            photosList: myPhotos,
            partnerPhotosList: partnerPhotos,
            colabMode: colabMode,
          } as any);

          await updateDoc(roomDocRef, {
            uploadedImageUrl: finalUrl,
            isUploading: false
          });

          awardXp(55, `captured gorgeous collaborative LDR snaps! 📸🌸`);

        } catch (err: any) {
          console.error("[Photobooth] Failed to upload final photo strip:", err);
          await updateDoc(roomDocRef, { isUploading: false });
          alert(`Failed to save photo strip: ${err.message || err}`);
        }
      }
    });

    return () => unsub();
  }, [activeSubTab, roomId, currentUser, cloudinaryCloudName, cloudinaryUploadPreset]);

  // REAL WEBCAM & HAPTIC STATES
  const {
    stream: webcamStream,
    isActive: useWebcam,
    error: webcamError,
    startCamera,
    stopCamera
  } = useCamera();

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (node && webcamStream) {
      node.srcObject = webcamStream;
      node.play().catch((err) => console.warn("Failed to play video stream:", err));
    }
  }, [webcamStream]);

  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && remoteStream) {
      node.srcObject = remoteStream;
      node.play().catch((err) => console.warn("Failed to play remote video stream:", err));
    }
  }, [remoteStream]);

  const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" = "light") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        if (type === "light") window.navigator.vibrate(12);
        else if (type === "medium") window.navigator.vibrate(35);
        else if (type === "heavy") window.navigator.vibrate(70);
        else if (type === "success") window.navigator.vibrate([20, 40, 20]);
      } catch (err) {
        console.warn("Haptics vibrate failed:", err);
      }
    }
  };

  // Strict single-click state management to prevent duplicate/rapid click increments
  const processingReactions = useRef<Record<string, boolean>>({});

  const handleReactionClick = useCallback((memoryId: string, emoji: string) => {
    // 1. Verify user ID is valid
    if (!currentUser || (currentUser !== "user_a" && currentUser !== "user_b")) {
      console.warn("Invalid user ID. Cannot register reaction.");
      return;
    }

    const lockKey = `${currentUser}_${memoryId}_${emoji}`;
    if (processingReactions.current[lockKey]) {
      return;
    }

    // Set lock
    processingReactions.current[lockKey] = true;

    try {
      addReactionToMemory(memoryId, emoji);
      triggerHaptic("light");
    } catch (err) {
      console.error("Error updating reaction:", err);
    } finally {
      // Release lock after 350ms to allow local states to stabilize
      setTimeout(() => {
        processingReactions.current[lockKey] = false;
      }, 350);
    }
  }, [currentUser, addReactionToMemory]);

  const startWebcam = async () => {
    try {
      await startCamera();
      triggerHaptic("success");
      awardXp(15, "authorized camera access for our photobooth! 📹🌸");
    } catch (err) {
      triggerHaptic("heavy");
    }
  };

  const stopWebcam = () => {
    stopCamera();
    triggerHaptic("light");
  };

  const toDataURL = async (url: string): Promise<string> => {
    try {
      // Append cache buster to bypass caching without CORS headers
      const cacheBustUrl = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      const res = await fetch(cacheBustUrl, { mode: "cors" });
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Failed to fetch image for base64 conversion:", e);
      return url;
    }
  };

  // PHOTO DOWNLOAD & PRINT HANDLERS (PURE HTML5 CANVAS IMPLEMENTATION)
  const generateCanvasStrip = async (
    layoutType: "2-cut" | "4-cut" | "6-cut" | "polaroid",
    bgStyle: string,
    filterName: string,
    stampText: string,
    myPhotos: string[],
    partnerPhotosList: string[],
    colab: "split" | "alternating" | "solo",
    creationDate: string
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    let totalSlots = 4;
    let slotHeight = 260;
    if (layoutType === "polaroid") {
      totalSlots = 1;
      slotHeight = 500;
    } else if (layoutType === "2-cut") {
      totalSlots = 2;
      slotHeight = 360;
    } else if (layoutType === "6-cut") {
      totalSlots = 6;
      slotHeight = 180;
    }

    const topPadding = 60;
    const gap = 24;
    const footerHeight = 140;
    const canvasWidth = 600;
    const canvasHeight = topPadding + (totalSlots * slotHeight) + ((totalSlots - 1) * gap) + footerHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");

    // 1. Draw Background
    ctx.save();
    if (bgStyle === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "pink") {
      ctx.fillStyle = "#fdf2f8";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "beige") {
      ctx.fillStyle = "#fffbeb";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "sakura") {
      const grad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 50, canvasWidth / 2, canvasHeight / 2, canvasHeight / 2);
      grad.addColorStop(0, "#fff5f5");
      grad.addColorStop(1, "#fbb6b6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "retro") {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, "#ff9a9e");
      grad.addColorStop(1, "#fecfef");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "pixel") {
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, "#4f46e5");
      grad.addColorStop(0.5, "#ec4899");
      grad.addColorStop(1, "#3b82f6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "cafe") {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, "#eeddbb");
      grad.addColorStop(1, "#cca980");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgStyle === "night") {
      const grad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 50, canvasWidth / 2, canvasHeight / 2, canvasHeight / 2);
      grad.addColorStop(0, "#1e3a8a");
      grad.addColorStop(1, "#030712");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    ctx.restore();

    // 2. Draw Header Stamp (★ LIFE 4 CUTS ★)
    ctx.save();
    ctx.fillStyle = bgStyle === "pixel" || bgStyle === "night" ? "#ffffff" : "#374151";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★ LIFE 4 CUTS ★", canvasWidth / 2, topPadding / 2 + 5);
    ctx.restore();

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    };

    // Helper to draw image centered and cropped (aspect fill/cover style)
    const drawImageCover = (
      img: HTMLImageElement,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      const imgRatio = img.width / img.height;
      const destRatio = w / h;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > destRatio) {
        // Image is wider than destination slot: crop sides
        sw = img.height * destRatio;
        sx = (img.width - sw) / 2;
      } else {
        // Image is taller than destination slot: crop top/bottom
        sh = img.width / destRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    };

    // Filter string resolver
    const getFilterString = (fName: string): string => {
      const filterStyles: Record<string, string> = {
        "vintage": "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)",
        "kodak": "contrast(1.1) saturate(1.3) brightness(1.05) sepia(0.05)",
        "disposable": "contrast(1.05) saturate(1.05) brightness(0.98) hue-rotate(-5deg)",
        "vhs": "contrast(1.2) brightness(1.1) saturate(0.85) sepia(0.1)",
        "soft-blur": "blur(0.5px) saturate(0.95) contrast(0.95)",
        "warm-tone": "sepia(0.15) saturate(1.2) hue-rotate(5deg)",
      };
      return filterStyles[fName] || "none";
    };

    // 3. Draw Photos in Slots
    const margin = 40;
    const slotWidth = canvasWidth - 2 * margin;

    for (let i = 0; i < totalSlots; i++) {
      const slotY = topPadding + i * (slotHeight + gap);

      // Determine photo sources
      const isSplit = colab === "split" && partnerPhotosList.length > 0;
      const myPhotoUrl = myPhotos[i] || photoboothSamplePhotos[i % photoboothSamplePhotos.length];
      const partnerPhotoUrl = partnerPhotosList[i] || photoboothSamplePhotos[(i + 2) % photoboothSamplePhotos.length];

      try {
        ctx.save();
        // Set image filter
        const filterStr = getFilterString(filterName);
        if (filterStr !== "none") {
          ctx.filter = filterStr;
        }

        if (isSplit) {
          // Left half: My Photo (drawn with Cover fit)
          const myImg = await loadImage(myPhotoUrl);
          drawImageCover(myImg, margin, slotY, slotWidth / 2, slotHeight);

          // Right half: Partner Photo (drawn with Cover fit)
          const partnerImg = await loadImage(partnerPhotoUrl);
          drawImageCover(partnerImg, margin + slotWidth / 2, slotY, slotWidth / 2, slotHeight);

          // Draw divider line
          ctx.filter = "none";
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(margin + slotWidth / 2, slotY);
          ctx.lineTo(margin + slotWidth / 2, slotY + slotHeight);
          ctx.stroke();
        } else {
          // Solo/Alternating (drawn with Cover fit)
          const photoUrl = colab === "alternating" && (i % 2 !== 0) && partnerPhotosList.length > 0
            ? partnerPhotosList[i]
            : myPhotos[i] || myPhotoUrl;

          const img = await loadImage(photoUrl);
          drawImageCover(img, margin, slotY, slotWidth, slotHeight);
        }
        ctx.restore();

        // Draw card border overlay for this slot
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, slotY, slotWidth, slotHeight);
        ctx.restore();
      } catch (err) {
        console.warn(`Failed to draw image for slot ${i}`, err);
        // Draw empty slot block on failure
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(margin, slotY, slotWidth, slotHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Camera Slot ${i + 1}`, margin + slotWidth / 2, slotY + slotHeight / 2);
        ctx.restore();
      }
    }

    // 4. Draw Footer Text Stamp & Date
    ctx.save();
    ctx.fillStyle = bgStyle === "pixel" || bgStyle === "night" ? "#ffffff" : "#111827";
    ctx.font = "italic bold 18px Georgia, serif";
    ctx.textAlign = "center";
    const footerY = canvasHeight - footerHeight / 2;
    ctx.fillText(stampText, canvasWidth / 2, footerY - 12);

    ctx.fillStyle = bgStyle === "pixel" || bgStyle === "night" ? "rgba(255, 255, 255, 0.7)" : "#6b7280";
    ctx.font = "11px monospace";
    const dateStr = new Date(creationDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    ctx.fillText(dateStr, canvasWidth / 2, footerY + 14);
    ctx.restore();

    return canvas;
  };

  const handleDownloadPng = async () => {
    try {
      triggerHaptic("success");
      const canvas = await generateCanvasStrip(
        layout,
        selectedBg,
        selectedFilter,
        selectedStamp,
        photos,
        partnerPhotos,
        colabMode,
        new Date().toISOString()
      );
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `couple_photobooth_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      awardXp(20, "downloaded a high-definition PNG custom photobooth strip! 📸🎨");
    } catch (error) {
      console.error("Canvas export error:", error);
      alert("Failed to export photobooth strip.");
    }
  };

  const handleDownloadMemoryStrip = async (currentMem: any) => {
    try {
      triggerHaptic("success");
      const canvas = await generateCanvasStrip(
        currentMem.layout || "4-cut",
        currentMem.bgStyle || "sakura",
        currentMem.filterClass || "natural",
        currentMem.title || "LDR Couple",
        currentMem.photosList || [],
        currentMem.partnerPhotosList || [],
        currentMem.colabMode || "solo",
        currentMem.date
      );
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${currentMem.title.replace(/\s+/g, "_") || "photobooth_strip"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      awardXp(25, "downloaded fully styled memory photobooth strip! 🎨📸");
    } catch (error) {
      console.error("Failed to download memory photobooth strip:", error);
      handleDownloadImage(currentMem.imageUrl, currentMem.title);
    }
  };

  const handleDownloadImage = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, "_") || "photobooth"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      awardXp(10, "downloaded customized keepsake 💌");
    } catch (error) {
      // Fallback open in new tab
      window.open(url, "_blank");
    }
  };

  const handlePrintImage = (url: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print this photo!");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - \${title}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #ffffff;
              font-family: 'Georgia', serif;
            }
            .container {
              text-align: center;
              padding: 20px;
              border: 1px solid #eaeaea;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 4px;
            }
            h1 {
              font-size: 18px;
              margin-top: 15px;
              color: #333;
            }
            p {
              font-size: 12px;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            @media print {
              body { background: none; }
              .container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="\${url}" />
            <h1>✨ \${title} ✨</h1>
            <p>Private Couple Sanctuary Memories</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    awardXp(10, "printed custom polaroid print 📸");
  };

  // JOURNAL STATE
  const [jTitle, setJTitle] = useState("");
  const [jDescription, setJDescription] = useState("");
  const [jDate, setJDate] = useState(new Date().toISOString().split("T")[0]);
  const [jLocation, setJLocation] = useState("");
  const [jWeather, setJWeather] = useState("sunny");
  const [jMood, setJMood] = useState("cozy");
  const [jTags, setJTags] = useState("");
  const [jImageUrl, setJImageUrl] = useState("");
  const [showAddJournal, setShowAddJournal] = useState(false);

  // COMMENTS STATE
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // QUICK REACTION & DISCUSSION MODAL STATE
  const [selectedMemoryForModal, setSelectedMemoryForModal] = useState<any | null>(null);
  const [modalCommentText, setModalCommentText] = useState("");

  // CUSTOM MILESTONE STATE
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mDate, setMDate] = useState(new Date().toISOString().split("T")[0]);
  const [mImageUrl, setMImageUrl] = useState("");

  // CRUD edit state
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEditMemory = (mem: any) => {
    setEditingMemoryId(mem.id);
    setEditTitle(mem.title);
    setEditDescription(mem.description || "");
    setEditDate(mem.date ? new Date(mem.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setConfirmDeleteId(null);
  };

  const cancelEditMemory = () => {
    setEditingMemoryId(null);
    setConfirmDeleteId(null);
  };

  const saveEditMemory = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateMemory(id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      date: new Date(editDate).toISOString(),
    });
    setEditingMemoryId(null);
    triggerHaptic("success");
  };

  const confirmAndDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    setConfirmDeleteId(null);
    triggerHaptic("heavy");
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mDescription) return;

    addMemory({
      type: "milestone",
      title: mTitle,
      description: mDescription,
      imageUrl: mImageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop",
      date: new Date(mDate).toISOString(),
      creatorId: currentUser,
    });

    setMTitle("");
    setMDescription("");
    setMImageUrl("");
    setShowAddMilestone(false);
    awardXp(30, "logging a sweet life milestone on our timeline! 💖");
  };

  const milestonePresets = [
    { label: "Cozy Cafe ☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop" },
    { label: "Ocean Sunset 🌅", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop" },
    { label: "Cherry Blossom 🌸", url: "https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=600&auto=format&fit=crop" },
    { label: "Cozy Cabin 🌲", url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=600&auto=format&fit=crop" },
    { label: "Sweet Desserts 🍰", url: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=600&auto=format&fit=crop" }
  ];

  // Upload photo handlers
  const handleMyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMyUpload(reader.result as string);
        setMySource("upload");
        triggerHaptic("success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartnerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPartnerUpload(reader.result as string);
        setPartnerSource("upload");
        triggerHaptic("success");
      };
      reader.readAsDataURL(file);
    }
  };

  const startSynchronizedCapture = async () => {
    setIsSnapping(true);
    setShowPrintAnimation(false);
    setPhotos([]);
    setPartnerPhotos([]);
    myPhotosRef.current = [];
    partnerPhotosRef.current = [];

    const roomDocRef = doc(db, "rooms", roomId);
    await setDoc(roomDocRef, {
      status: "counting",
      countdown: 3,
      currentIndex: 0,
      sessionLayout: layout,
      sessionBg: selectedBg,
      sessionFilter: selectedFilter,
      sessionStamp: selectedStamp,
      sessionMaster: currentUser,
      capturedPhotosA: {},
      capturedPhotosB: {},
      uploadedImageUrl: ""
    }, { merge: true });
  };

  // Update drag constraints when tab shifts or memories change
  useEffect(() => {
    if (activeSubTab === "photobooth") {
      const updateConstraints = () => {
        if (carouselRef.current) {
          const width = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
          setDragConstraints({ left: -Math.max(0, width), right: 0 });
        }
      };
      const timer = setTimeout(updateConstraints, 300);
      window.addEventListener("resize", updateConstraints);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateConstraints);
      };
    }
  }, [memories, activeSubTab]);

  const addStickerToStrip = (sticker: string) => {
    setStickerPlacements((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sticker,
        x: Math.floor(Math.random() * 60) + 20, // percentage
        y: Math.floor(Math.random() * 60) + 20,
      },
    ]);
  };

  const savePhotoboothToTimeline = async () => {
    const slotsCount = layout === "polaroid" ? 1 : layout === "2-cut" ? 2 : layout === "6-cut" ? 6 : 4;
    if (photos.length < slotsCount) {
      alert("Please capture all slots before saving to timeline! 📸");
      return;
    }

    let finalBase64 = "";
    let finalImageUrl = "";

    try {
      triggerHaptic("success");

      const canvas = await generateCanvasStrip(
        layout,
        selectedBg,
        selectedFilter,
        selectedStamp,
        photos,
        partnerPhotos,
        colabMode,
        new Date().toISOString()
      );

      finalBase64 = canvas.toDataURL("image/png");
      const filename = `photostrip-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
      finalImageUrl = await uploadBase64Image(finalBase64, filename);
    } catch (err) {
      console.error("Failed to render strip for timeline save:", err);
      finalImageUrl = photos[0];
    }

    addMemory({
      type: "photobooth",
      title: selectedStamp || `${layout.toUpperCase()} Colab Photostrip`,
      description: `Collaborative LDR Photobox strip (${colabMode === "split" ? "Split-Screen" : colabMode === "alternating" ? "Turn-Based" : "Solo"}). Backdrop: ${availableBackgrounds.find((b) => b.value === selectedBg)?.label}.`,
      imageUrl: finalImageUrl || photos[0],
      date: new Date().toISOString(),
      creatorId: currentUser,
      bgStyle: selectedBg,
      filterClass: selectedFilter,
      layout: layout,
      photosList: photos,
      partnerPhotosList: partnerPhotos,
      colabMode: colabMode,
    } as any);

    alert("Life4Cuts LDR print automatically saved to our Timeline memory! 📸🌸");
    awardXp(30, "synced collaborative photo strip to our timeline!");
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle || !jDescription) return;

    // Standard illustration matching weather
    const fallbackImageMap: Record<string, string> = {
      sunny: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
      rainy: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=800&auto=format&fit=crop",
      cloudy: "https://images.unsplash.com/photo-1483706600674-e0c87d3fe85b?q=80&w=800&auto=format&fit=crop",
      snowy: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=800&auto=format&fit=crop",
    };

    addJournal({
      title: jTitle,
      description: jDescription,
      date: jDate,
      location: jLocation || "Our Favorite Corner",
      weather: jWeather,
      mood: jMood,
      imageUrl: jImageUrl || fallbackImageMap[jWeather],
      tags: jTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
    });

    // Reset Form
    setJTitle("");
    setJDescription("");
    setJLocation("");
    setJTags("");
    setJImageUrl("");
    setShowAddJournal(false);
  };

  const handlePostComment = (memoryId: string) => {
    const text = commentInputs[memoryId] || "";
    if (!text.trim()) return;

    addCommentToMemory(memoryId, text);
    setCommentInputs((prev) => ({ ...prev, [memoryId]: "" }));
  };

  return (
    <div className="space-y-6" id="memories-section">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="bg-black/5 p-1 rounded-full flex gap-1 inline-flex">
          <button
            onClick={() => setActiveSubTab("timeline")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${activeSubTab === "timeline" ? "bg-white text-[var(--text-main)] shadow" : "text-gray-500 hover:text-gray-800"
              }`}
          >
            💖 Memory Timeline
          </button>
          <button
            onClick={() => setActiveSubTab("photobooth")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${activeSubTab === "photobooth" ? "bg-white text-[var(--text-main)] shadow" : "text-gray-500 hover:text-gray-800"
              }`}
          >
            📸 Life4Cuts Photobooth
          </button>
          <button
            onClick={() => setActiveSubTab("journal")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${activeSubTab === "journal" ? "bg-white text-[var(--text-main)] shadow" : "text-gray-500 hover:text-gray-800"
              }`}
          >
            🍋 Shared Diary Journal
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: MEMORY TIMELINE */}
        {activeSubTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
              <div>
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Our Shared Milestones</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  A chronological walk through our beautiful days and adventures together.
                </p>
              </div>
              <button
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="py-2.5 px-5 self-start rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow hover:shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> {showAddMilestone ? "Cancel" : "Add Milestone"}
              </button>
            </div>

            {/* EXPANDABLE ADD MILESTONE DRAWER */}
            {showAddMilestone && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleCreateMilestone}
                className="glass-panel p-6 rounded-2xl space-y-4 max-w-2xl mx-auto border-dashed border-[var(--primary)]"
              >
                <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--primary)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-pulse" /> Create Shared Milestone
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Milestone Title</label>
                    <input
                      type="text"
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      required
                      placeholder="e.g. Watched the first winter snow ❄️"
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      required
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Aesthetic Image URL (Optional)</label>
                  <input
                    type="text"
                    value={mImageUrl}
                    onChange={(e) => setMImageUrl(e.target.value)}
                    placeholder="Paste an Unsplash URL, or click a gorgeous preset below..."
                    className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                  />
                  {/* Preset helpers */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {milestonePresets.map((pr) => (
                      <button
                        type="button"
                        key={pr.label}
                        onClick={() => setMImageUrl(pr.url)}
                        className={`text-[9px] px-2.5 py-1 rounded-full border transition-all ${mImageUrl === pr.url
                            ? "bg-[var(--primary)] text-white border-transparent font-bold"
                            : "bg-white/60 text-gray-600 hover:bg-white border-gray-200"
                          }`}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Story / Memory Details</label>
                  <textarea
                    value={mDescription}
                    onChange={(e) => setMDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe how magical the afternoon was, who suggested it, and what made it unforgettable..."
                    className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-95"
                >
                  Log Milestone to Our Sacred Timeline
                </button>
              </motion.form>
            )}

            {memories.length === 0 ? (
              <div className="text-center p-12 bg-white/40 border border-white rounded-2xl">
                <Smile className="w-10 h-10 text-rose-300 mx-auto mb-2 animate-float" />
                <p className="text-sm font-semibold text-[var(--text-main)]">No milestones logged yet.</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Snap a photobooth strip or post a journal to populate our timeline!
                </p>
              </div>
            ) : (
              /* Scrollable vertical list container */
              <div className="max-h-[640px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="relative border-l-2 border-[var(--primary)]/20 pl-6 ml-4 space-y-10"
                >
                  {memories.filter((m) => m.type !== "photobooth").map((mem) => {
                    const filterObj = availableFilters.find((f) => f.value === mem.filterClass);

                    return (
                      <motion.div
                        key={mem.id}
                        variants={{
                          hidden: { opacity: 0, y: 30, scale: 0.97 },
                          show: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 90,
                              damping: 14
                            }
                          }
                        }}
                        className="relative bg-white/75 hover:bg-white rounded-2xl p-6 shadow-sm border border-[var(--border-color)] group transition-all"
                      >
                        {/* Heart Indicator Node */}
                        <span className="absolute -left-[33px] top-6 w-4 h-4 bg-[var(--primary)] border-4 border-white rounded-full group-hover:scale-125 transition-transform" />

                        {/* Interactive React Trigger Badge */}
                        <button
                          onClick={() => {
                            setSelectedMemoryForModal(mem);
                            setModalCommentText("");
                          }}
                          className="absolute top-4 right-4 text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 z-10 shadow-xs"
                        >
                          <Sparkles className="w-3 h-3 text-[var(--primary)]" /> React & Comment
                        </button>

                        {/* Edit & Delete Controls */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
                          {editingMemoryId !== mem.id && (
                            <>
                              <button
                                onClick={() => startEditMemory(mem)}
                                className="p-1.5 rounded-full bg-white/80 border border-[var(--border-color)] hover:bg-blue-50 hover:border-blue-300 text-blue-500 transition-all active:scale-95 shadow-xs"
                                title="Edit milestone"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {confirmDeleteId === mem.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2 py-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <span className="text-[9px] text-red-600 font-bold">Delete?</span>
                                  <button onClick={() => confirmAndDeleteMemory(mem.id)} className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold hover:bg-red-600 active:scale-95">
                                    Yes
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full font-bold hover:bg-gray-300 active:scale-95">
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(mem.id)}
                                  className="p-1.5 rounded-full bg-white/80 border border-[var(--border-color)] hover:bg-red-50 hover:border-red-300 text-red-400 transition-all active:scale-95 shadow-xs"
                                  title="Delete milestone"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className={mem.imageUrl ? "grid grid-cols-1 md:grid-cols-12 gap-6" : "grid grid-cols-1"}>
                          {/* Memory Image */}
                          {mem.imageUrl && (
                            <div className="md:col-span-4 lg:col-span-3 w-full h-48 md:h-full min-h-[160px] max-h-[220px] md:max-h-none rounded-xl overflow-hidden relative shadow bg-black/5">
                              <img
                                src={mem.imageUrl}
                                alt={mem.title}
                                className={`w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 ${filterObj ? filterObj.class : ""}`}
                                referrerPolicy="no-referrer"
                              />
                              {mem.type === "photobooth" && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                  <span className="px-2 py-0.5 bg-black/60 text-[9px] text-white font-mono uppercase tracking-wider rounded">
                                    Life4Cuts Strip
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Memory Details (or Inline Edit Form) */}
                          <div className={mem.imageUrl ? "md:col-span-8 lg:col-span-9 flex flex-col justify-between" : "flex flex-col justify-between"}>
                            {editingMemoryId === mem.id ? (
                              /* ── INLINE EDIT FORM ── */
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] flex items-center gap-1.5">
                                  <Edit2 className="w-3 h-3" /> Editing Milestone
                                </p>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-0.5">Title</label>
                                    <input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full bg-white/80 border border-[var(--border-color)] focus:border-[var(--primary)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-main)] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-0.5">Description</label>
                                    <textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      rows={3}
                                      className="w-full bg-white/80 border border-[var(--border-color)] focus:border-[var(--primary)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-main)] outline-none resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-0.5">Date</label>
                                    <input
                                      type="date"
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="w-full bg-white/80 border border-[var(--border-color)] focus:border-[var(--primary)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-main)] outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => saveEditMemory(mem.id)}
                                    className="flex-1 bg-[var(--primary)] text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Save Changes
                                  </button>
                                  <button
                                    onClick={cancelEditMemory}
                                    className="px-4 bg-black/5 hover:bg-black/10 text-[var(--text-muted)] text-xs font-bold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── NORMAL VIEW ── */
                              <div>
                                <div className="flex items-center gap-2 mb-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(mem.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                  <span>•</span>
                                  <span>Added by {(mem.creatorId === "user_a" ? userA : userB).name}</span>
                                </div>
                                <h3 className="text-base font-bold text-[var(--text-main)] font-display group-hover:text-rose-500 transition-colors">
                                  {mem.title}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">
                                  {mem.description}
                                </p>
                              </div>
                            )}

                            {/* Reactions Block — shown only when not editing */}
                            {editingMemoryId !== mem.id && (
                              <div className="pt-4 mt-4 border-t border-[var(--border-color)] space-y-3">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {["💖", "✨", "☕", "🌴", "🍕"].map((emoji) => {
                                    const hasReacted = !!userReactions?.[`${currentUser}_${mem.id}`]?.[emoji];
                                    return (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReactionClick(mem.id, emoji)}
                                        className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 font-semibold active:scale-95 border ${hasReacted
                                            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 shadow-sm"
                                            : "bg-black/5 hover:bg-black/10 text-gray-700 border-transparent"
                                          }`}
                                      >
                                        <span>{emoji}</span>
                                        <span className={`text-[10px] font-mono ${hasReacted ? "text-[var(--primary)] font-bold" : "text-gray-500"}`}>
                                          {mem.reactions[emoji] || 0}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Comments Listing */}
                                {mem.comments.length > 0 && (
                                  <div className="bg-black/5 rounded-xl p-3 space-y-2 text-[11px]">
                                    {mem.comments.map((comm) => (
                                      <div key={comm.id} className="flex gap-2">
                                        <span className="font-bold text-[var(--text-main)]">
                                          {(comm.authorId === "user_a" ? userA : userB).name}:
                                        </span>
                                        <span className="text-gray-700">{comm.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add Comment Input */}
                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={commentInputs[mem.id] || ""}
                                    onChange={(e) =>
                                      setCommentInputs((prev) => ({ ...prev, [mem.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && handlePostComment(mem.id)}
                                    className="flex-1 bg-black/5 focus:bg-white border border-transparent focus:border-[var(--primary)] text-xs rounded-lg px-3 py-1.5 outline-none transition-all"
                                  />
                                  <button
                                    onClick={() => handlePostComment(mem.id)}
                                    className="p-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 transition-all"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
        {activeSubTab === "photobooth" && (
          <motion.div
            key="photobooth"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* LDR Connection Header & Love Hub */}
            <div className="lg:col-span-12 bg-gradient-to-r from-rose-50 to-pink-50/50 backdrop-blur-md border border-rose-100/60 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm animate-float">
                    <Heart className="w-6 h-6 fill-current animate-heartbeat text-rose-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 font-display">
                      Romance Collaborative Studio
                      <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-ping" : "bg-rose-400"} inline-block`}></span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
                  {/* Room ID configuration */}
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-xs">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Room:</span>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="bg-transparent border-none outline-none font-mono text-xs text-gray-800 font-bold max-w-[90px]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setCopiedLink(true);
                      navigator.clipboard.writeText(window.location.origin + `?room=${roomId}`);
                      setTimeout(() => setCopiedLink(false), 2000);
                      awardXp(5, "invited partner to LDR photostrip session!");
                    }}
                    className="py-2 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? "Link Copied! ❤️" : "Invite Partner 🔗"}
                  </button>
                </div>
              </div>

              {/* Love Connection Meter */}
              <div className="bg-white/60 rounded-2xl p-4 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-gray-600 font-display">
                    Love Synergy Meter:
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {loveMeter}% ({loveMeter < 50 ? "Warm Spark ⚡" : loveMeter < 80 ? "Deep Connection 💞" : "Infinite Romance 💖"})
                  </span>
                </div>
                <div className="flex-1 w-full max-w-md bg-rose-100 rounded-full h-3.5 relative overflow-hidden shadow-inner border border-rose-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${loveMeter}%` }}
                    transition={{ type: "spring", stiffness: 60 }}
                    className="bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 h-full rounded-full shadow"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart className="w-3 h-3 text-white fill-current animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Twin Screens Column */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* Floating React Emoticons Rising Shower */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                <AnimatePresence>
                  {floatingEffects.map((eff) => (
                    <motion.div
                      key={eff.id}
                      initial={{ y: 260, opacity: 0, scale: 0.6 }}
                      animate={{ y: -180, opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.3, 0.7] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="absolute text-4xl"
                      style={{ left: `${eff.x}%` }}
                    >
                      {eff.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* LEFT Twin Screen: ME */}
              <div className="relative group flex flex-col rounded-3xl p-5 bg-white/70 border-3 border-rose-200/60 shadow-[0_12px_24px_rgba(251,182,182,0.15)] overflow-hidden">
                {/* Cam Header Overlay */}
                <div className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-black/50 text-[9px] font-mono font-bold tracking-widest text-white px-2 py-0.5 rounded-full select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  REC: ME (CAM_A)
                </div>

                {/* Webcam/Upload screen container */}
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-900 border border-slate-800 shadow-inner overflow-hidden relative flex items-center justify-center">
                  {mySource === "webcam" && useWebcam ? (
                    <div className="w-full h-full relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <button
                        onClick={stopWebcam}
                        className="absolute bottom-3 right-3 bg-red-550 hover:bg-red-650 text-white text-[8px] uppercase tracking-wider font-extrabold rounded px-2.5 py-1.5 transition-all active:scale-95 z-20 cursor-pointer shadow-md"
                      >
                        Turn Off Cam ✕
                      </button>
                    </div>
                  ) : mySource === "upload" && myUpload ? (
                    <img src={myUpload} className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-slate-850 to-slate-950">
                      <Camera className="w-10 h-10 text-rose-350 animate-pulse mb-2" />
                      <span className="text-[11px] text-slate-350 uppercase tracking-widest font-black">Camera Offline</span>
                      <button
                        onClick={startWebcam}
                        className="mt-3 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all"
                      >
                        Start Cam
                      </button>
                    </div>
                  )}

                  {/* Speech Chat Bubble Overlay */}
                  <AnimatePresence>
                    {myActiveBubble && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -15 }}
                        className="absolute bottom-6 left-6 right-6 bg-white border-2 border-rose-300 p-3 rounded-2xl shadow-lg text-xs font-serif italic text-gray-800 text-center font-bold z-20"
                      >
                        {myActiveBubble}
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-rose-300 rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shutter Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <span className="text-6xl font-black font-display text-rose-400 animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>

                {/* Perspective User Info */}
                <div className="flex items-center gap-3 mt-4 border-b pb-3 border-black/5">
                  <img
                    src={currentUser === "user_a" ? userA.avatar : userB.avatar}
                    className="w-8 h-8 rounded-full border-2 border-rose-200 object-cover"
                  />
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-800">{currentUser === "user_a" ? userA.name : userB.name}</h5>
                    <p className="text-[9px] font-semibold text-rose-500 tracking-wider uppercase">Active Shutter perspective</p>
                  </div>
                </div>

                {/* Interaction & Chat panel */}
                <div className="space-y-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">My Input Source:</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setMySource("webcam")} className={`text-[8px] font-bold px-2 py-0.5 rounded border transition-all ${mySource === "webcam" ? "bg-black text-white border-black" : "bg-white text-gray-500"}`}>Webcam</button>
                      <button onClick={() => setMySource("upload")} className={`text-[8px] font-bold px-2 py-0.5 rounded border transition-all ${mySource === "upload" ? "bg-black text-white border-black" : "bg-white text-gray-500"}`}>Upload</button>
                    </div>
                  </div>

                  {mySource === "upload" && (
                    <div className="flex flex-col gap-1 mt-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMyUpload}
                        className="hidden"
                        id="my-upload-input-sync"
                      />
                      <label
                        htmlFor="my-upload-input-sync"
                        className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-center cursor-pointer text-[9px] font-bold hover:bg-black/5 transition-all text-gray-600 block select-none"
                      >
                        {myUpload ? "Change my uploaded selfie 📸" : "Upload my photo 📁"}
                      </label>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { emoji: "🫶", label: "Heart Cheek" },
                      { emoji: "😘", label: "Blow Kiss" },
                      { emoji: "😉", label: "Cute Wink" },
                      { emoji: "💖", label: "Love You" },
                      { emoji: "✌️", label: "Double Peace" }
                    ].map((prompt) => (
                      <button
                        key={prompt.label}
                        onClick={() => sendChatPrompt(`${prompt.emoji} ${prompt.label} pose!`)}
                        className="py-1 px-2.5 border border-pink-100 bg-pink-50/50 hover:bg-pink-100 rounded-lg text-[9px] font-extrabold text-rose-600 transition-all active:scale-95 cursor-pointer"
                      >
                        {prompt.emoji} {prompt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Send a romantic pose suggestion..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendChatPrompt((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 bg-black/5 border border-transparent focus:border-rose-300 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                        if (input && input.value) {
                          sendChatPrompt(input.value);
                          input.value = "";
                        }
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  </div>

                  {/* Reaction Burst tools */}
                  <div className="flex items-center justify-between border-t pt-3 border-black/5">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Burst Love Reactions:</span>
                    <div className="flex gap-1.5">
                      {["💖", "✨", "🔥", "🥰", "🧸", "🎀"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => sendReaction(emoji)}
                          className="text-lg hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT Twin Screen: PARTNER */}
              <div className="relative group flex flex-col rounded-3xl p-5 bg-white/70 border-3 border-purple-200/60 shadow-[0_12px_24px_rgba(251,182,182,0.15)] overflow-hidden">
                {/* Cam Header Overlay */}
                <div className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-black/50 text-[9px] font-mono font-bold tracking-widest text-white px-2 py-0.5 rounded-full select-none">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-ping" : "bg-purple-400"} inline-block`}></span>
                  REC: MY LOVE (CAM_B)
                </div>

                {/* Webcam/Upload screen container */}
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-900 border border-slate-800 shadow-inner overflow-hidden relative flex items-center justify-center">
                  {partnerSource === "upload" && partnerUpload ? (
                    <img
                      src={partnerUpload}
                      className={`w-full h-full object-cover filter ${selectedFilter !== "none" ? availableFilters.find((f) => f.value === selectedFilter)?.class || "" : ""
                        }`}
                    />
                  ) : partnerWebcamMock ? (
                    // Webcam mock/synced stream from other tab
                    <img
                      src={partnerWebcamMock}
                      className={`w-full h-full object-cover filter ${selectedFilter !== "none" ? availableFilters.find((f) => f.value === selectedFilter)?.class || "" : ""
                        }`}
                    />
                  ) : (
                    // Synced Webcam status placeholder
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-slate-850 to-slate-950">
                      <Camera className="w-10 h-10 text-purple-300 animate-pulse mb-2" />
                      <span className="text-[11px] text-slate-350 uppercase tracking-widest font-black">Waiting for partner...</span>
                      <p className="text-[8.5px] text-slate-400 mt-1 max-w-[200px]">Ask your partner to open another tab, sign in with their account, and enter the same room ID to connect live!</p>
                    </div>
                  )}

                  {/* Speech Chat Bubble Overlay */}
                  <AnimatePresence>
                    {partnerActiveBubble && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -15 }}
                        className="absolute bottom-6 left-6 right-6 bg-white border-2 border-purple-300 p-3 rounded-2xl shadow-lg text-xs font-serif italic text-gray-800 text-center font-bold z-20"
                      >
                        {partnerActiveBubble}
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-purple-300 rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shutter Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <span className="text-6xl font-black font-display text-rose-400 animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>

                {/* Perspective User Info */}
                <div className="flex items-center gap-3 mt-4 border-b pb-3 border-black/5">
                  <img
                    src={currentUser === "user_a" ? userB.avatar : userA.avatar}
                    className="w-8 h-8 rounded-full border-2 border-purple-200 object-cover"
                  />
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-800">{currentUser === "user_a" ? userB.name : userA.name}</h5>
                    <p className="text-[9px] font-semibold text-purple-500 tracking-wider uppercase">Remote partner perspective</p>
                  </div>
                </div>

                {/* Partner stream controls */}
                <div className="space-y-3 pt-3 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Partner Inputs:</span>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => { setIsBotPartner(false); setPartnerSource("preset"); }} className={`text-[8px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${partnerSource === "preset" ? "bg-black text-white border-black" : "bg-white text-gray-500"}`}>Presets</button>
                      <button onClick={() => { setIsBotPartner(false); setPartnerSource("upload"); }} className={`text-[8px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${partnerSource === "upload" ? "bg-black text-white border-black" : "bg-white text-gray-500"}`}>Upload</button>
                    </div>
                  </div>

                  {partnerSource === "preset" && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider block">Cycle Partner Pose:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {(currentUser === "user_a" ? userBPresets : userAPresets).map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setSelectedPartnerPreset(preset.url);
                              triggerHaptic("light");
                            }}
                            className={`flex flex-col items-center p-1.5 rounded-lg border shrink-0 transition-all cursor-pointer ${selectedPartnerPreset === preset.url ? "border-purple-500 bg-purple-50 scale-105" : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                          >
                            <div className="w-8 h-8 rounded overflow-hidden relative border">
                              <img src={preset.url} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[6px] text-gray-500 mt-1 max-w-[40px] truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {partnerSource === "upload" && (
                    <div className="flex flex-col gap-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePartnerUpload}
                        className="hidden"
                        id="partner-upload-input-sync"
                      />
                      <label
                        htmlFor="partner-upload-input-sync"
                        className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-center cursor-pointer text-[9px] font-bold hover:bg-black/5 transition-all text-gray-650 block"
                      >
                        {partnerUpload ? "Change uploaded selfie" : "Upload partner photo"}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Below Twin Screens: Studio Workspace */}
            <div className="lg:col-span-5 space-y-6">
              {/* Creative Styling Panel */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-rose-500 flex items-center gap-1.5 border-b pb-2 border-black/5">
                  <Layers className="w-4 h-4 text-rose-500" />
                  Styling & Layout Studio
                </h3>

                {/* 1. Layout Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                    1. Choose Layout Strip
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "polaroid", label: "Polaroid" },
                      { value: "2-cut", label: "2 Cut" },
                      { value: "4-cut", label: "4 Cut" },
                      { value: "6-cut", label: "6 Cut" },
                    ].map((lay) => (
                      <button
                        key={lay.value}
                        onClick={() => {
                          setLayout(lay.value as any);
                          setPhotos([]);
                          setPartnerPhotos([]);
                        }}
                        className={`text-xs py-2 px-1 text-center border rounded-lg transition-all cursor-pointer ${layout === lay.value
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 font-bold"
                            : "border-gray-200 hover:bg-black/5"
                          }`}
                      >
                        {lay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Backdrop Styling */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                    2. Backdrop Styling
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {availableBackgrounds.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setSelectedBg(bg.value)}
                        className={`text-[10px] py-1.5 border rounded transition-all truncate text-center cursor-pointer ${selectedBg === bg.value ? "border-black font-bold scale-105" : "border-gray-200 opacity-80"
                          }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Filters Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                    3. Aesthetic Filters
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availableFilters.map((filt) => (
                      <button
                        key={filt.value}
                        onClick={() => setSelectedFilter(filt.value)}
                        className={`text-[10px] py-1.5 border rounded transition-all cursor-pointer ${selectedFilter === filt.value ? "border-[var(--primary)] font-bold bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border-color)]"
                          }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>
                </div>



                {/* 5. Custom Text Stamps */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block">
                    5. Bottom Text Label
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTextStamp}
                      onChange={(e) => setCustomTextStamp(e.target.value)}
                      placeholder="e.g. Cafe Date ☕"
                      className="flex-1 bg-black/5 text-xs rounded-lg px-2.5 outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                    <button
                      onClick={() => {
                        if (customTextStamp) {
                          setSelectedStamp(customTextStamp);
                          setCustomTextStamp("");
                        }
                      }}
                      className="text-xs bg-black text-white px-3 py-1 rounded-lg cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Canvas Preview Column */}
            <div className="lg:col-span-7 flex flex-col items-center">
              {/* Photobooth Strip Canvas Wrapper */}
              <div
                className="relative p-6 bg-white/40 border border-white rounded-3xl flex flex-col items-center w-full max-w-sm shadow-inner overflow-visible"
              >
                {/* Dedicated High-Resolution Capture Wrapper Container */}
                <div id="photobooth-capture-container" className="relative p-1 bg-transparent overflow-visible inline-block">
                  <div
                    id="photobooth-strip-capture"
                    style={bgStylesMap[selectedBg] || { backgroundColor: "#ffffff" }}
                    className="relative p-5 shadow-2xl rounded-sm w-64 flex flex-col items-center gap-4 transition-all duration-300 z-10"
                  >
                    {/* Outer Frame Header stamp */}
                    <div className="text-[9px] font-mono opacity-80 tracking-widest uppercase select-none flex items-center gap-1 font-bold">
                      ★ COLLABORATIVE STRIP ★
                    </div>

                    {/* Photobooth slots */}
                    <div className="w-full space-y-3 flex-1 flex flex-col">
                      {(() => {
                        const totalSlots = layout === "polaroid" ? 1 : layout === "2-cut" ? 2 : layout === "6-cut" ? 6 : 4;
                        return Array.from({ length: totalSlots }).map((_, idx) => {
                          const hasPhoto = colabMode === "split"
                            ? (idx < photos.length && idx < partnerPhotos.length)
                            : (idx < photos.length);
                          const isActiveSlot = idx === photos.length;

                          if (hasPhoto) {
                            if (colabMode === "split") {
                              return (
                                <div
                                  key={idx}
                                  className={`w-full overflow-hidden rounded relative border border-black/5 flex flex-row ${layout === "polaroid" ? "h-64" : layout === "2-cut" ? "h-44" : layout === "6-cut" ? "h-20" : "h-32"
                                    }`}
                                >
                                  {/* Left half: User A */}
                                  <div className="w-1/2 h-full relative overflow-hidden bg-gray-50 border-r border-black/5">
                                    <img
                                      src={photos[idx]}
                                      alt={`Snap ${idx + 1} User`}
                                      className={`w-full h-full object-cover select-none pointer-events-none ${selectedFilter !== "none"
                                          ? availableFilters.find((f) => f.value === selectedFilter)?.class
                                          : ""
                                        }`}
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  {/* Right half: User B */}
                                  <div className="w-1/2 h-full relative overflow-hidden bg-gray-50">
                                    <img
                                      src={partnerPhotos[idx]}
                                      alt={`Snap ${idx + 1} Partner`}
                                      className={`w-full h-full object-cover select-none pointer-events-none ${selectedFilter !== "none"
                                          ? availableFilters.find((f) => f.value === selectedFilter)?.class
                                          : ""
                                        }`}
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              );
                            } else {
                              const isPartnerAlt = colabMode === "alternating" && (
                                currentUser === "user_a" ? idx % 2 !== 0 : idx % 2 === 0
                              );
                              return (
                                <div
                                  key={idx}
                                  className={`w-full overflow-hidden rounded relative border border-black/5 bg-gray-100 ${layout === "polaroid" ? "h-64" : layout === "2-cut" ? "h-44" : layout === "6-cut" ? "h-20" : "h-32"
                                    }`}
                                >
                                  <img
                                    src={photos[idx]}
                                    alt={`Snap ${idx + 1}`}
                                    className={`w-full h-full object-cover select-none pointer-events-none ${selectedFilter !== "none"
                                        ? availableFilters.find((f) => f.value === selectedFilter)?.class
                                        : ""
                                      }`}
                                    referrerPolicy="no-referrer"
                                  />
                                  {colabMode === "alternating" && (
                                    <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[7px] font-bold text-white rounded shadow-sm ${isPartnerAlt ? "bg-rose-500" : "bg-gray-800"}`}>
                                      {isPartnerAlt ? "Partner" : "Me"}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                          }

                          if (isActiveSlot) {
                            if (colabMode === "split") {
                              const partnerPresets = currentUser === "user_a" ? userBPresets : userAPresets;
                              const partnerPresetUrl = partnerPresets[idx % partnerPresets.length].url;
                              const partnerPic = isBotPartner
                                ? selectedPartnerPreset || partnerPresetUrl
                                : partnerSource === "preset"
                                  ? selectedPartnerPreset || partnerPresetUrl
                                  : partnerSource === "upload" && partnerUpload
                                    ? partnerUpload
                                    : partnerWebcamMock || photoboothSamplePhotos[(idx + 2) % photoboothSamplePhotos.length];

                              return (
                                <div
                                  key={idx}
                                  className={`w-full overflow-hidden rounded relative border-2 border-[var(--primary)] flex flex-row ${layout === "polaroid" ? "h-64" : layout === "2-cut" ? "h-44" : layout === "6-cut" ? "h-20" : "h-32"
                                    }`}
                                >
                                  {/* Left half: Me */}
                                  <div className="w-1/2 h-full relative overflow-hidden bg-slate-900 border-r border-[var(--primary)]/30 flex items-center justify-center">
                                    {mySource === "webcam" && useWebcam ? (
                                      <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover scale-x-[-1]"
                                      />
                                    ) : mySource === "upload" && myUpload ? (
                                      <img src={myUpload} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-gradient-to-b from-slate-800 to-slate-900">
                                        <Camera className="w-4 h-4 text-rose-300 animate-pulse mb-0.5" />
                                        <span className="text-[7px] text-slate-350 uppercase tracking-widest font-bold">Me (Live)</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right half: Partner */}
                                  <div className="w-1/2 h-full relative overflow-hidden bg-slate-900 flex items-center justify-center">
                                    {remoteStream ? (
                                      <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover scale-x-[-1]"
                                      />
                                    ) : isBotPartner ? (
                                      <div className="w-full h-full relative overflow-hidden">
                                        <img src={partnerPic} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center p-1">
                                          <span className="text-[6px] text-purple-300 font-mono uppercase tracking-widest font-black flex items-center gap-0.5">
                                            Bot Companion
                                          </span>
                                        </div>
                                      </div>
                                    ) : partnerSource === "preset" ? (
                                      <img src={partnerPic} className="w-full h-full object-cover" />
                                    ) : partnerSource === "upload" && partnerUpload ? (
                                      <img src={partnerUpload} className="w-full h-full object-cover" />
                                    ) : partnerWebcamMock ? (
                                      <img src={partnerWebcamMock} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full relative overflow-hidden">
                                        <img src={partnerPic} className="w-full h-full object-cover opacity-75 filter blur-[0.5px]" />
                                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center p-1">
                                          <span className="text-[7px] text-emerald-400 font-mono uppercase tracking-widest font-black flex items-center gap-0.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Mock Feed
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 bg-black/60 text-[7px] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                      Partner
                                    </span>
                                  </div>

                                  {countdown !== null && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                                      <span className="text-3xl font-black font-display text-rose-400 animate-ping">
                                        {countdown}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              const isPartnerAlt = colabMode === "alternating" && (
                                currentUser === "user_a" ? idx % 2 !== 0 : idx % 2 === 0
                              );
                              return (
                                <div
                                  key={idx}
                                  className={`w-full overflow-hidden rounded relative border-2 border-[var(--primary)] bg-slate-950 flex flex-col items-center justify-center ${layout === "polaroid" ? "h-64" : layout === "2-cut" ? "h-44" : layout === "6-cut" ? "h-20" : "h-32"
                                    }`}
                                >
                                  {isPartnerAlt ? (
                                    <div className="w-full h-full relative flex items-center justify-center">
                                      {remoteStream ? (
                                        <video
                                          ref={remoteVideoRef}
                                          autoPlay
                                          playsInline
                                          className="w-full h-full object-cover scale-x-[-1]"
                                        />
                                      ) : isBotPartner ? (
                                        <img src={selectedPartnerPreset} className="w-full h-full object-cover" />
                                      ) : partnerSource === "preset" ? (
                                        <img src={selectedPartnerPreset} className="w-full h-full object-cover" />
                                      ) : partnerSource === "upload" && partnerUpload ? (
                                        <img src={partnerUpload} className="w-full h-full object-cover" />
                                      ) : partnerWebcamMock ? (
                                        <img src={partnerWebcamMock} className="w-full h-full object-cover" />
                                      ) : (
                                        <img src={photoboothSamplePhotos[(idx + 2) % photoboothSamplePhotos.length]} className="w-full h-full object-cover" />
                                      )}
                                      <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-center p-2 text-white">
                                        <Sparkles className="w-4 h-4 text-rose-300 animate-pulse mb-1" />
                                        <span className="text-[8px] uppercase tracking-wider font-bold">Partner's Turn</span>
                                      </div>
                                    </div>
                                  ) : (
                                    mySource === "webcam" && useWebcam ? (
                                      <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover scale-x-[-1]"
                                      />
                                    ) : mySource === "upload" && myUpload ? (
                                      <img src={myUpload} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-slate-900/50 flex flex-col items-center justify-center text-center p-2 text-white/95">
                                        <Sparkles className="w-5 h-5 text-rose-300 animate-pulse mb-1" />
                                        <span className="text-[9px] uppercase tracking-wider font-bold">My Turn (Live Cam)</span>
                                      </div>
                                    )
                                  )}

                                  {countdown !== null && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                                      <span className="text-3xl font-black font-display text-rose-400 animate-ping">
                                        {countdown}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          }

                          // Uncaptured empty slot placeholder
                          return (
                            <div
                              key={idx}
                              className={`w-full bg-black/5 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-[10px] text-gray-400 ${layout === "polaroid" ? "h-64" : layout === "2-cut" ? "h-44" : layout === "6-cut" ? "h-20" : "h-32"
                                }`}
                            >
                              <Camera className="w-4 h-4 mb-1 text-gray-300" />
                              Slot {idx + 1}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Stamp Label Footer */}
                    <div className="text-center pt-2 pb-1 border-t border-black/5 w-full flex items-center justify-between font-serif select-none">
                      <span className="text-[10px] italic font-semibold">{selectedStamp}</span>
                      <span className="text-[8px] font-mono tracking-tighter opacity-70">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>


                  </div>
                </div>

                {photos.length < (layout === "polaroid" ? 1 : layout === "2-cut" ? 2 : layout === "6-cut" ? 6 : 4) && (
                  <button
                    onClick={startSynchronizedCapture}
                    disabled={isSnapping}
                    className="w-full max-w-[240px] mt-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all z-10 active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {isSnapping ? "Get Ready! Snapping..." : "Capture Together 📸"}
                  </button>
                )}
              </div>

              {/* Action operations on Taken Strip */}
              {photos.length > 0 && !isSnapping && (
                <div className="flex flex-col gap-3 mt-6 w-full max-w-sm z-10 animate-fade-in">
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={savePhotoboothToTimeline}
                      className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Save to Timeline
                    </button>
                    <button
                      onClick={handleDownloadPng}
                      className="py-2.5 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-gray-300 transition-all active:scale-95 border border-gray-300 cursor-pointer"
                      title="Download high-resolution custom frame as PNG"
                    >
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic("medium");
                      setPhotos([]);
                      setPartnerPhotos([]);
                    }}
                    className="w-full py-2 bg-black/5 hover:bg-black/10 text-gray-650 font-bold rounded-lg text-[10px] text-center transition-all active:scale-95 cursor-pointer"
                  >
                    🔄 Take New Photos / Reset Strip
                  </button>
                </div>
              )}


              {/* THUMBNAIL GALLERY CAROUSEL OF PREVIOUS PHOTOS */}
              <div className="w-full mt-10 bg-white/40 backdrop-blur-md rounded-3xl p-5 border border-white/40 shadow-sm z-10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-700">
                      Our Keepsake Photobooth Gallery
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 bg-white/80 px-2 py-0.5 rounded-full border border-white">
                    {memories.filter((m) => m.type === "photobooth").length} prints
                  </span>
                </div>

                {memories.filter((m) => m.type === "photobooth").length > 0 ? (
                  <div
                    ref={carouselRef}
                    className="overflow-hidden w-full cursor-grab active:cursor-grabbing select-none"
                  >
                    <motion.div
                      drag="x"
                      dragConstraints={dragConstraints}
                      className="flex gap-3 w-max py-1 px-0.5"
                    >
                      {memories
                        .filter((m) => m.type === "photobooth")
                        .map((item, index) => (
                          <motion.div
                            key={item.id || index}
                            whileHover={{ scale: 1.05, y: -2 }}
                            onClick={() => {
                              triggerHaptic("success");

                              const itemLayout = (item as any).layout || ((item as any).photosList && (item as any).photosList.length === 1 ? "polaroid" : "4-cut");
                              setLayout(itemLayout as any);

                              setColabMode((item as any).colabMode || "solo");
                              setPartnerPhotos((item as any).partnerPhotosList || []);

                              if ((item as any).photosList && (item as any).photosList.length > 0) {
                                setPhotos((item as any).photosList);
                              } else {
                                const sampleList = [
                                  item.imageUrl,
                                  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop",
                                  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400&auto=format&fit=crop",
                                ];
                                const count = itemLayout === "polaroid" ? 1 : itemLayout === "2-cut" ? 2 : itemLayout === "6-cut" ? 6 : 4;
                                setPhotos(sampleList.slice(0, count));
                              }

                              setSelectedBg(item.bgStyle || "sakura");
                              setSelectedFilter(item.filterClass || "natural");
                              setSelectedStamp(item.title || "Us 🌸");

                              setShowPrintAnimation(true);
                            }}
                            className="w-28 bg-white p-2 pb-3 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-1.5 shrink-0 cursor-pointer hover:border-[var(--primary)]/50"
                          >
                            <div className="w-full aspect-square rounded overflow-hidden bg-gray-50 border border-gray-100 relative">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover pointer-events-none select-none"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] font-bold text-gray-700 truncate w-full">
                                {item.title}
                              </p>
                              <p className="text-[7px] font-mono text-gray-400 mt-0.5">
                                {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Pre-saved"}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  </div>
                ) : (
                  <div className="w-full text-center py-6 bg-white/20 border border-dashed border-black/5 rounded-2xl">
                    <p className="text-[10px] text-[var(--text-muted)] italic font-serif">
                      No photostrips in our gallery yet. Strike a pose and print your first strip above! 📸
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {/* SUBTAB 3: DIARY JOURNAL */}
        {activeSubTab === "journal" && (
          <motion.div
            key="journal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Our Shared Notion Diary</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Co-write memories of our small daily joys.</p>
              </div>
              <button
                onClick={() => setShowAddJournal(!showAddJournal)}
                className="py-2 px-4 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4" /> {showAddJournal ? "Cancel" : "New Entry"}
              </button>
            </div>

            {/* EXPANDABLE ADD ENTRY PANEL */}
            {showAddJournal && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleCreateJournal}
                className="glass-panel p-6 rounded-2xl space-y-4 max-w-2xl mx-auto"
              >
                <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--primary)]">
                  Log a Beautiful Day
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Title</label>
                    <input
                      type="text"
                      value={jTitle}
                      onChange={(e) => setJTitle(e.target.value)}
                      required
                      placeholder="e.g. Strawberry Picking Date 🍓"
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Date</label>
                    <input
                      type="date"
                      value={jDate}
                      onChange={(e) => setJDate(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Location</label>
                    <input
                      type="text"
                      value={jLocation}
                      onChange={(e) => setJLocation(e.target.value)}
                      placeholder="e.g. Han River Park"
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Weather</label>
                    <select
                      value={jWeather}
                      onChange={(e) => setJWeather(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent"
                    >
                      <option value="sunny">☀️ Sunny</option>
                      <option value="rainy">🌧️ Rainy</option>
                      <option value="cloudy">☁️ Cloudy</option>
                      <option value="snowy">❄️ Snowy</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Mood</label>
                    <select
                      value={jMood}
                      onChange={(e) => setJMood(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent"
                    >
                      <option value="cozy">☕ Cozy</option>
                      <option value="excited">🎉 Excited</option>
                      <option value="peaceful">🌿 Peaceful</option>
                      <option value="sleepy">🌙 Sleepy</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] font-bold">Description / Story</label>
                  <textarea
                    value={jDescription}
                    onChange={(e) => setJDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe how beautiful the afternoon was..."
                    className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Aesthetic Photo URL (Optional)</label>
                    <input
                      type="text"
                      value={jImageUrl}
                      onChange={(e) => setJImageUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-bold">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={jTags}
                      onChange={(e) => setJTags(e.target.value)}
                      placeholder="e.g. cafe, autumn, sweet"
                      className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs"
                >
                  Publish to Journal Timeline
                </button>
              </motion.form>
            )}

            {/* JOURNALS MASONRY LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {journals.map((jr) => (
                <motion.div
                  key={jr.id}
                  className="bg-white/80 hover:bg-white rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm flex flex-col justify-between"
                >
                  {/* Journal Image header */}
                  {jr.imageUrl && (
                    <div className="h-44 overflow-hidden relative bg-black/5">
                      <img
                        src={jr.imageUrl}
                        alt={jr.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur px-2 py-0.5 rounded text-[9px] font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                        <MapPin className="w-2.5 h-2.5" /> {jr.location}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {new Date(jr.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex gap-1.5">
                          <span>{jr.weather === "sunny" ? "☀️" : jr.weather === "rainy" ? "🌧️" : jr.weather === "snowy" ? "❄️" : "☁️"}</span>
                          <span>{jr.mood === "cozy" ? "☕" : jr.mood === "excited" ? "🎉" : jr.mood === "sleepy" ? "🌙" : "🌿"}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[var(--text-main)] font-display">{jr.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                        {jr.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                      <div className="flex gap-1">
                        {jr.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-2 py-0.5 bg-black/5 text-gray-500 rounded-full font-mono font-medium flex items-center gap-0.5"
                          >
                            <Tag className="w-2 h-2" /> {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to archive this memory?")) {
                            deleteJournal(jr.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK REACTION & COMMENT MODAL */}
      <AnimatePresence>
        {selectedMemoryForModal && (() => {
          const currentMem = memories.find((m) => m.id === selectedMemoryForModal.id) || selectedMemoryForModal;
          const filterObj = availableFilters.find((f) => f.value === currentMem.filterClass);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMemoryForModal(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 w-full max-w-md z-10 flex flex-col max-h-[85vh] relative text-left"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedMemoryForModal(null)}
                  className="absolute top-4 right-4 p-1.5 bg-black/5 hover:bg-black/10 rounded-full text-gray-500 hover:text-gray-800 transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Modal Banner */}
                {currentMem.imageUrl && (
                  currentMem.type === "photobooth" ? (
                    <div className="w-full bg-slate-900 p-6 flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0 border-b border-gray-100 min-h-[340px]">
                      {/* Blur reflection background */}
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-110 pointer-events-none"
                        style={{ backgroundImage: `url(${currentMem.imageUrl})` }}
                      />
                      {/* Miniature Physical Strip for canvas capture */}
                      <div
                        id={`photobooth-strip-modal-${currentMem.id}`}
                        style={bgStylesMap[currentMem.bgStyle || "sakura"] || { backgroundColor: "#ffffff" }}
                        className="relative p-4 shadow-2xl rounded-sm w-48 flex flex-col items-center gap-3 transition-all duration-300 z-10 border border-white/5"
                      >
                        {/* Outer Frame Header stamp */}
                        <div className="text-[7px] font-mono opacity-80 tracking-widest uppercase select-none font-bold">
                          ★ LIFE 4 CUTS ★
                        </div>

                        {/* Slots based on layout */}
                        <div className="w-full space-y-2 flex-1 flex flex-col">
                          {(() => {
                            const pList = currentMem.photosList || [];
                            const partnerPList = currentMem.partnerPhotosList || [];
                            const isSplit = currentMem.colabMode === "split" && partnerPList.length > 0;
                            const totalSlots = isSplit ? pList.length : (pList.length > 0 ? pList.length : 1);
                            const itemLayout = currentMem.layout || (totalSlots === 1 ? "polaroid" : "4-cut");

                            return Array.from({ length: totalSlots }).map((_, idx) => {
                              if (isSplit) {
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full overflow-hidden rounded relative border border-black/5 flex flex-row ${itemLayout === "polaroid" ? "h-40" : itemLayout === "2-cut" ? "h-28" : itemLayout === "6-cut" ? "h-12" : "h-20"
                                      }`}
                                  >
                                    <div className="w-1/2 h-full relative overflow-hidden bg-gray-50 border-r border-black/5">
                                      <img
                                        src={pList[idx] || photoboothSamplePhotos[idx % photoboothSamplePhotos.length]}
                                        alt={`Snap ${idx + 1} Me`}
                                        className={`w-full h-full object-cover select-none pointer-events-none ${currentMem.filterClass && currentMem.filterClass !== "none"
                                            ? availableFilters.find((f) => f.value === currentMem.filterClass)?.class || ""
                                            : ""
                                          }`}
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="w-1/2 h-full relative overflow-hidden bg-gray-50">
                                      <img
                                        src={partnerPList[idx] || photoboothSamplePhotos[(idx + 2) % photoboothSamplePhotos.length]}
                                        alt={`Snap ${idx + 1} Partner`}
                                        className={`w-full h-full object-cover select-none pointer-events-none ${currentMem.filterClass && currentMem.filterClass !== "none"
                                            ? availableFilters.find((f) => f.value === currentMem.filterClass)?.class || ""
                                            : ""
                                          }`}
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  </div>
                                );
                              } else {
                                const ph = pList[idx] || currentMem.imageUrl;
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full overflow-hidden rounded relative border border-black/5 bg-gray-100 ${itemLayout === "polaroid" ? "h-40" : itemLayout === "2-cut" ? "h-28" : itemLayout === "6-cut" ? "h-12" : "h-20"
                                      }`}
                                  >
                                    <img
                                      src={ph}
                                      alt={`Snap ${idx + 1}`}
                                      crossOrigin="anonymous"
                                      className={`w-full h-full object-cover select-none pointer-events-none ${currentMem.filterClass && currentMem.filterClass !== "none"
                                          ? availableFilters.find((f) => f.value === currentMem.filterClass)?.class || ""
                                          : ""
                                        }`}
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                );
                              }
                            });
                          })()}
                        </div>

                        {/* Stamp signature block */}
                        <div className="text-center w-full mt-1 flex flex-col gap-0.5 relative select-none">
                          <p className="font-serif italic text-[10px] font-bold tracking-tight">
                            {currentMem.title}
                          </p>
                          <p className="text-[6px] font-mono opacity-60">
                            {new Date(currentMem.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>

                        {/* Stored stickers list */}
                        {currentMem.stickersList && currentMem.stickersList.map((st) => (
                          <div
                            key={st.id}
                            style={{
                              position: "absolute",
                              left: `${st.x}%`,
                              top: `${st.y}%`,
                              transform: "translate(-50%, -50%)",
                              zIndex: 40,
                            }}
                            className="text-xl select-none pointer-events-none"
                          >
                            {st.sticker}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 relative bg-black/5 flex-shrink-0">
                      <img
                        src={currentMem.imageUrl}
                        alt={currentMem.title}
                        className={`w-full h-full object-cover ${filterObj ? filterObj.class : ""}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-12 text-white">
                        <div className="flex items-center gap-1 text-[9px] text-white/85 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(currentMem.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <h3 className="text-base font-serif font-bold tracking-tight mt-0.5 text-white drop-shadow-sm">
                          {currentMem.title}
                        </h3>
                      </div>
                    </div>
                  )
                )}

                {!currentMem.imageUrl && (
                  <div className="p-6 pb-2 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(currentMem.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <h3 className="text-lg font-serif font-bold tracking-tight text-[var(--text-main)] mt-1">
                      {currentMem.title}
                    </h3>
                  </div>
                )}

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                  {/* Description */}
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--primary)]/5 p-3.5 rounded-xl border border-[var(--border-color)]">
                    {currentMem.description}
                  </p>

                  {/* Download & Print Actions */}
                  {currentMem.imageUrl && (
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          triggerHaptic("success");
                          if (currentMem.type === "photobooth") {
                            handleDownloadMemoryStrip(currentMem);
                          } else {
                            handleDownloadImage(currentMem.imageUrl, currentMem.title);
                          }
                        }}
                        className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Photo</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic("medium");
                          handlePrintImage(currentMem.imageUrl, currentMem.title);
                        }}
                        className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-all active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                        </svg>
                        <span>Print Layout</span>
                      </button>
                    </div>
                  )}

                  {/* Reaction buttons */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold">
                      Tap to React ❤️
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["💖", "✨", "☕", "🌴", "🍕", "🔥", "😭", "🌸"].map((emoji) => {
                        const hasReacted = !!userReactions?.[`${currentUser}_${currentMem.id}`]?.[emoji];
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(currentMem.id, emoji)}
                            className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 font-semibold active:scale-95 border ${hasReacted
                                ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 shadow-sm"
                                : "bg-black/5 hover:bg-[var(--primary)]/5 hover:scale-105 text-[var(--text-main)] border-transparent"
                              }`}
                          >
                            <span>{emoji}</span>
                            <span className={`text-[9px] font-mono ${hasReacted ? "text-[var(--primary)] font-bold" : "text-gray-400"}`}>
                              {currentMem.reactions[emoji] || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Feed */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                      Discussions ({currentMem.comments.length})
                    </h4>

                    {currentMem.comments.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-100 text-[10px] text-gray-400 font-medium">
                        No whispers yet. Write a beautiful comment below!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                        {currentMem.comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="bg-gray-50/70 rounded-xl p-2.5 text-[10px] space-y-0.5 border border-gray-100/50"
                          >
                            <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono">
                              <span className="font-bold text-gray-600">
                                {(comm.authorId === "user_a" ? userA : userB).name}
                              </span>
                              <span>now</span>
                            </div>
                            <p className="text-gray-600 leading-normal">{comm.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Input Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a whisper..."
                    value={modalCommentText}
                    onChange={(e) => setModalCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && modalCommentText.trim()) {
                        addCommentToMemory(currentMem.id, modalCommentText);
                        setModalCommentText("");
                      }
                    }}
                    className="flex-1 bg-white focus:ring-1 focus:ring-rose-300 border border-gray-200 text-xs rounded-xl px-3 py-1.5 outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      if (modalCommentText.trim()) {
                        addCommentToMemory(currentMem.id, modalCommentText);
                        setModalCommentText("");
                      }
                    }}
                    className="px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-all active:scale-95"
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
