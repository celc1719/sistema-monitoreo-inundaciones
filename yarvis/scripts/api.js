// src/api.js
export const BACKEND = "http://192.168.100.11:4000"; // ej: http://192.168.1.72:4000
export async function obtenerTuneles() {
  const res = await fetch(`${BACKEND}/api/tuneles`);
  return await res.json();
}

export async function obtenerTunel() {
  const res = await fetch(`${BACKEND}/api/tunel`);
  return await res.json();
}

export async function obtenerPrediccion() {
  const res = await fetch(`${BACKEND}/api/prediccion`);
  if (res.ok) {
    return await res.json();
  }
  return null;
}
