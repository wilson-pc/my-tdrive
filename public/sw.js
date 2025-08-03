// sw.js
const PENDING = new Map();  // id → {clientId, file, params}

self.addEventListener('message', (e) => {
  const { id, file, params } = e.data;
  PENDING.set(id, { clientId: e.source.id, file, params });
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const id = url.pathname.slice(1);            //  /uuid  → uuid
  const job = PENDING.get(id);
  if (!job) return;

  e.respondWith(handleStreamDownload(job));
  PENDING.delete(id);
});

async function handleStreamDownload({ clientId, file, params }) {
  // Pedimos al cliente (tu página) que nos dé el ReadableStream
  const client = await self.clients.get(clientId);
  const channel = new MessageChannel();
  const streamPromise = new Promise((resolve) => {
    channel.port1.onmessage = (ev) => resolve(ev.data.stream);
  });

  client.postMessage({ type: 'REQUEST_STREAM', file, params }, [channel.port2]);
  const stream = await streamPromise;

  // Headers que entiende el navegador
  const headers = {
    'Content-Type': file.mimeType || 'application/octet-stream',
    'Content-Length': file.size,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`
  };

  return new Response(stream, { headers });
}