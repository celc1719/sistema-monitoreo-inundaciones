# Dashboard (Protección Civil)

Interfaz web simple para monitorear en tiempo real el nivel de agua de los túneles.

Cómo usar (local):

1. Asegúrate de que el backend esté corriendo (desde `mobile_inundacion/backend`):

```bash
# en zsh
cd backend
# exporta MONGO_URI en tu entorno o usa dotenv en .env
node server.js
```

2. Abrir el dashboard en el navegador:

- Si iniciaste el backend en `http://localhost:4000`, la URL del dashboard será:

```
http://localhost:4000/dashboard/
```

Qué hace:
- Lista de túneles (GET `/api/tuneles`).
- Conexión Socket.IO y evento `tunelActualizado` para tiempo real.
- Gráfica de historial (últimos ~30 puntos) del túnel seleccionado.
- Mapa Leaflet con marcadores coloreados por estado (bajo=azul, medio= naranja, alto= rojo).
- Panel de configuración de umbrales (medio / alto) con endpoints `/api/config` (GET/POST).
- Banner de alerta si uno o más túneles exceden el umbral alto.

Notas y mejoras sugeridas:
- Añadir mapa interactivo (Leaflet/Mapbox) si se desea ver ubicación.
- Añadir autenticación y roles para protección civil.
- Añadir alertas externas (SMS/Correo) cuando un túnel pase un umbral crítico.
- Persistir configuraciones de umbrales en BD (actualmente en memoria en el backend).
- Guardar historial temporal en Mongo para análisis.

Prueba rápida automática:

```bash
cd backend
node test-dashboard.js http://localhost:4000
```

Debe imprimir túneles iniciales, hacer un POST de update y recibir el evento Socket.IO confirmando el nuevo nivel y estado.

Integración de predicciones (Python)
----------------------------------
Se añadió soporte para ejecutar los scripts de predicción que están en `scripts/predicciones/`.

Requisitos en el servidor (Python):

```bash
# crea un virtualenv (recomendado)
python3 -m venv venv
source venv/bin/activate
pip install pandas pymongo matplotlib
```

Cómo funciona:
- El backend de Node ejecuta periódicamente `scripts/predicciones/run_prediction.py`.
- El script genera dos imágenes (historial de distancia y humedad/temperatura) en `dashboard/predictions/` y devuelve un JSON con la predicción.
- El backend emite un evento Socket.IO `prediccion` y expone `GET /api/prediccion` con el último resultado.
- El dashboard carga las imágenes desde `/dashboard/predictions/` y muestra el texto de riesgo.

Comprobación rápida:

1. Instala dependencias Python y asegúrate de que `modelo_distancia.pkl` esté presente en `scripts/predicciones/`.
2. Arranca el backend (`npm start`) y revisa en terminal que aparezca la ejecución inicial de la predicción.
3. Abre el dashboard y comprueba que la sección "Predicción" muestra el resultado y las gráficas.
