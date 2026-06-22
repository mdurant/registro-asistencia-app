/**
 * API mock + envío real de correos (Mailtrap SMTP).
 * Ejecutar: npm run api
 */

require('dotenv').config();

const http = require('http');
const crypto = require('crypto');

const { sendEmail } = require('./mailer');

const PORT = process.env.PORT || 3001;
const processedIds = new Map();

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === 'POST' && req.url === '/sync') {
      const body = await readBody(req);
      const key = `${body.entityType}:${body.entityId}`;

      if (processedIds.has(key)) {
        return sendJson(res, 200, { serverId: processedIds.get(key), ip: '127.0.0.1' });
      }

      const serverId = crypto.randomUUID();
      processedIds.set(key, serverId);

      console.log(`[SYNC] ${body.entityType} ${body.entityId}`, body.payload?.eventType ?? '');
      return sendJson(res, 200, { serverId, ip: req.socket.remoteAddress });
    }

    if (req.method === 'POST' && req.url === '/email') {
      const body = await readBody(req);
      const result = await sendEmail({
        to: body.to,
        subject: body.subject,
        html: body.html,
      });
      return sendJson(res, 200, result);
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[API]', err);
    sendJson(res, 500, { error: String(err) });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mi Asistencia API en http://0.0.0.0:${PORT}`);
  console.log(`Accesible desde el teléfono: http://<IP-de-tu-PC>:${PORT}`);
  if (process.env.SMTP_HOST) {
    console.log(`SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 2525}`);
  } else {
    console.log('SMTP: no configurado (solo log en consola)');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nEl puerto ${PORT} ya está en uso.`);
    console.error(`Reiniciar: lsof -ti :${PORT} | xargs kill && npm run api\n`);
    process.exit(1);
  }
  throw err;
});
