import { ProductoSuspel } from '../core/models/producto.model';

const MAX_NOMBRE = 200;
const MAX_IMO = 500;
const MAX_BODEGA = 100;

export interface ProductoFormValue {
  nombre: string;
  imo: string;
  bodega: string;
  cantidad: number | string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  values: ProductoSuspel;
}

export function validateProducto(payload: ProductoFormValue): ValidationResult {
  const errors: Record<string, string> = {};

  const nombre = (payload.nombre ?? '').trim();
  const imo = (payload.imo ?? '').trim();
  const bodega = (payload.bodega ?? '').trim();
  const cantidadRaw = payload.cantidad;

  if (!nombre) {
    errors['nombre'] = 'El nombre del producto es obligatorio.';
  } else if (nombre.length > MAX_NOMBRE) {
    errors['nombre'] = `El nombre no puede superar ${MAX_NOMBRE} caracteres.`;
  }

  if (!imo) {
    errors['imo'] = 'La clasificación IMO es obligatoria.';
  } else if (imo.length > MAX_IMO) {
    errors['imo'] = `La clasificación IMO no puede superar ${MAX_IMO} caracteres.`;
  }

  if (!bodega) {
    errors['bodega'] = 'La bodega es obligatoria.';
  } else if (bodega.length > MAX_BODEGA) {
    errors['bodega'] = `La bodega no puede superar ${MAX_BODEGA} caracteres.`;
  }

  if (cantidadRaw === '' || cantidadRaw === null || cantidadRaw === undefined) {
    errors['cantidad'] = 'La cantidad es obligatoria.';
  } else {
    const cantidad = Number(cantidadRaw);
    if (!Number.isInteger(cantidad)) {
      errors['cantidad'] = 'La cantidad debe ser un número entero.';
    } else if (cantidad < 0) {
      errors['cantidad'] = 'La cantidad no puede ser negativa.';
    } else if (cantidad > 999999999) {
      errors['cantidad'] = 'La cantidad ingresada es demasiado alta.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      nombre,
      imo,
      bodega,
      cantidad: errors['cantidad'] ? Number(cantidadRaw) || 0 : Number(cantidadRaw),
    },
  };
}
