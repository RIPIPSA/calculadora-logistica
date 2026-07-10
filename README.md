# Ripipsa · Cálculo de Costo Logístico

Reemplaza el flujo de la hoja `GUIALOG` del Excel
`Calculo_Costo_Logistico_REV232025_V1.xlsx` por una aplicación web.

```
ripipsa-app/
├── frontend/   Vite + React — el wizard que usan los usuarios
├── server/     Express + SQLite — catálogos, tarifas, login-gate de superusuarios
└── package.json  scripts para levantar los dos juntos
```

## Arranque rápido

```bash
npm run install:all   # instala raíz + frontend/ + server/ (una sola vez)
npm run dev            # levanta server (puerto 4000) y frontend (puerto 5173) juntos
```

Antes del primer `npm run dev`, copia y llena las variables de entorno:

```bash
cp frontend/.env.example frontend/.env   # URL/API key de Epicor + URL del server
cp server/.env.example server/.env        # puerto, CORS, verificación opcional de Epicor
```

Scripts sueltos si necesitas levantar solo uno de los dos:

```bash
npm run server      # solo el backend
npm run frontend     # solo el frontend
```

## Arquitectura, en una frase

El **frontend** no guarda ningún catálogo ni tarifa: al abrir la app pide
todo una sola vez a `GET /api/catalogos` del **server**, y el motor de
cálculo (`frontend/src/engine/calculoLogistico.js`) es una función pura que
recibe esos catálogos como parámetro. El **server** es la única fuente de
verdad (SQLite), y es quien permite a los superusuarios editar Tasas IGI,
Honorarios de Agencia Aduanal e Impuestos desde la propia app, sin tocar
código ni redesplegar el frontend.

**Dependencia importante:** desde que se migraron todos los catálogos a la
base de datos, la app **no puede calcular nada si `server` no está
corriendo** — ya no es un extra opcional, es una dependencia dura igual de
crítica que el login de Epicor. Trátalo con esa seriedad en producción
(supervisor de procesos, respaldos periódicos, alguien vigilando que esté
vivo) — ver `server/README.md`.

## Login

El login es contra la API de Epicor (`TokenResource.svc` de tu instancia
SaaS) — ver `frontend/src/services/epicorAuth.js`. Mientras Epicor no esté
configurado en tu `.env`, en modo desarrollo (`npm run dev`, nunca en un
build de producción) aparece un botón de "modo de prueba" para poder seguir
trabajando en la UI sin bloquear todo por el login.

## Superusuarios y "Reglas de negocio"

Un usuario logueado que esté en `server/data/superusuarios.json` ve un
botón extra **"Reglas de negocio"** en el encabezado del wizard, con 5
pestañas: Tasas IGI, Honorarios A.A., Impuestos, Bitácora de cambios, y
Respaldo/Restauración de la base completa. Cualquier cambio que guarden
ahí lo ven de inmediato el resto de los usuarios (todos comparten el mismo
`server`).

**Pendiente:** reemplazar los 3 usernames placeholder en
`server/data/superusuarios.json` por los reales de Epicor.

## Documentación específica

- [`frontend/README.md`](./frontend/README.md) — estructura del wizard,
  correcciones de negocio aplicadas respecto al Excel original, folio de
  PDF (con su limitación conocida: hoy es por navegador, no compartido).
- [`server/README.md`](./server/README.md) — esquema de la base, cómo
  funciona la autenticación de escritura, respaldo/restauración, y la
  limitación honesta sobre validación de token de Epicor.

## Pendientes generales (repaso rápido)

- Nada pendiente
