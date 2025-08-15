import { Routes } from '@angular/router';

export const ERROR_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'not-found',
    pathMatch: 'full'
  },
  {
    path: 'not-found',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - CareSync'
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./forbidden/forbidden.component').then(m => m.ForbiddenComponent),
    title: 'Access Forbidden - CareSync'
  },
  {
    path: 'server-error',
    loadComponent: () => import('./server-error/server-error.component').then(m => m.ServerErrorComponent),
    title: 'Server Error - CareSync'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Unauthorized - CareSync'
  },
  {
    path: 'maintenance',
    loadComponent: () => import('./maintenance/maintenance.component').then(m => m.MaintenanceComponent),
    title: 'System Maintenance - CareSync'
  }
];
