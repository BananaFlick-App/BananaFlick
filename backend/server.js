require('dotenv').config();
const express = require('express');
const cors = require('cors');

const proxy = require('./src/proxy');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('BananaFlick backend'));

app.get('/api/movies', (req, res) => {
  const action = req.query.action;
  if (action === 'genres') {
    return proxy.genres(req, res);
  } else if (action === 'recommend' || action === 'discover') {
    return proxy.discover(req, res);
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.get('/api/genres', proxy.genres);
app.get('/api/discover', proxy.discover);
app.get('/api/search', proxy.search);
app.get('/api/details/:id', proxy.details);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
