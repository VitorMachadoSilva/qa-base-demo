import '../src/config/env.js';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'production';
process.env.QABASE_FRONTEND_DIST = fileURLToPath(
  new URL('../../frontend/dist', import.meta.url)
);

const { app } = await import('../src/app.js');
const { prisma } = await import('../src/db/client.js');

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});

const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;

try {
  const health = await fetch(`${origin}/api/health`);
  const healthBody = await health.json();
  if (!health.ok || healthBody.status !== 'ok') {
    throw new Error('Production health check failed');
  }

  for (const path of ['/', '/account', '/projects']) {
    const response = await fetch(`${origin}${path}`);
    const body = await response.text();
    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('text/html') ||
      !body.includes('<div id="root"></div>')
    ) {
      throw new Error(`SPA fallback failed for ${path}`);
    }
  }

  const missingApi = await fetch(`${origin}/api/not-a-route`);
  if (
    missingApi.status < 400 ||
    !missingApi.headers.get('content-type')?.includes('application/json')
  ) {
    throw new Error('Unknown API route escaped to the SPA fallback');
  }

  const sameOrigin = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin
    },
    body: '{}'
  });
  if (sameOrigin.status === 403) {
    throw new Error('A mutation from the request host was rejected');
  }

  const foreignOrigin = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://invalid.example'
    },
    body: '{}'
  });
  if (foreignOrigin.status !== 403) {
    throw new Error('A foreign mutation origin was accepted');
  }

  console.log('Production runtime smoke test passed.');
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
