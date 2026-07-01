import { useState, useEffect, useCallback, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsActive(true);
      setError(null);
      return mediaStream;
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errMsg = "Could not access the camera. Please grant permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Permission Required: Please allow camera access in your browser settings to use the live photobooth.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "No camera found on this device.";
      } else {
        errMsg = err?.message || "Could not access the camera.";
      }
      setError(errMsg);
      setIsActive(false);
      setStream(null);
      streamRef.current = null;
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    streamRef.current = null;
    setIsActive(false);
  }, []);

  // Auto clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    isActive,
    error,
    setError,
    startCamera,
    stopCamera
  };
}
