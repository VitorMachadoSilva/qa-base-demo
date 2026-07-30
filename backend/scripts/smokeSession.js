const sessions = new Map();

async function login(apiUrl, credentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Smoke login failed with HTTP ${response.status}`);
  }

  const cookie = response.headers.get('set-cookie')?.split(';')[0];

  if (!cookie) {
    throw new Error('Smoke login did not return a session cookie');
  }

  return cookie;
}

export async function authenticatedFetch(apiUrl, path, options = {}) {
  return authenticatedFetchAs(apiUrl, path, options, {
    email: process.env.QABASE_SMOKE_EMAIL || 'vitor.silva@qabase.com',
    password: process.env.QABASE_SMOKE_PASSWORD || 'vitor@sw123456'
  });
}

export async function authenticatedFetchAs(
  apiUrl,
  path,
  options = {},
  credentials
) {
  const key = `${apiUrl}:${credentials.email}`;

  if (!sessions.has(key)) {
    sessions.set(key, login(apiUrl, credentials));
  }

  const cookie = await sessions.get(key);
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookie
    }
  });
}
