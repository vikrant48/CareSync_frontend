import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAdmin()) {
      return true;
    }

    // Redirect to appropriate dashboard based on role
    const userRole = this.authService.getUserRole();
    switch (userRole) {
      case UserRole.DOCTOR:
        this.router.navigate(['/doctor/dashboard']);
        break;
      case UserRole.PATIENT:
        this.router.navigate(['/patient/dashboard']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }

    return false;
  }
}
