import type { AppData, DailyLog, FoodEntry, Profile, ProgressPhoto, WeightLog, Workout } from "../types";

/**
 * Contrato de persistencia. La UI trabaja siempre sobre el estado en memoria (optimista)
 * y el backend replica cada cambio: IndexedDB en modo local o Firestore (Firebase).
 */
export interface Backend {
  kind: "local" | "cloud";
  load(): Promise<AppData>;
  /** Solo modo local: guarda la instantánea completa. */
  snapshot?(data: AppData): void;
  saveProfile(p: Profile, isDemo: boolean): Promise<void>;
  upsertFood(e: FoodEntry): Promise<void>;
  deleteFood(id: string): Promise<void>;
  upsertWeight(w: WeightLog): Promise<void>;
  deleteWeight(id: string): Promise<void>;
  upsertWorkout(w: Workout): Promise<void>;
  deleteWorkout(id: string): Promise<void>;
  upsertDaily(d: DailyLog): Promise<void>;
  upsertPhoto(p: ProgressPhoto): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  /** Borra todos los registros (no el perfil). */
  clearLogs(): Promise<void>;
  signOut?(): Promise<void>;
  userEmail?: string | null;
}
