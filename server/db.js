import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, 'data');
export const DB_PATH = path.join(DATA_DIR, 'reglasNegocio.db');
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

const esNueva = !fs.existsSync(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // más resistente a caídas a medio-escribir

db.exec(`
  -- === Editables por superusuarios ===
  CREATE TABLE IF NOT EXISTS tasas_igi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL UNIQUE,
    fraccion TEXT,
    tasa_igi REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS honorarios_aa (
    aduana TEXT PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('lineal','tramos')),
    pct REAL,
    fijo REAL,
    tramos_json TEXT,
    pct_excedente REAL
  );

  CREATE TABLE IF NOT EXISTS impuestos (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    tasa_dta_variable REAL NOT NULL,
    fee_fijo_dta REAL NOT NULL,
    flat_con_certificado REAL NOT NULL
  );

  -- === Catálogos de referencia (antes hardcodeados en src/data/*.js) ===
  CREATE TABLE IF NOT EXISTS sucursales (
    nombre TEXT PRIMARY KEY,
    zona INTEGER
  );

  CREATE TABLE IF NOT EXISTS aduanas_por_destino (
    destino TEXT NOT NULL,
    aduana TEXT NOT NULL,
    PRIMARY KEY (destino, aduana)
  );

  CREATE TABLE IF NOT EXISTS agencia_por_aduana (
    aduana TEXT PRIMARY KEY,
    zona TEXT,
    clave TEXT,
    agencia TEXT
  );

  CREATE TABLE IF NOT EXISTS proveedores (
    nombre TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS productos_por_proveedor (
    proveedor TEXT NOT NULL,
    producto TEXT NOT NULL,
    PRIMARY KEY (proveedor, producto)
  );

  CREATE TABLE IF NOT EXISTS opciones_especiales_peso (
    opcion TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS quiebres_peso (
    valor INTEGER PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS rutas_dedicado_proveedor (
    proveedor TEXT NOT NULL,
    aduana TEXT NOT NULL,
    tipo_transporte TEXT NOT NULL,
    tarifa REAL NOT NULL,
    PRIMARY KEY (proveedor, aduana, tipo_transporte)
  );

  CREATE TABLE IF NOT EXISTS rutas_consolidado_proveedor (
    proveedor TEXT NOT NULL,
    aduana TEXT NOT NULL,
    franja TEXT NOT NULL,
    valor REAL NOT NULL,
    PRIMARY KEY (proveedor, aduana, franja)
  );

  CREATE TABLE IF NOT EXISTS ur_tarifa_por_equipos (
    equipos INTEGER PRIMARY KEY,
    ftl REAL NOT NULL,
    rabon REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rutas_impo (
    aduana TEXT NOT NULL,
    destino TEXT NOT NULL,
    tipo_transporte TEXT NOT NULL,
    tarifa REAL NOT NULL,
    PRIMARY KEY (aduana, destino, tipo_transporte)
  );

  CREATE TABLE IF NOT EXISTS tarifa_bodega_por_aduana (
    aduana TEXT PRIMARY KEY,
    min REAL NOT NULL,
    medio REAL NOT NULL,
    alto REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bitacora_cambios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    usuario TEXT NOT NULL,
    tabla TEXT NOT NULL,
    clave TEXT NOT NULL,
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT
  );
`);

if (esNueva) {
  console.log('Base de datos nueva: sembrando catálogos iniciales (mismos valores que hoy en src/data/)...');

  const tasasIniciales = [
    ['Acoplamiento flexible para embrague', '8483609900', 0.1],
    ['Manufactura de aluminio', '7616999999', 0.15],
    ['Robot industrial para manipulación de mercancia con sus accesorios', '8428700100', 0.15],
    ['Mesa de elevación con sus accesorios', '8428909999', 0.15],
    ['Carretilla manual con sistema de elevacion', '8427909100', 0.15],
    ['Manufactura de metal', '7326909999', 0.25],
    ['Tornillos con diámetro igual o superior a 19.1 mm (¾ pulgada) y longitud igual o superior a 152.4 mm', '7318159908', 0.25],
    ['Tornillos con diámetro igual o superior a 19.1 mm (¾ pulgada) y longitud inferior a 152.4 mm', '7318159907', 0.25],
    ['Malla de acero galvanizado soldado en punto de cruce revestida de plástico', '7314420100', 0.25],
    ['Perfil de aluminio', '7604210100', 0.25],
    ['Transportador de cadena plástica', '8428399999', 0],
    ['Transportador de banda con accesorios', '8428339100', 0],
    ['Banda de plastico con refuerzo textil', '3926909902', 0],
    ['Motorreductor', '8483400999', 0],
    ['Partes para transportador', '8431399900', 0],
    ['Banda transportadora de plástico', '3926909902', 0],
    ['Transportador de gravedad con accesorios', '8428399999', 0],
    ['Transportador de rodillos con accesorios', '8428399999', 0],
    ['Rodillo para transportador', '8431399900', 0],
    ['Motor electrico', '8501519999', 0],
    ['Motovibrador electrico', '8501519999', 0],
    ['Circuitos Modulares', '8543900100', 0],
    ['Cargador de baterías 48v 12a', '8504401500', 0],
    ['Juego de baterías recargables de litio con sus accesorios para instalación', '8507600100', 0],
    ['Modulo de control para brazo robotico', '8479901899', 0],
    ['Partes para robot industrial', '8479901899', 0],
    ['Transportador vertical de mercancias', '8428399999', 0],
    ['Brazo robotico para uso industrial con accesorios para su instalacion y funcionamiento', '8479500100', 0],
  ];
  const insertTasa = db.prepare('INSERT INTO tasas_igi (descripcion, fraccion, tasa_igi) VALUES (?, ?, ?)');
  db.transaction((filas) => filas.forEach((f) => insertTasa.run(...f)))(tasasIniciales);

  const tramosSanDiegoTijuana = JSON.stringify([
    { hasta: 5000, monto: 160 },
    { hasta: 8000, monto: 167 },
    { hasta: 10000, monto: 197 },
    { hasta: 12000, monto: 233 },
    { hasta: 15000, monto: 260 },
    { hasta: 25000, monto: 321 },
  ]);
  const honorariosIniciales = [
    { aduana: 'El Paso', tipo: 'lineal', pct: 0.0035, fijo: 120, tramos_json: null, pct_excedente: null },
    { aduana: 'Laredo', tipo: 'lineal', pct: 0.0045, fijo: 180, tramos_json: null, pct_excedente: null },
    { aduana: 'Nogales', tipo: 'lineal', pct: 0.0125, fijo: 116, tramos_json: null, pct_excedente: null },
    { aduana: 'Monterrey', tipo: 'lineal', pct: 0.003, fijo: 300, tramos_json: null, pct_excedente: null },
    { aduana: 'AICM', tipo: 'lineal', pct: 0.003, fijo: 300, tramos_json: null, pct_excedente: null },
    { aduana: 'Cd. Juarez', tipo: 'lineal', pct: 0.006, fijo: 120, tramos_json: null, pct_excedente: null },
    { aduana: 'Altamira', tipo: 'lineal', pct: 0.003, fijo: 540, tramos_json: null, pct_excedente: null },
    { aduana: 'Manzanillo', tipo: 'lineal', pct: 0.003, fijo: 540, tramos_json: null, pct_excedente: null },
    { aduana: 'San Diego', tipo: 'tramos', pct: null, fijo: null, tramos_json: tramosSanDiegoTijuana, pct_excedente: 0.005 },
    { aduana: 'Tijuana', tipo: 'tramos', pct: null, fijo: null, tramos_json: tramosSanDiegoTijuana, pct_excedente: 0.005 },
  ];
  const insertHonorario = db.prepare(`
    INSERT INTO honorarios_aa (aduana, tipo, pct, fijo, tramos_json, pct_excedente)
    VALUES (@aduana, @tipo, @pct, @fijo, @tramos_json, @pct_excedente)
  `);
  db.transaction((filas) => filas.forEach((f) => insertHonorario.run(f)))(honorariosIniciales);

  db.prepare(
    `INSERT INTO impuestos (id, tasa_dta_variable, fee_fijo_dta, flat_con_certificado) VALUES (1, 0.008, 15, 35)`
  ).run();

  const sucursales = [
    ['Chihuahua', 1], ['Juarez', 1], ['Saltillo', 2], ['Torreon', 2], ['Monterrey', 2],
    ['CDMX', 2], ['Puebla', 3], ['Nogales', 4], ['Hermosillo', 4], ['Mexicali', 5], ['Tijuana', 5],
  ];
  const insertSucursal = db.prepare('INSERT INTO sucursales (nombre, zona) VALUES (?, ?)');
  db.transaction((filas) => filas.forEach((f) => insertSucursal.run(...f)))(sucursales);

  const aduanasPorDestino = {
    Chihuahua: ['El Paso', 'Cd. Juarez', 'Altamira', 'Manzanillo'],
    Juarez: ['El Paso', 'Cd. Juarez', 'Altamira', 'Manzanillo'],
    Saltillo: ['Laredo', 'Monterrey', 'Altamira', 'Manzanillo'],
    Torreon: ['Laredo', 'Monterrey', 'Altamira', 'Manzanillo'],
    Monterrey: ['Laredo', 'Monterrey', 'Altamira', 'Manzanillo'],
    CDMX: ['Laredo', 'Monterrey', 'Altamira', 'Manzanillo', 'AICM'],
    Puebla: ['Laredo', 'Monterrey', 'El Paso', 'Cd. Juarez', 'Altamira'],
    Nogales: ['Nogales', 'El Paso', 'Cd. Juarez', 'Altamira'],
    Hermosillo: ['Nogales', 'El Paso', 'Cd. Juarez', 'Altamira'],
    Mexicali: ['Nogales', 'San Diego', 'Tijuana', 'Altamira'],
    Tijuana: ['San Diego', 'Tijuana', 'Altamira', 'Manzanillo'],
  };
  const insertAduanaDestino = db.prepare('INSERT INTO aduanas_por_destino (destino, aduana) VALUES (?, ?)');
  db.transaction(() => {
    for (const [destino, aduanas] of Object.entries(aduanasPorDestino)) {
      for (const aduana of aduanas) insertAduanaDestino.run(destino, aduana);
    }
  })();

  const agenciaPorAduana = [
    ['El Paso', 'A', 'A1, A3, A4', 'MARON'],
    ['Laredo', 'B', 'B2, B3', 'GRUPO 1780'],
    ['Nogales', 'C', 'C4', 'PRL'],
    ['San Diego', 'D', 'D5', 'SICA'],
    ['Monterrey', 'E', 'E2,E3', 'PALCO'],
    ['AICM', 'F', 'F3', 'PALCO'],
    ['Cd. Juarez', 'G', 'G1, G2, G3', 'MARON'],
    ['Tijuana', 'H', 'H4, H5', 'SICA'],
    ['Altamira', 'I', 'I1, I2, I3, I4, I5', 'PALCO'],
    ['Manzanillo', 'J', 'J1, J2, J3, J4, J5', 'ALIANZA'],
  ];
  const insertAgencia = db.prepare('INSERT INTO agencia_por_aduana (aduana, zona, clave, agencia) VALUES (?, ?, ?, ?)');
  db.transaction((filas) => filas.forEach((f) => insertAgencia.run(...f)))(agenciaPorAduana);

  const productosPorProveedor = {
    Dorner: [
      'Transportador de banda con accesorios', 'Partes para transportador',
      'Mesa de elevación con sus accesorios', 'Cargador de baterías 48v 12a',
      'Brazo robotico para uso industrial con accesorios para su instalacion y funcionamiento',
      'Transportador de cadena plástica',
    ],
    Hytrol: [
      'Banda de plastico con refuerzo textil', 'Transportador de banda con accesorios',
      'Carretilla manual con sistema de elevacion',
      'Juego de baterías recargables de litio con sus accesorios para instalación',
      'Partes para robot industrial', 'Perfil de aluminio',
    ],
    Southworth: ['Motorreductor', 'Transportador de gravedad con accesorios', 'Robot industrial para manipulación de mercancia con sus accesorios'],
    MiR: ['Partes para transportador', 'Transportador de rodillos con accesorios', 'Partes para robot industrial'],
    UR: ['Rodillo para transportador', 'Circuitos Modulares'],
    Intechmotion: ['Banda transportadora de plástico'],
    Qimarox: [], OnRobot: [], Robotiq: [], Dellner: [], Italvibras: [],
  };
  const insertProveedor = db.prepare('INSERT INTO proveedores (nombre) VALUES (?)');
  const insertProducto = db.prepare('INSERT INTO productos_por_proveedor (proveedor, producto) VALUES (?, ?)');
  db.transaction(() => {
    for (const [proveedor, productos] of Object.entries(productosPorProveedor)) {
      insertProveedor.run(proveedor);
      for (const producto of productos) insertProducto.run(proveedor, producto);
    }
  })();

  const opcionesEspeciales = ['DEDICADO', 'Embalaje MIR250', 'Embalaje MIR600', 'Embalaje MIR1350', 'Embalaje URe', 'Embalaje UR20'];
  const insertOpcion = db.prepare('INSERT INTO opciones_especiales_peso (opcion) VALUES (?)');
  db.transaction((filas) => filas.forEach((f) => insertOpcion.run(f)))(opcionesEspeciales);

  const quiebresPeso = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
    1500, 1600, 1700, 1800, 1900, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
    6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 20000,
    25000, 30000, 40000,
  ];
  const insertQuiebre = db.prepare('INSERT INTO quiebres_peso (valor) VALUES (?)');
  db.transaction((filas) => filas.forEach((f) => insertQuiebre.run(f)))(quiebresPeso);

  const rutasDedicadoProveedor = {
    Hytrol: {
      'El Paso': { "FTL 53'": 3150, "RABON 20'": 2650, '3.5 T': 1950 },
      Laredo: { "FTL 53'": 2150, "RABON 20'": 1750, '3.5 T': 1650 },
      'San Diego': { "FTL 53'": 3580, "RABON 20'": 3150, '3.5 T': 2850 },
      Nogales: { "FTL 53'": 3580, "RABON 20'": 3150, '3.5 T': 2850 },
    },
    Southworth: {
      'El Paso': { "FTL 53'": 3150, "RABON 20'": 2650, '3.5 T': 1950 },
      Laredo: { "FTL 53'": 2150, "RABON 20'": 1750, '3.5 T': 1650 },
      'San Diego': { "FTL 53'": 3580, "RABON 20'": 3150, '3.5 T': 2850 },
      Nogales: { "FTL 53'": 3580, "RABON 20'": 3150, '3.5 T': 2850 },
    },
    Dorner: {
      'El Paso': { "FTL 53'": 3550, "RABON 20'": 3250, '3.5 T': 2550 },
      Laredo: { "FTL 53'": 2950, "RABON 20'": 2650, '3.5 T': 2350 },
      'San Diego': { "FTL 53'": 4250, "RABON 20'": 3950, '3.5 T': 3250 },
      Nogales: { "FTL 53'": 4250, "RABON 20'": 3950, '3.5 T': 3250 },
    },
    Intechmotion: {
      'El Paso': { "FTL 53'": 3950, "RABON 20'": 3450, '3.5 T': 2650 },
      Laredo: { "FTL 53'": 3150, "RABON 20'": 2750, '3.5 T': 2350 },
      'San Diego': { "FTL 53'": 4850, "RABON 20'": 4700, '3.5 T': 3750 },
      Nogales: { "FTL 53'": 4850, "RABON 20'": 4700, '3.5 T': 3750 },
    },
    MiR: {
      'El Paso': { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      Laredo: { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      'San Diego': { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      Nogales: { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      Monterrey: { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      AICM: { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      'Cd. Juarez': { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
      Tijuana: { "FTL 53'": 3250, "RABON 20'": 2650, '3.5 T': 1950 },
    },
  };
  const insertRutaDedicado = db.prepare(
    'INSERT INTO rutas_dedicado_proveedor (proveedor, aduana, tipo_transporte, tarifa) VALUES (?, ?, ?, ?)'
  );
  db.transaction(() => {
    for (const [proveedor, porAduana] of Object.entries(rutasDedicadoProveedor)) {
      for (const [aduana, tarifas] of Object.entries(porAduana)) {
        for (const [tipo, tarifa] of Object.entries(tarifas)) insertRutaDedicado.run(proveedor, aduana, tipo, tarifa);
      }
    }
  })();

  const rutasConsolidadoProveedor = {
    Hytrol: {
      'El Paso': { minCharge: 231, '100-299': 1.078, '300-499': 0.938, '500-999': 0.756, '1000-2000': 0.574, '2000+': 0.504 },
      Laredo: { minCharge: 231, '100-299': 1.022, '300-499': 0.882, '500-999': 0.7, '1000-2000': 0.518, '2000+': 0.462 },
      'San Diego': { minCharge: 245, '100-299': 1.33, '300-499': 1.19, '500-999': 1.022, '1000-2000': 0.77, '2000+': 0.7 },
      Nogales: { minCharge: 245, '100-299': 1.33, '300-499': 1.19, '500-999': 1.022, '1000-2000': 0.77, '2000+': 0.7 },
    },
    Southworth: {
      'El Paso': { minCharge: 231, '100-299': 1.078, '300-499': 0.938, '500-999': 0.756, '1000-2000': 0.574, '2000+': 0.504 },
      Laredo: { minCharge: 231, '100-299': 1.022, '300-499': 0.882, '500-999': 0.7, '1000-2000': 0.518, '2000+': 0.462 },
      'San Diego': { minCharge: 245, '100-299': 1.33, '300-499': 1.19, '500-999': 1.022, '1000-2000': 0.77, '2000+': 0.7 },
      Nogales: { minCharge: 245, '100-299': 1.33, '300-499': 1.19, '500-999': 1.022, '1000-2000': 0.77, '2000+': 0.7 },
    },
    Dorner: {
      'El Paso': { minCharge: 277.2, '100-299': 1.2936, '300-499': 1.1256, '500-999': 0.9072, '1000-2000': 0.6888, '2000+': 0.6048 },
      Laredo: { minCharge: 277.2, '100-299': 1.2264, '300-499': 1.0584, '500-999': 0.84, '1000-2000': 0.6216, '2000+': 0.5544 },
      'San Diego': { minCharge: 294, '100-299': 1.596, '300-499': 1.428, '500-999': 1.2264, '1000-2000': 0.924, '2000+': 0.84 },
      Nogales: { minCharge: 294, '100-299': 1.596, '300-499': 1.428, '500-999': 1.2264, '1000-2000': 0.924, '2000+': 0.84 },
    },
    Intechmotion: {
      'El Paso': { minCharge: 277.2, '100-299': 1.2936, '300-499': 1.1256, '500-999': 0.9072, '1000-2000': 0.6888, '2000+': 0.6048 },
      Laredo: { minCharge: 277.2, '100-299': 1.2264, '300-499': 1.0584, '500-999': 0.84, '1000-2000': 0.6216, '2000+': 0.5544 },
      'San Diego': { minCharge: 294, '100-299': 1.596, '300-499': 1.428, '500-999': 1.2264, '1000-2000': 0.924, '2000+': 0.84 },
      Nogales: { minCharge: 294, '100-299': 1.596, '300-499': 1.428, '500-999': 1.2264, '1000-2000': 0.924, '2000+': 0.84 },
    },
    MiR: { '*': { flat: 250 } },
    UR: { '*': { flat: 250 } },
  };
  const insertRutaConsolidado = db.prepare(
    'INSERT INTO rutas_consolidado_proveedor (proveedor, aduana, franja, valor) VALUES (?, ?, ?, ?)'
  );
  db.transaction(() => {
    for (const [proveedor, porAduana] of Object.entries(rutasConsolidadoProveedor)) {
      for (const [aduana, franjas] of Object.entries(porAduana)) {
        for (const [franja, valor] of Object.entries(franjas)) insertRutaConsolidado.run(proveedor, aduana, franja, valor);
      }
    }
  })();

  const urTarifaPorEquipos = [
    [1, 2199 + 220, 925 + 220], [2, 4282 + 220, 1734 + 220], [3, 6366 + 220, 2544 + 220],
    [4, 8449 + 220, 3354 + 220], [5, 10533 + 330, 4163 + 330], [6, 12616 + 330, 4973 + 330],
    [7, 14700 + 440, 5783 + 440], [8, 16784 + 440, 6592 + 440], [9, 17062 + 440, 7402 + 440],
    [10, 19146 + 550, 8212 + 550],
  ];
  const insertUrEquipos = db.prepare('INSERT INTO ur_tarifa_por_equipos (equipos, ftl, rabon) VALUES (?, ?, ?)');
  db.transaction((filas) => filas.forEach((f) => insertUrEquipos.run(...f)))(urTarifaPorEquipos);

  const rutasImpo = {
    'El Paso': {
      Chihuahua: { "FTL 53'": 850, "RABON 20'": 650, '3.5 T': 550, CONSOLIDADO: 350 },
      Juarez: { "FTL 53'": 150, "RABON 20'": 100, '3.5 T': 100, CONSOLIDADO: 150 },
      Puebla: { "FTL 53'": 1650, "RABON 20'": 1350, '3.5 T': 1100, CONSOLIDADO: 700 },
      Nogales: { "FTL 53'": 1650, "RABON 20'": 1350, '3.5 T': 1100, CONSOLIDADO: 450 },
      Hermosillo: { "FTL 53'": 1850, "RABON 20'": 1550, '3.5 T': 1300, CONSOLIDADO: 450 },
    },
    Laredo: {
      Saltillo: { "FTL 53'": 950, "RABON 20'": 750, '3.5 T': 750, CONSOLIDADO: 350 },
      Torreon: { "FTL 53'": 1150, "RABON 20'": 950, '3.5 T': 750, CONSOLIDADO: 350 },
      Monterrey: { "FTL 53'": 750, "RABON 20'": 650, '3.5 T': 550, CONSOLIDADO: 350 },
      CDMX: { "FTL 53'": 1650, "RABON 20'": 1350, '3.5 T': 1100, CONSOLIDADO: 700 },
      Puebla: { "FTL 53'": 1850, "RABON 20'": 1550, '3.5 T': 1300, CONSOLIDADO: 700 },
    },
    Nogales: {
      Nogales: { "FTL 53'": 350, "RABON 20'": 350, '3.5 T': 250, CONSOLIDADO: 150 },
      Hermosillo: { "FTL 53'": 850, "RABON 20'": 650, '3.5 T': 550, CONSOLIDADO: 350 },
      Mexicali: { "FTL 53'": 850, "RABON 20'": 650, '3.5 T': 550, CONSOLIDADO: 350 },
    },
    'San Diego': {
      Mexicali: { "FTL 53'": 850, "RABON 20'": 650, '3.5 T': 550, CONSOLIDADO: 150 },
      Tijuana: { "FTL 53'": 350, "RABON 20'": 350, '3.5 T': 250, CONSOLIDADO: 150 },
    },
    Monterrey: {
      Monterrey: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 150 },
      Saltillo: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 350 },
    },
    AICM: { Puebla: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 350 } },
    'Cd. Juarez': {
      Chihuahua: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 350 },
      Juarez: { "FTL 53'": 250, "RABON 20'": 200, '3.5 T': 150, CONSOLIDADO: 150 },
      Puebla: { "FTL 53'": 1350, "RABON 20'": 1150, '3.5 T': 950, CONSOLIDADO: 700 },
      Nogales: { "FTL 53'": 1150, "RABON 20'": 950, '3.5 T': 650, CONSOLIDADO: 450 },
    },
    Tijuana: {
      Tijuana: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 150 },
      Mexicali: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 450 },
    },
    Altamira: { Sucursales: { "FTL 53'": 3500, "RABON 20'": 2500, '3.5 T': 1900, CONSOLIDADO: 850 } },
    Manzanillo: { Sucursales: { "FTL 53'": 3500, "RABON 20'": 2500, '3.5 T': 1900, CONSOLIDADO: 850 } },
  };
  const insertRutaImpo = db.prepare('INSERT INTO rutas_impo (aduana, destino, tipo_transporte, tarifa) VALUES (?, ?, ?, ?)');
  db.transaction(() => {
    for (const [aduana, porDestino] of Object.entries(rutasImpo)) {
      for (const [destino, tarifas] of Object.entries(porDestino)) {
        for (const [tipo, tarifa] of Object.entries(tarifas)) insertRutaImpo.run(aduana, destino, tipo, tarifa);
      }
    }
  })();

  const tarifaBodega = [
    ['El Paso', 200, 250, 400],
    ['Laredo', 400, 550, 700],
    ['Nogales', 200, 250, 400],
    ['San Diego', 230, 350, 750],
    ['Monterrey', 138.89, 194.44, 250],
    ['AICM', 138.89, 194.44, 250],
    ['Cd. Juarez', 61.11, 105.56, 138.89],
    ['Tijuana', 61.11, 105.56, 138.89],
    ['Altamira', 5000 / 18, 7000 / 18, 9000 / 18],
    ['Manzanillo', 5000 / 18, 7000 / 18, 9000 / 18],
  ];
  const insertTarifaBodega = db.prepare('INSERT INTO tarifa_bodega_por_aduana (aduana, min, medio, alto) VALUES (?, ?, ?, ?)');
  db.transaction((filas) => filas.forEach((f) => insertTarifaBodega.run(...f)))(tarifaBodega);

  console.log('Catálogos sembrados correctamente.');
}
