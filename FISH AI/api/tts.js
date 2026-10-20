const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { text, reference_id, apiKey } = req.body;
    // Clave por defecto o la que envíe el usuario
    const FISH_API_KEY = apiKey || "Sk-fish-q1wZEPg4BuCtELetM9601qxSZf9yJltOVlRyRuedjU0";

    if (!text || !reference_id) {
      return res.status(400).json({ error: "Faltan parámetros: text o reference_id" });
    }

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FISH_API_KEY}`,
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

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({ 
      success: true, 
      audio: `data:audio/mp3;base64,${base64Audio}` 
    });

  } catch (error) {
    console.error("Error TTS:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
};