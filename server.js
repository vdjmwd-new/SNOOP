const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory game state (placeholder)
const gameState = {
  timeOfDay: 'night', // 'day' | 'night'
  clues: []
};

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic API for game state
app.get('/api/state', (req, res) => {
  res.json(gameState);
});

app.post('/api/time', (req, res) => {
  const { timeOfDay } = req.body || {};
  if (timeOfDay !== 'day' && timeOfDay !== 'night') {
    return res.status(400).json({ error: 'Invalid timeOfDay' });
  }
  gameState.timeOfDay = timeOfDay;
  res.json({ ok: true, timeOfDay });
});

app.post('/api/clues', (req, res) => {
  const { clue } = req.body || {};
  if (!clue) {
    return res.status(400).json({ error: 'Missing clue' });
  }
  gameState.clues.push(clue);
  res.json({ ok: true, clues: gameState.clues });
});

app.listen(PORT, () => {
  console.log(`SNOOP server listening on http://localhost:${PORT}`);
});

