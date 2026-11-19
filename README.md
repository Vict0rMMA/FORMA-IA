# FORMA AI

App personal de nutrición, calorías y progreso físico con IA.
Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Recharts · Lucide · Firebase.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin configurar nada, la app funciona en **modo local**. Los datos se guardan en el navegador (IndexedDB) y empieza con **datos de demostración**, marcados con un aviso arriba. Desde *Perfil → Configuración → Empezar con mis datos* los borras y empiezas de cero.

## Modos

| Qué | Sin configurar | Configurado |
|---|---|---|
| Datos | IndexedDB local, sin login | Firestore, con login por correo y reglas por usuario |
| Escáner de fotos | Plato de ejemplo (marcado "demostración") | Claude o Gemini analizan la foto real |
| Escáner por texto | Base local de ~50 alimentos | IA |
| AI Coach | Respuestas locales calculadas con tus datos | Conversación libre con IA |

## Activar la IA

1. Copia `.env.example` → `.env.local`.
2. Añade **una** de estas claves:
   - `ANTHROPIC_API_KEY`: consíguela en https://console.anthropic.com → API Keys. Usa `claude-opus-5-5` con salida JSON estructurada.
   - `GEMINI_API_KEY`: consíguela en https://aistudio.google.com/apikey. Prueba en cadena los modelos de `GEMINI_MODEL` y salta al siguiente si alguno da 404/503.
3. Reinicia `npm run dev`. En *Perfil → Configuración* verás qué proveedor está activo.

Las claves solo se usan en las rutas de servidor `/api/analyze` y `/api/coach`. Esas rutas validan la entrada con zod, limitan peticiones por usuario o IP y, si Firebase está activo, exigen el token de sesión.

## Activar Firebase (base de datos + autenticación)

1. Crea un proyecto en https://console.firebase.google.com y añade una app web.
2. Pon `.firebaserc` con tu proyecto y ejecuta `firebase deploy --only firestore,auth`. Así se crea Firestore, se suben las reglas de `firestore.rules` y se activa el login con correo y contraseña.
3. Copia la configuración del SDK web en `NEXT_PUBLIC_FIREBASE_*` dentro de `.env.local`.
4. Reinicia. A partir de ahí la app pide login (`/login`) y guarda todo en Firestore, con caché offline.

## Desplegar en Vercel

Importa el repositorio, añade las mismas variables de entorno en *Settings → Environment Variables* y despliega. Las rutas de IA tienen `maxDuration = 60`.

## Estructura

```
src/
  app/
    (app)/            páginas con sidebar/nav: overview, diario, escaner, progreso, entrenamiento, coach, perfil
    api/              analyze · coach · status (servidor, claves seguras)
    login/            autenticación Firebase
  components/
    ui/               botón, anillo, barras, hoja modal, controles
    shell/            sidebar, navegación inferior móvil, aviso demo
    dashboard/ food/ scanner/ progress/ workout/
  lib/
    nutrition.ts      Mifflin-St Jeor, TDEE, objetivos de macros
    food-db.ts        base local de alimentos (valores por 100 g)
    store.tsx         estado global optimista + sincronización
    data/             backends: local (IndexedDB) y Firebase (Firestore)
    firebase/         cliente, configuración y verificación de token
    ai/               Claude, Gemini, modo demo, prompts y esquemas
firestore.rules       reglas de seguridad de Firestore
```

## Cálculo de objetivos

- **TMB**: Mifflin-St Jeor. **Gasto diario** = TMB × factor de actividad (1,2–1,9).
- **Calorías**: −20 % para perder grasa, +10 % para ganar músculo. Nunca por debajo de TMB × 1,05. Se puede fijar un valor manual.
- **Proteína**: 2,0 g/kg en definición y 1,8 g/kg en el resto. **Grasa**: 25–27 % de las kcal. **Carbohidratos**: el resto.
