// Fuente: hoja "Bodega, Recinto, A.A."
// A29:G38 -> tarifa de bodega/recinto según franja de peso (<1000, 1000-2000, >2000)
export const TARIFA_BODEGA_POR_ADUANA = {
  'El Paso': { min: 200, medio: 250, alto: 400 },
  Laredo: { min: 400, medio: 550, alto: 700 },
  Nogales: { min: 200, medio: 250, alto: 400 },
  'San Diego': { min: 230, medio: 350, alto: 750 },
  Monterrey: { min: 138.89, medio: 194.44, alto: 250 },
  AICM: { min: 138.89, medio: 194.44, alto: 250 },
  'Cd. Juarez': { min: 61.11, medio: 105.56, alto: 138.89 },
  Tijuana: { min: 61.11, medio: 105.56, alto: 138.89 },
  Altamira: { min: 5000 / 18, medio: 7000 / 18, alto: 9000 / 18 },
  Manzanillo: { min: 5000 / 18, medio: 7000 / 18, alto: 9000 / 18 },
};

export function calcularCostoBodega(aduana, pesoLbs) {
  const t = TARIFA_BODEGA_POR_ADUANA[aduana];
  if (!t) return null;
  if (pesoLbs < 1000) return t.min;
  if (pesoLbs < 2000) return t.medio;
  return t.alto;
}

// A45:E54 -> honorarios de Agencia Aduanal como función del Valor Aduana (A6)
export function calcularHonorariosAA(aduana, valorAduana) {
  switch (aduana) {
    case 'El Paso':
      return 0.0035 * valorAduana + 40 + 80;
    case 'Laredo':
      return 180 + 0.0045 * valorAduana;
    case 'Nogales':
      return valorAduana * 0.0125 + 116;
    case 'San Diego':
    case 'Tijuana':
      if (valorAduana < 5000) return 160;
      if (valorAduana < 8000) return 167;
      if (valorAduana < 10000) return 197;
      if (valorAduana < 12000) return 233;
      if (valorAduana < 15000) return 260;
      if (valorAduana < 25000) return 321;
      return valorAduana * 0.005;
    case 'Monterrey':
    case 'AICM':
      return 180 + 0.003 * valorAduana + 60 + 60;
    case 'Cd. Juarez':
      return 0.006 * valorAduana + 40 + 80;
    case 'Altamira':
    case 'Manzanillo':
      return 300 + 0.003 * valorAduana + 180 + 60;
    default:
      return null;
  }
}
