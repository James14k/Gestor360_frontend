export interface Bodega {
  nombre: string;
  uso: string;
}

/** Bodegas habilitadas, segregadas por tipo de sustancia peligrosa. */
export const BODEGAS: readonly Bodega[] = [
  { nombre: 'Bodega 5', uso: 'Inflamables' },
  { nombre: 'Bodega 6', uso: 'Corrosivos' },
  { nombre: 'Bodega 7', uso: 'Misceláneos' },
  { nombre: 'Bodega 8', uso: 'Otras clases' },
];

export function usoDeBodega(nombre: string): string {
  return BODEGAS.find((b) => b.nombre === nombre)?.uso ?? '';
}

export function esBodegaValida(nombre: string): boolean {
  return BODEGAS.some((b) => b.nombre === nombre);
}

/**
 * Bodega que corresponde a una clase IMO:
 * 2.1, 3 y 4.x (inflamables) -> 5 · 8 (corrosivos) -> 6 · 9 (misceláneos) -> 7 · resto -> 8.
 */
export function bodegaSugerida(imo: string | null | undefined): string | null {
  const match = (imo ?? '').match(/Clase\s+(\d)(?:\.(\d))?/i);
  if (!match) return null;
  const clase = match[1];
  const division = match[2];
  if ((clase === '2' && division === '1') || clase === '3' || clase === '4') return 'Bodega 5';
  if (clase === '8') return 'Bodega 6';
  if (clase === '9') return 'Bodega 7';
  return 'Bodega 8';
}
