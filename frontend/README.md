# Ripipsa · Cálculo de Costo Logístico

App Vite + React que reemplaza el flujo de la hoja `GUIALOG` del Excel
`Calculo_Costo_Logistico_REV232025_V1.xlsx`.

## Cómo correrla

```bash
npm install
cp .env
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
5. **Sucursal y Destino son campos independientes** (corregido tras
   revisión): en una versión anterior se habían fusionado por error,
   asumiendo que ambos representaban lo mismo. Revisando las fórmulas
   exactas del Excel se confirmó que **no** es así: `Destino` únicamente
   filtra qué Aduanas se pueden elegir (`INDIRECT($J$35)`), mientras que
   `Sucursal` es la que realmente recibe la mercancía y se usa para calcular
   la ruta de Flete de Importación (`Aduana -> Sucursal`, fórmula `S85`).
   Ambos campos ya están separados en la UI y en el motor de cálculo.

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

El login llama a `src/services/epicorAuth.js`, que hace un `GET` al
`TokenResource.svc` de la instancia Epicor SaaS (`VITE_EPICOR_TOKEN_URL`),
autenticado con:

- Encabezado `Authorization: Basic <base64(usuario:contraseña)>`
- Encabezado `X-API-Key: VITE_EPICOR_API_KEY`

y espera un token en la propiedad `Token` de la respuesta (con fallback a
`AccessToken`/`token` por si la versión de Epicor lo nombra distinto — si tu
ambiente usa otro nombre, ese es el único punto a ajustar en el archivo).

## Pendientes / a validar con el negocio

- Cargar tarifas de flete para Qimarox, OnRobot, Robotiq, Dellner e
  Italvibras cuando estén disponibles (`src/data/proveedores.js` y
  `src/data/fletesProveedor.js`).
- Confirmar el endpoint real y el shape de la respuesta de autenticación de
  Epicor.
- Validar con el equipo de comercio exterior que las fórmulas de Honorarios
  A.A. e Impuestos (Sección V) sigan vigentes tal como están en el Excel.
