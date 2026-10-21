import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Login and register pages are for logged-out users. A logged-in user goes to their dashboard instead (no more
 * "login page with a logged-in nav"). Broken stored login data (a token without its role) is cleared, so the page
 * shows normally with Login and Register in the nav.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.hasValidSession()) {
    auth.redirectToDashboard(auth.role());
    return false;
  }
  if (auth.isAuthenticated()) {
    auth.clearSession();
  }
  return true;
};
