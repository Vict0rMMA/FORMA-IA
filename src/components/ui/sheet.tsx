"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";

/** Hoja inferior en móvil, diálogo centrado en desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line-strong bg-surface md:max-w-lg md:rounded-[28px]",
              className,
            )}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          >
            <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-white/15 md:hidden" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3 md:px-6 md:pt-5">
              <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-fg" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-6">{children}</div>
            {footer && <div className="border-t border-line px-5 py-4 pb-safe md:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
