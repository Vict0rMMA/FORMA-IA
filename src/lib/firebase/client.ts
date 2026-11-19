"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig, firebaseEnabled } from "./config";

let cached: { auth: Auth; db: Firestore } | null = null;

export function getFirebase(): { auth: Auth; db: Firestore } | null {
  if (!firebaseEnabled) return null;
  if (cached) return cached;
  const fresh = getApps().length === 0;
  const app = fresh ? initializeApp(firebaseConfig) : getApp();
  let db: Firestore;
  try {
    // Caché en memoria: arranca más rápido. La copia para abrir al instante la guarda el store en IndexedDB.
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    db = getFirestore(app);
  }
  cached = { auth: getAuth(app), db };
  return cached;
}

/** Espera a que Firebase resuelva la sesión guardada (null si no hay). */
export function currentUser(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (u) => {
      off();
      resolve(u);
    });
  });
}

/** Cabeceras para las rutas /api: añade el token de Firebase si hay sesión. */
export async function authHeadersImpl(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const fb = getFirebase();
  const user = fb?.auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return headers;
}
