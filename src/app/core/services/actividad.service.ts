import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENV } from '../env';
import { AvisoEmergencia, FichaAlmacenamiento, Notificacion, RegistroAuditoria } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${ENV.apiBaseUrl}/actividad`;

  auditoria(): Observable<RegistroAuditoria[]> {
    return this.http.get<RegistroAuditoria[]>(`${this.baseUrl}/auditoria`);
  }

  notificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.baseUrl}/notificaciones`);
  }

  emergencias(): Observable<AvisoEmergencia[]> {
    return this.http.get<AvisoEmergencia[]>(`${this.baseUrl}/emergencias`);
  }

  fichas(): Observable<FichaAlmacenamiento[]> {
    return this.http.get<FichaAlmacenamiento[]>(`${this.baseUrl}/fichas`);
  }
}
