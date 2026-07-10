// Fuente: hoja "Fraccion Arancelaria" D10:E119.
// GUIALOG busca la Tasa IGI con MATCH sobre la columna D (Descripción en
// pedimento) y toma la PRIMERA coincidencia. Cuando el mismo texto aparece
// más de una vez con tasas distintas, replicamos ese mismo comportamiento:
// se respeta el primer registro en el orden original del catálogo.

export const FRACCIONES = [
  { descripcion: 'Acoplamiento flexible para embrague', fraccion: 8483609900, tasaIgi: 0.10 },
  { descripcion: 'Manufactura de aluminio', fraccion: 7616999999, tasaIgi: 0.15 },
  { descripcion: 'Robot industrial para manipulación de mercancia con sus accesorios', fraccion: 8428700100, tasaIgi: 0.15 },
  { descripcion: 'Mesa de elevación con sus accesorios', fraccion: 8428909999, tasaIgi: 0.15 },
  { descripcion: 'Carretilla manual con sistema de elevacion', fraccion: 8427909100, tasaIgi: 0.15 },
  { descripcion: 'Manufactura de metal', fraccion: 7326909999, tasaIgi: 0.25 },
  { descripcion: 'Tornillos con diámetro igual o superior a 19.1 mm (¾ pulgada) y longitud igual o superior a 152.4 mm', fraccion: 7318159908, tasaIgi: 0.25 },
  { descripcion: 'Tornillos con diámetro igual o superior a 19.1 mm (¾ pulgada) y longitud inferior a 152.4 mm', fraccion: 7318159907, tasaIgi: 0.25 },
  { descripcion: 'Malla de acero galvanizado soldado en punto de cruce revestida de plástico', fraccion: 7314420100, tasaIgi: 0.25 },
  { descripcion: 'Perfil de aluminio', fraccion: 7604210100, tasaIgi: 0.25 },
  { descripcion: 'Transportador de cadena plástica', fraccion: 8428399999, tasaIgi: 0 },
  { descripcion: 'Transportador de banda con accesorios', fraccion: 8428339100, tasaIgi: 0 },
  { descripcion: 'Banda de plastico con refuerzo textil', fraccion: 3926909902, tasaIgi: 0 },
  { descripcion: 'Motorreductor', fraccion: 8483400999, tasaIgi: 0 },
  { descripcion: 'Partes para transportador', fraccion: 8431399900, tasaIgi: 0 },
  { descripcion: 'Banda transportadora de plástico', fraccion: 3926909902, tasaIgi: 0 },
  { descripcion: 'Transportador de gravedad con accesorios', fraccion: 8428399999, tasaIgi: 0 },
  { descripcion: 'Transportador de rodillos con accesorios', fraccion: 8428399999, tasaIgi: 0 },
  { descripcion: 'Rodillo para transportador', fraccion: 8431399900, tasaIgi: 0 },
  { descripcion: 'Motor electrico', fraccion: 8501519999, tasaIgi: 0 },
  { descripcion: 'Motovibrador electrico', fraccion: 8501519999, tasaIgi: 0 },
  { descripcion: 'Circuitos Modulares', fraccion: 8543900100, tasaIgi: 0 },
  { descripcion: 'Cargador de baterías 48v 12a', fraccion: 8504401500, tasaIgi: 0 },
  { descripcion: 'Juego de baterías recargables de litio con sus accesorios para instalación', fraccion: 8507600100, tasaIgi: 0 },
  { descripcion: 'Modulo de control para brazo robotico', fraccion: 8479901899, tasaIgi: 0 },
  { descripcion: 'Partes para robot industrial', fraccion: 8479901899, tasaIgi: 0 },
  { descripcion: 'Transportador vertical de mercancias', fraccion: 8428399999, tasaIgi: 0 },
  { descripcion: 'Brazo robotico para uso industrial con accesorios para su instalacion y funcionamiento', fraccion: 8479500100, tasaIgi: 0 },
];

export function getTasaIgi(descripcionProducto) {
  const found = FRACCIONES.find((f) => f.descripcion === descripcionProducto);
  return found ? found.tasaIgi : null;
}
