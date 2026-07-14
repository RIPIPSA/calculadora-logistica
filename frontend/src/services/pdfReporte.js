import { jsPDF } from 'jspdf';
import logoRipipsaPng from '../assets/logo.png';

const formatoUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * jsPDF no acepta directamente la URL que da el import de Vite: hay que
 * cargarla como imagen real y pasarla como data URL (o como
 * HTMLImageElement). Se dibuja en un <canvas> oculto solo para leer los
 * bytes; nunca se inserta ese canvas en la página.
 */
function cargarImagenComoDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('No se pudo cargar el logo.'));
    img.src = url;
  });
}

/**
 * Genera y descarga el PDF del resumen de costo logístico.
 *
 * @param {object} datos
 * @param {string} datos.generadoPor - nombre del usuario (ver nota abajo)
 * @param {object} datos.state - estado del wizard (sucursal, destino, proveedor, etc.)
 * @param {object} datos.resultado - resultado de calcularCostoLogistico
 *
 * Nota sobre "generadoPor": hoy viene del usuario con el que se hizo login
 * (username de Epicor), no de su nombre completo — el TokenResource.svc que
 * están usando solo regresa un token, no el nombre de la persona. En cuanto
 * se resuelva el acceso a Epicor, hay que confirmar qué endpoint de Epicor
 * regresa el nombre completo del usuario para reemplazar ese único punto
 * (ver AuthContext.jsx).
 *
 * Nota: se pidió explícitamente NO incluir folio consecutivo en el PDF
 * (se había construido en services/folio.js, ya eliminado; si más
 * adelante se retoma, el patrón sigue documentado en el historial del
 * proyecto — bastaría un contador y agregar de nuevo esa línea aquí).
 */
export async function generarPdfResultado({ generadoPor, state, resultado }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margenX = 48;
  const anchoPagina = doc.internal.pageSize.getWidth();
  let y = 56;

  // Logo arriba a la derecha. Si por lo que sea no carga (ambiente sin
  // el archivo, fallo de red, etc.), seguimos generando el PDF sin logo
  // en vez de tronar la descarga completa por esto.
  try {
    const { dataUrl, width, height } = await cargarImagenComoDataUrl(logoRipipsaPng);
    const altoLogo = 32;
    const anchoLogo = (width / height) * altoLogo;
    doc.addImage(dataUrl, 'PNG', anchoPagina - margenX - anchoLogo, 28, anchoLogo, altoLogo);
  } catch (err) {
    console.warn('No se pudo agregar el logo al PDF:', err);
  }

  doc.setFontSize(18);
  doc.setTextColor(0, 60, 108); // --color-primary-dark
  doc.text('Cálculo de Costo Logístico', margenX, y);

  doc.setFontSize(10);
  doc.setTextColor(65, 66, 71); // --color-text-muted
  y += 20;
  doc.text(`Generado por: ${generadoPor}`, margenX, y);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 320, y);

  y += 28;
  doc.setDrawColor(209, 204, 204); // --color-border
  doc.line(margenX, y, 564, y);
  y += 24;

  doc.setFontSize(12);
  doc.setTextColor(15, 15, 15);
  doc.text('Datos del embarque', margenX, y);
  y += 18;

  doc.setFontSize(10);
  doc.setTextColor(65, 66, 71);
  const filasDatos = [
    ['Sucursal', state.sucursal],
    ['Destino', state.destino],
    ['Proveedor', state.proveedor],
    ['Aduana', state.aduana],
    ['Agencia aduanal', resultado.agencia?.agencia ?? '—'],
    ['Producto', state.producto],
    ['Valor de mercancía', formatoUSD.format(Number(state.valorMercancia) || 0)],
    ['Certificado de origen', state.certificadoOrigen],
    ['Tasa IGI', `${Number(state.tasaIgiPorcentaje).toFixed(1)}%`],
    ['Tipo de embarque', resultado.tipoEmbarque],
  ];
  filasDatos.forEach(([label, valor]) => {
    doc.setTextColor(101, 101, 101);
    doc.text(`${label}:`, margenX, y);
    doc.setTextColor(15, 15, 15);
    doc.text(String(valor ?? '—'), margenX + 150, y);
    y += 16;
  });

  y += 12;
  doc.setDrawColor(209, 204, 204);
  doc.line(margenX, y, 564, y);
  y += 24;

  doc.setFontSize(12);
  doc.setTextColor(15, 15, 15);
  doc.text('Resumen de costos', margenX, y);
  y += 18;

  const filasCosto = [
    ['Flete Proveedor (Costo 1)', resultado.resumen.fleteProveedor],
    ['Flete de Importación (Costo 2)', resultado.resumen.fleteImportacion],
    ['Bodega y Recinto (Costo 3)', resultado.resumen.bodegaYRecinto],
    ['Honorarios A.A. (Costo 4)', resultado.resumen.honorariosAA],
    ['Impuestos - DTA + IGI (Costo 5)', resultado.resumen.impuestos],
  ];

  doc.setFontSize(10);
  filasCosto.forEach(([label, monto]) => {
    doc.setTextColor(65, 66, 71);
    doc.text(label, margenX, y);
    doc.setTextColor(15, 15, 15);
    doc.text(formatoUSD.format(monto), 470, y, { align: 'right' });
    y += 18;
  });

  y += 8;
  doc.setDrawColor(0, 159, 227); // --color-primary
  doc.setLineWidth(1.2);
  doc.line(margenX, y, 564, y);
  y += 20;

  doc.setFontSize(13);
  doc.setTextColor(0, 60, 108);
  doc.text('Costo logístico total', margenX, y);
  doc.text(formatoUSD.format(resultado.resumen.costoLogisticoTotal), 470, y, { align: 'right' });

  if (resultado.huboPD) {
    y += 30;
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // --color-warning
    doc.text('* Alguna tarifa de esta combinación todavía no está cargada en el catálogo (PD).', margenX, y);
  }

  doc.save(`ripipsa-costo-logistico-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`);
}
