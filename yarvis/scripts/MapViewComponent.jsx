// MapViewComponent.jsx — ORS + actualización en tiempo real de túneles
import React, { useEffect, useState } from "react";
import MapView, { Marker, Polyline, Circle } from "react-native-maps";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { obtenerTuneles, obtenerTunel, obtenerPrediccion } from "./api";
import { connectSocket } from "./socket";

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjgzYzhlZWMwNTRlMTQ4OTNhOTNhNzU1YzcxZjJlNTkwIiwiaCI6Im11cm11cjY0In0=";

export default function MapViewComponent({ origin, destination }) {
  const [coords, setCoords] = useState([]);
  const [tunnel, setTunnel] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [region, setRegion] = useState(null);

  // Normalizar coordenadas
  const normalize = (p) => {
    if (!p) return null;
    return {
      latitude: p.latitude ?? p.lat,
      longitude: p.longitude ?? p.lng,
    };
  };

  const o = normalize(origin);
  const d = normalize(destination);

  // Derivar estado y color en cliente si faltan
  const obtenerEstado = (distancia) => {
    if (distancia === null || distancia === undefined) return 'desconocido';
    if (Number(distancia) < 2.0) return 'alto';
    if (Number(distancia) < 3.0) return 'medio';
    return 'bajo';
  };

  const colorPorEstado = (estadoActual, estadoPredicho) => {
    const ea = String(estadoActual || '').toLowerCase();
    const ep = String(estadoPredicho || '').toLowerCase();
    if (ea === 'alto' || ep === 'alto') return 'red';
    if (ea === 'medio' || ep === 'medio') return 'orange';
    if (ea === 'bajo' || ep === 'bajo') return 'green';
    return 'orange';
  };

  // ===============================
  //  Cargar túneles desde REST API
  // ===============================
  async function cargarTuneles() {
    try {
      // Preferir endpoint single si está disponible
      let t = null;
      try {
        t = await obtenerTunel();
      } catch (_) {
        const data = await obtenerTuneles();
        t = Array.isArray(data) && data.length > 0 ? data[0] : null;
      }
      // Incorporar predicción del backend si está disponible
      try {
        const pred = await obtenerPrediccion();
        if (pred && t) {
          t = { ...t, prediccion_cm: pred.prediccion };
        }
      } catch (_) {}
      setTunnel(t);
      // Centrar mapa al túnel como en el dashboard
      if (t) {
        const lat = t.lat ?? t.coords?.latitude;
        const lng = t.lng ?? t.coords?.longitude;
        if (lat && lng) {
          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (err) {
      console.log("Error cargando túneles:", err);
    }
  }

  // =============================================
  // Generar círculo lon-lat para avoid_polygons
  // =============================================
  function generarCirculo([lng, lat], radiusDeg = 0.0012, puntos = 24) {
    const coords = [];
    for (let i = 0; i <= puntos; i++) {
      const ang = (i * 2 * Math.PI) / puntos;
      coords.push([
        lng + radiusDeg * Math.cos(ang),
        lat + radiusDeg * Math.sin(ang),
      ]);
    }
    return coords;
  }

  // ====================================================
  //  Ruta ORS con evitación automática de túneles
  // ====================================================
  const getRoute = async () => {
    if (!o || !d) {
      console.log("Esperando origin y destination...");
      return;
    }

    setLoadingRoute(true);
    setCoords([]);

    await new Promise((res) => setTimeout(res, 3000)); // Loader 3s

    try {
      const tunelesInundados = tunnel
        ? [tunnel].filter((t) => {
            const estadoActualAlto = String(t.estado || "").toLowerCase() === "alto";
            const predichoAlto = String(t.estado_predicho || "").toLowerCase() === "alto";
            const distanciaBajaAlto = t.distancia_cm != null && Number(t.distancia_cm) < 2.0; // misma lógica del backend
            return estadoActualAlto || predichoAlto || distanciaBajaAlto;
          })
        : [];

      let avoidPolygons = null;

      if (tunelesInundados.length > 0) {
        avoidPolygons = {
          type: "MultiPolygon",
          coordinates: tunelesInundados.map((t) => [
            generarCirculo([t.lng, t.lat], 0.0012, 24),
          ]),
        };
      }

      const body = {
        coordinates: [
          [o.longitude, o.latitude],
          [d.longitude, d.latitude],
        ],
        options: avoidPolygons ? { avoid_polygons: avoidPolygons } : {},
      };

      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      console.log("ORS RESPONSE:", data);

      if (!data?.routes?.[0]?.geometry) {
        console.log("ORS no devolvió ruta alternativa");
        setLoadingRoute(false);
        return;
      }

      const decoded = decodePolyline(data.routes[0].geometry);
      setCoords(decoded);
    } catch (err) {
      console.log("ERROR ORS:", err);
    }

    setLoadingRoute(false);
  };

  // =====================
  // Decodificar polyline
  // =====================
  function decodePolyline(str) {
    let index = 0,
      lat = 0,
      lng = 0,
      coords = [];

    while (index < str.length) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      let deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      let deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coords.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coords;
  }

  // ================================
  // Cargar túneles iniciales (REST)
  // ================================
  useEffect(() => {
    cargarTuneles();
  }, []);

  // ================================================================
  //  SOCKET.IO — escucha cambios de túneles en TIEMPO REAL
  // ================================================================
  useEffect(() => {
    const socket = connectSocket();

    // El backend emite 'tunelActualizado' por cada cambio
    socket.on("tunelActualizado", (data) => {
      // Actualiza túnel único
      setTunnel((prev) => ({ ...(prev || {}), ...data }));

      // Recentrar mapa al túnel que cambió
      const lat = data.lat ?? data.coords?.latitude;
      const lng = data.lng ?? data.coords?.longitude;
      if (lat && lng) {
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });

    // Recibir actualización de predicción (imagen + valor)
    socket.on("predictionImages", (payload) => {
      if (!payload) return;
      setTunnel((prev) => {
        if (!prev) return prev;
        return { ...prev, prediccion_cm: payload.prediccion };
      });
    });

    return () => {
      socket.off("tunelActualizado");
      socket.off("predictionImages");
    };
  }, []);

  // =============================
  //  Recalcular ruta automáticamente
  // =============================
  useEffect(() => {
    getRoute();
  }, [origin, destination, tunnel]);

  return (
    <View style={styles.container}>
      {/* Banner de riesgo */}
      {tunnel && (() => {
        const predEstado = tunnel.estado_predicho || (tunnel.prediccion_cm != null ? obtenerEstado(tunnel.prediccion_cm) : null);
        const bannerHigh = String(tunnel.estado||'').toLowerCase()==='alto' || String(predEstado||'').toLowerCase()==='alto';
        return (
          <View style={[styles.banner, bannerHigh ? styles.bannerHigh : styles.bannerOk]}>
            <Text style={styles.bannerText}>
              Estado actual: {String(tunnel.estado||'?').toUpperCase()} · Predicción: {String(predEstado||'?').toUpperCase()}
            </Text>
          </View>
        );
      })()}
      {loadingRoute && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10 }}>Recalculando ruta...</Text>
        </View>
      )}

      <MapView
        style={styles.map}
        initialRegion={
          region ?? {
            latitude: o?.latitude || 20.6767,
            longitude: o?.longitude || -103.3476,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
        }
        region={region || undefined}
      >
        {o && (
          <Marker coordinate={o} title="Origen" pinColor="green" />
        )}

        {d && (
          <Marker coordinate={d} title="Destino" pinColor="blue" />
        )}

        {(() => {
          const t = tunnel;
          if (!t) return null;
          const lat = t.lat ?? t.coords?.latitude ?? t.ubicacion?.lat;
          const lng = t.lng ?? t.coords?.longitude ?? t.ubicacion?.lng;
          if (!lat || !lng) return null;

          const predEstado = t.estado_predicho || (t.prediccion_cm != null ? obtenerEstado(t.prediccion_cm) : null);
          const isAlto = String(t.estado || "").toLowerCase() === "alto" || Number(t.nivelAgua) >= 60;
          const predictedAlto = String(predEstado || "").toLowerCase() === 'alto';

          return (
            <React.Fragment key={t._id ?? t.id ?? 'tunnel'}>
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                title={t.nombre ?? `Túnel`}
                description={`Ahora: ${String(t.estado ?? "?").toUpperCase()} | Predicción: ${String((predEstado||'?')).toUpperCase()}`}
                pinColor={colorPorEstado(t.estado, predEstado)}
              />
              {(isAlto || predictedAlto) && (
                <Circle
                  center={{ latitude: lat, longitude: lng }}
                  radius={120}
                  strokeColor="rgba(255,0,0,0.9)"
                  fillColor="rgba(255,0,0,0.2)"
                />
              )}
            </React.Fragment>
          );
        })()}

        {coords.length > 0 && (
          <Polyline coordinates={coords} strokeWidth={6} strokeColor="blue" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    position: "absolute",
    zIndex: 10,
    top: 20,
    alignSelf: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 11,
  },
  bannerHigh: {
    backgroundColor: '#ff3b30',
  },
  bannerOk: {
    backgroundColor: '#34c759',
  },
  bannerText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center'
  }
});
