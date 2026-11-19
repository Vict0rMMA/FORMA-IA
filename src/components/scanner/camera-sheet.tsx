"use client";

import { Camera, SwitchCamera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";

/** Cámara en vivo (desktop o navegadores sin `capture`). Devuelve un JPEG como Blob. */
export function CameraSheet({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (b: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return stop();
    let cancelled = false;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        stop();
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("No pudimos acceder a la cámara. Revisa los permisos del navegador o sube una foto."));
    return () => {
      cancelled = true;
    };
  }, [open, facing, stop]);

  useEffect(() => stop, [stop]);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (b) => {
        if (!b) return;
        stop();
        onCapture(b);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Sheet open={open} onClose={() => (stop(), onClose())} title="Tomar foto">
      {error ? (
        <p className="py-10 text-center text-sm text-muted">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-6 rounded-xl border border-white/15" />
          </div>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-fg" aria-label="Cambiar cámara">
              <SwitchCamera size={17} />
            </button>
            <button onClick={shoot} className="grid h-16 w-16 place-items-center rounded-full border-4 border-white/20 bg-lime text-lime-ink transition-transform active:scale-95" aria-label="Capturar">
              <Camera size={22} />
            </button>
            <span className="w-10" />
          </div>
        </div>
      )}
    </Sheet>
  );
}
