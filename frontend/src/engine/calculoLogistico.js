// Motor de cálculo — replica GUIALOG del Excel original, sección por
// sección, con las correcciones de negocio confirmadas por el cliente.
//
// A partir de esta versión, el motor YA NO importa catálogos estáticos de
// src/data/*.js: todo (sucursales, aduanas, proveedores, tarifas,
// honorarios, impuestos, tasas IGI) vive en el servicio de reglas de
// negocio (Express + SQLite) y se recibe como parámetro `catalogos`
// (ver src/context/CatalogosContext.jsx, que lo carga una sola vez desde
// GET /api/catalogos). Esto hace que estas funciones sigan siendo puras y
// fáciles de testear: solo hay que pasarles un objeto `catalogos` de
// prueba, sin necesidad de mockear imports.
//
// Correcciones de negocio confirmadas (se mantienen igual que antes):
//  1) "DEDICADO"/"CONSOLIDADO" se compara SIEMPRE en mayúsculas.
//  2) La Agencia Aduanal es un campo DERIVADO de la Aduana.
//  3) "Sucursal" y "Destino" son campos independientes (Sección I).
//  4) El texto de tipo de embalaje se normaliza igual en ambas piernas
//     (Flete Proveedor y Flete de Importación).
//
// Los proveedores/aduanas que no tienen tarifa cargada en el catálogo
// devuelven `null`/"PD", en vez de inventar un número.

function esPesoEspecial(peso, opcionesEspecialesPeso) {
  return typeof peso === 'string' && opcionesEspecialesPeso.includes(peso);
}

/** Sección III: determina si el embarque es DEDICADO o CONSOLIDADO. */
export function calcularTipoEmbarque(pesoLbs, cantidadBultos, opcionesEspecialesPeso) {
  if (esPesoEspecial(pesoLbs, opcionesEspecialesPeso)) return 'DEDICADO';
  const peso = Number(pesoLbs) || 0;
  const bultos = Number(cantidadBultos) || 0;
  if (peso > 5000 || bultos > 7) return 'DEDICADO';
  return 'CONSOLIDADO';
}

/** Marca de "pequeña importación": peso numérico < 200 lbs y 1 solo bulto. */
export function calcularNotaImpoPartes(pesoLbs, cantidadBultos, tipoEmbarque, opcionesEspecialesPeso) {
  const bultos = Number(cantidadBultos) || 0;
  if (!esPesoEspecial(pesoLbs, opcionesEspecialesPeso) && Number(pesoLbs) < 200 && bultos === 1) {
    return 'pequeñaimportacion';
  }
  return tipoEmbarque;
}

export function calcularNumeroCamiones(cantidadBultos) {
  const b = Number(cantidadBultos) || 0;
  if (b > 30 && b < 61) return 2;
  if (b > 61 && b < 91) return 3;
  if (b > 91 && b < 121) return 4;
  return 1;
}

function elegirTipoTransporte(tipoEmbarque, pesoLbs, umbrales) {
  if (tipoEmbarque !== 'DEDICADO') return 'CONSOLIDADO';
  if (pesoLbs === 'Embalaje MIR250') return '3.5 T';
  if (pesoLbs === 'Embalaje MIR600') return "RABON 20'";
  if (pesoLbs === 'Embalaje MIR1350') return "FTL 53'";
  if (pesoLbs === 'Embalaje URe') return "RABON 20'";
  if (pesoLbs === 'Embalaje UR20') return "FTL 53'";
  const peso = Number(pesoLbs) || 0;
  if (peso > umbrales.ftl) return "FTL 53'";
  if (peso > umbrales.rabonMin && peso < umbrales.rabonMax) return "RABON 20'";
  if (peso > umbrales.t35Min && peso < umbrales.t35Max) return '3.5 T';
  return 'CONSOLIDADO';
}

const UMBRALES_PROVEEDOR = { ftl: 9000, rabonMin: 7000, rabonMax: 10000, t35Min: 2000, t35Max: 8000 };
const UMBRALES_IMPO = { ftl: 15000, rabonMin: 7000, rabonMax: 15000, t35Min: 2000, t35Max: 7000 };

/** Costo 1: Flete Proveedor -> Aduana. */
export function calcularFleteProveedor({ proveedor, aduana, pesoLbs, cantidadBultos, tipoEmbarque }, catalogos) {
  const tipoTransporte = elegirTipoTransporte(tipoEmbarque, pesoLbs, UMBRALES_PROVEEDOR);
  const numeroCamiones = calcularNumeroCamiones(cantidadBultos);
  const peso = Number(pesoLbs) || 0;

  let tarifaBase = null;

  if (proveedor === 'MiR' || proveedor === 'UR') {
    if (tipoTransporte === 'CONSOLIDADO') {
      tarifaBase = catalogos.rutasConsolidadoProveedor[proveedor]?.['*']?.flat ?? null;
    } else if (proveedor === 'UR' && (pesoLbs === 'Embalaje URe' || pesoLbs === 'Embalaje UR20')) {
      const fila = catalogos.urTarifaPorEquipos.find((f) => f.equipos === Number(cantidadBultos));
      if (fila) tarifaBase = tipoTransporte === "FTL 53'" ? fila.FTL : fila.RABON;
    } else {
      tarifaBase = catalogos.rutasDedicadoProveedor[proveedor]?.[aduana]?.[tipoTransporte] ?? null;
    }
  } else if (tipoTransporte === 'CONSOLIDADO') {
    const tabla = catalogos.rutasConsolidadoProveedor[proveedor]?.[aduana];
    if (tabla) {
      if (peso === 100) tarifaBase = tabla.minCharge;
      else if (peso > 100 && peso < 300) tarifaBase = peso * tabla['100-299'];
      else if (peso >= 300 && peso < 500) tarifaBase = peso * tabla['300-499'];
      else if (peso >= 500 && peso < 1000) tarifaBase = peso * tabla['500-999'];
      else if (peso >= 1000 && peso < 2000) tarifaBase = peso * tabla['1000-2000'];
      else if (peso >= 2000 && peso <= 5000) tarifaBase = peso * tabla['2000+'];
    }
  } else {
    tarifaBase = catalogos.rutasDedicadoProveedor[proveedor]?.[aduana]?.[tipoTransporte] ?? null;
  }

  if (tarifaBase === null || tarifaBase === undefined) {
    return { tipoTransporte, numeroCamiones, total: null, pd: true };
  }
  const total = Number(cantidadBultos) === 0 ? 0 : tarifaBase * numeroCamiones;
  return { tipoTransporte, numeroCamiones, total, pd: false };
}

/** Costo 2: Flete de Importación, Aduana -> Sucursal. */
export function calcularFleteImpo({ aduana, sucursal, pesoLbs, cantidadBultos, tipoEmbarque }, catalogos) {
  const tipoTransporte = elegirTipoTransporte(tipoEmbarque, pesoLbs, UMBRALES_IMPO);
  const numeroCamiones = calcularNumeroCamiones(cantidadBultos);
  const ruta = catalogos.rutasImpoAduanaSucursal[aduana]?.[sucursal] ?? null;
  const cruceFronterizo = Number(cantidadBultos) === 0 ? 0 : 130 * numeroCamiones;

  if (!ruta || ruta[tipoTransporte] === undefined) {
    return { tipoTransporte, numeroCamiones, cruceFronterizo, total: null, pd: true };
  }
  const tarifaBase = ruta[tipoTransporte];
  const totalFlete = Number(cantidadBultos) === 0 ? 0 : tarifaBase * numeroCamiones;
  return { tipoTransporte, numeroCamiones, cruceFronterizo, total: totalFlete + cruceFronterizo, pd: false };
}

/** Costo 3: Bodega y Recinto. */
export function calcularBodegaYRecinto({ aduana, pesoLbs }, catalogos) {
  const peso = Number(pesoLbs) || 0;
  const t = catalogos.tarifaBodegaPorAduana[aduana];
  if (!t) return { total: null, pd: true };
  const total = peso < 1000 ? t.min : peso < 2000 ? t.medio : t.alto;
  return { total, pd: false };
}

/** Evalúa los honorarios de Agencia Aduanal según los parámetros data-driven de la aduana. */
function evaluarHonorariosAA(params, valorMercancia) {
  if (!params) return null;
  if (params.tipo === 'lineal') {
    return params.pct * valorMercancia + params.fijo;
  }
  if (params.tipo === 'tramos') {
    for (const tramo of params.tramos) {
      if (valorMercancia < tramo.hasta) return tramo.monto;
    }
    return valorMercancia * params.pctExcedente;
  }
  return null;
}

/** Costo 4 y 5: Honorarios de Agencia Aduanal + Impuestos (DTA + IGI). */
export function calcularHonorariosEImpuestos({ aduana, valorMercancia, valorAduana, tasaIgi, certificadoOrigen }, catalogos) {
  const honorariosAA = evaluarHonorariosAA(catalogos.honorariosAA[aduana], valorMercancia);
  const { tasaDtaVariable, feeFijoDta, flatConCertificado } = catalogos.impuestos;
  const dta = certificadoOrigen === 'NO' ? valorAduana * tasaDtaVariable + feeFijoDta : flatConCertificado;
  const igi = tasaIgi * valorAduana;
  const totalImpuestos =
    certificadoOrigen === 'SI' ? flatConCertificado : valorAduana * tasaDtaVariable + feeFijoDta + valorAduana * tasaIgi;
  return {
    honorariosAA: honorariosAA ?? null,
    dta,
    igi,
    totalImpuestos,
    pd: honorariosAA === null,
  };
}

/**
 * Calcula el costo logístico completo a partir de las respuestas del wizard.
 * @param {object} datos - ver forma esperada en components/wizard/WizardContext
 * @param {object} catalogos - ver forma exacta en context/CatalogosContext.jsx (GET /api/catalogos)
 */
export function calcularCostoLogistico(datos, catalogos) {
  const {
    sucursal,
    proveedor,
    valorMercancia,
    certificadoOrigen,
    aduana,
    pesoLbs,
    cantidadBultos,
    tasaIgi,
  } = datos;

  const agencia = catalogos.agenciaPorAduana[aduana] ?? null;
  const tipoEmbarque = calcularTipoEmbarque(pesoLbs, cantidadBultos, catalogos.opcionesEspecialesPeso);
  const notaImpoPartes = calcularNotaImpoPartes(pesoLbs, cantidadBultos, tipoEmbarque, catalogos.opcionesEspecialesPeso);
  const esPequenaImportacion = notaImpoPartes === 'pequeñaimportacion';

  let costo1;
  if (esPequenaImportacion && valorMercancia < 1000) {
    costo1 = { total: valorMercancia * 0.12, tipoTransporte: tipoEmbarque, pd: false };
  } else {
    costo1 = calcularFleteProveedor({ proveedor, aduana, pesoLbs, cantidadBultos, tipoEmbarque }, catalogos);
  }

  let costo2;
  if (esPequenaImportacion && valorMercancia < 1000) {
    costo2 = { total: valorMercancia * 0.12, tipoTransporte: tipoEmbarque, cruceFronterizo: 0, pd: false };
  } else {
    costo2 = calcularFleteImpo({ aduana, sucursal, pesoLbs, cantidadBultos, tipoEmbarque }, catalogos);
  }

  const costo3 = calcularBodegaYRecinto({ aduana, pesoLbs }, catalogos);

  const valorAduana = valorMercancia + (costo2.total ?? 0);

  const costo45 = calcularHonorariosEImpuestos(
    { aduana, valorMercancia, valorAduana, tasaIgi: tasaIgi ?? 0, certificadoOrigen },
    catalogos
  );

  const huboPD = costo1.pd || costo2.pd || costo3.pd || costo45.pd;

  const total =
    (costo1.total ?? 0) + (costo2.total ?? 0) + (costo3.total ?? 0) + (costo45.honorariosAA ?? 0) + (costo45.totalImpuestos ?? 0);

  return {
    agencia,
    tasaIgi,
    tipoEmbarque,
    notaImpoPartes,
    valorAduana,
    costo1,
    costo2,
    costo3,
    costo45,
    huboPD,
    resumen: {
      fleteProveedor: costo1.total ?? 0,
      bodegaYRecinto: costo3.total ?? 0,
      fleteImportacion: costo2.total ?? 0,
      honorariosAA: costo45.honorariosAA ?? 0,
      impuestos: costo45.totalImpuestos ?? 0,
      costoLogisticoTotal: total,
    },
  };
}
