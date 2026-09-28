import { Component, inject, signal } from '@angular/core';
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

  login(): void {
    void this.auth.login();
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }
}
