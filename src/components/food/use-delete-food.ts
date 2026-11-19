"use client";

import { toast } from "sonner";
import { useStore } from "@/lib/store";

/** Elimina una comida con opción de deshacer. */
export function useDeleteFood() {
  const { deleteFood, saveFood } = useStore();
  return (id: string) => {
    const removed = deleteFood(id);
    if (!removed) return;
    toast("Comida eliminada", {
      description: removed.title,
      action: { label: "Deshacer", onClick: () => saveFood(removed) },
    });
  };
}
