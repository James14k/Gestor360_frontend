/**
 * Extrae la etiqueta de clase IMO (ej. "Clase 3") desde el campo imo del backend.
 */
export function extractImoClass(imo) {
  if (!imo) return '';
  const match = String(imo).match(/Clase\s+[\d.]+/i);
  return match ? match[0] : imo;
}

export function formatQuantity(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('es-CL').format(Number(value));
}

export function compareStrings(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'es', { sensitivity: 'base' });
}

export function compareNumbers(a, b) {
  return (Number(a) || 0) - (Number(b) || 0);
}
