/**
 * Stock Pulse — Robust Local CORS Proxy for NVIDIA NIM & AI APIs
 * 
 * Usage:
 *   node proxy.js
 * 
 * In Stock Pulse API Settings:
 *   - Provider: NVIDIA NIM
 *   - Base URL: http://localhost:3000/v1
 *   - API Key: your nvapi-... key
 */

const http = require('http');
const https = require('https');

const PORT = 3000;
const TARGET_HOST = 'integrate.api.nvidia.com';

// Prevent Windows certificate validation failure on local proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = http.createServer((req, res) => {
  // CORS Headers for browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, User-Agent');

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Collect incoming request body
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);

    // Clean forwarded headers
    const forwardHeaders = {
      'host': TARGET_HOST,
      'content-type': req.headers['content-type'] || 'application/json',
      'accept': req.headers['accept'] || 'application/json',
      'content-length': bodyBuffer.length
    };

    if (req.headers['authorization']) {
      forwardHeaders['authorization'] = req.headers['authorization'];
    }
    if (req.headers['x-api-key']) {
      forwardHeaders['x-api-key'] = req.headers['x-api-key'];
    }

    const options = {
      hostname: TARGET_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      servername: TARGET_HOST,
      rejectUnauthorized: false,
      headers: forwardHeaders
    };

    const proxyReq = https.request(options, proxyRes => {
      // Forward status and headers
      const resHeaders = { ...proxyRes.headers };
      resHeaders['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode, resHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('Proxy outgoing request error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          error: 'Proxy connection error',
          message: err.message
        }));
      }
    });

    if (bodyBuffer.length > 0) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  });

  req.on('error', err => {
    console.error('Incoming request error:', err.message);
    if (!res.headersSent) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(` Stock Pulse Local Proxy is LIVE on 127.0.0.1:${PORT}`);
  console.log(` Endpoint: http://localhost:${PORT}/v1/chat/completions`);
  console.log(` In Stock Pulse API Settings:`);
  console.log(`   Base URL: http://localhost:${PORT}/v1`);
  console.log(`=======================================================`);
});
