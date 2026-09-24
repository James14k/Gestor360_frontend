import AppConfig from '../config.js';
import { ApiError, mapHttpStatusToMessage } from '../utils/errors.js';

/**
 * Cliente HTTP centralizado (Fetch API).
 */
class ApiClient {
  constructor(baseUrl, timeoutMs) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async request(method, path, options = {}) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers = {
      Accept: 'application/json',
      ...options.headers,
    };

    const init = {
      method,
      headers,
      signal: controller.signal,
    };

    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, init);
      clearTimeout(timeoutId);

      if (response.status === 204) {
        return { data: null, response };
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } else if (response.status !== 404) {
        const text = await response.text();
        data = text || null;
      }

      if (!response.ok) {
        const message =
          (data && (data.message || data.error || data.detail)) ||
          mapHttpStatusToMessage(response.status);
        throw new ApiError(message, response.status, data);
      }

      return { data, response };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError(
          'La solicitud tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.',
          408
        );
      }

      if (error instanceof TypeError) {
        throw new ApiError(
          'No fue posible conectar con el sistema. Compruebe su conexión e inténtelo nuevamente.',
          0
        );
      }

      throw new ApiError('Ocurrió un error inesperado al procesar la solicitud.', 500, error);
    }
  }

  get(path, options) {
    return this.request('GET', path, options);
  }

  post(path, body, options) {
    return this.request('POST', path, { ...options, body });
  }

  put(path, body, options) {
    return this.request('PUT', path, { ...options, body });
  }

  patch(path, body, options) {
    return this.request('PATCH', path, { ...options, body });
  }

  delete(path, options) {
    return this.request('DELETE', path, options);
  }
}

const api = new ApiClient(AppConfig.apiBaseUrl, AppConfig.requestTimeoutMs);

export default api;
