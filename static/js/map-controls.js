import { map,createLayerLeyendPanel, destroyLayerLegendPanel } from "./map-layers.js";
import {eraseFeatures} from "./map-drawing.js";
import {listRasterLayers} from "./map-operations.js";

/**
 * @fileoverview Este archivo contiene las funciones que controlan los controles del mapa, como la escala, el zoom, la posición del ratón, la leyenda, etc.
 */

//Añade Layer Switcher
map.addControl(new ol.control.LayerSwitcher({ 
  trash: true, 
  extent: true,
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Leyenda', // Optional label for button
}));

//Se declara linea de escala
const scale = new ol.control.ScaleLine({
});

//SE añade linea de escala al mapa
map.addControl(scale)

//SE declara  Zoom control 
const zoom = new ol.control.ZoomSlider({
});

//Se añade zoom control al mapa
map.addControl(zoom)

//Estilo de posición raton
const mouseStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '14px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),

});

 //SE declara elemento de posicion del raton
const mousePos = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.createStringXY(4),
  projection: 'EPSG:25830',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

//Se añade control al mapa para gestionar posicion el raton
map.addControl(mousePos)

const projectionSelect = document.getElementById('projection');
projectionSelect.addEventListener('change', function (event) {
  mousePos.setProjection(event.target.value);
});

//Se añade evento para mostrar u ocultar la posición del ratón
const positionButton = document.getElementById('position-button');
positionButton.addEventListener('click', function (event) {
  var container = document.getElementById('position-container');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
  }
 
});

//Se añade evento para mostrar u ocultar la impresion en pdf
const printButton = document.getElementById('print-button');
printButton.addEventListener('click', function (event) {
  var container = document.getElementById('export_pdf');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
  }
 
});

//Se añade evento para mostrar u ocultar la leyenda y la visualización de valores
const valueButton = document.getElementById('value-button');
valueButton.addEventListener('click', function (event) {
  const container = document.getElementById('value_layer');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
    createLayerLeyendPanel();
  }else{
    container.className = container.className + ' hidden';
    destroyLayerLegendPanel();
  }
 
});

//Se añade evento para mostrar u ocultar el panel de herramientas de dibujo y medidas
const toolsButton = document.getElementById('tools-button');
toolsButton.addEventListener('click', function (event) {
  var container = document.getElementById('tools-panel');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
    eraseFeatures;
  }
 
});

//Se añade evento para mostrar u ocultar el panel de contacto
const contactButton = document.getElementById('contact-button');
contactButton.addEventListener('click', function (event) {
  var container = document.getElementById('contact-panel');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
  }
 
});

//Se añade evento para mostrar u ocultar el panel de información
const infoButton = document.getElementById('info-button');
infoButton.addEventListener('click', function (event) {
  var container = document.getElementById('info-panel');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
  }
 
});

//Se añade evento para mostrar u ocultar el panel de operaciones con WCS
const wcsButton = document.getElementById('wcs-operations-button');
wcsButton.addEventListener('click', function (event) {
  var container = document.getElementById('wcs-operations-panel');
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
    //añado todas las capas raster a los inputs
    //Se queda comentado para futuras operaciones con WCS
    /* var rasterLayers = listRasterLayers();
    var select1 = document.getElementById('operation-layer-one');
    var select2 = document.getElementById('operation-layer-two');
    rasterLayers.forEach(layer => {
      var option1 = document.createElement("option");
      option1.text = layer.get('title');
      option1.value = layer.get('title');
      select1.add(option1);
      var option2 = document.createElement("option");
      option2.text = layer.get('title');
      option2.value = layer.get('title');
      select2.add(option2);
    }); */
  }else{
    container.className = container.className + ' hidden';
  }
 
});

//Se añade evento a los botones de cerrar de los paneles de información, contacto, herramientas, valores y operaciones
const closeInfoButton = document.getElementById('close-info-button');
closeInfoButton.addEventListener('click', function (event) {
  closeElement(this);
 
});

const closeContactButton = document.getElementById('close-contact-button');
closeContactButton.addEventListener('click', function (event) {
  closeElement(this);
 
});

const closeToolsButton = document.getElementById('close-tools-button');
closeToolsButton.addEventListener('click', function (event) {
  closeElement(this);
 
});
const closeValueButton = document.getElementById('close-value-button');
closeValueButton.addEventListener('click', function (event) {
  var container = document.getElementById('value_layer');
  container.className = container.className + ' hidden';
  destroyLayerLegendPanel();
 
});

const closeOperationsButton = document.getElementById('close-operations-button');
closeOperationsButton.addEventListener('click', function (event) {
  //limpio los inputs
  var select1 = document.getElementById('operation-layer-one');
  var select2 = document.getElementById('operation-layer-two');
  select1.innerHTML = "";
  select2.innerHTML = "";
  
  closeElement(this);
});

function closeElement(element){
  var container = element.parentNode.parentNode.parentNode;
  if(container.className.includes("hidden")){
    container.className = container.className.replace("hidden","");
  }else{
    container.className = container.className + ' hidden';
  }
}