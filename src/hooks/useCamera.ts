/**
 * useCamera.ts — Webcam access hook for Photobooth
 */
import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 360 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err: any) {
      const msg = err?.message || "Camera access denied";
      setError(msg);
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    setError(null);
  }, []);

  return { startCamera, stopCamera, isActive, stream, error };
}
