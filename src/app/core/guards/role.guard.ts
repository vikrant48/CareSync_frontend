import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = (route.data?.['roles'] as string[]) || [];
  const userRole = auth.role();
  if (userRole && roles.includes(userRole)) return true;
  // Shared doctor links are for patients; tell a doctor or admin why they landed on their dashboard
  if (userRole && state.url.startsWith('/patient/doctor/')) {
    inject(ToastService).showInfo('This link is for patients.');
  }
  // A token without its role is broken login data: clear it, so the login page shows a logged-out nav
  if (!userRole && auth.isAuthenticated()) {
    auth.clearSession();
  }
  auth.redirectToDashboard(userRole);
  return false;
};
