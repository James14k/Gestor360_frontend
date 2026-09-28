import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { ENV } from '../env';
import { AuthService } from './auth.service';

/**
 * Equivalente al MsalInterceptor: agrega automaticamente
 * "Authorization: Bearer <accessToken>" a las llamadas dirigidas a nuestra API
 * (via API Gateway). Otras peticiones (ej. assets) pasan sin tocar.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(ENV.apiBaseUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    })
  );
};
