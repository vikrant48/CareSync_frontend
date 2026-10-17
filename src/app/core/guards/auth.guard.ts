import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  // Open this page after login or sign-up (e.g. a shared doctor link)
  auth.rememberReturnUrl(state.url);
  router.navigate(['/login']);
  return false;
};
