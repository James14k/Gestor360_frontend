import { TipoEmergencia } from './actividad.model';

export interface EmergenciaRequest {
  bodega: string;
  tipo: TipoEmergencia;
  detalle?: string;
}

export interface EmergenciaResponse {
  eventoId: string;
  bodega: string;
  tipo: TipoEmergencia;
  prioridad: number;
  sustancias: number;
  mensaje: string;
}
