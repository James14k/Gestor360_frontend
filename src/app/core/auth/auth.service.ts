import { Injectable, signal } from '@angular/core';
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

/**
 * Wrapper de AWS Amplify Auth. Cumple el mismo rol que un servicio MSAL en un
 * proyecto Azure AD: login()/logout() via Hosted UI (Authorization Code + PKCE),
 * estado de sesion reactivo y obtencion del Access Token para el interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly username = signal<string | null>(null);
  readonly checkingSession = signal(true);

  constructor() {
    Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signInWithRedirect') {
        this.refreshSession();
      }
      if (payload.event === 'signedOut') {
        this.isAuthenticated.set(false);
        this.username.set(null);
      }
    });
    this.refreshSession();
  }

  async login(): Promise<void> {
    await signInWithRedirect();
  }

  async logout(): Promise<void> {
    await signOut();
  }

  async refreshSession(): Promise<boolean> {
    this.checkingSession.set(true);
    try {
      const [user, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
      const authenticated = !!session.tokens?.accessToken;
      this.isAuthenticated.set(authenticated);
      this.username.set(user.username ?? null);
      return authenticated;
    } catch {
      this.isAuthenticated.set(false);
      this.username.set(null);
      return false;
    } finally {
      this.checkingSession.set(false);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() ?? null;
    } catch {
      return null;
    }
  }
}
