// Fuente: hoja "Sucursal, Aduana, Proveedor" A6:A17 (sucursales) y B87:M98
// (tabla de correlación Aduanas por Sucursal). Cada sucursal solo debe
// mostrar en su combo de "Aduana" las aduanas que de verdad le corresponden.

export const SUCURSALES = [
  'Chihuahua',
  'Juarez',
  'Saltillo',
  'Torreon',
  'Monterrey',
  'CDMX',
  'Puebla',
  'Nogales',
  'Hermosillo',
  'Mexicali',
  'Tijuana',
];

// destino -> lista de aduanas válidas (cascada: se filtra el combo de Aduana
// según el destino elegido, igual que el rango con nombre INDIRECT en Excel)
export const ADUANAS_POR_DESTINO = {
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

// Zona por sucursal (hoja "Sucursal, Aduana, Proveedor" B6:B16)
export const ZONA_POR_SUCURSAL = {
  Chihuahua: 1,
  Juarez: 1,
  Saltillo: 2,
  Torreon: 2,
  Monterrey: 2,
  CDMX: 2,
  Puebla: 3,
  Nogales: 4,
  Hermosillo: 4,
  Mexicali: 5,
  Tijuana: 5,
};
