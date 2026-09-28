/** Extrae la etiqueta de clase IMO (ej. "Clase 3") desde el campo imo del backend. */
export function extractImoClass(imo: string | undefined | null): string {
  if (!imo) return '';
  const match = String(imo).match(/Clase\s+[\d.]+/i);
  return match ? match[0] : imo;
}

export function formatQuantity(value: number | string | undefined | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('es-CL').format(Number(value));
}

export function compareStrings(a: unknown, b: unknown): number {
  return String(a ?? '').localeCompare(String(b ?? ''), 'es', { sensitivity: 'base' });
}

export function compareNumbers(a: unknown, b: unknown): number {
  return (Number(a) || 0) - (Number(b) || 0);
}
