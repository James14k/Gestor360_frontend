const MAX_NOMBRE = 200;
const MAX_IMO = 500;
const MAX_BODEGA = 100;

export function validateProducto(payload, { isUpdate = false } = {}) {
  const errors = {};

  const nombre = (payload.nombre ?? '').trim();
  const imo = (payload.imo ?? '').trim();
  const bodega = (payload.bodega ?? '').trim();
  const cantidadRaw = payload.cantidad;

  if (!nombre) {
    errors.nombre = 'El nombre del producto es obligatorio.';
  } else if (nombre.length > MAX_NOMBRE) {
    errors.nombre = `El nombre no puede superar ${MAX_NOMBRE} caracteres.`;
  }

  if (!imo) {
    errors.imo = 'La clasificación IMO es obligatoria.';
  } else if (imo.length > MAX_IMO) {
    errors.imo = `La clasificación IMO no puede superar ${MAX_IMO} caracteres.`;
  }

  if (!bodega) {
    errors.bodega = 'La bodega es obligatoria.';
  } else if (bodega.length > MAX_BODEGA) {
    errors.bodega = `La bodega no puede superar ${MAX_BODEGA} caracteres.`;
  }

  if (cantidadRaw === '' || cantidadRaw === null || cantidadRaw === undefined) {
    errors.cantidad = 'La cantidad es obligatoria.';
  } else {
    const cantidad = Number(cantidadRaw);
    if (!Number.isInteger(cantidad)) {
      errors.cantidad = 'La cantidad debe ser un número entero.';
    } else if (cantidad < 0) {
      errors.cantidad = 'La cantidad no puede ser negativa.';
    } else if (cantidad > 999999999) {
      errors.cantidad = 'La cantidad ingresada es demasiado alta.';
    }
  }

  if (isUpdate && payload.id !== undefined && payload.id !== null && payload.id === '') {
    errors.id = 'Identificador de producto no válido.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      nombre,
      imo,
      bodega,
      cantidad: errors.cantidad ? cantidadRaw : Number(cantidadRaw),
    },
  };
}

export function applyFieldErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  form.querySelectorAll('[data-field-error]').forEach((el) => {
    el.textContent = '';
    el.hidden = true;
  });

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`);
    const feedback = form.querySelector(`[data-field-error="${field}"]`);
    if (input) input.classList.add('is-invalid');
    if (feedback) {
      feedback.textContent = message;
      feedback.hidden = false;
    }
  });
}

export function clearFieldErrors(form) {
  applyFieldErrors(form, {});
}
