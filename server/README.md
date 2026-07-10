# Ripipsa - Servicio de Reglas de Negocio

Servicio Express + SQLite (better-sqlite3) que guarda las Tasas IGI,
Honorarios de Agencia Aduanal e Impuestos/DTA que los superusuarios pueden
editar desde la app. Reemplaza al almacenamiento hardcodeado en el
frontend para que todos los usuarios vean el mismo valor actualizado.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # ajusta CORS_ORIGIN al dominio real de la app
npm start               # o "npm run dev" para reinicio automático en cambios
```

La primera vez que corre, crea `data/reglasNegocio.db` y lo siembra con
los mismos valores que hoy están hardcodeados en el frontend (para que
migrar no cambie ningún número el día 1).

**Para producción, no lo corras con solo `npm start` en una terminal que
se pueda cerrar** — usa un supervisor de procesos (pm2, systemd, Docker)
para que se reinicie solo si el servidor se reinicia o el proceso se cae.
Esto es especialmente importante porque el endpoint de restaurar apaga el
proceso a propósito para recargar el archivo nuevo (`process.exit(0)`) —
sin un supervisor, el servicio se quedaría caído hasta que alguien lo
arranque a mano.

## Autenticación

- **Lectura** (`GET /api/reglas-negocio`): pública, la necesita cualquier
  usuario logueado en la app para poder calcular.
- **Escritura**: requiere header `Authorization: Bearer <token de Epicor>`
  + header `x-ripipsa-user: <username>`, y que ese username esté en
  `data/superusuarios.json`.

⚠️ **Limitación honesta** (ver comentarios en `auth.js`): hoy no se
revalida criptográficamente el token contra Epicor en cada escritura,
porque no tenemos confirmado un endpoint de Epicor para "validar un token
ya emitido" (`TokenResource.svc` emite tokens nuevos, no valida
existentes). Si tu equipo de Epicor confirma un endpoint liviano para
esto, defínelo en `EPICOR_VERIFY_URL` y `auth.js` ya lo usa automáticamente.

## Respaldo y restauración

- `GET /api/reglas-negocio/respaldo` — descarga el `.db` completo (superusuarios).
- `POST /api/reglas-negocio/restaurar` (campo `archivo`) — sube un `.db` y
  reemplaza el actual. Antes de sobreescribir, guarda un respaldo
  automático del estado previo en `data/backups/`, así que un restore
  incorrecto siempre se puede revertir a mano.
- Además, cada escritura (`PUT`) genera automáticamente un respaldo en
  `data/backups/` antes de aplicar el cambio.

## Bitácora de cambios

`GET /api/reglas-negocio/bitacora` (superusuarios) regresa quién cambió
qué, cuándo, y el valor anterior/nuevo — tabla `bitacora_cambios` en la
misma base de datos.

## Pendiente / a decidir con el negocio

- Reemplazar los 3 usernames placeholder en `data/superusuarios.json` por
  los reales.
- Confirmar con IT/Epicor si existe un endpoint liviano para revalidar el
  token (`EPICOR_VERIFY_URL`).
- Definir quién corre este servicio y con qué supervisor de procesos en
  producción.
