import { map } from "./map-layers.js";
/**
 * @fileoverview Este archivo contiene las funciones que controlan el control de capas WCS.
 */

//Se declara clase WCSCapabilities
class WCSCapabilities {
    constructor(options) {
        this.map = options.map;
        this.services = options.services;
        this.container = document.getElementById(options.containerId);
        this.init();
    }

    //Función para inicializar el componente
    init() {
        // Crear un select con las opciones de los servicios WCS
        const select = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select a WCS service or enter URL';
        defaultOption.value = '';
        select.appendChild(defaultOption);

        // Añadir las opciones de los servicios WCS al select
        this.services.forEach(service => {
            const option = document.createElement('option');
            option.textContent = service.name;
            option.value = service.url;
            select.appendChild(option);
        });

        // Añadir evento change al select
        select.onchange = () => {
            const url = select.value;
            if (url) {
                this.getCapabilities(url);
            } else {
                const listToClear = document.getElementsByClassName('wcs-capabilities-panel-container');

                for (let element of listToClear) {
                    element.innerHTML = '';
                }
            }
        };

        // Añadir el select al contenedor
        this.container.appendChild(select);
    }

    //Función para obtener las capacidades de un servicio WCS
    getCapabilities(url) {
        const capabilitiesUrl = `${url}?service=WCS&version=2.0.1&request=GetCapabilities`;
        fetch(capabilitiesUrl)
            .then(response => response.text())
            .then(text => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'application/xml');
                const layers = this.parseWCSCapabilities(xmlDoc, url);
                this.showLayers(layers);
            })
            .catch(console.error);
    }

    //Función para parsear las capacidades de un servicio WCS
    parseWCSCapabilities(xmlDoc, url) {
        const layers = [];
        const coverageSummaries = xmlDoc.getElementsByTagName('wcs:CoverageSummary');
        for (const coverage of coverageSummaries) {
            const title = coverage.getElementsByTagName('ows:Title')[0].textContent;
            const identifier = coverage.getElementsByTagName('wcs:CoverageId')[0].textContent;
            const serviceUrl = url;
            layers.push({ title, identifier, coverage, serviceUrl });
        }
        return { layers };
    }


    //Función para mostrar las capas de un servicio WCS
    showLayers(layers) {
        // Limpiar el contenedor antes de mostrar las capas
        let generalContainer = document.createElement('div');
        generalContainer.className = 'wcs-capabilities-panel-container';
        generalContainer.id = 'wcs-capabilities-panel-container';
        this.container.appendChild(generalContainer);

        // Crear un div para mostrar la lista de capas
        let listContainer = document.getElementById('raster-layer-list');
        if (listContainer == null) {
            listContainer = document.createElement('div');
            listContainer.className = 'raster-layer-list wcs-select-list';
            listContainer.id = 'raster-layer-list';

        } else {
            listContainer.innerHTML = '';
        }

        // Añadir las capas al div
        layers.layers.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'level-0 raster-layer-item';
            layerDiv.textContent = layer.title;

            //cada vez que se hace click en un layerDiv se le añade el class selected y se le quita a todos los otros layerDiv
            layerDiv.onclick = function (e) {
                let selected = document.getElementsByClassName('raster-layer-item selected');
                for (let element of selected) {
                    element.classList.remove('selected');
                }
                e.target.classList.add('selected');
            }
            listContainer.appendChild(layerDiv);
        });

        //obtengo el nombre de la capa del div hijo del div con id raster-layer-list y class selected
        const loadButton = document.createElement('input');
        loadButton.type = 'button';
        loadButton.value = 'Load Layer';
        loadButton.id = 'load-raster-layer-button';
        loadButton.className = 'operation-input operation-input-button';
        loadButton.onclick = (event) => {
            let selectedLayer = layers.layers.find(layer => layer.title === document.querySelector('.raster-layer-item.selected').textContent);
            event.stopPropagation();
            this.loadLayer(selectedLayer);
        };

        generalContainer.appendChild(listContainer);
        generalContainer.appendChild(loadButton);

        // Insertar dinámicamente los controles de estilo de capa
        const controlsContainer = document.createElement('div');
        controlsContainer.innerHTML = `
            <div class="controls">
                <label for="styleSelect">Select Style:</label>
                <select id="styleSelect">
                    <option value="rsg">RSG</option>
                    <option value="custom">Custom</option>
                </select>
                <div id="customControls" style="display: none;">
                    <label for="startColor">Start Color:</label>
                    <input type="color" id="startColor" value="#0000ff">
                    <label for="endColor">End Color:</label>
                    <input type="color" id="endColor" value="#ff0000">
                </div>
            </div>
        `;
        generalContainer.appendChild(controlsContainer);
        const styleSelect = document.getElementById('styleSelect');
        const customControls = document.getElementById('customControls');

        styleSelect.addEventListener('change', function() {
            if (styleSelect.value === 'custom') {
              customControls.style.display = 'block';
            } else {
              customControls.style.display = 'none';
            }

          });
    }

    //Función para cargar una capa raster
    loadLayer(layer) {
        //Obtener la extensión y la proyección del mapa
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const projection = this.map.getView().getProjection().getCode();
        let subsetX, subsetY;

        // Determinar los ejes de la extensión para EPSG:4326 tiene que ser Long y Lat
        if (projection === 'EPSG:4326') {
            subsetX = 'Long';
            subsetY = 'Lat';
        } else {
            subsetX = 'E';
            subsetY = 'N';
        }

        // Construir la URL de la solicitud GetCoverage
        const wcsUrl = `${layer.serviceUrl}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${layer.identifier}&format=image/tiff&subset=${subsetY}(${extent[1]},${extent[3]})&subset=${subsetX}(${extent[0]},${extent[2]})`;

        fetch(wcsUrl)
            .then(response => {
                showLoader(); // Mostrar el loader antes de realizar la solicitud
                if (!response.ok) {
                    throw new Error('Error cargando capa');
                }
                return response.blob();
            })
            .then(blob => {
                // Verificar el tipo de blob
                if (blob.type !== 'image/tiff') {
                    throw new Error('Expected image/tiff but received ' + blob.type);
                }

                initializeMap(blob,layer);
                hideLoader(); // Ocultar el loader después de que la solicitud se complete
            })
            .catch(error => {
                console.error(error);
                hideLoader(); // Ocultar el loader si la solicitud falla
            });
    }


}

// Función para obtener los datos de los canales de una capa raster
async function getRasterData(source) {
    const blob = source.sourceImagery_[0][0].source.file;
    const arrayBuffer = await blob.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);

    // Obtener la imagen del GeoTIFF
    const rasters =  await tiff.readRasters();
    return rasters;
}
// Función para esperar a que la fuente esté lista
function waitForSourceReady(source) {
    return new Promise((resolve) => {
        function checkState() {
            if (source.getState() === 'ready') {
                resolve();
            } else {
                source.once('change', checkState);
            }
        }
        checkState();
    });
}

// Función para inicializar el mapa con una capa raster
async function initializeMap(blob,layer){
    // Crear una fuente GeoTIFF
    const source = new ol.source.GeoTIFF({
        sources: [
            {
                blob: blob,
            },
        ],
        normalize: false, // Asegúrate de que la normalización esté desactivada si no es necesaria
    });
    let min = 0;
    let max = 1;
    // Esperar a que la fuente esté lista
    await waitForSourceReady(source)
    const rasters =await getRasterData(source);
    const data = rasters[0]; // Obtener los datos de la primera banda
    min = 0;
    max = data[0];
    for (let i = 1; i < data.length; i++) {
        if (data[i] > max) {
            max = data[i];
        }
    }

    // Crear una capa de raster usando la fuente GeoTIFF
    const rasterLayer = new ol.layer.WebGLTile({
        title: layer.title,
        source: source,
        style: {
            color: [
                'interpolate',
                ['linear'],
                ['band', 1],
                ...updateLayerStyle(styleSelect,min,max),
            ]
        },
        // Configurar la interpolación del tipo vecino más cercano
        tileGrid: source.getTileGrid(),
        tilePixelRatio: 1,
        interpolate: false,

    });

    // Añadir la capa al mapa
    map.addLayer(rasterLayer);
}

// Función para actualizar el estilo de la capa raster
// en función de la selección del usuario
// y los valores mínimo y máximo de los datos
// de la capa raster
// Devuelve un array con los valores de la paleta de colores
// para la capa raster
function updateLayerStyle(styleSelect,min,max) {
    let colorMap;
    if (styleSelect.value === 'rsg') {
        colorMap = [
            0, [0,0,0,0],
            0.05, [0, 114, 6, 1],
            0.1, [29, 137, 8, 1],
            0.15, [84, 161, 12, 1],
            0.2, [125, 184, 16, 1],
            0.25, [164, 184, 16, 1],
            0.3, [201, 232, 28, 1],
            0.4, [242, 254, 30, 1],
            0.5, [248, 228, 28, 1],
            0.6, [248, 228, 28, 1],
            0.8, [255, 172, 18, 1],
            1, [255, 172, 18, 1],
            1.5, [253, 104, 11, 1],
            2, [252, 9, 9, 1]
        ];
    } else {
        const startColor = document.getElementById('startColor').value;
        const endColor = document.getElementById('endColor').value;
        colorMap = generateCustomColorMap(startColor, endColor, min, max);
    }

    return colorMap;
}

// Función para convertir un color hexadecimal a RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Función para interpolar entre dos colores
function interpolateColors(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// Función para generar un mapa de colores personalizado
function generateCustomColorMap(startColor, endColor, min, max) {
    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);
    const colorMap = [[0, [0,0,0,0]]];
    for (let i = 0; i <= 20; i++) {
        const value = min + (i / 20) * (max - min); // Calcular el valor en el rango
        const factor = i / 20; // Factor de interpolación
        const color = interpolateColors(startRgb, endRgb, factor); // Interpolar el color
        colorMap.push([value, color.concat([1])]); // Añadir el color interpolado al colorMap
    }
    return colorMap.flat();
}
// Función para mostrar el loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Función para ocultar el loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Inicializar el componente WCSCapabilities
const wcsCapabilities = new WCSCapabilities({
    map: map,
    containerId: 'wcs-capabilities-panel',
    services: [
        { name: 'GeoServer WCS', url: 'http://localhost/geoserver/ows' }
    ]
});



