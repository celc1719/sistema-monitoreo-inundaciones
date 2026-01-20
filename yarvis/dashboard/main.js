// ===============================
// VARIABLES GLOBALES (deben ir al inicio del archivo)
// ===============================
let history = {};
let markers = {};      // ← ESTA ES LA IMPORTANTE
let chart = null;
let hasChart = false;
let selectedId = null;


// ============================================================================
//  CARGAR HISTORIAL DESDE BD
// ============================================================================
async function loadHistoryFromDB(id) {
  try {
    const res = await fetch('/api/sensor/raw?limit=60');
    const data = await res.json();

    history[id] = data.map(d => ({
      t: new Date(d.fecha),
      v: d.distancia_cm
    }));

    if (hasChart) {
      chart.data.labels = history[id].map(p => p.t.toLocaleTimeString());
      chart.data.datasets[0].data = history[id].map(p => p.v);
      chart.update();
    }
  } catch (err) {
    console.error("Error cargando historial desde la BD:", err);
  }
}

// ============================================================================
//  CONFIGURACIÓN GENERAL DEL DASHBOARD
// ============================================================================
// ============================================================================
//  PEDIR PREDICCIÓN AL BACKEND (PYTHON)
// ============================================================================
async function pedirPrediccion(distancia, temperatura, humedad, cambio) {
  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distancia,
        temperatura,
        humedad,
        cambio
      })
    });

    const data = await res.json();

    console.log("Respuesta de predicción:", data);

    // Mostrar texto de predicción (si tienes un DIV)
    const predBox = document.getElementById("predText");
    if (predBox) {
      predBox.innerText = `Predicción: ${data.prediccion?.toFixed(2) ?? "?"}`;
    }

    // Mostrar gráfica si existe el <img>
    if (data.grafica_base64) {
      const img = document.getElementById("grafica");
      if (img) {
        img.src = "data:image/png;base64," + data.grafica_base64;
      }
    }

    return data;

  } catch (err) {
    console.error("Error solicitando predicción:", err);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  let socket;

  const tunnelTableBody = document.querySelector('#tunnelTable tbody');
  const predText = document.getElementById("predText");
  const imgDistancia = document.getElementById("imgDistancia");
  const imgHumedad = document.getElementById("imgHumedad");

  // --- MAPA ---
  const map = L.map('map').setView([20.6736, -103.344], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  // ========================================================================
  //  CARGAR TÚNELES INICIALES
  // ========================================================================
  (async function loadInitialData() {
    try {
      const res = await fetch('/api/tuneles');
      const tuneles = await res.json();

      tuneles.forEach(t => {
        const level = t.distancia_cm ?? t.nivelAgua ?? t.nivel_agua;

        if (level != null) pushToHistory(t.id, level);

        tunnelTableBody.appendChild(createRow(t));
        addOrUpdateMarker(t);
      });

      // =======================================================
      // 🔥 TOOLTIP FLOTANTE PARA INDICAR CLICK EN EL ICONO
      // =======================================================
      if (tuneles.length > 0) {
        const first = tuneles[0];

        const hint = L.popup({
          closeButton: false,
          autoClose: true,
          closeOnClick: true,
          className: "click-hint"
        })
        .setLatLng([first.lat + 0.0100, first.lng])
        .setContent("👉 Presiona el icono para ver detalles")
        .openOn(map);

        setTimeout(() => {
          map.closePopup(hint);
        }, 4000);
      }
      // =======================================================

      if (tuneles.length > 0) {
        selectedId = tuneles[0].id;
        await loadHistoryFromDB(selectedId);
      }

    } catch (err) {
      console.error("Error cargando túneles:", err);
    }

    connectSocket();
  })();

  // ========================================================================
  //  SOCKET.IO — TIEMPO REAL
  // ========================================================================
  function connectSocket() {
    socket = io();

    socket.on('connect', () => console.log("📡 Conectado al servidor"));

    socket.on('tunelActualizado', (data) => {
      updateTableRow(data);
      addOrUpdateMarker(data);

      pushToHistory(data.id, data.distancia_cm);

      if (data.id === selectedId) updateChart(selectedId);
      pedirPrediccion(
        data.distancia_cm,
        data.temperatura,
        data.humedad,
        1   // si tu modelo usa "cambio", aquí lo defines
      );
    });

    socket.on('prediction', (data) => {
      predText.innerText = data.texto ?? "Predicción recibida";

      if (data.distanciaGraph)
        imgDistancia.src = `data:image/png;base64,${data.distanciaGraph}`;

      if (data.humedadGraph)
        imgHumedad.src = `data:image/png;base64,${data.humedadGraph}`;
    });

    socket.on("predictionImages", data => {
      if (data?.grafica_base64) {
        const img = document.getElementById("grafica");
        if (img) img.src = "data:image/png;base64," + data.grafica_base64;
      }
      if (typeof data?.prediccion === 'number') {
        const predBox = document.getElementById("predText");
        if (predBox) predBox.innerText = `Predicción: ${data.prediccion.toFixed(2)}`;
      }
    });

  }

  // ========================================================================
  //  HISTORIAL + GRÁFICA
  // ========================================================================
  function pushToHistory(id, value) {
    if (!history[id]) history[id] = [];

    history[id].push({ t: new Date(), v: value });

    if (history[id].length > 60) history[id].shift();
  }

  function updateChart(id) {
    if (!chart || !history[id]) return;

    const data = history[id];

    chart.data.labels = data.map(p => p.t.toLocaleTimeString());
    chart.data.datasets[0].data = data.map(p => p.v);

    chart.update();
  }

  // =====================
  // CREAR GRÁFICA
  // =====================
  const ctx = document.getElementById('nivelChart').getContext('2d');
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Nivel de agua (cm)",
        data: [],
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 10,
          grid: { color: "rgba(0,0,0,0.07)" },
          ticks: { font: { size: 11 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      },
      elements: {
        point: { radius: 1.5 }
      }
    }
  });

  hasChart = true;

  // ========================================================================
  //  TABLA
  // ========================================================================
  function createRow(t) {
    const tr = document.createElement('tr');
    tr.dataset.id = t.id;

    const nivel = t.distancia_cm;

    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.nombre ?? "Túnel"}</td>
      <td>${nivel}</td>
      <td>${getStatusText(nivel)}</td>
      <td>${new Date(t.fecha).toLocaleTimeString()}</td>
    `;

    tr.addEventListener('click', () => {
      document.querySelectorAll('#tunnelTable tr').forEach(r =>
        r.classList.remove('selected')
      );

      tr.classList.add('selected');

      selectedId = t.id;
      updateChart(selectedId);
    });

    return tr;
  }

  function updateTableRow(data) {
    const row = tunnelTableBody.querySelector(`tr[data-id="${data.id}"]`);
    if (!row) return;

    const cells = row.querySelectorAll('td');

    cells[2].innerText = data.distancia_cm;
    cells[3].innerText = getStatusText(data.distancia_cm);
    cells[4].innerText = new Date().toLocaleTimeString();
  }

  function getStatusText(value) {
    if (value < 2.0) return "Peligroso";
    if (value < 3.0 && value >= 2.0) return "Medio";
    return "Seguro";
  }

  // ========================================================================
  //  MAPA — MARCADORES
  // ========================================================================
  function addOrUpdateMarker(t) {
    const id = t.id;
    const lat = t.lat;
    const lng = t.lng;
    const nivel = t.distancia_cm;

    const status = getStatusText(nivel);

    let statusClass =
      status === "BAJO" ? "popup-bajo" :
      status === "MEDIO" ? "popup-medio" :
      "popup-alto";

    const popupHTML = `
      <div class="popup-content ${statusClass}">
        <b>Túnel ${id}</b><br>
        Nivel: <b>${nivel} cm</b><br>
        Estado: <b>${status}</b><br>
        ${t.nombre ?? "Túnel"}
      </div>
    `;

    if (!markers[id]) {
      markers[id] = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(popupHTML);
    } else {
      markers[id].setLatLng([lat, lng]);
      markers[id].setPopupContent(popupHTML);
    }
  }

  // ============================================
//   CARGAR PREDICCIÓN AUTOMÁTICA CADA 1 MIN
// ============================================
async function loadPredictionAuto() {
  try {
    const res = await fetch("/api/prediccion");

    if (!res.ok) {
      document.getElementById("predText").innerText = "Sin predicción disponible.";
      return;
    }

    const data = await res.json();

    // 🔹 Texto principal
    document.getElementById("predText").innerText =
      `Nivel estimado: ${data.prediccion?.toFixed(2) ?? "?"} cm`;

    // 🔹 Imagen única de la predicción (si se usa)
    if (data.grafica_base64) {
      const img = document.getElementById("grafica");
      if (img) img.src = "data:image/png;base64," + data.grafica_base64;
    }

  } catch (err) {
    console.error("Error cargando predicción automática:", err);
    document.getElementById("predText").innerText = "Error cargando predicción.";
  }
}

// ▶ Ejecutar al iniciar
loadPredictionAuto();

// ▶ Volver a cargar cada minuto
setInterval(loadPredictionAuto, 60000);

});
