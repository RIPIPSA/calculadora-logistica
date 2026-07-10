// Fuente: hoja "Fletes Proveedor" A41:A86 (rango con nombre RANGOPESO).
// El campo "Peso" admite: la palabra DEDICADO, un tipo de embalaje MiR/UR,
// o un peso en libras (las libras se capturan como número; estas son las
// opciones especiales que además aparecen en el catálogo).

export const OPCIONES_ESPECIALES_PESO = [
  'DEDICADO',
  'Embalaje MIR250',
  'Embalaje MIR600',
  'Embalaje MIR1350',
  'Embalaje URe',
  'Embalaje UR20',
];

// Quiebres de peso (lbs) usados por las tablas de tarifa consolidada
export const QUIEBRES_PESO = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
  1500, 1600, 1700, 1800, 1900, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 20000,
  25000, 30000, 40000,
];
