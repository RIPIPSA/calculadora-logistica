# Ripipsa · Cálculo de Costo Logístico

App Vite + React que reemplaza el flujo de la hoja `GUIALOG` del Excel
`Calculo_Costo_Logistico_REV232025_V1.xlsx`.

## Cómo correrla

```bash
npm install
cp .env   # llena VITE_EPICOR_BASE_URL, etc. con el ambiente real
npm run dev
```

## Qué se corrigió respecto al Excel original (acordado con el cliente)

1. **Mayúsculas de "DEDICADO"/"CONSOLIDADO"**: el Excel comparaba en
   minúsculas en `P93`/`S96` y esa condición nunca se cumplía. El motor de
   cálculo (`src/engine/calculoLogistico.js`) ahora compara siempre en
   mayúsculas.
2. **Agencia Aduanal**: ya no es un combo — se deriva automáticamente de la
   Aduana elegida (`src/data/agenciaAduanal.js`), igual que hacía la fórmula
   `P39` del Excel.
3. **Catálogo de productos por proveedor**: Qimarox, OnRobot, Robotiq,
   Dellner e Italvibras se dejaron con lista de productos vacía a propósito.
   La UI deshabilita el combo y avisa que falta cargar el catálogo, en vez de
   dejarlo abierto a texto libre.
4. Se ignoraron los nombres definidos rotos (`#REF!`) del libro original.

## Estructura

```
src/
  data/        catálogos extraídos del Excel (sucursales, proveedores,
               fracciones arancelarias, tarifas de flete, bodega, etc.)
  engine/      motor de cálculo puro (sin UI), fácil de testear
  services/    conexión a la API de Epicor (login)
  context/     AuthContext (sesión)
  components/
    login/     pantalla de login
    wizard/    wizard de 4 pasos (General, Mercancía, Transporte, Resultado)
    ui/        botones, campos, tarjetas (design system con la paleta de marca)
```

## Login / Epicor

El login llama a `src/services/epicorAuth.js`, que hace un `POST` a
`VITE_EPICOR_BASE_URL + VITE_EPICOR_AUTH_PATH` con `{ userId, password, company }`
y espera un token en la respuesta.

## Pendientes / a validar con el negocio

- Cargar tarifas de flete para Qimarox, OnRobot, Robotiq, Dellner e
  Italvibras cuando estén disponibles (`src/data/proveedores.js` y
  `src/data/fletesProveedor.js`).
- Confirmar el endpoint real y el shape de la respuesta de autenticación de
  Epicor.
- Validar con el equipo de comercio exterior que las fórmulas de Honorarios
  A.A. e Impuestos (Sección V) sigan vigentes tal como están en el Excel.
- Definir formato de PDF a decargar una vez finalizada la cotización
