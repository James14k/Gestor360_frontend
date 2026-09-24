export class ApiError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const STATUS_MESSAGES = {
  400: 'La solicitud no es válida. Revisa los datos enviados.',
  401: 'Debes iniciar sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'Conflicto: el recurso ya existe o no puede modificarse.',
  422: 'Los datos enviados no cumplen las validaciones del servidor.',
  429: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  500: 'Error interno del servidor. Inténtalo más tarde.',
  502: 'El servidor no está disponible temporalmente.',
  503: 'Servicio no disponible. Inténtalo más tarde.',
};

export function mapHttpStatusToMessage(status) {
  return STATUS_MESSAGES[status] || `Error del servidor (código ${status}).`;
}

export function logErrorForDebug(error, context = '') {
  const prefix = context ? `[${context}]` : '[Pedidos360]';
  if (error instanceof ApiError) {
    console.error(prefix, error.message, { status: error.status, payload: error.payload });
  } else {
    console.error(prefix, error);
  }
}
