import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'productos', component: ProductosComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
