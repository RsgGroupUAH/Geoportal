import { map } from "./map-layers.js";


// Descripción: Este archivo contiene las operaciones que se pueden aplicar a las capas raster.

//Metodo que recibe dos capas raster y un nombre de operacion y devuelve la capa resultante de aplicar la operacion
async function applyRasterOperation(raster1, raster2, operation, layerName) {


    // Definir la operación para combinar las fuentes raster
    function rasterOperation(pixels, data) {
        const pixel1 = pixels[0];
        const pixel2 = pixels[1];
        const result = pixel1.map((value, index) => value + pixel2[index]); // Ejemplo de suma de píxeles
        return result;
    }

    // Crear la fuente raster con la operación
    const rasterSource = new ol.source.Raster({
        sources: [raster1.getSource(), raster2.getSource()],
        operation: rasterOperation,
        operationType: 'pixel',
    });

    // Crear una nueva capa raster con los resultados de las operaciones
    /*  const resultLayer = new ol.layer.WebGLTile({
         title: layerName,
         source: rasterSource,
         style: {
             color: [
                 'interpolate',
                 ['linear'],
                 ['band', 1],
                 0, [0, 0, 0, 0],
                 0.05, [0, 114, 6, 1],
                 2.0, [252, 9, 9, 1]
             ]
         },
         tilePixelRatio: 1,
         interpolate: false,
         tileGrid: raster1.getSource().getTileGrid(),
     }); */

    // Crear una capa Image usando la fuente raster
    const resultLayer = new ol.layer.Image({
        source: new ol.source.ImageStatic({
            imageExtent: raster1.getSource().getProjection().getExtent(),
            projection: raster1.getSource().getProjection(),
            imageLoadFunction: function (image, src) {
                const context = image.context_;
                const width = image.getImage().width;
                const height = image.getImage().height;
                const data = rasterSource.getImageData(0, 0, width, height);
                context.putImageData(data, 0, 0);
            }
        })
    });

    //Añadimos la capa al mapa
    map.addLayer(resultLayer);
}

function sumBands(band1, band) {

    return band1.map((value, index) => value + band[index]);

}

//metodo que lista todas las capas  del mapa
export const listRasterLayers = function () {
    let rasterLayers = [];
    map.getLayers().forEach(function (layer) {
        //compruebo que es una capa no vectorial
        if (layer.getVisible() && layer.get('title') !== undefined) {
            rasterLayers.push(layer);
        }
    });
    return rasterLayers;
};

//metodo que en el onclick del boton de realizar operacion recoje el valor de todos los select con la operacion y las capas raster y llama al método de applyOperation
export const applyOperation = function () {
    // Recojo los valores de los select
    const operation = document.getElementById('operation-type').value;
    const layer1 = document.getElementById('operation-layer-one').value;
    const layer2 = document.getElementById('operation-layer-two').value;


    // Obtengo las capas raster seleccionadas
    const raster1 = map.getLayers().getArray().find(layer => layer.get('title') === layer1);
    const raster2 = map.getLayers().getArray().find(layer => layer.get('title') === layer2);

    // Obtengo el nombre de la capa resultante
    const layerName = raster1.get('title') + ' ' + operation + ' ' + raster2.get('title');

    // Llamo al método de applyOperation
    applyRasterOperation(raster1, raster2, operation, layerName);
};
// Función para obtener los datos de los canales de una capa raster
async function getRasterData(layer) {
    const source = layer.getSource();
    const blob = source.sourceImagery_[0][0].source.file;
    const arrayBuffer = await blob.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);

    // Obtener la imagen del GeoTIFF
    const rasters = await tiff.readRasters();
    return rasters;
}



const performOperationButton = document.getElementById('perform-operation');
performOperationButton.addEventListener('click', applyOperation);