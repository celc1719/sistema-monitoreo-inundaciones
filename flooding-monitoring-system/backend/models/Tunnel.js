const mongoose = require('mongoose');

const TunnelSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nombre: String,

  // tu estructura original
  ubicacion: {
    lat: Number,
    lng: Number
  },

  // lo que usa tu frontend
  lat: Number,
  lng: Number,
  coords: {
    latitude: Number,
    longitude: Number
  },

  nivelAgua: Number,     // lo que TU frontend usa
  nivel_agua: Number,    // lo que TIENEN tus datos
  humedad: Number,
  lluvia: Number,
  estado: String,

  alternativa: { latitude: Number, longitude: Number },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tunnel', TunnelSchema, 'tuneles');
