import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ENV } from '../core/env';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly env = ENV;
  protected readonly mobileMenuOpen = signal(false);

  protected readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Panel', icon: 'speedometer2' },
    { path: '/productos', label: 'Productos', icon: 'boxes' },
  ];

  protected readonly year = new Date().getFullYear();

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    void this.auth.logout();
  }
}
