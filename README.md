# Piso Modular 3D — Sitio + Concierge IA (Groq)

## Estructura

```
/index.html        → el sitio completo (single-file)
/api/chat.js        → Edge Function de Vercel, proxy seguro hacia Groq
/package.json
/.env.example
```

El chat del frontend (`index.html`) NUNCA llama directo a Groq. Llama a
`/api/chat` (tu propio backend en Vercel), y ese archivo es el único
que tiene la API key, vía variable de entorno.

## 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Sitio Piso Modular 3D + concierge IA"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## 2. Deploy en Vercel

1. Entrá a vercel.com → **Add New Project** → importá el repo de GitHub.
2. Framework Preset: dejalo en **Other** (es un sitio estático + 1 función, no necesita build).
3. Antes de hacer deploy (o después, en Settings → Environment Variables), agregá:

   - **Name:** `GROQ_API_KEY`
   - **Value:** tu API key de [console.groq.com](https://console.groq.com/keys)
   - Aplicala a Production, Preview y Development.

4. Deploy.

Una vez deployado, el botón del Asesor IA (🤖) ya va a hablar con Groq
a través de `/api/chat`.

## 3. Probar en local (opcional)

```bash
npm i -g vercel
vercel dev
```

Esto levanta el sitio + la función `/api/chat` en `localhost:3000`,
leyendo la key desde `.env.local` (copiá `.env.example` → `.env.local`
y poné tu key real ahí, ese archivo no se sube a git).

> ⚠️ Si abrís `index.html` directo con doble clic (`file://`), el chat
> NO va a funcionar — necesita el endpoint `/api/chat`, que solo existe
> corriendo con `vercel dev` o ya deployado en Vercel.

## Cómo funciona el lead capture

El modelo (Llama 3.3 70B vía Groq) recibe instrucciones de, una vez que
tiene tipo de proyecto + un dato de contacto, devolver al final de su
respuesta un bloque invisible:

```
<!--LEAD:{"nombre":"...","empresa":"...","telefono":"...","email":"...","tipo":"...","metros":"...","ciudad":"...","trafico":"..."}-->
```

El frontend (`extractLead()` en `index.html`) lo detecta, lo saca del
texto visible para el cliente, y arma el botón de WhatsApp con esos
datos pre-cargados. Si en 14 mensajes nunca se completa, igual aparece
el botón de WhatsApp como salida de emergencia.

## Cambiar el modelo de Groq

En `api/chat.js`, variable `MODEL`. Por defecto: `llama-3.3-70b-versatile`
(mejor calidad/razonamiento). Para más velocidad: `llama-3.1-8b-instant`.
