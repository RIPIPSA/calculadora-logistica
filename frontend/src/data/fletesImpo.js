// Fuente: hoja "Fletes Impo" A78:G104 (ruta Aduana -> Sucursal destino).
// FTL/RABON/3.5T = tarifa DEDICADO; CONSOLIDADO = tarifa fija por operación.
export const RUTAS_IMPO_ADUANA_SUCURSAL = {
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
  AICM: {
    Puebla: { "FTL 53'": 650, "RABON 20'": 450, '3.5 T': 350, CONSOLIDADO: 350 },
  },
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
  Altamira: {
    Sucursales: { "FTL 53'": 3500, "RABON 20'": 2500, '3.5 T': 1900, CONSOLIDADO: 850 },
  },
  Manzanillo: {
    Sucursales: { "FTL 53'": 3500, "RABON 20'": 2500, '3.5 T': 1900, CONSOLIDADO: 850 },
  },
};

export function getRutaImpo(aduana, destino) {
  return RUTAS_IMPO_ADUANA_SUCURSAL[aduana]?.[destino] ?? null;
}
