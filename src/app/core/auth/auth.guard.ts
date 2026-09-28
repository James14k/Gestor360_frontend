import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Equivalente al MsalGuard: si no hay sesion valida, dispara el login
 * (Hosted UI de Cognito) en lugar de mostrar la ruta protegida.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const authenticated = await auth.refreshSession();
  if (authenticated) {
    return true;
  }
  await auth.login();
  return false;
};
