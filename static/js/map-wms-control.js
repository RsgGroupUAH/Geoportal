import { map } from "./map-layers.js";
// http services load on http
/* if (location.protocol === 'https:' && !/^localhost/.test(location.host)) {
  location.href = window.location.href.replace(/^https:/,'http:');
} */

var parent = document.getElementById('layer-control-parent');

map.addControl(new ol.control.LayerSwitcher({ 
  trash: true, 
  extent: true,
}));
var plink = new ol.control.Permalink({ visible: false, localStorage: 'position' });
map.addControl(plink);
map.addControl(new ol.control.SearchNominatim({ zoomOnSelect: 13 }));
if (plink.hasUrlParam('edugeo')) $('.options button').show();

var cap = new ol.control.WMSCapabilities({ 
  target: $('.options').get(0),
  cors: true,
  optional: 'token',
  services: {
    'UAH-geoserver': 'http://geoserver.uah.es:8080/geoserver/ows?',
    'IDEE COPERNICUS': 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
    'CODIGOS POSTALES': 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp',
    'IDEE HIDROGRAFIA': 'https://servicios.idee.es/wms-inspire/hidrografia',
    'IGN': 'https://www.ign.es/wms-inspire/ign-base',
    'TOPOGRAFIA': 'https://servicios.idee.es/wms-inspire/mdt',
    'SATELITE HISTORICOS':'https://wms-satelites-historicos.idee.es/satelites-historicos',
    'OCUPACION DE SUELO':'https://servicios.idee.es/wms-inspire/ocupacion-suelo',
    'TRANSPORTE': 'https://servicios.idee.es/wms-inspire/transportes',
    'EOX':'https://tiles.maps.eox.at/wms?',
    'GEBCO':'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv',
  },
  // Show trace in the console
  trace: true
});
map.addControl(cap);

cap.on('load', function(e) {
  map.addLayer(e.layer);
  e.layer.set('legend', e.options.data.legend);
  plink.setUrlParam('url', e.options.source.url);
  plink.setUrlParam('layer', e.options.source.params.LAYERS);
});