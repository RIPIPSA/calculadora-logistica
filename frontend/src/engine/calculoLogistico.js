// Motor de cálculo — replica la hoja GUIALOG del Excel original, sección por
// sección, con las correcciones de negocio confirmadas por el cliente:
//
//  1) "DEDICADO"/"CONSOLIDADO" se compara SIEMPRE en mayúsculas (el Excel
//     original tenía una comparación en minúsculas que nunca se cumplía).
//  2) La Agencia Aduanal es un campo DERIVADO de la Aduana (no un combo
//     abierto): se resuelve con getAgenciaAduanal().
//  3) "Sucursal" y "Destino" son campos INDEPENDIENTES (Sección I), tal como
//     en el Excel: Destino solo determina qué Aduanas se pueden elegir
//     (INDIRECT($J$35)); Sucursal es la que realmente recibe la mercancía
//     y se usa para calcular la ruta de Flete de Importación (Aduana ->
//     Sucursal, fórmula S85 del Excel). No se deben fusionar.
//  4) El texto de comparación de tipo de embalaje ("Embalaje MIR250", etc.)
//     se normaliza igual en la pierna de Flete Proveedor y en la de Flete
//     de Importación (en el Excel original la segunda comparaba un texto
//     recortado que nunca hacía match).
//
// Los proveedores/aduanas que no tienen tarifa cargada en el catálogo
// (p. ej. Qimarox, OnRobot, Robotiq, Dellner, Italvibras, o rutas no
// contempladas) devuelven `null`/"PD" igual que el Excel original, en vez
// de inventar un número.

import { getAgenciaAduanal } from '../data/agenciaAduanal.js';
import {
  RUTAS_DEDICADO_PROVEEDOR,
  RUTAS_CONSOLIDADO_PROVEEDOR,
  UR_TARIFA_POR_EQUIPOS,
} from '../data/fletesProveedor.js';
import { OPCIONES_ESPECIALES_PESO } from '../data/rangoPeso.js';
import { getRutaImpo } from '../data/fletesImpo.js';
import { calcularCostoBodega, calcularHonorariosAA } from '../data/bodega.js';

// "Peso especial" = el usuario eligió DEDICADO o un tipo de embalaje MiR/UR
// en vez de capturar un número de libras. Se compara contra el catálogo
// real (no contra "typeof === string" a secas) para que un número que por
// error llegue como texto (p. ej. "6000") NO se confunda con un peso
// especial y dispare "DEDICADO" de forma incorrecta.
function esPesoEspecial(peso) {
  return typeof peso === 'string' && OPCIONES_ESPECIALES_PESO.includes(peso);
}

/** Sección III: determina si el embarque es DEDICADO o CONSOLIDADO. */
export function calcularTipoEmbarque(pesoLbs, cantidadBultos) {
  if (esPesoEspecial(pesoLbs)) return 'DEDICADO'; // DEDICADO o Embalaje... fuerza dedicado
  const peso = Number(pesoLbs) || 0;
  const bultos = Number(cantidadBultos) || 0;
  if (peso > 5000 || bultos > 7) return 'DEDICADO';
  return 'CONSOLIDADO';
}

/** Marca de "pequeña importación": peso numérico < 200 lbs y 1 solo bulto. */
export function calcularNotaImpoPartes(pesoLbs, cantidadBultos, tipoEmbarque) {
  const bultos = Number(cantidadBultos) || 0;
  if (!esPesoEspecial(pesoLbs) && Number(pesoLbs) < 200 && bultos === 1) {
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

/** Elige FTL / RABON / 3.5T / CONSOLIDADO según el peso (o el embalaje elegido). */
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
export function calcularFleteProveedor({ proveedor, aduana, pesoLbs, cantidadBultos, tipoEmbarque }) {
  const tipoTransporte = elegirTipoTransporte(tipoEmbarque, pesoLbs, UMBRALES_PROVEEDOR);
  const numeroCamiones = calcularNumeroCamiones(cantidadBultos);
  const peso = Number(pesoLbs) || 0;

  let tarifaBase = null;

  if (proveedor === 'MiR' || proveedor === 'UR') {
    if (tipoTransporte === 'CONSOLIDADO') {
      tarifaBase = RUTAS_CONSOLIDADO_PROVEEDOR[proveedor]?.flat ?? null;
    } else if (proveedor === 'UR' && (pesoLbs === 'Embalaje URe' || pesoLbs === 'Embalaje UR20')) {
      // Tarifa UR por cantidad de equipos (bultos = número de equipos)
      const fila = UR_TARIFA_POR_EQUIPOS.find((f) => f.equipos === Number(cantidadBultos));
      if (fila) tarifaBase = tipoTransporte === "FTL 53'" ? fila.FTL : fila.RABON;
    } else {
      tarifaBase = RUTAS_DEDICADO_PROVEEDOR[proveedor]?.[aduana]?.[tipoTransporte] ?? null;
    }
  } else if (tipoTransporte === 'CONSOLIDADO') {
    const tabla = RUTAS_CONSOLIDADO_PROVEEDOR[proveedor]?.[aduana];
    if (tabla) {
      if (peso === 100) tarifaBase = tabla.minCharge;
      else if (peso > 100 && peso < 300) tarifaBase = peso * tabla['100-299'];
      else if (peso >= 300 && peso < 500) tarifaBase = peso * tabla['300-499'];
      else if (peso >= 500 && peso < 1000) tarifaBase = peso * tabla['500-999'];
      else if (peso >= 1000 && peso < 2000) tarifaBase = peso * tabla['1000-2000'];
      else if (peso >= 2000 && peso <= 5000) tarifaBase = peso * tabla['2000+'];
    }
  } else {
    tarifaBase = RUTAS_DEDICADO_PROVEEDOR[proveedor]?.[aduana]?.[tipoTransporte] ?? null;
  }

  if (tarifaBase === null || tarifaBase === undefined) {
    return { tipoTransporte, numeroCamiones, total: null, pd: true };
  }
  const total = Number(cantidadBultos) === 0 ? 0 : tarifaBase * numeroCamiones;
  return { tipoTransporte, numeroCamiones, total, pd: false };
}

/** Costo 2: Flete de Importación, Aduana -> Sucursal. */
export function calcularFleteImpo({ aduana, sucursal, pesoLbs, cantidadBultos, tipoEmbarque }) {
  const tipoTransporte = elegirTipoTransporte(tipoEmbarque, pesoLbs, UMBRALES_IMPO);
  const numeroCamiones = calcularNumeroCamiones(cantidadBultos);
  const ruta = getRutaImpo(aduana, sucursal);
  const cruceFronterizo = Number(cantidadBultos) === 0 ? 0 : 130 * numeroCamiones;

  if (!ruta || ruta[tipoTransporte] === undefined) {
    return { tipoTransporte, numeroCamiones, cruceFronterizo, total: null, pd: true };
  }
  const tarifaBase = ruta[tipoTransporte];
  const totalFlete = Number(cantidadBultos) === 0 ? 0 : tarifaBase * numeroCamiones;
  return { tipoTransporte, numeroCamiones, cruceFronterizo, total: totalFlete + cruceFronterizo, pd: false };
}

/** Costo 3: Bodega y Recinto. */
export function calcularBodegaYRecinto({ aduana, pesoLbs }) {
  const peso = Number(pesoLbs) || 0;
  const total = calcularCostoBodega(aduana, peso);
  return { total: total ?? null, pd: total === null };
}

/** Costo 4 y 5: Honorarios de Agencia Aduanal + Impuestos (DTA + IGI). */
export function calcularHonorariosEImpuestos({ aduana, valorMercancia, valorAduana, tasaIgi, certificadoOrigen }) {
  const honorariosAA = calcularHonorariosAA(aduana, valorMercancia);
  const dta = certificadoOrigen === 'NO' ? valorAduana * 0.008 + 15 : 20 + 15;
  const igi = tasaIgi * valorAduana;
  const totalImpuestos = certificadoOrigen === 'SI' ? 20 + 15 : valorAduana * 0.008 + 15 + valorAduana * tasaIgi;
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
 */
export function calcularCostoLogistico(datos) {
  const {
    sucursal, // Sucursal que recibe la mercancía; se usa para la ruta de Flete de Importación
    proveedor,
    valorMercancia,
    certificadoOrigen,
    aduana,
    pesoLbs,
    cantidadBultos,
    tasaIgi, // decimal (0.15 = 15%). Se captura/confirma manualmente en el formulario,
    // ya que en la práctica se revisa mercancía por mercancía si trae o no el impuesto.
  } = datos;

  const agencia = getAgenciaAduanal(aduana);
  const tipoEmbarque = calcularTipoEmbarque(pesoLbs, cantidadBultos);
  const notaImpoPartes = calcularNotaImpoPartes(pesoLbs, cantidadBultos, tipoEmbarque);
  const esPequenaImportacion = notaImpoPartes === 'pequeñaimportacion';

  // Costo 1: Flete Proveedor. Si es "pequeña importación" y el valor de
  // mercancía es menor a $1,000 usd, el Excel usa una cuota fija del 12%
  // del valor de mercancía en vez de la tabla de tarifas.
  let costo1;
  if (esPequenaImportacion && valorMercancia < 1000) {
    costo1 = { total: valorMercancia * 0.12, tipoTransporte: tipoEmbarque, pd: false };
  } else {
    costo1 = calcularFleteProveedor({ proveedor, aduana, pesoLbs, cantidadBultos, tipoEmbarque });
  }

  // Costo 2: Flete de Importación (misma regla de pequeña importación).
  let costo2;
  if (esPequenaImportacion && valorMercancia < 1000) {
    costo2 = { total: valorMercancia * 0.12, tipoTransporte: tipoEmbarque, cruceFronterizo: 0, pd: false };
  } else {
    costo2 = calcularFleteImpo({ aduana, sucursal, pesoLbs, cantidadBultos, tipoEmbarque });
  }

  // Costo 3: Bodega y Recinto
  const costo3 = calcularBodegaYRecinto({ aduana, pesoLbs });

  // Valor Aduana = Valor Mercancía + Total Flete de Importación
  const valorAduana = valorMercancia + (costo2.total ?? 0);

  // Costo 4 y 5: Honorarios A.A. e Impuestos
  const costo45 = calcularHonorariosEImpuestos({
    aduana,
    valorMercancia,
    valorAduana,
    tasaIgi: tasaIgi ?? 0,
    certificadoOrigen,
  });

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
