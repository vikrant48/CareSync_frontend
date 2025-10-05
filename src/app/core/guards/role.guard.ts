import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = (route.data?.['roles'] as string[]) || [];
  const userRole = auth.role();
  if (userRole && roles.includes(userRole)) return true;
  auth.redirectToDashboard(userRole);
  return false;
};