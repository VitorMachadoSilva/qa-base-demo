export function parseId(value, label = 'id') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${label} invalido`);
    error.status = 400;
    throw error;
  }

  return id;
}

export function sendError(res, error) {
  const status = error.status || 500;
  const message = status === 500 ? 'Erro interno no servidor' : error.message;

  res.status(status).json({ error: message });
}
