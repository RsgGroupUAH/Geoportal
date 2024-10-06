const distanceInput = 40;
const mindistanceInput = 20;


let projectionName = "EPSG:25830";
proj4.defs(projectionName, "+proj=utm +zone=30 +ellps=ETRS89 +units=m +no_defs");
ol.proj.proj4.register(proj4);

let projection = ol.proj.get(projectionName);
projection.setExtent([-1099677.548488217,3011748.0230924687,1295248.9757446367,4998012.783793152]);

//SE declara mapa con tres Tiles, y se le añaden las capas declaradas anterioremente
export const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Group({
      title: 'Base map',
       layers: [
       new ol.layer.Tile({
          title: "Open Street Map",
          visible: true,
          source: new ol.source.OSM({
            crossOrigin: 'Anonymous',
            
          }),
        }),
        new ol.layer.Tile({
          title: "Híbrido",
          source: new ol.source.XYZ({
            url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            crossOrigin: 'Anonymous',
            
          }),
          projection: projection,
        }),
        
      ]
    }),
     
  ],
  view: new ol.View({
    projection: projection,
    zoom: 14,
    center: ol.proj.fromLonLat([-3.329501, 40.551952]),
    
  }),
});

//Metodo qoue añade al control de valores de capa un panel con las capas visibles
export function createLayerLeyendPanel() {
  // Crear el contenedor del panel
  const panel = document.createElement('div');
  panel.id = 'layer-value-panel';
  panel.style.top = '10px';
  panel.style.right = '10px';
  panel.style.backgroundColor = 'white';
  panel.style.padding = '10px';
  panel.style.border = '1px solid black';

  // Crear el combo (select)
  const combo = document.createElement('select');
  combo.id = 'layer-switcher-combo-for-data';

  //añado listener a chamge que llama a metodo showLayerLegend para ver su leyenda
  combo.addEventListener('change', showLayerLegend);

  // Obtener todas las capas del layer switcher
  const layers = map.getLayers().getArray();

  // Filtrar las capas visibles y añadirlas al combo
  layers.forEach(layer => {
    if (layer.getVisible() && layer.get('title') !== undefined) {
      const option = document.createElement('option');
      option.value = layer.get('title'); // Asumiendo que las capas tienen un atributo 'title'
      option.text = layer.get('title');
      combo.appendChild(option);
    }
  });

  // Añadir el combo al panel
  panel.appendChild(combo);

  //añado el panel al div value_layer
  const container = document.getElementById('value_layer');
  container.appendChild(panel);
}

//MEtodo que vacia la capa de valores de capa
export function destroyLayerLegendPanel(){
  //vacio el div de de leyenda
  const container = document.getElementById('value_layer').querySelector('#legend');
  container.innerHTML = "";
  //elimino el div de valores de capa
  const containerValue = document.getElementById('value_layer').querySelector('#value');  
  containerValue.innerHTML = "";
  //eliminar el combo layer-switcher-combo-for-data
  const panel = document.getElementById('layer-value-panel');
  panel.remove();
}

//MEtodo que cada vez que cambia el valor del combo layer-switcher-combo-for-data consulta su leyenda y la muestra
export function showLayerLegend() {
  // Obtener el combo
  var combo = document.getElementById('layer-switcher-combo-for-data');

  // Obtener el valor seleccionado
  var selectedValue = combo.options[combo.selectedIndex].value;

  // Obtener todas las capas del layer switcher
  var layers = map.getLayers().getArray();

  // Obtener la capa seleccionada
  var selectedLayer = layers.find(layer => layer.get('title') === selectedValue);

  // Obtener la leyenda de la capa seleccionada
  var legend = selectedLayer.get('legend');

  // Mostrar la leyenda en el div de valores de capa en el div info hijo de layer-value si no es undefined
  var container = document.getElementById('value_layer').querySelector('#legend');

  //poner el el sppan value_layer_name el valor selecteValue
  var containerName = document.getElementById('value_layer').querySelector('#value_layer_name');
  containerName.innerHTML = selectedValue;

  //vaciar el div value para que no se acumulen valores
  var containerValue = document.getElementById('value_layer').querySelector('#value');
  containerValue.innerHTML = "";
  
  if(legend !== undefined){
    //legend es un array de url wms a consultar la leyenda
    //se llama a cada una de las url para mostrar la leyenda y obtener la imagen
    container.innerHTML = "";
    if (legend.length > 0) {
      const url = legend[0];
      fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.style.height = '100%';
        container.appendChild(img);
      });
    } else {
      container.innerHTML = "No hay leyenda disponible";
    }
  }else{
    container.innerHTML = "No hay leyenda disponible";
  }

  //Añadir evento onclick al mapa para que si value_layer esta visible y 
  //se hace click en el mapa se consulte el valor de la capa seleccionada en el combo 
  //y se muestre en el div info
  map.on('click', function (evt) {
    var combo = document.getElementById('layer-switcher-combo-for-data');
    //obtener selectedValue del combo layer-switcher-combo-for-data'
    var selectedValue = combo.options[combo.selectedIndex].value;
    // Obtener la capa seleccionada
    var selectedLayer = layers.find(layer => layer.get('title') === selectedValue);
    // Verificar si la capa seleccionada es una capa WMS
    if (selectedLayer && selectedLayer.getSource() instanceof ol.source.TileWMS) {
      // Obtener la fuente de la capa seleccionada
      const source = selectedLayer.getSource();

      // Transformar la coordenada a la proyección del mapa
      const viewResolution = map.getView().getResolution();
      const viewProjection = map.getView().getProjection().getCode();
 
      // Construir la URL de la solicitud GetFeatureInfo
      var url = source.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        viewProjection,
        { 'INFO_FORMAT': 'application/json' }
      );
      // Hacer la solicitud GetFeatureInfo
      fetch(url)
      .then(response => response.json())
      .then(data => {
        // Obtener el contenedor donde se mostrará la tabla
        var container = document.getElementById('value_layer').querySelector('#value');
        
        // Limpiar el contenedor
        container.innerHTML = '';

        // Crear la tabla
        var table = document.createElement('table');
        table.border = 1;
        //añado clase value_layer_table para darle estilo
        table.className = 'value_layer_table';

        // Crear el encabezado de la tabla
        var thead = document.createElement('thead');
        //le añado class value_layer_table para darle estilo
        thead.className = 'value_layer_table_head';
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        th.textContent = 'Atributo';
        tr.appendChild(th);
        th = document.createElement('th');
        th.textContent = 'Valor';
        tr.appendChild(th);
        thead.appendChild(tr);
        table.appendChild(thead);

        // Crear el cuerpo de la tabla
        var tbody = document.createElement('tbody');
        data.features.forEach(feature => {
          Object.entries(feature.properties).forEach(([key, value]) => {
            var row = document.createElement('tr');

            var th = document.createElement('th');
            th.textContent = key;
            row.appendChild(th);

            var td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);

            tbody.appendChild(row);
          });
        });
        table.appendChild(tbody);

        // Añadir la tabla al contenedor
        container.appendChild(table);
      })
      .catch(error => {
        console.error('Error al obtener la información de la capa:', error);
      });
      
    }
  });
  
 
  
}