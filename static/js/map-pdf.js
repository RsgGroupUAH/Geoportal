import { map } from "./map-layers.js";

/**
 * @fileoverview Este archivo contiene las funciones que controlan la exportación de mapas a PDF.
 */
const exportButton = document.getElementById('export-pdf-button');

const dims = {
    a4: [297, 210],
    a5: [210, 148],
  };

// Evento de click en el botón de exportar
exportButton.addEventListener(
  'click',
  function () {
    // Deshabilitar el botón de exportar y cambiar el cursor
    exportButton.disabled = true;
    document.body.style.cursor = 'progress';

    // Obtener el formato y la resolución del PDF
    const format = document.getElementById('format').value;
    const resolution = document.getElementById('resolution').value;
    const dim = dims[format];
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const size = map.getSize();
    const viewResolution = map.getView().getResolution();

    // Evento de render completo
    map.once('rendercomplete', function () {
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        function (canvas) {
          if (canvas.width > 0) {
            const opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const transform = canvas.style.transform;
            // Obtener los parámetros de transformación de la matriz de transformación del estilo
            const matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Aplicar la transformación al contexto del mapa de exportación
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix
            );
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      let pdf = new jspdf.jsPDF('landscape', undefined, format);
      
      pdf.addImage(
        mapCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        dim[0],
        dim[1]
      );
      pdf = addWaterMark(pdf);
      pdf.save('map.pdf');
      // Restablecer el tamaño del mapa
      map.setSize(size);
      map.getView().setResolution(viewResolution);
      exportButton.disabled = false;
      document.body.style.cursor = 'auto';
    });

    // Establecer el tamaño del mapa para la impresión
    const printSize = [width, height];
    map.setSize(printSize);
    const scaling = Math.min(width / size[0], height / size[1]);
    map.getView().setResolution(viewResolution / scaling);
  },
  false
);
/**
 * Añadir marca de agua al PDF
 * @param {*} doc 
 * @returns 
 */
function addWaterMark(doc) {
  var totalPages = doc.internal.getNumberOfPages();
  var i = 0;
  for (i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(255);
    doc.addImage('static/images/rsg.png', 'PNG', 10, doc.internal.pageSize.height - 20, 10, 10); // add image
  }

  return doc;
}