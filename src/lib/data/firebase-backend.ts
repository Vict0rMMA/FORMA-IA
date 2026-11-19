"use client";

import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { todayKey } from "../dates";
import { DEFAULT_PROFILE, emptyData } from "../demo-data";
import { uid } from "../format";
import type { AppData, DailyLog, FoodEntry, Profile, ProgressPhoto, WeightLog, Workout } from "../types";
import type { Backend } from "./backend";

/**
 * Estructura en Firestore (las reglas solo dejan a cada usuario tocar lo suyo):
 *   users/{uid}                 → { profile, isDemo, updatedAt }
 *   users/{uid}/foods/{id}      → FoodEntry
 *   users/{uid}/weights/{date}  → WeightLog (un registro por día)
 *   users/{uid}/workouts/{id}   → Workout
 *   users/{uid}/daily/{date}    → DailyLog
 *   users/{uid}/photos/{id}     → ProgressPhoto
 */
const COLLECTIONS = ["foods", "weights", "workouts", "daily", "photos"] as const;

/** Agrupa escrituras rápidas (p. ej. cada tecla al registrar series) en una sola petición. */
function debouncer() {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return (key: string, fn: () => Promise<void>, ms = 600) =>
    new Promise<void>((resolve, reject) => {
      const t = timers.get(key);
      if (t) clearTimeout(t);
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          fn().then(resolve, reject);
        }, ms),
      );
    });
}

export function createFirebaseBackend(db: Firestore, auth: Auth, user: User): Backend {
  const root = doc(db, "users", user.uid);
  const col = (name: (typeof COLLECTIONS)[number]) => collection(root, name);
  const later = debouncer();

  async function all<T>(name: (typeof COLLECTIONS)[number]): Promise<T[]> {
    const snap = await getDocs(col(name));
    return snap.docs.map((d) => d.data() as T);
  }

  return {
    kind: "cloud",
    userEmail: user.email,

    async load(): Promise<AppData> {
      const profileSnap = await getDoc(root);

      if (!profileSnap.exists()) {
        const name = user.displayName || user.email?.split("@")[0] || "Atleta";
        const fresh = emptyData({ ...DEFAULT_PROFILE, name });
        const firstWeight: WeightLog = { id: uid(), date: todayKey(), kg: fresh.profile.weightKg };
        await setDoc(root, { profile: fresh.profile, isDemo: false, updatedAt: new Date().toISOString() });
        await setDoc(doc(col("weights"), firstWeight.date), firstWeight);
        return { ...fresh, weights: [firstWeight] };
      }

      const [foods, weights, workouts, daily, photos] = await Promise.all([
        all<FoodEntry>("foods"),
        all<WeightLog>("weights"),
        all<Workout>("workouts"),
        all<DailyLog>("daily"),
        all<ProgressPhoto>("photos"),
      ]);
      const stored = profileSnap.data() as { profile: Profile; isDemo?: boolean };

      return {
        profile: { ...DEFAULT_PROFILE, ...stored.profile },
        isDemo: Boolean(stored.isDemo),
        foods: foods.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        weights: weights.sort((a, b) => a.date.localeCompare(b.date)),
        workouts: workouts.sort((a, b) => a.date.localeCompare(b.date)),
        daily: Object.fromEntries(daily.map((d) => [d.date, d])),
        photos: photos.sort((a, b) => a.date.localeCompare(b.date)),
      };
    },

    async saveProfile(p: Profile, isDemo: boolean) {
      await setDoc(root, { profile: p, isDemo, updatedAt: new Date().toISOString() });
    },
    upsertFood: (e) => later(`food:${e.id}`, () => setDoc(doc(col("foods"), e.id), e), 300),
    async deleteFood(id) {
      await deleteDoc(doc(col("foods"), id));
    },
    async upsertWeight(w: WeightLog) {
      await setDoc(doc(col("weights"), w.date), w);
    },
    async deleteWeight(id) {
      // Los pesos se guardan por fecha; buscamos el documento con ese id.
      const snap = await getDocs(col("weights"));
      const match = snap.docs.find((d) => (d.data() as WeightLog).id === id);
      if (match) await deleteDoc(match.ref);
    },
    upsertWorkout: (w) => later(`workout:${w.id}`, () => setDoc(doc(col("workouts"), w.id), w)),
    async deleteWorkout(id) {
      await deleteDoc(doc(col("workouts"), id));
    },
    upsertDaily: (d: DailyLog) => later(`daily:${d.date}`, () => setDoc(doc(col("daily"), d.date), d)),
    async upsertPhoto(p) {
      await setDoc(doc(col("photos"), p.id), p);
    },
    async deletePhoto(id) {
      await deleteDoc(doc(col("photos"), id));
    },
    async clearLogs() {
      for (const name of COLLECTIONS) {
        const snap = await getDocs(col(name));
        // Firestore admite hasta 500 operaciones por lote.
        for (let i = 0; i < snap.docs.length; i += 450) {
          const batch = writeBatch(db);
          snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
    },
    async signOut() {
      await signOut(auth);
    },
  };
}
