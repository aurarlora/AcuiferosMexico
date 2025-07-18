var boundsAcuiferos = [
  [14.531865, -117.125824], // Suroeste (lat, lng)
  [32.718721, -86.731454]   // Noreste (lat, lng)
];


var states = L.esri.featureLayer({
    url: "https://apl.esri.com/apl2/rest/services/Mexico/Mexico_traveller_c/MapServer/28",
    style: function (feature) {
        return {color: '#bada55', weight: 1};
    }
});

var map = L.map('map', {
  layers: [L.esri.basemapLayer("Topographic"), states]
});

map.fitBounds(boundsAcuiferos);


var baseLayers = {
    "Oceanos": L.esri.basemapLayer("Oceans"),
    "Streetmap": L.esri.basemapLayer("Streets"),
    "Topographic":L.esri.basemapLayer("Topographic")
};
//Escala
var sidebar = L.control.sidebar({
    container: 'sidebar',
    position: 'left'
}).addTo(map);

//sidebar.close('home');
const tabHome = document.querySelector('a[href="#home"]');
const sidebarEl = document.getElementById('sidebar');
const paneHome = document.getElementById('home');

let homeVisible = false; // 💡 estado manual

tabHome.addEventListener('click', function (e) {
  e.preventDefault(); // Evita comportamiento automático

  if (homeVisible) {
    // Ocultar panel y contenido
    sidebarEl.classList.add('collapsed');
    tabHome.classList.remove('active');
    paneHome.style.display = 'none';
    homeVisible = false;
  } else {
    // Mostrar panel y contenido
    sidebarEl.classList.remove('collapsed');

    // Desactiva cualquier otro tab activo
    document.querySelectorAll('.leaflet-sidebar-tabs a.active').forEach(el => el.classList.remove('active'));
    tabHome.classList.add('active');

    // Oculta otros panes y muestra home
    document.querySelectorAll('.leaflet-sidebar-pane').forEach(el => el.style.display = 'none');
    paneHome.style.display = '';

    homeVisible = true;
  }
});



L.control.layers(baseLayers).addTo(map);

// ZOOM
document.getElementById('zoom-in').addEventListener('click', function () {
  map.zoomIn();
});
document.getElementById('zoom-out').addEventListener('click', function () {
  map.zoomOut();
});

// A todo el mapa
document.getElementById('zoom-reset').addEventListener('click', function () {
  map.fitBounds(acuiferosLayer.getBounds());
});



// CONSTANTES
const listadoAcuif = document.getElementById('acuif-listado');
const checkboxAcuif = document.getElementById('toggle-acuif');
const checkboxCuencas = document.getElementById('toggle-cuencas');
const checkboxEstados = document.getElementById('toggle-estados');
const checkboxIndice250 = document.getElementById('toggle-indice250');
const checkboxIndice50 = document.getElementById('toggle-indice50');
const contenedorAcuif = document.getElementById('acuif-container');
const icono = document.getElementById('toggle-icon');
const info = document.getElementById('info-acuif');
const contenido = document.getElementById('contenido-info');

//etiquetas flotantes con el nombre del acuífero
let etiquetasLayer = L.layerGroup().addTo(map);
let acuifSeleccionado = null;
let etiquetasIndice250 = L.layerGroup().addTo(map);
let etiquetasIndice50 = L.layerGroup().addTo(map);


// Estilos
var acuiferosStyle = {
    color: "#000000",          // Contorno negro
    weight: 1,                 // Grosor de línea
    opacity: 1,
    dashArray: '4,2',          // Línea punteada: 4 píxeles trazo, 2 píxeles espacio
    fill: false                // No rellenar el polígono
};

var cuencasStyle = {
    color: '#003366',
    weight: 2.5,
    opacity: 1,
    dashArray: '3,2',
    fill: false
};

var estadosStyle = {
  color: '#056801ff',            
  weight: 3,
  dashArray: '4,2',         
  fill: false        
};

var indice50Style = {
  color: '#021041ff',            
  weight: 1.5,
  dashArray: '4,2',         
  fillColor: '#b6edf7ff',     
  fillOpacity: 0.2          
};

var indice250Style = {
  color: '#290d0dff',            
  weight: 1.5,
  dashArray: '4,2',         
  fillColor: '#fdcbd2ff',     
  fillOpacity: 0.1          
};

//agregar titulo al visor
const etiquetaInicio = L.marker([24, -94], {
  icon: L.divIcon({
    className: 'etiqueta-inicial',
    html: '<div>División de los sistemas\n acuíferos de México</div>',
    iconSize: [160, 20],
    iconAnchor: [80, 10]
  })
}).addTo(map);


// Función toggle general
function toggleLayer(checkbox, capaLeaflet, contenedorExtra = null) {
  if (checkbox.checked) {
    map.addLayer(capaLeaflet);
    if (contenedorExtra) contenedorExtra.style.display = 'block';
  } else {
    map.removeLayer(capaLeaflet);
    if (contenedorExtra) contenedorExtra.style.display = 'none';
  }
}

function mostrarInfo(feature, layer) {
  const info = document.getElementById('info-acuif');
  const contenido = document.getElementById('contenido-info');
  const nombre = feature.properties.NOM_ACUI;

  if (!info || !contenido) return; // Verifica que existan los elementos

  // 🔸 1. Elimina resaltado anterior si existe
  if (typeof acuifSeleccionado !== 'undefined' && acuifSeleccionado) {
    map.removeLayer(acuifSeleccionado);
  }

  // 🔸 2. Agrega resaltado al polígono actual
  acuifSeleccionado = L.geoJSON(feature, {
    style: {
      color: 'yellow',
      weight: 3,
      dashArray: '5,3'
    }
  }).addTo(map);

  // 🔸 3. Centra el mapa al polígono
  map.fitBounds(layer.getBounds());

  // 🔸 4. Construye el contenido del panel
  contenido.innerHTML = `
    <strong>${nombre}</strong><br>
    <b>Clave:</b> ${feature.properties.CLV_ACUI}<br>
    <b>Área (km²):</b> ${feature.properties.AREA_KM2}<br>
    <b>Recarga media:</b> ${feature.properties.RECARGA_ME}<br>
    <b>Descarga natural:</b> ${feature.properties.DESCARGA_N}
  `;

  // 🔸 5. Calcula la posición del panel basado en el centroide
  const puntoPantalla = map.latLngToContainerPoint(layer.getBounds().getCenter());
  const anchoMapa = map.getSize().x;

  let left = puntoPantalla.x + 10;
  let top = puntoPantalla.y - 40;

  // Asegura que no se salga del mapa (ancho máximo 250px estimado)
  if (left + 260 > anchoMapa) left = anchoMapa - 260;
  if (top < 0) top = 10;

  // 🔸 6. Posiciona y muestra el div flotante
  info.style.left = `${left}px`;
  info.style.top = `${top}px`;
  info.style.display = 'block';
}

console.log("Cuencas:", typeof cuencas, cuencas);
console.log("Estados:", typeof estados, estados);


// VARIABLES***
var cuencasLayer = L.geoJson(cuencas, {
    style: cuencasStyle,
    onEachFeature: function (feature, layer) {
    layer.on('click', () => {
      if (document.getElementById('toggle-cuencas').checked) {
        mostrarInfoCuenca(feature, layer);
      }
    });
  }
  });

var estadosLayer = L.geoJson(estados, {
style: estadosStyle
});

var indice250Layer = L.geoJson(ind250, {
style: indice250Style,
onEachFeature: function (feature, layer) {
    const nombreind250 = feature.properties.CLAVE;
    const centroide = layer.getBounds().getCenter();
    const etiqueta = L.marker(centroide, {
      icon: L.divIcon({
        className: 'etiqueta-indice250',
        html: nombreind250,
        iconSize: null
      })
    });
    layer._etiquetaIndice250  = etiqueta;
    }
});

var indice50Layer = L.geoJson(ind50, {
style: indice50Style,
onEachFeature: function (feature, layer) {
    const nombreind50 = feature.properties.CLAVE;
    const centroide = layer.getBounds().getCenter();
    const etiqueta = L.marker(centroide, {
      icon: L.divIcon({
        className: 'etiqueta-indice50',
        html: nombreind50,
        iconSize: null
      })
    });
    layer._etiquetaIndice50 = etiqueta;
    }
});



var acuiferosLayer = L.geoJson(acuiferos, {
    style: acuiferosStyle,
    onEachFeature: function (feature, layer) {
        const nombre = feature.properties.NOM_ACUI;
          // Crear etiqueta centrada
        const etiqueta = L.marker(layer.getBounds().getCenter(), {
              icon: L.divIcon({
                      className: 'etiqueta-acuif',
                            html: nombre
                              })
                              });
  // Al hacer clic sobre la etiqueta
  layer._etiqueta = etiqueta; 
  etiqueta.on('click', () => {
      mostrarInfo(feature, layer);
  });

  // Al hacer clic sobre el polígono
  layer.on('click', () => {
    mostrarInfo(feature, layer);
  });

  // Agregar al listado
  let li = document.createElement('li');
  li.textContent = nombre;
  li.style.cursor = 'pointer';

  li.addEventListener('click', () => {
    mostrarInfo(feature, layer);
   });
  // console.log("¿listadoAcuif es null?", listadoAcuif === null);

  listadoAcuif.appendChild(li);
}

});

//Para mostrar la info de cuencas
let cuencaSeleccionada = null;

function mostrarInfoCuenca(feature, layer) {
  const info = document.getElementById('info-acuif');
  const contenido = document.getElementById('contenido-info');
  const nombre = feature.properties.NOMBRE || 'Sin nombre';
  const tipo = feature.properties.TIPO_CUENCA || 'Desconocido';

  if (!info || !contenido) return;

  if (cuencaSeleccionada) map.removeLayer(cuencaSeleccionada);

  cuencaSeleccionada = L.geoJSON(feature, {
    style: {
      color: 'orange',
      weight: 3,
      dashArray: '4,2'
    }
  }).addTo(map);

  map.setZoom(9);
  map.panTo(layer.getBounds().getCenter());

  contenido.innerHTML = `
    <strong>${nombre}</strong><br>
    <b>Tipo de cuenca:</b> ${tipo}
  `;

  const point = map.latLngToContainerPoint(layer.getBounds().getCenter());
  info.style.left = `${point.x + 10}px`;
  info.style.top = `${point.y - 40}px`;
  info.style.display = 'block';
}


// Activar contenedor y estilos desde el inicio
map.addLayer(acuiferosLayer);  

contenedorAcuif.style.display = 'block';
listadoAcuif.style.display = 'none'; // lista retraída
icono.textContent = '▼';
icono.style.color = 'black';
icono.style.cursor = 'pointer';


//listener global al mapa para actualizar las etiquetas según zoom
map.on('zoomend', () => {
  etiquetasLayer.clearLayers();  // acuiferos
  etiquetasIndice250.clearLayers();  // ind250
  etiquetasIndice50.clearLayers();  // ind50
  

  if (map.getZoom() >= 9) {
    acuiferosLayer.eachLayer(l => {
      if (l._etiqueta) etiquetasLayer.addLayer(l._etiqueta);
    });
  }

  if (checkboxIndice250.checked && map.getZoom() >= 7) {
    indice250Layer.eachLayer(l => {
      if (l._etiquetaIndice250) etiquetasIndice250.addLayer(l._etiquetaIndice250);
    });
    }
     if (checkboxIndice50.checked && map.getZoom() >= 7) {
    indice50Layer.eachLayer(l => {
      if (l._etiquetaIndice50) etiquetasIndice50.addLayer(l._etiquetaIndice50);
    });
    }
});

// Añadir la capa al mapa
acuiferosLayer.addTo(map);

acuiferosLayer.once('layeradd', function () {
  map.fitBounds(acuiferosLayer.getBounds());
  updateGraticule();
});





// Agrega el evento para cerrar
document.getElementById('cerrar-info').addEventListener('click', () => {
  document.getElementById('info-acuif').style.display = 'none';
});

// Flecha: retraer/expandir lista
icono.addEventListener('click', () => {
  const visible = listadoAcuif.style.display === 'block';
  listadoAcuif.style.display = visible ? 'none' : 'block';
  icono.textContent = visible ? '▼' : '▲';
});

//Agregar la escala
L.control.scale({ metric: true, imperial: false }).addTo(map);

// Para la lupa

document.getElementById('zoombox-btn').addEventListener('click', () => {
  map.dragging.disable();  // 🚫 Desactiva mover el mapa

  let startPoint;
  let box;

  const onMouseDown = function (e) {
    startPoint = e.latlng;

    box = L.rectangle([startPoint, startPoint], {
      color: 'blue',
      weight: 1,
      dashArray: '4,2'
    }).addTo(map);

    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
  };

  const onMouseMove = function (e) {
    if (box) box.setBounds([startPoint, e.latlng]);
  };

  const onMouseUp = function () {
    if (box) {
      map.fitBounds(box.getBounds());
      map.removeLayer(box);
      box = null;
    }

    // 🔄 Reactiva movimiento del mapa
    map.dragging.enable();

    map.off('mousedown', onMouseDown);
    map.off('mousemove', onMouseMove);
    map.off('mouseup', onMouseUp);
  };

  map.on('mousedown', onMouseDown);
});



// Para el boton identificador
let identificando = false;
const identifyBtn = document.getElementById('identify-btn');

// Activar/desactivar herramienta
identifyBtn.addEventListener('click', () => {
  identificando = !identificando;
  identifyBtn.style.backgroundColor = identificando ? 'lightgray' : 'transparent';
  map.getContainer().style.cursor = identificando ? 'crosshair' : '';
});

// Escuchar clic en el mapa
map.on('click', function (e) {
  if (!identificando) return;

  // Buscar el polígono clicado
  let encontrado = false;

  acuiferosLayer.eachLayer(function (layer) {
    if (layer instanceof L.Polygon && layer.getBounds().contains(e.latlng)) {
      encontrado = true;

      // Usar misma función de mostrar info que ya tienes
      mostrarInfo(layer.feature, layer);

      // Zoom fijo a nivel 9 centrado
      map.setView(layer.getBounds().getCenter(), 9);
    }
  });

  if (!encontrado) {
    console.log('No se encontró ningún acuífero en ese punto');
  }
});


//Boton de clear

const clearBtn = document.getElementById('clear-btn');

clearBtn.addEventListener('click', () => {
  // Quitar resaltado
  if (acuifSeleccionado) {
    map.removeLayer(acuifSeleccionado);
    acuifSeleccionado = null;
  }

  // Ocultar el cuadro de información
  const info = document.getElementById('info-acuif');
  if (info) {
    info.style.display = 'none';
  }

  // (Opcional) Desactivar la herramienta de identificar
  identificando = false;
  identifyBtn.style.backgroundColor = 'transparent';
  map.getContainer().style.cursor = '';
});

// 🔹 Mostrar/Ocultar capa de CUENCAS
checkboxCuencas.addEventListener('change', () => {
  if (checkboxCuencas.checked) {
    map.addLayer(cuencasLayer);
  } else {
    map.removeLayer(cuencasLayer);

    // Quitar resaltado (contorno naranja) si existía
    if (cuencaSeleccionada) {
      map.removeLayer(cuencaSeleccionada);
      cuencaSeleccionada = null;
    }

    // Ocultar cuadro de información
    const info = document.getElementById('info-acuif');
    if (info) info.style.display = 'none';
  }
});

// 🔹 Mostrar/Ocultar capa de ESTADOS
checkboxEstados.addEventListener('change', () => {
  if (checkboxEstados.checked) {
    map.addLayer(estadosLayer);
    } else {
    map.removeLayer(estadosLayer);
    }
});

// 🔹 Mostrar/Ocultar capa de INDICE250
checkboxIndice250.addEventListener('change', () => {
  if (checkboxIndice250.checked) {
    map.addLayer(indice250Layer);
    etiquetasIndice250.clearLayers(); // Limpiar por si acaso
    // Mostrar etiquetas
    if (map.getZoom() >= 9) {
    indice250Layer.eachLayer(l => {
      if (l._etiquetaIndice250) {
          etiquetasIndice250.addLayer(l._etiquetaIndice250);
        }
    });
  }
  } else {
    map.removeLayer(indice250Layer);
    etiquetasIndice250.clearLayers();

    if (cuencaSeleccionada) map.removeLayer(cuencaSeleccionada);
    document.getElementById('info-acuif').style.display = 'none';
  }
});

// 🔹 Mostrar/Ocultar capa de INDICE50
checkboxIndice50.addEventListener('change', () => {
  if (checkboxIndice50.checked) {
    map.addLayer(indice50Layer);
    etiquetasIndice50.clearLayers(); // Limpiar por si acaso
    // Mostrar etiquetas
    if (map.getZoom() >= 12) {
    indice50Layer.eachLayer(l => {
      if (l._etiquetaIndice50) {
          etiquetasIndice50.addLayer(l._etiquetaIndice50);
        }
    });
  }
  } else {
    map.removeLayer(indice50Layer);
    etiquetasIndice50.clearLayers();

    if (cuencaSeleccionada) map.removeLayer(cuencaSeleccionada);
    document.getElementById('info-acuif').style.display = 'none';
  }
});

// Cuadricula

const graticuleLayer = L.layerGroup().addTo(map);

function drawGraticule(intervalDegrees) {
  graticuleLayer.clearLayers(); // limpia lo anterior

  const bounds = map.getBounds();
  const south = Math.floor(bounds.getSouth() / intervalDegrees) * intervalDegrees;
  const north = Math.ceil(bounds.getNorth() / intervalDegrees) * intervalDegrees;
  const west = Math.floor(bounds.getWest() / intervalDegrees) * intervalDegrees;
  const east = Math.ceil(bounds.getEast() / intervalDegrees) * intervalDegrees;

  // líneas horizontales
  for (let lat = south; lat <= north; lat += intervalDegrees) {
    const line = L.polyline([[lat, west], [lat, east]], {
      color: '#555',
      weight: 0.5,
      opacity: 0.6,
      interactive: false
    });
    graticuleLayer.addLayer(line);
  }

  // líneas verticales
  for (let lng = west; lng <= east; lng += intervalDegrees) {
    const line = L.polyline([[south, lng], [north, lng]], {
      color: '#555',
      weight: 0.5,
      opacity: 0.6,
      interactive: false
    });
    graticuleLayer.addLayer(line);
  }
}

function createGraticuleLabels(map, interval) {
  const bounds = map.getBounds();
  const south = Math.floor(bounds.getSouth() / interval) * interval;
  const north = Math.ceil(bounds.getNorth() / interval) * interval;
  const west = Math.floor(bounds.getWest() / interval) * interval;
  const east = Math.ceil(bounds.getEast() / interval) * interval;

  // eliminar etiquetas anteriores
  const container = map.getContainer();
  const oldLabels = container.querySelectorAll('.graticule-label-control');
  oldLabels.forEach(label => label.remove());

  const labelContainer = document.getElementById('graticule-labels');
  labelContainer.innerHTML = ''; // limpia anteriores


  // etiquetas de latitud (derecha)
for (let lat = south; lat <= north; lat += interval) {
  const point = map.latLngToContainerPoint([lat, bounds.getEast()]);
  const label = document.createElement('div');
  label.className = 'graticule-label-control graticule-label-right';
  label.style.position = 'absolute';
  label.style.top = `${point.y}px`;
  label.style.right = '4px';
  label.innerHTML = `${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`;
  labelContainer.appendChild(label);
}

// etiquetas de longitud (abajo)
for (let lng = west; lng <= east; lng += interval) {
  const point = map.latLngToContainerPoint([bounds.getSouth(), lng]);
  const label = document.createElement('div');
  label.className = 'graticule-label-control graticule-label-bottom';
  label.style.position = 'absolute';
  label.style.left = `${point.x}px`;
  label.style.bottom = '4px';
  label.innerHTML = `${Math.abs(lng)}°${lng >= 0 ? 'E' : 'W'}`;
  labelContainer.appendChild(label);
}
}

function updateGraticule() {
  const zoom = map.getZoom();
  let interval = 5;
  if (zoom >= 7) interval = 2;
  if (zoom >= 9) interval = 1;
  if (zoom >= 11) interval = 0.5;
  if (zoom >= 13) interval = 0.2;

  drawGraticule(interval);
  createGraticuleLabels(map, interval);
}

// Esperar a que los acuíferos estén completamente añadidos al mapa

map.on('moveend zoomend resize', updateGraticule);

console.log(acuiferosLayer.getBounds().toBBoxString());