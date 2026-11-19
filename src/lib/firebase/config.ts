export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** Si no hay credenciales de Firebase, la app funciona en modo local (IndexedDB) sin login. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
