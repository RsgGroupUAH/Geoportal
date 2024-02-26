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


