import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use signals directly for synchronous guard
  const user = authService.currentUser();
  if (user) {
    return true;
  } else {
    router.navigate(['/auth/login']);
    return false;
  }
};
