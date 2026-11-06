import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENV } from '../env';
import { EmergenciaRequest, EmergenciaResponse } from '../models/emergencia.model';

@Injectable({ providedIn: 'root' })
export class EmergenciaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${ENV.apiBaseUrl}/emergencias`;

  reportar(request: EmergenciaRequest): Observable<EmergenciaResponse> {
    return this.http.post<EmergenciaResponse>(this.baseUrl, request);
  }
}
