const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const targetUrl = reqUrl.searchParams.get('url');

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing target url parameter' }));
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid target url' }));
  }

  const isHttps = parsedTarget.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: (parsedTarget.pathname || '/') + (parsedTarget.search || ''),
    method: req.method || 'GET',
    headers: {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
    },
    rejectUnauthorized: false,
    timeout: 8000
  };

  const proxyReq = client.request(options, (proxyRes) => {
    // Modify headers to allow iframe embedding
    const headers = { ...proxyRes.headers };
    
    // Strip anti-framing headers
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    
    // Set permissive framing and CORS
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
    
    const contentType = headers['content-type'] || '';

    // If HTML, inject <base href="..."> so relative paths resolve cleanly
    if (contentType.includes('text/html')) {
      delete headers['content-length'];
      res.writeHead(proxyRes.statusCode, headers);

      let body = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', chunk => { body += chunk; });
      proxyRes.on('end', () => {
        const baseHref = `${parsedTarget.origin}${parsedTarget.pathname.substring(0, parsedTarget.pathname.lastIndexOf('/') + 1)}`;
        const baseTag = `<base href="${baseHref}">`;
        
        let modifiedHtml = body;
        if (body.includes('<head>')) {
          modifiedHtml = body.replace('<head>', `<head>${baseTag}`);
        } else if (body.includes('<html>')) {
          modifiedHtml = body.replace('<html>', `<html><head>${baseTag}</head>`);
        }
        res.end(modifiedHtml);
      });
    } else {
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gateway timeout contacting target URL' }));
    }
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy upstream error: ${err.message}` }));
    }
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
};
