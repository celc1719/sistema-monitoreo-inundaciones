// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const connectDB = require('./db');
const Tunnel = require('./models/Tunnel');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Configuración del túnel fijo
const TUNNEL_ID = Number(process.env.TUNNEL_ID || 1);
const TUNNEL_NAME = process.env.TUNNEL_NAME || 'Túnel 1';
const TUNNEL_LAT = Number(process.env.TUNNEL_LAT || 20.647233);
const TUNNEL_LNG = Number(process.env.TUNNEL_LNG || -103.405459);


// === LÓGICA CORRECTA DEL NIVEL DE AGUA (distancia menor = más agua) ===
function obtenerEstado(distancia) {
  if (distancia === null || distancia === undefined) return 'desconocido';
  if (distancia < 2.0) return 'alto';
  if (distancia < 3.0) return 'medio';
  return 'bajo';
}

// === INICIAR SERVIDOR ===
(async () => {
  await connectDB(process.env.MONGO_URI);
  const server = http.createServer(app);
  const io = require('socket.io')(server, { cors: { origin: '*' } });

  // 1. ENDPOINT PRINCIPAL: información del túnel con nivel correcto
  app.get('/api/tuneles', async (req, res) => {
    try {
      const latest = await require('mongoose').connection.db
        .collection('Sensor')
        .findOne({}, { sort: { fecha: -1 } });

      const distancia = latest?.distancia_cm ?? null;
      const prediccion_cm = (globalThis.lastPrediction?.prediccion ?? null);
      const estado_predicho = prediccion_cm != null ? obtenerEstado(prediccion_cm) : null;

      const tunel = {
        id: TUNNEL_ID,
        nombre: TUNNEL_NAME,
        lat: TUNNEL_LAT,
        lng: TUNNEL_LNG,
        coords: { latitude: TUNNEL_LAT, longitude: TUNNEL_LNG },
        distancia_cm: distancia,
        humedad: latest?.humedad ?? null,
        temperatura: latest?.temperatura ?? null,
        estado: obtenerEstado(distancia),
        prediccion_cm,
        estado_predicho,
        fecha: latest?.fecha ?? new Date()
      };

      res.json([tunel]);
    } catch (error) {
      console.error('Error /api/tuneles:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    }
  });

  // Endpoint equivalente pero para un solo túnel
  app.get('/api/tunel', async (req, res) => {
    try {
      const latest = await require('mongoose').connection.db
        .collection('Sensor')
        .findOne({}, { sort: { fecha: -1 } });

      const distancia = latest?.distancia_cm ?? null;
      const prediccion_cm = (globalThis.lastPrediction?.prediccion ?? null);
      const estado_predicho = prediccion_cm != null ? obtenerEstado(prediccion_cm) : null;

      const tunel = {
        id: TUNNEL_ID,
        nombre: TUNNEL_NAME,
        lat: TUNNEL_LAT,
        lng: TUNNEL_LNG,
        coords: { latitude: TUNNEL_LAT, longitude: TUNNEL_LNG },
        distancia_cm: distancia,
        humedad: latest?.humedad ?? null,
        temperatura: latest?.temperatura ?? null,
        estado: obtenerEstado(distancia),
        prediccion_cm,
        estado_predicho,
        fecha: latest?.fecha ?? new Date()
      };

      res.json(tunel);
    } catch (error) {
      console.error('Error /api/tunel:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    }
  });


  // 2. ENDPOINT NUEVO: SOLO DATOS CRUDOS DE LA BASE DE DATOS (lo que tú pediste)
  app.get('/api/sensor/raw', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    const registros = await require('mongoose').connection.db
      .collection('Sensor')
      .find({})
      .sort({ fecha: -1 })
      .limit(limit)
      .toArray();

    const datosLimpios = registros.map(doc => ({
      _id: doc._id,
      distancia_cm: doc.distancia_cm ?? null,
      humedad: doc.humedad ?? null,
      temperatura: doc.temperatura ?? null,
      fecha: doc.fecha
    }));

    res.json(datosLimpios);
  } catch (error) {
    console.error('Error /api/sensor/raw:', error);
    res.status(500).json({ error: 'Error al obtener datos crudos' });
  }
  });


  // 3. ACTUALIZACIÓN MANUAL (opcional)
  app.post('/api/update', async (req, res) => {
    const { nivelAgua } = req.body;
    const estado = obtenerEstado(nivelAgua);

    const doc = {
      id: TUNNEL_ID,
      nombre: TUNNEL_NAME,
      lat: TUNNEL_LAT,
      lng: TUNNEL_LNG,
      coords: { latitude: TUNNEL_LAT, longitude: TUNNEL_LNG },
      nivelAgua,
      estado,
      updatedAt: new Date()
    };

    await Tunnel.findOneAndUpdate({ id: TUNNEL_ID }, { $set: doc }, { upsert: true });
    io.emit('tunelActualizado', doc);
    res.json({ ok: true, estado });
  });

  // 4. CHANGE STREAM: actualización en tiempo real
  try {
    const sensorColl = require('mongoose').connection.db.collection('Sensor');
    const changeStream = sensorColl.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
    if (!['insert', 'update'].includes(change.operationType)) return;
    const doc = change.fullDocument;
    if (!doc) return;

    const distancia = doc.distancia_cm ?? null;

    const update = {
      id: TUNNEL_ID,
      nombre: TUNNEL_NAME,
      lat: TUNNEL_LAT,
      lng: TUNNEL_LNG,
      coords: { latitude: TUNNEL_LAT, longitude: TUNNEL_LNG },
      distancia_cm: distancia,
      humedad: doc.humedad ?? null,
      temperatura: doc.temperatura ?? null,
      estado: obtenerEstado(distancia),
      prediccion_cm: (globalThis.lastPrediction?.prediccion ?? null),
      estado_predicho: (globalThis.lastPrediction?.prediccion != null)
        ? obtenerEstado(globalThis.lastPrediction.prediccion)
        : null,
      fecha: doc.fecha ?? new Date()
    };

    io.emit('tunelActualizado', update);
  });


    console.log('ChangeStream activo en colección "Sensor"');
  } catch (e) {
    console.warn('ChangeStream no disponible:', e.message);
  }

  // 5. SERVIR DASHBOARD
  const dashboardPath = path.join(__dirname, '..', 'dashboard');
  app.use('/dashboard', express.static(dashboardPath));

  // 6. PREDICCIONES (si las usas, se mantienen igual)
const { spawn } = require('child_process');   // ✔️ QUEDA ESTE
const predictionsDir = path.join(__dirname, '..', 'dashboard', 'predictions');
require('fs').mkdirSync(predictionsDir, { recursive: true });

let lastPrediction = null;
// Hacer visible para otros bloques (e.g., endpoints)
globalThis.lastPrediction = null;
const runPredictionOnce = async () => {
  try {
    // Obtener último registro para construir entrada al modelo
    const latest = await require('mongoose').connection.db
      .collection('Sensor')
      .findOne({}, { sort: { fecha: -1 } });

    const entrada = {
      distancia: latest?.distancia_cm ?? 0,
      temperatura: latest?.temperatura ?? 0,
      humedad: latest?.humedad ?? 0,
      cambio: 0
    };

    const pythonPath = path.join(__dirname, "python", "predictor.py");
    const python = spawn("python3", [pythonPath]);

    // enviar datos al stdin del script
    python.stdin.write(JSON.stringify(entrada));
    python.stdin.end();

    let salida = "";
    let errores = "";

    python.stdout.on("data", data => salida += data.toString());
    python.stderr.on("data", data => errores += data.toString());

    python.on("close", code => {
      if (errores) console.error("Python STDERR:", errores);
      if (code !== 0) {
        console.error(`Python terminó con código ${code}`);
        console.log("Salida:", salida);
        return;
      }

      try {
        const json = JSON.parse(salida);

        // Unificar esquema para dashboard: prediccion + grafica_base64
        lastPrediction = {
          prediccion: json.prediccion ?? null,
          grafica_base64: json.grafica_base64 ?? null
        };
        globalThis.lastPrediction = lastPrediction;

        console.log("Predicción (job) actualizada desde Python");
        io.emit("predictionImages", lastPrediction);

      } catch (err) {
        console.error("Error parseando predicción Python:", err);
        console.log("Salida que falló:", salida);
        console.log("Errores Python:", errores);
      }
    });
  } catch (e) {
    console.error("Error ejecutando predicción periódica:", e);
  }
};


runPredictionOnce();
setInterval(runPredictionOnce, 60000);

app.get('/api/prediccion', (req, res) => {
  if (lastPrediction) {
    return res.json({
      prediccion: lastPrediction.prediccion ?? null,
      grafica_base64: lastPrediction.grafica_base64 ?? null
    });
  }
  res.status(404).json({ error: 'no_prediction' });
});
app.use('/dashboard/predictions', express.static(predictionsDir));


// === PREDICCIÓN DESDE PYTHON ===
// ❌ YA NO SE VUELVE A DECLARAR SPAWN AQUÍ
// ❌ ESTO SE ELIMINA: const { spawn } = require("child_process");

app.post("/api/predict", (req, res) => {
  const pythonPath = path.join(__dirname, "python", "predictor.py"); // ajusta según tu ruta
  const python = spawn("python3", [pythonPath]);

  // enviar datos al stdin del script
  python.stdin.write(JSON.stringify(req.body));
  python.stdin.end();

  let salida = "";
  let errores = "";

  python.stdout.on("data", chunk => salida += chunk.toString());
  python.stderr.on("data", chunk => errores += chunk.toString());

  python.on("close", code => {
    if (errores) console.error("Python STDERR:", errores); // ❗ Aquí ves errores internos
    if (code !== 0) {
      return res.status(500).json({
        error: "Python terminó con error",
        code,
        salida,
        errores
      });
    }

    try {
      const jsonData = JSON.parse(salida);
      res.json(jsonData);
    } catch (err) {
      res.status(500).json({
        error: "Error parseando JSON",
        detalle: err.message,
        salida,
        errores
      });
    }
  });
});

  // INICIAR
  server.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
    console.log(`Datos crudos → http://localhost:${PORT}/api/sensor/raw`);
  });
})();
