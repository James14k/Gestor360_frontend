import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENV } from '../env';
import { ProductoSuspel } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${ENV.apiBaseUrl}/productos`;

  listar(): Observable<ProductoSuspel[]> {
    return this.http.get<ProductoSuspel[]>(this.baseUrl);
  }

  obtener(id: number): Observable<ProductoSuspel> {
    return this.http.get<ProductoSuspel>(`${this.baseUrl}/${id}`);
  }

  crear(producto: ProductoSuspel): Observable<ProductoSuspel> {
    return this.http.post<ProductoSuspel>(this.baseUrl, producto);
  }

  actualizar(id: number, producto: ProductoSuspel): Observable<ProductoSuspel> {
    return this.http.put<ProductoSuspel>(`${this.baseUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
