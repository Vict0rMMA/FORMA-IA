"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, ImageUp, Type } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/format";
import { useMediaQuery } from "@/lib/hooks";
import { CameraSheet } from "./camera-sheet";

const EXAMPLES = ["2 huevos, 1 arepa con queso y café con leche", "180 g de pollo, arroz y ensalada", "Batido de proteína con banano"];

export function Capture({ onImage, onText }: { onImage: (file: Blob) => void; onText: (text: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [text, setText] = useState("");
  const [camera, setCamera] = useState(false);
  const touch = useMediaQuery("(pointer: coarse)");

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f && f.type.startsWith("image/")) onImage(f);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files);
        }}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={cn(
          "relative flex flex-col items-center overflow-hidden rounded-[28px] border border-dashed px-6 py-12 text-center transition-colors md:py-16",
          drag ? "border-lime/60 bg-lime-soft" : "border-line-strong bg-surface",
        )}
      >
        <Corners />
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-[18px] bg-lime-soft text-lime">
          <Camera size={24} />
        </div>
        <p className="text-[17px] font-medium">Fotografía tu plato</p>
        <p className="mt-1.5 max-w-xs text-sm text-muted">{touch ? "Toma una foto o elige una de tu galería." : "Arrastra una imagen aquí, súbela o usa tu cámara."}</p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => (touch ? camRef.current?.click() : setCamera(true))}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-lime-ink transition-transform active:scale-[0.97]"
          >
            <Camera size={16} /> Tomar foto
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:bg-surface-2">
            <ImageUp size={16} /> Subir imagen
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} />
      </motion.div>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-line" />
        <span className="label-xs">o descríbela</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onText(text.trim());
        }}
      >
        <div className="flex items-end gap-2 rounded-[22px] border border-line bg-surface p-2 pl-4 focus-within:border-lime/30">
          <Type size={16} className="mb-3 shrink-0 text-faint" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim()) onText(text.trim());
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder="Ej: 2 huevos revueltos, 1 arepa con queso y un café con leche"
            className="min-h-[48px] flex-1 resize-none bg-transparent py-2.5 outline-none placeholder:text-faint"
          />
          <button type="submit" disabled={!text.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition-opacity disabled:opacity-30" aria-label="Analizar texto">
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:text-fg">
              {ex}
            </button>
          ))}
        </div>
      </form>

      <CameraSheet
        open={camera}
        onClose={() => setCamera(false)}
        onCapture={(b) => {
          setCamera(false);
          onImage(b);
        }}
      />
    </div>
  );
}

function Corners() {
  const c = "absolute h-5 w-5 border-lime/50";
  return (
    <>
      <span className={`${c} left-4 top-4 rounded-tl-lg border-l-2 border-t-2`} />
      <span className={`${c} right-4 top-4 rounded-tr-lg border-r-2 border-t-2`} />
      <span className={`${c} bottom-4 left-4 rounded-bl-lg border-b-2 border-l-2`} />
      <span className={`${c} bottom-4 right-4 rounded-br-lg border-b-2 border-r-2`} />
    </>
  );
}
