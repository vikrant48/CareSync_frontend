import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[calc(100dvh-3.5rem)] bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>

      <div class="max-w-lg w-full text-center space-y-8 relative z-10 animate-fade-in px-1 sm:px-4">

        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="w-11 h-11 bg-brand-soft border border-brand rounded-xl flex items-center justify-center text-brand text-lg">
            <i class="fa-solid fa-heart-pulse" aria-hidden="true"></i>
          </div>
          <span class="heading text-xl font-bold tracking-tight uppercase">Care<span class="text-brand">Sync</span></span>
        </div>

        <div class="relative py-2 sm:py-4">
          <p class="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 tracking-tighter select-none" aria-hidden="true">
            404
          </p>
          <div class="w-24 h-1 bg-brand-gradient mx-auto rounded-full mt-2"></div>
        </div>

        <div class="space-y-3">
          <h1 class="heading text-2xl sm:text-3xl font-bold">Page Not Found</h1>
          <p class="text-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            The page or medical record you are searching for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <button type="button" (click)="navigateHome()" class="btn-primary w-full sm:w-auto">
            <i class="fa-solid fa-house text-xs" aria-hidden="true"></i>
            {{ getHomeButtonText() }}
          </button>

          <button type="button" (click)="goBack()" class="btn-secondary w-full sm:w-auto">
            <i class="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
            Go Back
          </button>
        </div>

        <div class="pt-8 border-t border-[var(--border)] text-xs sm:text-sm text-muted">
          Need assistance? <a routerLink="/login" class="link">Contact Support</a>
        </div>

      </div>
    </div>
  `
})
export class NotFoundComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  getHomeButtonText(): string {
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.role();
      if (userRole === 'DOCTOR') return 'Go to Doctor Dashboard';
      if (userRole === 'PATIENT') return 'Go to Patient Dashboard';
      if (userRole === 'ADMIN') return 'Go to Admin Dashboard';
    }
    return 'Return to Sign In';
  }

  navigateHome(): void {
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.role();
      this.authService.redirectToDashboard(userRole);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.navigateHome();
    }
  }
}
