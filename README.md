# uah-gis-explorer-html

Este repositorio está destinado a tner el código del desarrollo del TFG de creación de aplicación visora de mapas GIS del departamento de radiacón y electromagnetismo de la UAH.

Esta prueba de concepto es su comienzo con html y javascript planos. 

Se debe desplegar bajo un Apache para evitar la protección CORS de los navegadores. Se puede utilizar XAMP en entornos windows. Copiando su contenido en la carpeta htdocs directamente o añadiendo estas líneas en httpd.conf del apache:

```
Alias /[url_que_queremos_en_navegador]/ [ruta_local_proyecto]

<Directory "[ruta_local_proyecto]">
    Options Indexes FollowSymLinks MultiViews
	AllowOverride All
	Require local
</Directory>
```
