import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ENV } from '../../core/env';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly auth = inject(AuthService);
  protected readonly env = ENV;
  protected readonly navOpen = signal(false);
  protected readonly token = signal<string | null>(null);
  protected readonly copied = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.auth.getAccessToken().then((token) => this.token.set(token));
      } else {
        this.token.set(null);
      }
    });
  }

  async copyToken(): Promise<void> {
    const token = this.token();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }

  login(): void {
    void this.auth.login();
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }
}
