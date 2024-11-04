import { map } from "./map-layers.js";


class WCSCapabilities {
    constructor(options) {
        this.map = options.map;
        this.services = options.services;
        this.container = document.getElementById(options.containerId);
        this.init();
    }

    init() {
        const select = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select a WCS service or enter URL';
        defaultOption.value = '';
        select.appendChild(defaultOption);

        this.services.forEach(service => {
            const option = document.createElement('option');
            option.textContent = service.name;
            option.value = service.url;
            select.appendChild(option);
        });

        select.onchange = () => {
            const url = select.value;
            if (url) {
                this.getCapabilities(url);
            } else {
                const listToClear = document.getElementsByClassName('wcs-capabilities-panel-container');

                for (var i = 0; i < listToClear.length; i++) {
                    listToClear[i].innerHTML = '';
                }
            }
        };

        this.container.appendChild(select);
    }

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

    parseWCSCapabilities(xmlDoc, url) {
        const layers = [];
        const coverageSummaries = xmlDoc.getElementsByTagName('wcs:CoverageSummary');
        for (let i = 0; i < coverageSummaries.length; i++) {
            const coverage = coverageSummaries[i];
            const title = coverage.getElementsByTagName('ows:Title')[0].textContent;
            const identifier = coverage.getElementsByTagName('wcs:CoverageId')[0].textContent;
            const serviceUrl = url;
            layers.push({ title, identifier, coverage, serviceUrl });
        }
        return { layers };
    }


    showLayers(layers) {
        var generalContainer = document.createElement('div');
        generalContainer.className = 'wcs-capabilities-panel-container';
        generalContainer.id = 'wcs-capabilities-panel-container';
        this.container.appendChild(generalContainer);
        var listContainer = document.getElementById('raster-layer-list');
        if (listContainer == null) {
            listContainer = document.createElement('div');
            listContainer.className = 'raster-layer-list wcs-select-list';
            listContainer.id = 'raster-layer-list';

        } else {
            listContainer.innerHTML = '';
        }

        layers.layers.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'level-0 raster-layer-item';
            layerDiv.textContent = layer.title;
            //TODO: Add event listener to preview layer
            /* layerDiv.onclick = () => this.previewLayer(layer); */
            //cada vez que se hace click en un layerDiv se le añade el class selected y se le quita a todos los otros layerDiv
            layerDiv.onclick = function (e) {
                var selected = document.getElementsByClassName('raster-layer-item selected');
                for (var i = 0; i < selected.length; i++) {
                    selected[i].classList.remove('selected');
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
            var selectedLayer = layers.layers.find(layer => layer.title === document.querySelector('.raster-layer-item.selected').textContent);
            event.stopPropagation();
            this.loadLayer(selectedLayer);
        };

        generalContainer.appendChild(listContainer);
        generalContainer.appendChild(loadButton);
    }


    previewLayer(layer) {
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const wcsUrl = `${this.WCSCapabilities.ServiceURL}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${layer.Identifier}&format=image/png&subset=Lat(${extent[1]},${extent[3]})&subset=Long(${extent[0]},${extent[2]})`;
        const img = new Image();
        img.src = wcsUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            const imageData = context.getImageData(0, 0, img.width, img.height);

            const rasterLayer = new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    url: canvas.toDataURL(),
                    imageExtent: extent
                })
            });

            this.map.addLayer(rasterLayer);
        };
    }

    showLegend(layer) {
        const legendUrl = `${layer.serviceUrl}?service=WMS&version=1.3.0&request=GetLegendGraphic&layer=${layer.Identifier}&format=image/png`;
        const img = new Image();
        img.src = legendUrl;
        this.container.appendChild(img);
    }

    loadLayer(layer) {
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const projection = this.map.getView().getProjection().getCode();
        let subsetX, subsetY;

        if (projection === 'EPSG:4326') {
            subsetX = 'Long';
            subsetY = 'Lat';
        } else {
            subsetX = 'E';
            subsetY = 'N';
        }

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
                
                // Crear una fuente GeoTIFF
                const source = new ol.source.GeoTIFF({
                    sources: [
                        {
                            blob: blob,
                        },
                    ],
                    normalize: false, // Asegúrate de que la normalización esté desactivada si no es necesaria
                });

                // Crear una capa de raster usando la fuente GeoTIFF
                const rasterLayer = new ol.layer.WebGLTile({
                    title: layer.title,
                    source: source,
                    style: {
                        color: [
                            'interpolate',
                            ['linear'],
                            ['band', 1],
                            0, [0, 0, 0, 0], // Transparente para valores menores que 0
                            0.05, [0, 114, 6, 1], // Color inicial de Viridis
                            2.0, [252, 9, 9, 1] // Color final de Viridis
                        ]
                    },
                    // Configurar la interpolación del tipo vecino más cercano
                    tileGrid: source.getTileGrid(),
                    tilePixelRatio: 1,
                    interpolate: false,

                });

                // Añadir la capa al mapa
                this.map.addLayer(rasterLayer);
                hideLoader(); // Ocultar el loader después de que la solicitud se complete
            })
            .catch(error => {
                console.error(error);
                hideLoader(); // Ocultar el loader si la solicitud falla
            });
    }

}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Inicializar el componente WCSCapabilities
const wcsCapabilities = new WCSCapabilities({
    map: map,
    containerId: 'wcs-capabilities-panel',
    services: [
        { name: 'GeoServer WCS', url: 'http://geoserver.uah.es:8080/geoserver/ows' }
    ]
});


