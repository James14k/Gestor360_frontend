import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ENV } from '../core/env';
import { AuthService } from '../core/auth/auth.service';
import { iniciales } from '../shared/format.util';
import { NotificacionesBellComponent } from '../shared/notificaciones-bell/notificaciones-bell.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NotificacionesBellComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly env = ENV;
  protected readonly mobileMenuOpen = signal(false);
  protected readonly cuentaAbierta = signal(false);
  protected readonly iniciales = computed(() => iniciales(this.auth.displayName()));

  protected readonly navItems: NavItem[] = [
    { path: '/inicio', label: 'Inicio', icon: 'house' },
    { path: '/dashboard', label: 'Panel', icon: 'speedometer2' },
    { path: '/productos', label: 'Productos', icon: 'boxes' },
    { path: '/actividad', label: 'Actividad', icon: 'activity' },
  ];

  protected readonly year = new Date().getFullYear();

  toggleMobileMenu(): void {
    this.cuentaAbierta.set(false);
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleCuenta(): void {
    this.mobileMenuOpen.set(false);
    this.cuentaAbierta.update((open) => !open);
  }

  cerrarMenus(): void {
    this.cuentaAbierta.set(false);
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.cerrarMenus();
    void this.auth.logout();
  }
}
