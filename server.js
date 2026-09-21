require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5008;
const publicDir = path.join(__dirname, 'public');
const indexFile = path.join(publicDir, 'index.html');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(publicDir));

app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Digital Culture Schools',
    port: PORT,
    environment: process.env.NODE_ENV || 'production'
  });
});

// Direct URL for viewing the website page on port 5008.
app.get('/site', (_, res) => res.sendFile(indexFile));

// Client-side routes such as /profile and /dashboard.
app.get('*', (_, res) => res.sendFile(indexFile));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Digital Culture Schools is running at http://0.0.0.0:${PORT}`);
});
