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

// =====================================================================
// Catálogos editables agregados en la v2 del panel de administración.
//
// NOTA DE DISEÑO IMPORTANTE: el motor de cálculo (frontend) busca claves
// EXACTAS y hardcodeadas en estas tablas:
//   - tipo_transporte: "FTL 53'", "RABON 20'", "3.5 T", "CONSOLIDADO"
//   - franja (consolidado): minCharge, 100-299, 300-499, 500-999,
//     1000-2000, 2000+, flat
// Si se guardara una clave distinta, el cálculo devolvería "PD" en
// silencio. Por eso estos endpoints VALIDAN las claves recibidas y
// rechazan cualquiera que no esté en la lista blanca: es preferible un
// error explícito al guardar que un costo mal calculado en producción.
// =====================================================================

/**
 * Registra en la bitácora SOLO las filas que cambiaron, comparando dos
 * mapas planos { "clave|compuesta": valor }.
 *
 * La alternativa (volcar la tabla completa en cada guardado) hacía la
 * bitácora ilegible: un solo cambio de tarifa generaba un renglón con
 * miles de caracteres de JSON, y respondía muy mal a la pregunta para la
 * que existe la bitácora: "¿quién cambió ESTA tarifa y cuándo?".
 */
function registrarDiff({ usuario, tabla, campo, antes, despues }) {
  const claves = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  for (const clave of claves) {
    const a = antes[clave];
    const d = despues[clave];
    if (a === d) continue;
    registrarCambio({
      usuario,
      tabla,
      clave,
      campo,
      valorAnterior: a === undefined ? '(no existía)' : a,
      valorNuevo: d === undefined ? '(eliminado)' : d,
    });
  }
}

const TIPOS_TRANSPORTE_DEDICADO = ["FTL 53'", "RABON 20'", '3.5 T'];
const TIPOS_TRANSPORTE_IMPO = ["FTL 53'", "RABON 20'", '3.5 T', 'CONSOLIDADO'];
const FRANJAS_CONSOLIDADO = ['minCharge', '100-299', '300-499', '500-999', '1000-2000', '2000+'];

// --- Proveedor-Mercancía: qué productos ofrece cada proveedor ---
app.put('/api/reglas-negocio/proveedores-productos', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const nuevo = req.body; // { [proveedor]: [producto, ...] }
  if (!nuevo || typeof nuevo !== 'object' || Array.isArray(nuevo)) {
    return res.status(400).json({ error: 'Se esperaba un objeto { [proveedor]: [productos] }.' });
  }

  // El producto debe existir en tasas_igi: si no coincide EXACTAMENTE con
  // una descripción de ese catálogo, la app no podría sugerir la tasa IGI
  // y el operador tendría que capturarla a mano sin saber por qué.
  const productosValidos = new Set(db.prepare('SELECT descripcion FROM tasas_igi').all().map((f) => f.descripcion));
  const desconocidos = [];
  for (const [proveedor, productos] of Object.entries(nuevo)) {
    if (!Array.isArray(productos)) {
      return res.status(400).json({ error: `Los productos de "${proveedor}" deben ser una lista.` });
    }
    for (const p of productos) if (!productosValidos.has(p)) desconocidos.push(`${proveedor} → "${p}"`);
  }
  if (desconocidos.length) {
    return res.status(400).json({
      error:
        'Estos productos no existen en el catálogo de Tasas IGI y romperían la sugerencia automática de tasa. ' +
        'Agrégalos primero en la pestaña "Tasas IGI" (con el texto idéntico): ' +
        desconocidos.join('; '),
    });
  }

  const antes = {};
  for (const f of db.prepare('SELECT * FROM productos_por_proveedor').all()) {
    (antes[f.proveedor] ??= []).push(f.producto);
  }
  const antesPlano = Object.fromEntries(
    Object.entries(antes).map(([prov, prods]) => [prov, prods.slice().sort().join(', ')])
  );
  const despuesPlano = Object.fromEntries(
    Object.entries(nuevo).map(([prov, prods]) => [prov, prods.slice().sort().join(', ') || '(sin productos)'])
  );

  const insertProveedor = db.prepare('INSERT OR IGNORE INTO proveedores (nombre) VALUES (?)');
  const insertProducto = db.prepare('INSERT INTO productos_por_proveedor (proveedor, producto) VALUES (?, ?)');

  const guardar = db.transaction(() => {
    db.exec('DELETE FROM productos_por_proveedor');
    for (const [proveedor, productos] of Object.entries(nuevo)) {
      insertProveedor.run(proveedor);
      for (const producto of productos) insertProducto.run(proveedor, producto);
    }
    registrarDiff({
      usuario: req.usuario,
      tabla: 'productos_por_proveedor',
      campo: 'lista_productos',
      antes: antesPlano,
      despues: despuesPlano,
    });
  });
  guardar();
  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Flete Proveedor: dedicado + consolidado + tarifa UR por equipos ---
app.put('/api/reglas-negocio/flete-proveedor', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const { dedicado, consolidado, urPorEquipos } = req.body || {};
  if (!dedicado || !consolidado || !Array.isArray(urPorEquipos)) {
    return res
      .status(400)
      .json({ error: 'Se esperaba { dedicado, consolidado, urPorEquipos }.' });
  }

  // Validación de claves (ver nota de diseño arriba).
  for (const [proveedor, porAduana] of Object.entries(dedicado)) {
    for (const [aduana, tarifas] of Object.entries(porAduana)) {
      for (const tipo of Object.keys(tarifas)) {
        if (!TIPOS_TRANSPORTE_DEDICADO.includes(tipo)) {
          return res.status(400).json({
            error: `Tipo de transporte no reconocido en ${proveedor}/${aduana}: "${tipo}". Permitidos: ${TIPOS_TRANSPORTE_DEDICADO.join(', ')}.`,
          });
        }
      }
    }
  }
  for (const [proveedor, porAduana] of Object.entries(consolidado)) {
    for (const [aduana, franjas] of Object.entries(porAduana)) {
      for (const franja of Object.keys(franjas)) {
        // 'flat' solo aplica a la aduana comodín '*' (caso MiR/UR).
        const permitido = aduana === '*' ? ['flat'] : FRANJAS_CONSOLIDADO;
        if (!permitido.includes(franja)) {
          return res.status(400).json({
            error: `Franja no reconocida en ${proveedor}/${aduana}: "${franja}". Permitidas: ${permitido.join(', ')}.`,
          });
        }
      }
    }
  }

  // Se aplanan a mapas "clave|compuesta" -> valor para poder comparar fila
  // por fila y registrar solo lo que realmente cambió.
  const antesDedicado = Object.fromEntries(
    db
      .prepare('SELECT * FROM rutas_dedicado_proveedor')
      .all()
      .map((f) => [`${f.proveedor} · ${f.aduana} · ${f.tipo_transporte}`, String(f.tarifa)])
  );
  const antesConsolidado = Object.fromEntries(
    db
      .prepare('SELECT * FROM rutas_consolidado_proveedor')
      .all()
      .map((f) => [`${f.proveedor} · ${f.aduana} · ${f.franja}`, String(f.valor)])
  );
  const antesUr = Object.fromEntries(
    db
      .prepare('SELECT * FROM ur_tarifa_por_equipos')
      .all()
      .map((f) => [`${f.equipos} equipos`, `FTL ${f.ftl} / RABON ${f.rabon}`])
  );

  const despuesDedicado = {};
  for (const [prov, porAduana] of Object.entries(dedicado))
    for (const [aduana, tarifas] of Object.entries(porAduana))
      for (const [tipo, tarifa] of Object.entries(tarifas))
        despuesDedicado[`${prov} · ${aduana} · ${tipo}`] = String(Number(tarifa));

  const despuesConsolidado = {};
  for (const [prov, porAduana] of Object.entries(consolidado))
    for (const [aduana, franjas] of Object.entries(porAduana))
      for (const [franja, valor] of Object.entries(franjas))
        despuesConsolidado[`${prov} · ${aduana} · ${franja}`] = String(Number(valor));

  const despuesUr = Object.fromEntries(
    urPorEquipos.map((f) => [`${Number(f.equipos)} equipos`, `FTL ${Number(f.FTL)} / RABON ${Number(f.RABON)}`])
  );

  const insDed = db.prepare(
    'INSERT INTO rutas_dedicado_proveedor (proveedor, aduana, tipo_transporte, tarifa) VALUES (?, ?, ?, ?)'
  );
  const insCons = db.prepare(
    'INSERT INTO rutas_consolidado_proveedor (proveedor, aduana, franja, valor) VALUES (?, ?, ?, ?)'
  );
  const insUr = db.prepare('INSERT INTO ur_tarifa_por_equipos (equipos, ftl, rabon) VALUES (?, ?, ?)');

  const guardar = db.transaction(() => {
    db.exec('DELETE FROM rutas_dedicado_proveedor');
    for (const [proveedor, porAduana] of Object.entries(dedicado)) {
      for (const [aduana, tarifas] of Object.entries(porAduana)) {
        for (const [tipo, tarifa] of Object.entries(tarifas)) insDed.run(proveedor, aduana, tipo, Number(tarifa));
      }
    }

    db.exec('DELETE FROM rutas_consolidado_proveedor');
    for (const [proveedor, porAduana] of Object.entries(consolidado)) {
      for (const [aduana, franjas] of Object.entries(porAduana)) {
        for (const [franja, valor] of Object.entries(franjas)) insCons.run(proveedor, aduana, franja, Number(valor));
      }
    }

    db.exec('DELETE FROM ur_tarifa_por_equipos');
    for (const fila of urPorEquipos) insUr.run(Number(fila.equipos), Number(fila.FTL), Number(fila.RABON));

    registrarDiff({
      usuario: req.usuario,
      tabla: 'rutas_dedicado_proveedor',
      campo: 'tarifa',
      antes: antesDedicado,
      despues: despuesDedicado,
    });
    registrarDiff({
      usuario: req.usuario,
      tabla: 'rutas_consolidado_proveedor',
      campo: 'valor',
      antes: antesConsolidado,
      despues: despuesConsolidado,
    });
    registrarDiff({
      usuario: req.usuario,
      tabla: 'ur_tarifa_por_equipos',
      campo: 'tarifa',
      antes: antesUr,
      despues: despuesUr,
    });
  });
  guardar();
  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Flete Impo: Aduana -> Sucursal ---
app.put('/api/reglas-negocio/flete-impo', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const nuevo = req.body; // { [aduana]: { [destino]: { [tipo]: tarifa } } }
  if (!nuevo || typeof nuevo !== 'object' || Array.isArray(nuevo)) {
    return res.status(400).json({ error: 'Se esperaba un objeto { [aduana]: { [destino]: { [tipo]: tarifa } } }.' });
  }

  for (const [aduana, porDestino] of Object.entries(nuevo)) {
    for (const [destino, tarifas] of Object.entries(porDestino)) {
      for (const tipo of Object.keys(tarifas)) {
        if (!TIPOS_TRANSPORTE_IMPO.includes(tipo)) {
          return res.status(400).json({
            error: `Tipo de transporte no reconocido en ${aduana}/${destino}: "${tipo}". Permitidos: ${TIPOS_TRANSPORTE_IMPO.join(', ')}.`,
          });
        }
      }
    }
  }

  const antes = Object.fromEntries(
    db
      .prepare('SELECT * FROM rutas_impo')
      .all()
      .map((f) => [`${f.aduana} → ${f.destino} · ${f.tipo_transporte}`, String(f.tarifa)])
  );
  const despues = {};
  for (const [aduana, porDestino] of Object.entries(nuevo))
    for (const [destino, tarifas] of Object.entries(porDestino))
      for (const [tipo, tarifa] of Object.entries(tarifas))
        despues[`${aduana} → ${destino} · ${tipo}`] = String(Number(tarifa));

  const insertar = db.prepare('INSERT INTO rutas_impo (aduana, destino, tipo_transporte, tarifa) VALUES (?, ?, ?, ?)');

  const guardar = db.transaction(() => {
    db.exec('DELETE FROM rutas_impo');
    for (const [aduana, porDestino] of Object.entries(nuevo)) {
      for (const [destino, tarifas] of Object.entries(porDestino)) {
        for (const [tipo, tarifa] of Object.entries(tarifas)) insertar.run(aduana, destino, tipo, Number(tarifa));
      }
    }
    registrarDiff({ usuario: req.usuario, tabla: 'rutas_impo', campo: 'tarifa', antes, despues });
  });
  guardar();
  await respaldarAntesDeEscribir();
  res.json({ ok: true });
});

// --- Bodega y Recinto: tarifa por aduana según franja de peso ---
app.put('/api/reglas-negocio/bodega', requireSesionEpicor, requireSuperusuario, async (req, res) => {
  const nuevo = req.body; // { [aduana]: { min, medio, alto } }
  if (!nuevo || typeof nuevo !== 'object' || Array.isArray(nuevo)) {
    return res.status(400).json({ error: 'Se esperaba un objeto { [aduana]: { min, medio, alto } }.' });
  }
  for (const [aduana, t] of Object.entries(nuevo)) {
    if ([t?.min, t?.medio, t?.alto].some((v) => typeof Number(v) !== 'number' || Number.isNaN(Number(v)))) {
      return res.status(400).json({ error: `Los 3 valores de "${aduana}" (min, medio, alto) deben ser numéricos.` });
    }
  }

  const antes = new Map(db.prepare('SELECT * FROM tarifa_bodega_por_aduana').all().map((f) => [f.aduana, f]));
  const upsert = db.prepare(`
    INSERT INTO tarifa_bodega_por_aduana (aduana, min, medio, alto)
    VALUES (@aduana, @min, @medio, @alto)
    ON CONFLICT(aduana) DO UPDATE SET min = excluded.min, medio = excluded.medio, alto = excluded.alto
  `);

  const guardar = db.transaction(() => {
    for (const [aduana, t] of Object.entries(nuevo)) {
      const fila = { aduana, min: Number(t.min), medio: Number(t.medio), alto: Number(t.alto) };
      upsert.run(fila);
      const previa = antes.get(aduana);
      registrarCambio({
        usuario: req.usuario,
        tabla: 'tarifa_bodega_por_aduana',
        clave: aduana,
        campo: 'min/medio/alto',
        valorAnterior: previa ? `${previa.min}/${previa.medio}/${previa.alto}` : null,
        valorNuevo: `${fila.min}/${fila.medio}/${fila.alto}`,
      });
    }
  });
  guardar();
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
