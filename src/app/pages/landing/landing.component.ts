import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ENV } from '../../core/env';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly env = ENV;

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.router.navigateByUrl('/inicio');
      }
    });
  }

  login(): void {
    void this.auth.login();
  }
}
