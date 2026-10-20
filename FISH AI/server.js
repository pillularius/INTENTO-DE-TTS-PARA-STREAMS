const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
// API Key de Fish Audio configurada desde variables de entorno o la ingresada
const FISH_API_KEY = process.env.FISH_API_KEY || "Sk-fish-q1wZEPg4BuCtELetM9601qxSZf9yJltOVlRyRuedjU0";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Servir la página principal de moderación/TTS
app.get('/tts/mods', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para generar TTS mediante Fish Audio API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, reference_id, apiKey } = req.body;
    const keyToUse = apiKey || FISH_API_KEY;

    if (!text || !reference_id) {
      return res.status(400).json({ error: "Faltan parámetros: text o reference_id" });
    }

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keyToUse}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        reference_id: reference_id,
        format: "mp3"
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      return res.status(response.status).json({ error: "Error en Fish AI API", details: errData });
    }

    const audioBuffer = await response.buffer();
    const base64Audio = audioBuffer.toString('base64');

    // Transmitir evento de audio en tiempo real a los clientes/overlays conectados
    io.emit('play-tts', { audio: `data:audio/mp3;base64,${base64Audio}`, text });

    return res.json({ success: true, message: "Audio generado con éxito" });
  } catch (error) {
    console.error("Error TTS:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// WebSocket conexiones
io.on('connection', (socket) => {
  console.log('Cliente / Overlay conectado:', socket.id);
});

server.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});