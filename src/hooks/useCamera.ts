/**
 * useCamera.ts — Webcam access hook for Photobooth
 */
import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    if (isLoading || isActive) return;
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 360 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err: any) {
      console.warn("First camera attempt failed, trying fallback constraints:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsActive(true);
      } catch (fallbackErr: any) {
        const msg = fallbackErr?.message || err?.message || "Camera access denied";
        setError(msg);
        setIsActive(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    setError(null);
    setIsLoading(false);
  }, []);

  return { startCamera, stopCamera, isActive, stream, error, isLoading };
}
