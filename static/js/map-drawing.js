import { map } from "./map-layers.js";

const checkbox = document.getElementById('activeDrawing');
const checkboxFreeHand = document.getElementById('freeHand');


const drawingSourceVector = new ol.source.Vector();
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

// Limit multi-world panning to one world east and west of the real world.
// Geometry coordinates have to be within that range.
const extent = ol.proj.get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];

const modify = new ol.interaction.Modify({source: drawingSourceVector});

map.addInteraction(modify);

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById('drawType');

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
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  if(checkbox.checked){
    addInteractions();
  }
};

checkbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    addInteractions();
  } else {
    map.removeInteraction(draw); 
  }
});

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


document.getElementById ("eraseDrawings").addEventListener ("click", eraseFeatures, false);

function eraseFeatures(){
  var features = drawingVectorLayer.getSource().getFeatures();
  features.forEach((feature) => {
    drawingVectorLayer.getSource().removeFeature(feature);
  });
};
