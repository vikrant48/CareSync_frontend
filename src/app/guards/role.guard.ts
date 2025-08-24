import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use signals directly for synchronous guard
  const user = authService.currentUser();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (requiredRoles.includes(user.role)) {
    return true;
  } else {
    // Redirect based on user role
    switch (user.role) {
      case UserRole.PATIENT:
        router.navigate(['/patient/dashboard']);
        break;
      case UserRole.DOCTOR:
        router.navigate(['/doctor/dashboard']);
        break;
      case UserRole.ADMIN:
        router.navigate(['/admin/dashboard']);
        break;
      default:
        router.navigate(['/error/forbidden']);
    }
    return false;
  }
};
