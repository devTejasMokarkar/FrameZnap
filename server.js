const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const MIME = {
  html: 'text/html', css: 'text/css', js: 'application/javascript',
  wasm: 'application/wasm', mp4: 'video/mp4', json: 'application/json',
  xml: 'text/xml', txt: 'text/plain', png: 'image/png', ico: 'image/x-icon',
};

http.createServer((req, res) => {
  let fp = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  let ext = path.extname(fp).slice(1);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    res.end(data);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT));
