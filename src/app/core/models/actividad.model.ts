export type TipoEvento = 'PRODUCTO_CREADO' | 'PRODUCTO_ACTUALIZADO' | 'PRODUCTO_ELIMINADO';

export interface RegistroAuditoria {
  id: number;
  eventoId: string;
  tipo: TipoEvento;
  productoId: number;
  producto: string;
  usuario: string;
  fecha: string;
}

export interface Notificacion {
  id: number;
  eventoId: string;
  productoId: number;
  producto: string;
  bodega: string;
  cantidad: number;
  mensaje: string;
  fecha: string;
}

export interface FichaAlmacenamiento {
  id: number;
  eventoId: string;
  folio: string;
  productoId: number;
  producto: string;
  claseImo: string;
  bodega: string;
  indicaciones: string;
  fecha: string;
}

export interface SustanciaAviso {
  nombre: string;
  imo: string;
  cantidad: number;
}

export interface AvisoEmergencia {
  id: number;
  eventoId: string;
  folio: string;
  tipo: TipoEmergencia;
  prioridad: number;
  bodega: string;
  detalle: string | null;
  usuario: string;
  destino: string;
  fechaReporte: string;
  fechaDespacho: string;
  sustancias: SustanciaAviso[];
}

export type TipoEmergencia = 'INCENDIO' | 'FUGA_GAS' | 'DERRAME';
