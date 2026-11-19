"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Backend } from "./data/backend";
import { createLocalBackend } from "./data/local-backend";
import { createFirebaseBackend } from "./data/firebase-backend";
import { currentUser, getFirebase } from "./firebase/client";
import { computeTargets } from "./nutrition";
import { todayKey } from "./dates";
import { uid } from "./format";
import type { AppData, DailyLog, FoodEntry, Macros, Profile, ProgressPhoto, Workout } from "./types";
import { createDemoData } from "./demo-data";

interface Store {
  data: AppData;
  targets: Macros;
  mode: Backend["kind"];
  userEmail: string | null;
  updateProfile(patch: Partial<Profile>): void;
  saveFood(entry: FoodEntry): void;
  deleteFood(id: string): FoodEntry | undefined;
  logWeight(date: string, kg: number): void;
  deleteWeight(id: string): void;
  saveWorkout(w: Workout): void;
  deleteWorkout(id: string): void;
  updateDaily(date: string, patch: Partial<Omit<DailyLog, "date">>): void;
  addPhoto(p: Omit<ProgressPhoto, "id">): void;
  deletePhoto(id: string): void;
  /** Borra los registros de demostración y deja el perfil. */
  clearDemo(): Promise<void>;
  /** Vuelve a cargar los datos de demostración (solo modo local). */
  loadDemo(): void;
  signOut(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de StoreProvider");
  return s;
}

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const backendRef = useRef<Backend | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fb = getFirebase();
        let backend: Backend;
        if (fb) {
          const user = await currentUser(fb.auth);
          if (!user) {
            window.location.replace("/login");
            return;
          }
          backend = createFirebaseBackend(fb.db, fb.auth, user);
        } else {
          backend = createLocalBackend();
        }
        backendRef.current = backend;
        const loaded = await backend.load();
        if (alive) setData(loaded);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "No se pudieron cargar tus datos");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Modo local: cada cambio se guarda como instantánea en IndexedDB.
  useEffect(() => {
    if (data && backendRef.current?.snapshot) backendRef.current.snapshot(data);
  }, [data]);

  const sync = useCallback((fn: (b: Backend) => Promise<void>) => {
    const b = backendRef.current;
    if (!b) return;
    fn(b).catch((e) => toast.error("No se pudo sincronizar", { description: e instanceof Error ? e.message : String(e) }));
  }, []);

  const mutate = useCallback((fn: (d: AppData) => AppData) => setData((d) => (d ? fn(d) : d)), []);

  const store = useMemo<Store | null>(() => {
    if (!data) return null;
    return {
      data,
      targets: computeTargets(data.profile),
      mode: backendRef.current?.kind ?? "local",
      userEmail: backendRef.current?.userEmail ?? null,

      updateProfile(patch) {
        const profile = { ...data.profile, ...patch };
        mutate((d) => ({ ...d, profile }));
        sync((b) => b.saveProfile(profile, data.isDemo));
      },

      saveFood(entry) {
        mutate((d) => {
          const exists = d.foods.some((f) => f.id === entry.id);
          return { ...d, foods: exists ? d.foods.map((f) => (f.id === entry.id ? entry : f)) : [...d.foods, entry] };
        });
        sync((b) => b.upsertFood(entry));
      },

      deleteFood(id) {
        const entry = data.foods.find((f) => f.id === id);
        mutate((d) => ({ ...d, foods: d.foods.filter((f) => f.id !== id) }));
        sync((b) => b.deleteFood(id));
        return entry;
      },

      logWeight(date, kg) {
        const existing = data.weights.find((w) => w.date === date);
        const log = { id: existing?.id ?? uid(), date, kg };
        mutate((d) => {
          const weights = [...d.weights.filter((w) => w.date !== date), log].sort((a, b) => a.date.localeCompare(b.date));
          const latest = weights[weights.length - 1];
          return { ...d, weights, profile: { ...d.profile, weightKg: latest.kg } };
        });
        sync(async (b) => {
          await b.upsertWeight(log);
          const latestDate = [...data.weights.map((w) => w.date), date].sort().pop();
          if (latestDate === date) await b.saveProfile({ ...data.profile, weightKg: kg }, data.isDemo);
        });
      },

      deleteWeight(id) {
        mutate((d) => ({ ...d, weights: d.weights.filter((w) => w.id !== id) }));
        sync((b) => b.deleteWeight(id));
      },

      saveWorkout(w) {
        mutate((d) => {
          const exists = d.workouts.some((x) => x.id === w.id);
          return { ...d, workouts: exists ? d.workouts.map((x) => (x.id === w.id ? w : x)) : [...d.workouts, w] };
        });
        sync((b) => b.upsertWorkout(w));
      },

      deleteWorkout(id) {
        mutate((d) => ({ ...d, workouts: d.workouts.filter((x) => x.id !== id) }));
        sync((b) => b.deleteWorkout(id));
      },

      updateDaily(date, patch) {
        const current = data.daily[date] ?? { date, waterMl: 0, steps: 0 };
        const next = { ...current, ...patch, date };
        next.waterMl = Math.max(0, Math.round(next.waterMl));
        next.steps = Math.max(0, Math.round(next.steps));
        mutate((d) => ({ ...d, daily: { ...d.daily, [date]: next } }));
        sync((b) => b.upsertDaily(next));
      },

      addPhoto(p) {
        const photo = { ...p, id: uid() };
        mutate((d) => ({ ...d, photos: [...d.photos, photo] }));
        sync((b) => b.upsertPhoto(photo));
      },

      deletePhoto(id) {
        mutate((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }));
        sync((b) => b.deletePhoto(id));
      },

      async clearDemo() {
        const b = backendRef.current;
        if (b) await b.clearLogs();
        const weightLog = { id: uid(), date: todayKey(), kg: data.profile.weightKg };
        mutate((d) => ({ ...d, foods: [], workouts: [], weights: [weightLog], daily: {}, photos: [], isDemo: false }));
        if (b) {
          await b.upsertWeight(weightLog);
          await b.saveProfile(data.profile, false);
        }
      },

      loadDemo() {
        if (backendRef.current?.kind !== "local") return;
        setData(createDemoData());
      },

      async signOut() {
        await backendRef.current?.signOut?.();
        window.location.href = "/login";
      },
    };
  }, [data, mutate, sync]);

  if (error)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="text-sm text-muted">No pudimos cargar tus datos</p>
          <p className="text-fg">{error}</p>
          <button className="text-lime text-sm" onClick={() => location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  if (!store) return <>{fallback}</>;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
