// Script de prueba rápida del flujo: obtiene túneles, actualiza uno y escucha evento Socket.IO
// Requisitos: backend corriendo y MONGO_URI válido.
// Uso:
//   node test-dashboard.js [BACKEND_URL]
// Ej: node test-dashboard.js http://localhost:4000

const urlBase = process.argv[2] || 'http://localhost:4000';
const io = require('socket.io-client');

async function main() {
  console.log('Usando backend:', urlBase);
  // Obtener túneles
  const tunelesResp = await fetch(urlBase + '/api/tuneles');
  const tuneles = await tunelesResp.json();
  console.log('Túneles iniciales:', tuneles.map(t => ({ id: t.id, nivel: t.nivelAgua || t.nivel_agua })));

  const targetId = tuneles[0]?.id || 9999;
  const nuevoNivel = Math.floor(Math.random() * 100);

  // Conectar socket para escuchar
  const socket = io(urlBase, { transports: ['websocket'] });

  const receivedPromise = new Promise((resolve) => {
    socket.on('tunelActualizado', (payload) => {
      if (payload.id === targetId) {
        console.log('Evento recibido para túnel', targetId, '-> nivelAgua', payload.nivelAgua || payload.nivel_agua);
        resolve(payload);
      }
    });
  });

  // Realizar update
  const updResp = await fetch(urlBase + '/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: targetId, nombre: 'Test', lat: 0, lng: 0, nivelAgua: nuevoNivel })
  });
  const updJson = await updResp.json();
  console.log('POST /api/update respuesta:', updJson);

  // Esperar evento
  const ev = await Promise.race([
    receivedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout esperando evento')), 5000))
  ]);

  console.log('Prueba OK. Estado calculado:', ev.estado);
  socket.close();
}

main().catch(e => {
  console.error('Error en prueba:', e);
  process.exit(1);
});
