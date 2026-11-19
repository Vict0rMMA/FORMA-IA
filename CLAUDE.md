# FORMA AI — contexto para Claude

Víctor (usuario, habla español) pidió una app web personal de nutrición, calorías y progreso físico, con aspecto de producto premium de startup fitness. Este archivo resume la sesión que la construyó (19-nov-2026).

## Estado actual (19-nov-2026)
- **En producción:** https://forma-ai-pearl.vercel.app (proyecto Vercel `forma-ai`).
- **Datos en Firebase** (proyecto `forma-ai-victor`): login con correo y contraseña, y Firestore. Supabase se quitó por completo porque el plan gratis ya tenía 2 proyectos activos.
- **IA:** Gemini (la misma clave de INGLES VICTOR). Probado en producción: escáner por texto, coach y foto subida desde un celular simulado (una bandeja paisa: 9 alimentos en ~4 s).
- Perfil por defecto de Víctor: 21 años, 184 cm, 87 kg. Se usa al crear la cuenta.
- **Repo:** https://github.com/Vict0rMMA/FORMA-IA (rama `main`), conectado a Vercel: cada push a `main` publica en producción. Hacer commit y push solo cuando Víctor lo pida.

## Stack
Next.js 15.5 (App Router) · TypeScript · Tailwind 4 · Framer Motion · Recharts · Lucide · sonner · zod · firebase (Auth + Firestore) · @anthropic-ai/sdk · idb-keyval.

## Dirección visual (respetarla)
- Fondo #0A0A0B, superficies #141416 / #1C1C1F, un solo acento lima #C6F36B. Macros: proteína lima, carbohidratos blanco (#E9E9EC), grasa verde salvia (#8FB39A). Agua: #A9E4D3. Nada de azules "de IA" ni degradados genéricos.
- Fuente Geist. Números grandes con la utilidad `num` (tabulares, tracking negativo). Etiquetas con `label-xs` (11px, mayúsculas, tracking amplio).
- Pocas tarjetas, bordes sutiles y sin sombras. Los tokens están en `src/app/globals.css` (`@theme`).

## Estructura
- `src/app/(app)/`: páginas con shell. `page.tsx` (overview), `diario`, `escaner`, `progreso`, `entrenamiento`, `coach`, `perfil`. `template.tsx` hace la transición entre páginas.
- `src/app/api/`: `analyze` (foto o texto → alimentos), `coach` (chat) y `status` (proveedor de IA activo). También están `login/` y `auth/callback/`.
- `src/components/`:
  - `ui/`: Button, Ring, Bar, AnimatedNumber, Sheet, Segmented, Stepper, MacroDonut.
  - `shell/`: Sidebar, BottomNav, DemoBanner.
  - `dashboard/`, `food/`, `scanner/`, `progress/`, `workout/`.
- `src/lib/`:
  - `store.tsx`: estado global optimista; los cambios se replican al backend.
  - `data/`: backends `local-backend` (IndexedDB) y `firebase-backend` (Firestore), ambos con la interfaz `Backend` (`kind: "local" | "cloud"`).
  - `firebase/`: `config.ts`, `client.ts` (app, auth, Firestore con caché offline y `authHeaders()` para llamar a /api) y `server.ts` (`requireUser(req)` valida el token con Identity Toolkit, sin cuenta de servicio).
  - `nutrition.ts`: metabolismo basal (Mifflin-St Jeor), gasto diario y objetivos de macros.
  - `food-db.ts`: ~50 alimentos con valores por 100 g.
  - `demo-data.ts`: datos de demostración.
  - `workouts.ts`: plantillas y biblioteca de ejercicios.
  - `ai/`: `anthropic.ts`, `gemini.ts`, `demo.ts`, `prompts.ts`, `schemas.ts`, `provider.ts`.
- `firestore.rules`: cada usuario solo lee y escribe `users/{uid}` y sus subcolecciones (foods, weights, workouts, daily, photos). `firebase.json` despliega las reglas y activa el proveedor email/password: `firebase deploy --only firestore,auth`.

## Cómo funciona
- **Sin Firebase** (variables vacías): modo local en IndexedDB, sin login. Arranca con datos de demo marcados con un aviso; Perfil → "Empezar con mis datos" los borra.
- **Con Firebase** (`NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`): el store espera la sesión y, si no hay, redirige a `/login` (en el cliente, no hay middleware). Las rutas /api exigen `Authorization: Bearer <idToken>`. Las pesadas se guardan por fecha (`weights/{date}`).
- **Proveedor de IA:** usa `ANTHROPIC_API_KEY` (modelo `claude-opus-5-5`, salida JSON estructurada, `fallbacks: "default"`) o, si no hay, `GEMINI_API_KEY` (cadena `gemini-3.5-flash-lite` → `gemini-flash-lite-latest` → `gemini-3.5-flash`; salta de modelo con 404/429/503; recibe el mismo JSON Schema que Claude vía `responseJsonSchema`, sin `additionalProperties`). Sin ninguna clave entra en modo demo:
  - Fotos: devuelve un plato de ejemplo marcado como demo.
  - Texto: analiza con la base local de alimentos.
  - Coach: responde preguntas concretas con los datos del usuario.
- Los ítems de comida guardan los valores nutricionales por 100 g (`per100`) más los gramos, así que al editar la porción todo se reescala.
- Las fotos se comprimen en el cliente (`lib/image.ts`) y se guardan como data URL. Es una limitación conocida; se podría migrar a Firebase Storage.

## Próximos pasos probables
1. Que Víctor cree su cuenta en producción y revisar el diseño en el celular.
2. Probar el escáner con fotos reales.
3. Las fotos se guardan como data URL dentro de Firestore (límite de 1 MB por documento). Si da problemas, pasarlas a Firebase Storage.
4. Para publicar: `git push` (Vercel despliega solo). Las variables ya están en Vercel (producción).

## Comandos
`npm run dev` (puerto 3000) · `npm run build` · `npx tsc --noEmit` · `npx next lint`
