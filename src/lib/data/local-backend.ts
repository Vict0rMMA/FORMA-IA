"use client";

import { get, set } from "idb-keyval";
import { createDemoData } from "../demo-data";
import type { AppData } from "../types";
import type { Backend } from "./backend";

const KEY = "forma-ai:data:v1";
const noop = async () => {};

/** Persistencia en el navegador (IndexedDB). Arranca con datos de demostración. */
export function createLocalBackend(): Backend {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    kind: "local",
    async load() {
      try {
        const saved = await get<AppData>(KEY);
        if (saved?.profile) return saved;
      } catch {
        // IndexedDB bloqueado (modo privado): seguimos en memoria.
      }
      const demo = createDemoData();
      set(KEY, demo).catch(() => {});
      return demo;
    },
    snapshot(data) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => set(KEY, data).catch(() => {}), 250);
    },
    saveProfile: noop,
    upsertFood: noop,
    deleteFood: noop,
    upsertWeight: noop,
    deleteWeight: noop,
    upsertWorkout: noop,
    deleteWorkout: noop,
    upsertDaily: noop,
    upsertPhoto: noop,
    deletePhoto: noop,
    clearLogs: noop,
  };
}
