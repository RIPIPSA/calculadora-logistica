// Fuente: hoja "Sucursal, Aduana, Proveedor" A103:D112
// La Agencia Aduanal NO es un campo que el usuario deba elegir libremente:
// se deriva siempre de la Aduana seleccionada (así lo confirma la fórmula
// P39 de GUIALOG, una cadena de SI(...) que busca P38 en esta misma tabla).

export const AGENCIA_POR_ADUANA = {
  'El Paso': {
    zona: 'A',
    clave: 'A1, A3, A4',
    agencia: 'MARON'
  },
  Laredo: {
    zona: 'B',
    clave: 'B2, B3',
    agencia: 'GRUPO 1780'
  },
  Nogales: {
    zona: 'C',
    clave: 'C4',
    agencia: 'PRL'
  },
  'San Diego': {
    zona: 'D',
    clave: 'D5',
    agencia: 'SICA'
  },
  Monterrey: {
    zona: 'E',
    clave: 'E2,E3',
    agencia: 'PALCO'
  },
  AICM: {
    zona: 'F',
    clave: 'F3',
    agencia: 'PALCO'
  },
  'Cd. Juarez': {
    zona: 'G',
    clave: 'G1, G2, G3',
    agencia: 'MARON'
  },
  Tijuana: {
    zona: 'H',
    clave: 'H4, H5',
    agencia: 'SICA'
  },
  Altamira: {
    zona: 'I',
    clave: 'I1, I2, I3, I4, I5',
    agencia: 'PALCO'
  },
  Manzanillo: {
    zona: 'J',
    clave: 'J1, J2, J3, J4, J5',
    agencia: 'ALIANZA'
  },
};

export function getAgenciaAduanal(aduana) {
  return AGENCIA_POR_ADUANA[aduana] ?? null;
}
