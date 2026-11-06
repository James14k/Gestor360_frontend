import { Component, computed, input } from '@angular/core';

type Pictograma = 'llama' | 'llamaSobreCirculo' | 'calavera' | 'corrosivo' | 'cilindro' | 'explosion' | 'trebol' | 'ninguno';

interface Etiqueta {
  arriba: string;
  abajo: string;
  rayas?: 'todo' | 'arriba';
  pictograma: Pictograma;
  colorSimbolo: string;
  colorNumero: string;
  numero: string;
}

const NOMBRE_CLASE: Record<string, string> = {
  '1': 'Explosivos',
  '2.1': 'Gases inflamables',
  '2.2': 'Gases no inflamables, no tóxicos',
  '2.3': 'Gases tóxicos',
  '3': 'Líquidos inflamables',
  '4.1': 'Sólidos inflamables',
  '4.2': 'Combustión espontánea',
  '4.3': 'Peligroso en contacto con agua',
  '5.1': 'Comburentes',
  '5.2': 'Peróxidos orgánicos',
  '6.1': 'Sustancias tóxicas',
  '6.2': 'Sustancias infecciosas',
  '7': 'Material radiactivo',
  '8': 'Sustancias corrosivas',
  '9': 'Sustancias peligrosas varias',
};

const ROJO = '#d7261e';
const BLANCO = '#ffffff';
const NEGRO = '#111111';

function etiqueta(
  arriba: string,
  abajo: string,
  pictograma: Pictograma,
  colorSimbolo: string,
  colorNumero: string,
  numero: string,
  rayas?: 'todo' | 'arriba'
): Etiqueta {
  return { arriba, abajo, pictograma, colorSimbolo, colorNumero, numero, rayas };
}

const ETIQUETAS: Record<string, Etiqueta> = {
  '1': etiqueta('#f39200', '#f39200', 'explosion', NEGRO, NEGRO, '1'),
  '2.1': etiqueta(ROJO, ROJO, 'llama', BLANCO, BLANCO, '2'),
  '2.2': etiqueta('#00965e', '#00965e', 'cilindro', BLANCO, BLANCO, '2'),
  '2.3': etiqueta(BLANCO, BLANCO, 'calavera', NEGRO, NEGRO, '2'),
  '3': etiqueta(ROJO, ROJO, 'llama', BLANCO, BLANCO, '3'),
  '4.1': etiqueta(BLANCO, BLANCO, 'llama', NEGRO, NEGRO, '4', 'todo'),
  '4.2': etiqueta(BLANCO, ROJO, 'llama', NEGRO, NEGRO, '4'),
  '4.3': etiqueta('#0072bc', '#0072bc', 'llama', BLANCO, BLANCO, '4'),
  '5.1': etiqueta('#ffd200', '#ffd200', 'llamaSobreCirculo', NEGRO, NEGRO, '5.1'),
  '5.2': etiqueta(ROJO, '#ffd200', 'llama', NEGRO, NEGRO, '5.2'),
  '6.1': etiqueta(BLANCO, BLANCO, 'calavera', NEGRO, NEGRO, '6'),
  '6.2': etiqueta(BLANCO, BLANCO, 'ninguno', NEGRO, NEGRO, '6'),
  '7': etiqueta('#ffd200', BLANCO, 'trebol', NEGRO, NEGRO, '7'),
  '8': etiqueta(BLANCO, NEGRO, 'corrosivo', NEGRO, BLANCO, '8'),
  '9': etiqueta(BLANCO, BLANCO, 'ninguno', NEGRO, NEGRO, '9', 'arriba'),
};

const RAYAS_X = [8, 22, 36, 50, 64, 78, 92];
const RAYOS_EXPLOSION = [0, 45, 90, 135, 180, 225, 270, 315];
const HOJAS_TREBOL = [0, 120, 240];

/** "Clase 3 - Líquido Inflamable", "6.1", "Clase 4.1" -> clase reconocida; null si no lo es. */
export function claseImoDe(texto: string | null | undefined): string | null {
  const match = /(\d(?:\.\d)?)/.exec(texto ?? '');
  if (!match) return null;
  if (NOMBRE_CLASE[match[1]]) return match[1];
  const entero = match[1].split('.')[0];
  return NOMBRE_CLASE[entero] ? entero : null;
}

export function nombreClaseImo(texto: string | null | undefined): string | null {
  const clase = claseImoDe(texto);
  return clase ? NOMBRE_CLASE[clase] : null;
}

let secuencia = 0;

/** Rombo de la etiqueta de clase de peligro (ONU / IMDG), dibujo simplificado por clase. */
@Component({
  selector: 'app-rombo-imo',
  standalone: true,
  host: { class: 'rombo-imo' },
  template: `
    @if (etiqueta(); as e) {
      <svg
        [attr.width]="tamano()"
        [attr.height]="tamano()"
        viewBox="0 0 100 100"
        role="img"
        [attr.aria-label]="titulo()"
        class="flex-shrink-0"
      >
        <title>{{ titulo() }}</title>
        <defs>
          <clipPath [attr.id]="recorte">
            <polygon points="50,1 99,50 50,99 1,50" />
          </clipPath>
        </defs>
        <g [attr.clip-path]="'url(#' + recorte + ')'">
          <rect x="0" y="0" width="100" height="50" [attr.fill]="e.arriba" />
          <rect x="0" y="50" width="100" height="50" [attr.fill]="e.abajo" />
          @if (e.rayas) {
            @for (x of rayasX; track x) {
              <rect
                [attr.x]="x - 3.5"
                y="0"
                width="7"
                [attr.height]="e.rayas === 'todo' ? 100 : 50"
                [attr.fill]="e.rayas === 'todo' ? rojo : negro"
              />
            }
          }
        </g>
        <polygon points="50,1 99,50 50,99 1,50" fill="none" stroke="#475569" stroke-width="2" />
        <polygon points="50,7 93,50 50,93 7,50" fill="none" [attr.stroke]="e.colorSimbolo" stroke-width="1.5" />
        @switch (e.pictograma) {
          @case ('llama') {
            <g [attr.fill]="e.colorSimbolo">
              <path d="M50 12c5 8 12 12 11 22-1 7-5 11-11 12-7-1-11-5-11-11 0-5 3-8 5-11 0 4 2 6 4 6-2-6-1-12 2-18z" />
              <rect x="36" y="47" width="28" height="3" />
            </g>
          }
          @case ('llamaSobreCirculo') {
            <g [attr.fill]="e.colorSimbolo">
              <path d="M50 10c4 6 9 9 8 16-1 4-3 6-6 7h-4c-4-1-6-4-6-8 0-4 2-6 4-8 0 3 1 4 3 4-1-4 0-8 1-11z" />
              <circle cx="50" cy="40" r="7" fill="none" [attr.stroke]="e.colorSimbolo" stroke-width="3" />
              <rect x="36" y="49" width="28" height="3" />
            </g>
          }
          @case ('calavera') {
            <g>
              <path d="M34 36 66 48M34 48 66 36" [attr.stroke]="e.colorSimbolo" stroke-width="4" stroke-linecap="round" />
              <circle cx="50" cy="26" r="11" [attr.fill]="e.colorSimbolo" />
              <rect x="44" y="33" width="12" height="8" rx="2" [attr.fill]="e.colorSimbolo" />
              <circle cx="45.5" cy="25" r="3" [attr.fill]="e.arriba" />
              <circle cx="54.5" cy="25" r="3" [attr.fill]="e.arriba" />
            </g>
          }
          @case ('corrosivo') {
            <g [attr.fill]="e.colorSimbolo">
              <rect x="30" y="12" width="7" height="16" rx="1" transform="rotate(-35 33 20)" />
              <rect x="60" y="12" width="7" height="16" rx="1" transform="rotate(35 64 20)" />
              <circle cx="40" cy="34" r="2" />
              <circle cx="59" cy="34" r="2" />
              <rect x="30" y="40" width="18" height="4" rx="1" />
              <path d="M53 42h14l-3 4h-11z" />
            </g>
          }
          @case ('cilindro') {
            <g [attr.fill]="e.colorSimbolo">
              <rect x="43" y="16" width="14" height="32" rx="5" />
              <rect x="47" y="11" width="6" height="6" />
            </g>
          }
          @case ('explosion') {
            <g [attr.fill]="e.colorSimbolo">
              <circle cx="50" cy="32" r="7" />
              @for (a of rayosExplosion; track a) {
                <rect x="49" y="14" width="2" height="8" [attr.transform]="'rotate(' + a + ' 50 32)'" />
              }
            </g>
          }
          @case ('trebol') {
            <g [attr.fill]="e.colorSimbolo">
              <circle cx="50" cy="30" r="3" />
              @for (a of hojasTrebol; track a) {
                <path d="M50 30 44 18a13 13 0 0 1 12 0z" [attr.transform]="'rotate(' + a + ' 50 30)'" />
              }
            </g>
          }
        }
        <text
          x="50"
          y="84"
          text-anchor="middle"
          [attr.font-size]="e.numero.length > 1 ? 15 : 18"
          font-weight="bold"
          font-family="Arial, Helvetica, sans-serif"
          [attr.fill]="e.colorNumero"
        >{{ e.numero }}</text>
      </svg>
      @if (conTexto()) {
        <span class="rombo-imo-texto">{{ nombre() }}</span>
      }
    } @else {
      <span class="badge text-bg-light border" title="Sin clase IMO">{{ imo() || 'NC' }}</span>
    }
  `,
})
export class RomboImoComponent {
  readonly imo = input<string | null | undefined>('');
  readonly tamano = input(24);
  readonly conTexto = input(false);

  protected readonly recorte = `rombo-imo-${++secuencia}`;
  protected readonly rayasX = RAYAS_X;
  protected readonly rayosExplosion = RAYOS_EXPLOSION;
  protected readonly hojasTrebol = HOJAS_TREBOL;
  protected readonly rojo = ROJO;
  protected readonly negro = NEGRO;

  protected readonly clase = computed(() => claseImoDe(this.imo()));
  protected readonly etiqueta = computed(() => {
    const clase = this.clase();
    return clase ? ETIQUETAS[clase] ?? null : null;
  });
  protected readonly nombre = computed(() => {
    const clase = this.clase();
    return clase ? `Clase ${clase} · ${NOMBRE_CLASE[clase]}` : '';
  });
  protected readonly titulo = computed(() => this.nombre());
}
