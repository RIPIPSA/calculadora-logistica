// Fuente: hoja "Fletes Proveedor".
// Tarifas DEDICADO por ruta Proveedor -> Aduana destino (A94:G132)
export const TIPOS_TRANSPORTE_DEDICADO = ["FTL 53'", "RABON 20'", '3.5 T'];

export const RUTAS_DEDICADO_PROVEEDOR = {
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
  // MiR: mismo precio para todas las aduanas terrestres del catálogo
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

// UR: tarifa DEDICADO por cantidad de equipos embarcados (A177:F186),
// +220/330/440/550 según franja de cantidad (columna C)
export const UR_TARIFA_POR_EQUIPOS = [
  { equipos: 1, FTL: 2199 + 220, RABON: 925 + 220 },
  { equipos: 2, FTL: 4282 + 220, RABON: 1734 + 220 },
  { equipos: 3, FTL: 6366 + 220, RABON: 2544 + 220 },
  { equipos: 4, FTL: 8449 + 220, RABON: 3354 + 220 },
  { equipos: 5, FTL: 10533 + 330, RABON: 4163 + 330 },
  { equipos: 6, FTL: 12616 + 330, RABON: 4973 + 330 },
  { equipos: 7, FTL: 14700 + 440, RABON: 5783 + 440 },
  { equipos: 8, FTL: 16784 + 440, RABON: 6592 + 440 },
  { equipos: 9, FTL: 17062 + 440, RABON: 7402 + 440 },
  { equipos: 10, FTL: 19146 + 550, RABON: 8212 + 550 },
];

// Tarifa CONSOLIDADO 2025 (vigente) por proveedor + aduana destino, en
// $/lb según franja de peso (D137:I152 * no aplica; vigente = filas 137-152,
// que ya son la tabla "actual"). Franjas: minCharge, 100-299, 300-499,
// 500-999, 1000-2000, 2000+
export const CONSOLIDADO_FRANJAS = ['minCharge', '100-299', '300-499', '500-999', '1000-2000', '2000+'];

export const RUTAS_CONSOLIDADO_PROVEEDOR = {
  Hytrol: {
    'El Paso': { minCharge: 231, '100-299': 1.078, '300-499': 0.938, '500-999': 0.756, '1000-2000': 0.574, '2000+': 0.504 },
    Laredo: { minCharge: 231, '100-299': 1.022, '300-499': 0.882, '500-999': 0.700, '1000-2000': 0.518, '2000+': 0.462 },
    'San Diego': { minCharge: 245, '100-299': 1.330, '300-499': 1.190, '500-999': 1.022, '1000-2000': 0.770, '2000+': 0.700 },
    Nogales: { minCharge: 245, '100-299': 1.330, '300-499': 1.190, '500-999': 1.022, '1000-2000': 0.770, '2000+': 0.700 },
  },
  Southworth: {
    'El Paso': { minCharge: 231, '100-299': 1.078, '300-499': 0.938, '500-999': 0.756, '1000-2000': 0.574, '2000+': 0.504 },
    Laredo: { minCharge: 231, '100-299': 1.022, '300-499': 0.882, '500-999': 0.700, '1000-2000': 0.518, '2000+': 0.462 },
    'San Diego': { minCharge: 245, '100-299': 1.330, '300-499': 1.190, '500-999': 1.022, '1000-2000': 0.770, '2000+': 0.700 },
    Nogales: { minCharge: 245, '100-299': 1.330, '300-499': 1.190, '500-999': 1.022, '1000-2000': 0.770, '2000+': 0.700 },
  },
  Dorner: {
    'El Paso': { minCharge: 277.2, '100-299': 1.2936, '300-499': 1.1256, '500-999': 0.9072, '1000-2000': 0.6888, '2000+': 0.6048 },
    Laredo: { minCharge: 277.2, '100-299': 1.2264, '300-499': 1.0584, '500-999': 0.8400, '1000-2000': 0.6216, '2000+': 0.5544 },
    'San Diego': { minCharge: 294, '100-299': 1.5960, '300-499': 1.4280, '500-999': 1.2264, '1000-2000': 0.9240, '2000+': 0.8400 },
    Nogales: { minCharge: 294, '100-299': 1.5960, '300-499': 1.4280, '500-999': 1.2264, '1000-2000': 0.9240, '2000+': 0.8400 },
  },
  Intechmotion: {
    'El Paso': { minCharge: 277.2, '100-299': 1.2936, '300-499': 1.1256, '500-999': 0.9072, '1000-2000': 0.6888, '2000+': 0.6048 },
    Laredo: { minCharge: 277.2, '100-299': 1.2264, '300-499': 1.0584, '500-999': 0.8400, '1000-2000': 0.6216, '2000+': 0.5544 },
    'San Diego': { minCharge: 294, '100-299': 1.5960, '300-499': 1.4280, '500-999': 1.2264, '1000-2000': 0.9240, '2000+': 0.8400 },
    Nogales: { minCharge: 294, '100-299': 1.5960, '300-499': 1.4280, '500-999': 1.2264, '1000-2000': 0.9240, '2000+': 0.8400 },
  },
  // MiR y UR consolidado: tarifa fija de $250 según el libro
  MiR: { flat: 250 },
  UR: { flat: 250 },
};
