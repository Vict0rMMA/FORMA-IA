"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/ui/logo";
import { buildCoachContext } from "@/lib/coach-context";
import { cn, n0, uid } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ChatMessage, CoachCard } from "@/lib/types";
import { authHeaders } from "@/lib/firebase/client";

const STARTERS = [
  "¿Cuántas calorías me quedan?",
  "¿Qué puedo comer ahora?",
  "¿Cómo voy con mis proteínas?",
  "Analiza mi alimentación de hoy",
  "¿Qué puedo cenar?",
  "¿Cuánto peso he perdido?",
  "Dame una comida de 500 calorías",
  "¿Qué alimentos tienen más proteína?",
];

const KEY = "forma-ai:coach:v1";

export default function CoachPage() {
  const { data, targets } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* sin persistencia */
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || pending) return;
    const user: ChatMessage = { id: uid(), role: "user", text: q, createdAt: new Date().toISOString() };
    const next = [...messages, user];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          messages: next.slice(-12).map((m) => ({ role: m.role, text: m.text })),
          context: buildCoachContext(data, targets),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: json.reply, cards: json.cards, suggestions: json.suggestions, provider: json.provider, createdAt: new Date().toISOString() },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: e instanceof Error && e.message ? e.message : "No pude responder ahora. Intenta de nuevo.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setPending(false);
    }
  };

  const last = messages.at(-1);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-11rem)] max-w-3xl flex-col md:min-h-[calc(100dvh-6.5rem)]">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-surface">
            <Sparkles size={17} className="text-lime" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight">AI Coach</h1>
            <p className="text-[12px] text-muted">Conoce tus registros y objetivos de hoy</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-muted hover:bg-surface hover:text-fg">
            <RotateCcw size={13} /> Nueva conversación
          </button>
        )}
      </header>

      <div className="flex-1">
        {messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-8 text-center md:pt-16">
            <LogoMark size={44} />
            <h2 className="mt-6 text-[24px] font-semibold tracking-tight">¿En qué te ayudo, {data.profile.name.split(" ")[0]}?</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">Pregúntame por tus calorías, macros, comidas o progreso. Respondo con tus datos reales.</p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {STARTERS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => send(s)}
                  className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-left text-[14px] text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-[20px] rounded-br-md bg-surface-2 px-4 py-2.5 text-[15px]">{m.text}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-soft">
                        <Sparkles size={13} className="text-lime" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <RichText text={m.text} />
                        {!!m.cards?.length && (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {m.cards.map((c, i) => (
                              <MealCard key={i} c={c} />
                            ))}
                          </div>
                        )}
                        {m.provider === "demo" && <p className="mt-3 text-[11px] text-faint">Modo demo · respuesta generada localmente</p>}
                        {m === last && !!m.suggestions?.length && !pending && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {m.suggestions.map((s) => (
                              <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:border-line-strong hover:text-fg">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {pending && (
              <div className="flex gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-lime-soft">
                  <Sparkles size={13} className="text-lime" />
                </div>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-[84px] mt-4 md:bottom-6"
      >
        <div className="flex items-end gap-2 rounded-[24px] border border-line-strong bg-surface-2/95 p-2 pl-4 backdrop-blur-xl focus-within:border-lime/30">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pregunta a tu coach…"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 outline-none placeholder:text-faint"
          />
          <button type="submit" disabled={!input.trim() || pending} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition-opacity disabled:opacity-30" aria-label="Enviar">
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Markdown mínimo: **negritas**, viñetas "- " y saltos de línea. */
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const bold = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
  return (
    <div className="space-y-1.5 text-[15px] leading-relaxed text-fg/90">
      {lines.map((l, i) =>
        /^\s*[-•]\s+/.test(l) ? (
          <div key={i} className="flex gap-2.5 pl-0.5">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-lime" />
            <span>{bold(l.replace(/^\s*[-•]\s+/, ""))}</span>
          </div>
        ) : l.trim() ? (
          <p key={i}>{bold(l)}</p>
        ) : (
          <div key={i} className="h-1" />
        ),
      )}
    </div>
  );
}

function MealCard({ c }: { c: CoachCard }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium leading-snug">{c.title}</p>
        <p className="num shrink-0 text-lg font-semibold leading-none">
          {n0(c.kcal)}
          <span className="ml-0.5 text-[11px] font-normal text-faint">kcal</span>
        </p>
      </div>
      {c.note && <p className="mt-1.5 text-[12px] text-muted">{c.note}</p>}
      <div className="num mt-3 flex gap-3 text-[12px]">
        <Chip color="var(--color-lime)" v={c.protein} l="P" />
        <Chip color="var(--color-carbs)" v={c.carbs} l="C" />
        <Chip color="var(--color-fat)" v={c.fat} l="G" />
      </div>
    </div>
  );
}

function Chip({ color, v, l }: { color: string; v: number; l: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-muted")}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="text-fg">{n0(v)} g</span> {l}
    </span>
  );
}
