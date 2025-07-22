const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const sensorData = {};

// Serve static HTML dashboard
function serveDashboard(res) {
  const filePath = path.join(__dirname, 'dashboard.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error loading dashboard');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { method } = req;
  const pathname = parsedUrl.pathname;

  // --- CORS headers for all responses ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // --- Serve HTML dashboard on / or /dashboard ---
  if (method === 'GET' && (pathname === '/' || pathname === '/dashboard')) {
    return serveDashboard(res);
  }

  // --- POST /sensor ---
  if (method === 'POST' && pathname === '/sensor') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { id, temperature, humidity } = data;

        if (!id || temperature === undefined || humidity === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing id, temperature, or humidity' }));
        }

        const key = `sensor${id}`;
        sensorData[key] = { temperature, humidity };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }

  // --- GET /sensor?id=1..4 ---
  else if (method === 'GET' && pathname === '/sensor') {
    const id = parsedUrl.query.id;
    const key = `sensor${id}`;

    if (!id || !sensorData[key]) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Sensor ID not found' }));
    }

    const sensor = sensorData[key];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sensor));
  }

  // --- Unknown route ---
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
