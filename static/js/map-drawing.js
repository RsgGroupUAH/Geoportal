import { map } from "./map-layers.js";

/**
 * @fileoverview Este archivo contiene las funciones que controlan el dibujo de geometrías en el mapa.
 * y de medidas.
 */

//se obtiene check de activar dibujo
const checkbox = document.getElementById('activeDrawing');
//se obtiene check de activar dibujo a mano alzada
const checkboxFreeHand = document.getElementById('freeHand');

//se declara fuente de vector para dibujo
const drawingSourceVector = new ol.source.Vector();
//se declara capa de vector para dibujo
const drawingVectorLayer = new ol.layer.Vector({
  source: drawingSourceVector,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.2)',
    'stroke-color': '#ffcc33',
    'stroke-width': 2,
    'circle-radius': 7,
    'circle-fill-color': '#ffcc33',
  },
});
drawingVectorLayer.setZIndex(1000);
map.addLayer(drawingVectorLayer);

// Limitar el desplazamiento multi-mundo a un mundo al este y al oeste del mundo real.
// Las coordenadas de la geometría deben estar dentro de ese rango.
const extent = ol.proj.get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];

// Crear un nuevo dibujo
const modify = new ol.interaction.Modify({source: drawingSourceVector});

// Añadir interacción de modificación al mapa
map.addInteraction(modify);
let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById('drawType');

/**
 * Añadir interacciones al mapa
 */
function addInteractions() {
  draw = new ol.interaction.Draw({
    source: drawingSourceVector,
    type: typeSelect.value,
    freehand: checkboxFreeHand.checked,
  });

  if(checkbox.checked){
    map.addInteraction(draw);
    snap = new ol.interaction.Snap({source: drawingSourceVector});
    map.addInteraction(snap);
  }

}

/**
 * manjear cambio de tipo de dibujo
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  if(checkbox.checked){
    addInteractions();
  }
};

// Evento para activar o desactivar dibujo
checkbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    addInteractions();
  } else {
    map.removeInteraction(draw); 
  }
});

// Evento para activar o desactivar dibujo a mano alzada
checkboxFreeHand.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    if(checkbox.checked){
      addInteractions();
    }
  } else {
    map.removeInteraction(draw); 
  }
});

if(checkbox.checked){
  addInteractions();
}

// Evento para borrar dibujos
document.getElementById ("eraseDrawings").addEventListener ("click", eraseFeatures, false);

export function eraseFeatures(){
  var features = drawingVectorLayer.getSource().getFeatures();
  features.forEach((feature) => {
    drawingVectorLayer.getSource().removeFeature(feature);
  });
};
