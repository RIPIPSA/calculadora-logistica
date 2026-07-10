import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { db, DB_PATH, BACKUPS_DIR } from './db.js';
import { requireSesionEpicor, requireSuperusuario, esSuperusuario } from './auth.js';
import { registrarCambio, obtenerBitacora } from './bitacora.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function timestampArchivo() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function respaldarAntesDeEscribir() {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const destino = path.join(BACKUPS_DIR, `reglasNegocio.${timestampArchivo()}.db`);
  await db.backup(destino);
}

// --- Todos los catálogos de referencia en un solo request (misma forma
// que hoy exportan src/data/*.js, para minimizar el refactor del frontend) ---
app.get('/api/catalogos', (req, res) => {
  const sucursales = db.prepare('SELECT nombre FROM sucursales ORDER BY nombre').all().map((f) => f.nombre);

  const zonaPorSucursal = {};
  for (const f of db.prepare('SELECT * FROM sucursales').all()) zonaPorSucursal[f.nombre] = f.zona;

  const aduanasPorDestino = {};
  for (const f of db.prepare('SELECT * FROM aduanas_por_destino').all()) {
    (aduanasPorDestino[f.destino] ??= []).push(f.aduana);
  }

  const agenciaPorAduana = {};
  for (const f of db.prepare('SELECT * FROM agencia_por_aduana').all()) {
    agenciaPorAduana[f.aduana] = { zona: f.zona, clave: f.clave, agencia: f.agencia };
  }

  const proveedores = db.prepare('SELECT nombre FROM proveedores ORDER BY nombre').all().map((f) => f.nombre);

  const productosPorProveedor = {};
  for (const p of proveedores) productosPorProveedor[p] = [];
  for (const f of db.prepare('SELECT * FROM productos_por_proveedor').all()) {
    (productosPorProveedor[f.proveedor] ??= []).push(f.producto);
  }

  const opcionesEspecialesPeso = db.prepare('SELECT opcion FROM opciones_especiales_peso').all().map((f) => f.opcion);
  const quiebresPeso = db.prepare('SELECT valor FROM quiebres_peso ORDER BY valor').all().map((f) => f.valor);

  const rutasDedicadoProveedor = {};
  for (const f of db.prepare('SELECT * FROM rutas_dedicado_proveedor').all()) {
    ((rutasDedicadoProveedor[f.proveedor] ??= {})[f.aduana] ??= {})[f.tipo_transporte] = f.tarifa;
  }

  const rutasConsolidadoProveedor = {};
  for (const f of db.prepare('SELECT * FROM rutas_consolidado_proveedor').all()) {
    ((rutasConsolidadoProveedor[f.proveedor] ??= {})[f.aduana] ??= {})[f.franja] = f.valor;
  }

  const urTarifaPorEquipos = db
    .prepare('SELECT * FROM ur_tarifa_por_equipos ORDER BY equipos')
    .all()
    .map((f) => ({ equipos: f.equipos, FTL: f.ftl, RABON: f.rabon }));

  const rutasImpoAduanaSucursal = {};
  for (const f of db.prepare('SELECT * FROM rutas_impo').all()) {
    ((rutasImpoAduanaSucursal[f.aduana] ??= {})[f.destino] ??= {})[f.tipo_transporte] = f.tarifa;
  }

  const tarifaBodegaPorAduana = {};
  for (const f of db.prepare('SELECT * FROM tarifa_bodega_por_aduana').all()) {
    tarifaBodegaPorAduana[f.aduana] = { min: f.min, medio: f.medio, alto: f.alto };
  }

  const tasasIgi = db.prepare('SELECT descripcion, fraccion, tasa_igi as tasaIgi FROM tasas_igi ORDER BY descripcion').all();

  const honorariosAA = {};
  for (const fila of db.prepare('SELECT * FROM honorarios_aa').all()) {
    honorariosAA[fila.aduana] =
      fila.tipo === 'tramos'
        ? { tipo: 'tramos', tramos: JSON.parse(fila.tramos_json), pctExcedente: fila.pct_excedente }
        : { tipo: 'lineal', pct: fila.pct, fijo: fila.fijo };
  }

  const impuestosRow = db.prepare('SELECT * FROM impuestos WHERE id = 1').get();
  const impuestos = {
    tasaDtaVariable: impuestosRow.tasa_dta_variable,
    feeFijoDta: impuestosRow.fee_fijo_dta,
    flatConCertificado: impuestosRow.flat_con_certificado,
  };

  res.json({
    sucursales,
    zonaPorSucursal,
    aduanasPorDestino,
    agenciaPorAduana,
    proveedores,
    productosPorProveedor,
    opcionesEspecialesPeso,
    quiebresPeso,
    rutasDedicadoProveedor,
    rutasConsolidadoProveedor,
    urTarifaPorEquipos,
    rutasImpoAduanaSucursal,
    tarifaBodegaPorAduana,
    tasasIgi,
    honorariosAA,
    impuestos,
  });
});

// --- ¿el usuario actual es superusuario? (para que el frontend decida si
// muestra el botón de "Reglas de negocio") ---
app.get('/api/es-superusuario', (req, res) => {
  res.json({ esSuperusuario: esSuperusuario(req.query.usuario) });
});

// --- Lectura: cualquier persona logueada en la app la necesita para calcular ---
app.get('/api/reglas-negocio', (req, res) => {
  const tasasIgi = db.prepare('SELECT descripcion, tasa_igi as tasaIgi FROM tasas_igi ORDER BY descripcion').all();

  const honorariosAA = {};
  for (const fila of db.prepare('SELECT * FROM honorarios_aa').all()) {
    honorariosAA[fila.aduana] =
      fila.tipo === 'tramos'
        ? { tipo: 'tramos', tramos: JSON.parse(fila.tramos_json), pctExcedente: fila.pct_excedente }
        : { tipo: 'lineal', pct: fila.pct, fijo: fila.fijo };
  }

  const impuestosRow = db.prepare('SELECT * FROM impuestos WHERE id = 1').get();
  const impuestos = {
    tasaDtaVariable: impuestosRow.tasa_dta_variable,
    feeFijoDta: impuestosRow.fee_fijo_dta,
    flatConCertificado: impuestosRow.flat_con_certificado,
  };

  res.json({ tasasIgi, honorariosAA, impuestos });
});

// --- Bitácora de cambios (solo superusuarios) ---
app.get('/api/reglas-negocio/bitacora', requireSesionEpicor, requireSuperusuario, (req, res) => {
  res.json(obtenerBitacora(Number(req.query.limite) || 200));
});

// --- Escritura: Tasas IGI (reemplazo completo de la lista, con diff a la bitácora) ---
app.put('/api/reglas-negocio/tasas-igi', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const nuevas = req.body;
  if (!Array.isArray(nuevas)) {
    return res.status(400).json({ error: 'Se esperaba un arreglo de { descripcion, fraccion, tasaIgi }.' });
  }

  const actuales = new Map(db.prepare('SELECT descripcion, tasa_igi FROM tasas_igi').all().map((f) => [f.descripcion, f.tasa_igi]));

  const guardarTodo = db.transaction(() => {
    db.exec('DELETE FROM tasas_igi');
    const insertar = db.prepare('INSERT INTO tasas_igi (descripcion, fraccion, tasa_igi) VALUES (?, ?, ?)');
    for (const { descripcion, fraccion, tasaIgi } of nuevas) {
      insertar.run(descripcion, fraccion ?? null, tasaIgi);
      registrarCambio({
        usuario: req.usuario,
        tabla: 'tasas_igi',
        clave: descripcion,
        campo: 'tasa_igi',
        valorAnterior: actuales.get(descripcion),
        valorNuevo: tasaIgi,
      });
    }
  });
  guardarTodo();
  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Escritura: Honorarios A.A. (por aduana) ---
app.put('/api/reglas-negocio/honorarios-aa', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const nuevo = req.body; // { [aduana]: { tipo, pct?, fijo?, tramos?, pctExcedente? } }
  if (!nuevo || typeof nuevo !== 'object') {
    return res.status(400).json({ error: 'Se esperaba un objeto { [aduana]: {...} }.' });
  }

  const actuales = new Map(db.prepare('SELECT * FROM honorarios_aa').all().map((f) => [f.aduana, f]));

  const upsert = db.prepare(`
    INSERT INTO honorarios_aa (aduana, tipo, pct, fijo, tramos_json, pct_excedente)
    VALUES (@aduana, @tipo, @pct, @fijo, @tramos_json, @pct_excedente)
    ON CONFLICT(aduana) DO UPDATE SET
      tipo = excluded.tipo, pct = excluded.pct, fijo = excluded.fijo,
      tramos_json = excluded.tramos_json, pct_excedente = excluded.pct_excedente
  `);

  const guardarTodo = db.transaction(() => {
    for (const [aduana, params] of Object.entries(nuevo)) {
      const fila = {
        aduana,
        tipo: params.tipo,
        pct: params.pct ?? null,
        fijo: params.fijo ?? null,
        tramos_json: params.tramos ? JSON.stringify(params.tramos) : null,
        pct_excedente: params.pctExcedente ?? null,
      };
      upsert.run(fila);

      const previa = actuales.get(aduana);
      registrarCambio({
        usuario: req.usuario,
        tabla: 'honorarios_aa',
        clave: aduana,
        campo: 'params',
        valorAnterior: previa ? JSON.stringify(previa) : null,
        valorNuevo: JSON.stringify(fila),
      });
    }
  });
  guardarTodo();
  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Escritura: Impuestos / DTA (fila única de configuración global) ---
app.put('/api/reglas-negocio/impuestos', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const { tasaDtaVariable, feeFijoDta, flatConCertificado } = req.body || {};
  if ([tasaDtaVariable, feeFijoDta, flatConCertificado].some((v) => typeof v !== 'number')) {
    return res.status(400).json({ error: 'Se esperaban 3 números: tasaDtaVariable, feeFijoDta, flatConCertificado.' });
  }

  const previa = db.prepare('SELECT * FROM impuestos WHERE id = 1').get();

  db.prepare(
    `UPDATE impuestos SET tasa_dta_variable = ?, fee_fijo_dta = ?, flat_con_certificado = ? WHERE id = 1`
  ).run(tasaDtaVariable, feeFijoDta, flatConCertificado);

  registrarCambio({
    usuario: req.usuario,
    tabla: 'impuestos',
    clave: 'global',
    campo: 'tasa_dta_variable',
    valorAnterior: previa.tasa_dta_variable,
    valorNuevo: tasaDtaVariable,
  });
  registrarCambio({
    usuario: req.usuario,
    tabla: 'impuestos',
    clave: 'global',
    campo: 'fee_fijo_dta',
    valorAnterior: previa.fee_fijo_dta,
    valorNuevo: feeFijoDta,
  });
  registrarCambio({
    usuario: req.usuario,
    tabla: 'impuestos',
    clave: 'global',
    campo: 'flat_con_certificado',
    valorAnterior: previa.flat_con_certificado,
    valorNuevo: flatConCertificado,
  });

  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Respaldo: descargar el .db completo ---
app.get('/api/reglas-negocio/respaldo', requireSesionEpicor, requireSuperusuario, (req, res) => {
  res.download(DB_PATH, `reglasNegocio-${timestampArchivo()}.db`);
});

// --- Restauración: subir un .db y reemplazar el actual (con respaldo previo) ---
app.post(
  '/api/reglas-negocio/restaurar',
  requireSesionEpicor,
  requireSuperusuario,
  upload.single('archivo'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Falta el archivo (campo "archivo").' });
    }
    const cabecera = req.file.buffer.subarray(0, 16).toString('utf-8');
    if (!cabecera.startsWith('SQLite format 3')) {
      return res.status(400).json({ error: 'El archivo no parece ser una base de datos SQLite válida.' });
    }

    // Respaldo del estado actual antes de sobreescribir, por si hay que revertir.
    // Se espera a que termine ANTES de cerrar la conexión (si no, hay una
    // condición de carrera: el respaldo puede quedar a medias).
    await respaldarAntesDeEscribir();

    // El evento de restauración se registra en un archivo aparte, NO en la
    // tabla bitacora_cambios: estamos a punto de reemplazar el archivo de
    // base de datos completo, así que cualquier fila que insertáramos ahí
    // se perdería de todas formas en cuanto se sobreescriba el archivo.
    const lineaEvento = `${new Date().toISOString()}\t${req.usuario}\trestauracion_db\t${req.file.originalname}\n`;
    fs.appendFileSync(path.join(BACKUPS_DIR, '..', 'eventos-restauracion.log'), lineaEvento);

    // Cierra la conexión actual antes de tocar el archivo (evita corrupción
    // por escribir mientras better-sqlite3 lo sigue teniendo abierto).
    db.close();
    fs.writeFileSync(DB_PATH, req.file.buffer);

    res.json({
      ok: true,
      mensaje: 'Base restaurada. El servicio se reiniciará en un segundo para tomar el archivo nuevo.',
    });
    setTimeout(() => process.exit(0), 500); // requiere correr el server con un supervisor (pm2/systemd) que lo reinicie
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servicio de reglas de negocio escuchando en http://localhost:${PORT}`));
