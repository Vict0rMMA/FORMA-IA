"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/controls";
import { getFirebase } from "@/lib/firebase/client";

export default function LoginPage() {
  const fb = getFirebase();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  const submitting = useRef(false);

  // Si ya hay sesión guardada, entra directo.
  useEffect(() => {
    if (!fb) return;
    return onAuthStateChanged(fb.auth, (u) => {
      if (u && !submitting.current) window.location.replace("/");
    });
  }, [fb]);

  if (!fb)
    return (
      <Shell>
        <p className="text-sm text-muted">
          La autenticación se activa al configurar Firebase en <code className="text-fg">.env.local</code>. Mientras tanto la app funciona en modo local.
        </p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-lime px-6 text-sm font-semibold text-lime-ink">
          Entrar en modo local
        </Link>
      </Shell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    submitting.current = true;
    try {
      if (mode === "in") {
        await signInWithEmailAndPassword(fb.auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(fb.auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      }
      window.location.replace("/");
      return;
    } catch (err) {
      setMsg({ tone: "error", text: authError(err) });
    }
    submitting.current = false;
    setLoading(false);
  };

  return (
    <Shell>
      <h1 className="text-[26px] font-semibold tracking-tight">{mode === "in" ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h1>
      <p className="mt-1.5 text-sm text-muted">{mode === "in" ? "Entra para ver tu progreso." : "Tus datos se guardan de forma privada."}</p>
      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "up" && <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" />}
        <Input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
        />
        {msg && <p className={`text-[13px] ${msg.tone === "error" ? "text-danger" : "text-lime"}`}>{msg.text}</p>}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-full bg-lime font-semibold text-lime-ink transition-transform active:scale-[0.98] disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "in" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-start gap-3">
        <button onClick={() => (setMode(mode === "in" ? "up" : "in"), setMsg(null))} className="text-sm text-muted hover:text-fg">
          {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
        </button>
        {mode === "in" && (
          <button
            onClick={async () => {
              if (!email.trim()) return setMsg({ tone: "error", text: "Escribe tu correo arriba y vuelve a pulsar." });
              try {
                await sendPasswordResetEmail(fb.auth, email.trim());
                setMsg({ tone: "ok", text: "Te enviamos un correo para cambiar la contraseña." });
              } catch (err) {
                setMsg({ tone: "error", text: authError(err) });
              }
            }}
            className="text-sm text-muted hover:text-fg"
          >
            Olvidé mi contraseña
          </button>
        )}
      </div>
    </Shell>
  );
}

function authError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No hay ninguna cuenta con ese correo.",
    "auth/email-already-in-use": "Ese correo ya tiene cuenta. Entra con él.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  };
  return map[code] ?? (err instanceof Error ? err.message : "No se pudo continuar.");
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-sm">
        <div className="mb-12">
          <Logo />
        </div>
        {children}
      </motion.div>
    </main>
  );
}
