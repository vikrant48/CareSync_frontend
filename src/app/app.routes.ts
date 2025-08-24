import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Patient routes
  {
    path: 'patient',
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    data: { roles: [UserRole.PATIENT] },
    loadChildren: () => import('./patient/patient.routes').then(m => m.PATIENT_ROUTES)
  },

  // Doctor routes
  {
    path: 'doctor',
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    data: { roles: [UserRole.DOCTOR] },
    loadChildren: () => import('./doctor/doctor.routes').then(m => m.DOCTOR_ROUTES)
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // Shared routes (accessible by all authenticated users)
  {
    path: 'shared',
    canActivate: [authGuard],
    loadChildren: () => import('./shared/shared.routes').then(m => m.SHARED_ROUTES)
  },

  // Debug route (for development)
  {
    path: 'debug',
    loadComponent: () => import('./debug-profile.component').then(m => m.DebugProfileComponent)
  },

  // Error routes
  {
    path: 'error',
    loadChildren: () => import('./shared/errors/error.routes').then(m => m.ERROR_ROUTES)
  },

  // Catch all route
  {
    path: '**',
    redirectTo: '/error/not-found'
  }
];
