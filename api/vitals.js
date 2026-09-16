const handler = require('../OmniHub/server.js');

module.exports = async (req, res) => {
  req.url = '/api/vitals';
  try {
    return await handler(req, res);
  } catch (err) {
    console.error('API Vitals Error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
};
