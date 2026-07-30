const TELEGRAM_API_ROOT = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 10_000;

export class TelegramError extends Error {
  constructor(message, { code = 'TELEGRAM_ERROR', httpStatus = null } = {}) {
    super(message);
    this.name = 'TelegramError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function safeMessage(value, token) {
  const message = String(value || 'Falha desconhecida no Telegram');
  return token ? message.split(token).join('[token]') : message;
}

export function createTelegramClient({
  token = process.env.TELEGRAM_BOT_TOKEN,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const configured = Boolean(token?.trim());

  async function request(method, payload = {}) {
    if (!configured) {
      throw new TelegramError('Token do Telegram nao configurado', {
        code: 'TOKEN_NOT_CONFIGURED'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${TELEGRAM_API_ROOT}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new TelegramError(
          safeMessage(data?.description || `Telegram respondeu com HTTP ${response.status}`, token),
          {
            code: data?.error_code ? `TELEGRAM_${data.error_code}` : 'TELEGRAM_REJECTED',
            httpStatus: response.status
          }
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof TelegramError) {
        throw error;
      }

      const timedOut = error.name === 'AbortError';
      throw new TelegramError(
        timedOut ? 'Tempo limite excedido ao acessar o Telegram' : 'Nao foi possivel acessar o Telegram',
        { code: timedOut ? 'TELEGRAM_TIMEOUT' : 'TELEGRAM_UNAVAILABLE' }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    configured,
    getMe: () => request('getMe'),
    getUpdates: (offset) =>
      request('getUpdates', {
        ...(offset ? { offset } : {}),
        timeout: 0,
        allowed_updates: ['message']
      }),
    getChat: (chatId) => request('getChat', { chat_id: chatId }),
    sendMessage: (chatId, text) =>
      request('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
  };
}
