var states = L.esri.featureLayer({
    url: "https://apl.esri.com/apl2/rest/services/Mexico/Mexico_traveller_c/MapServer/28",
    style: function (feature) {
        return {color: '#bada55', weight: 1};
    }
});

var map = L.map('map', {
  layers: [L.esri.basemapLayer("Topographic"), states]
});

let etiquetasLayer = L.layerGroup().addTo(map);
let acuifSeleccionado = null;


var baseLayers = {
    "Oceanos": L.esri.basemapLayer("Oceans"),
    "Streetmap": L.esri.basemapLayer("Streets"),
    "Topographic":L.esri.basemapLayer("Topographic")
};

var acuiferosStyle = {
    color: "#000000",          // Contorno negro
    weight: 1,                 // Grosor de línea
    opacity: 1,
    dashArray: '4,2',          // Línea punteada: 4 píxeles trazo, 2 píxeles espacio
    fill: false                // No rellenar el polígono
};

var sidebar = L.control.sidebar({
    container: 'sidebar',
    position: 'left'
}).addTo(map);

// Abre el panel al cargar

sidebar.close('home');

// constantes
const listadoAcuif = document.getElementById('acuif-listado');
const checkboxAcuif = document.getElementById('toggle-acuif');
const contenedorAcuif = document.getElementById('acuif-container');
const icono = document.getElementById('toggle-icon');
const info = document.getElementById('info-acuif');
const contenido = document.getElementById('contenido-info');

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


// Ini_oneach
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
  
  layer._etiqueta = etiqueta;

  // Al hacer clic sobre la etiqueta
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
// Fin_oneach



// Activar contenedor y estilos desde el inicio
map.addLayer(acuiferosLayer);  // debe estar fuera también
map.fitBounds(acuiferosLayer.getBounds());

contenedorAcuif.style.display = 'block';
listadoAcuif.style.display = 'none'; // lista retraída
icono.textContent = '▼';
icono.style.color = 'black';
icono.style.cursor = 'pointer';


//listener global al mapa para actualizar las etiquetas según zoom
map.on('zoomend', () => {
  etiquetasLayer.clearLayers();  // Limpia las etiquetas

  if (map.getZoom() >= 9) {
    acuiferosLayer.eachLayer(l => {
      if (l._etiqueta) etiquetasLayer.addLayer(l._etiqueta);
    });
  }
});

// Añadir la capa al mapa
acuiferosLayer.addTo(map);

// Esperar a que se agregue al mapa y luego ajustar la vista
acuiferosLayer.once('layeradd', function () {
  map.fitBounds(acuiferosLayer.getBounds());
});


L.control.layers(baseLayers).addTo(map);


// Para colocar el ícono de zoom
document.getElementById('zoom-in').addEventListener('click', function () {
  map.zoomIn();
});
document.getElementById('zoom-out').addEventListener('click', function () {
  map.zoomOut();
});


// Zoom a todo el mapa
document.getElementById('zoom-reset').addEventListener('click', function () {
  map.fitBounds(acuiferosLayer.getBounds());
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

// Escuchar clics en el mapa
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

