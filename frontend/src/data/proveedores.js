// Fuente: hoja "Proveedor, Mercancia" A6:G11 + rangos con nombre
// DORNER, HYTROL, SOUTHWORTH, MIR, UR, INTECHMOTION.
//
// Nota (confirmado por el cliente): Qimarox, OnRobot, Robotiq, Dellner e
// Italvibras existen como marcas en otros catálogos del libro, pero no
// tienen un rango de productos propio todavía. Se dejan contempladas en
// el catálogo con lista de productos vacía a propósito ("está bien que
// quede vacío, después podremos llenarlo"): la UI debe deshabilitar el
// combo de Producto y mostrar un mensaje, nunca dejarlo abierto a texto libre.

export const PROVEEDORES = [
  'Dorner',
  'Hytrol',
  'Southworth',
  'MiR',
  'UR',
  'Intechmotion',
  'Qimarox',
  'OnRobot',
  'Robotiq',
  'Dellner',
  'Italvibras',
];

export const PRODUCTOS_POR_PROVEEDOR = {
  Dorner: [
    'Transportador de banda con accesorios',
    'Banda de plastico con refuerzo textil',
    'Motorreductor',
    'Partes para transportador',

  ],
  Hytrol: [
    'Partes para transportador',
    'Transportador de banda con accesorios',
    'Transportador de gravedad con accesorios',
    'Transportador de rodillos con accesorios',
    'Rodillo para transportador',
    'Banda transportadora de plástico',

  ],
  Southworth: [
    'Mesa de elevación con sus accesorios',
    'Carretilla manual con sistema de elevacion ',

  ],
  MiR: [
    'Cargador de baterías 48v 12a',
    'Juego de baterías recargables de litio con sus accesorios para instalación',
    'Robot industrial para manipulación de mercancia con sus accesorios',
    'Partes para robot industrial',
    'Circuitos Modulares',

  ],
  UR: [
    'Brazo robotico para uso industrial con accesorios para su instalacion y funcionamiento',
    'Partes para robot industrial',
  ],
  Intechmotion: [
    'Transportador de cadena plástica',
    'Perfil de aluminio',
  ],
  Qimarox: [],
  OnRobot: [],
  Robotiq: [],
  Dellner: [],
  Italvibras: [],
};
