import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-token-refresh',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse-slow"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 translate-x-1/2"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        
        <div class="bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in duration-300">
          
          <div class="mb-6">
            <div class="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
               <i class="fa-solid fa-arrows-rotate text-3xl" [class.fa-spin]="isRefreshing"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Refreshing Session</h2>
            <p class="text-gray-600 dark:text-gray-400">
               Your session is being refreshed. Please wait a moment...
            </p>
          </div>

          <!-- Loading State -->
          <div *ngIf="isRefreshing" class="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl mb-4">
             <div class="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
               <span class="animate-pulse">{{ refreshMessage }}</span>
             </div>
          </div>

          <!-- Error State -->
          <div *ngIf="refreshError" class="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start text-left gap-3">
               <i class="fa-solid fa-circle-exclamation text-red-500 mt-1"></i>
               <div>
                 <h3 class="text-sm font-semibold text-red-800 dark:text-red-200">Refresh Failed</h3>
                 <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ refreshError }}</p>
               </div>
            </div>
            
            <button 
              (click)="retryRefresh()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20">
              <i class="fa-solid fa-arrow-rotate-right mr-2"></i> Try Again
            </button>
            
            <button 
              (click)="goToLogin()"
              class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors">
              Go to Login
            </button>
          </div>

          <div *ngIf="!isRefreshing && !refreshError" class="text-sm text-gray-400 dark:text-gray-500 mt-4">
             <i class="fa-regular fa-clock mr-1"></i> If this takes too long, you may need to log in again.
          </div>

        </div>
      </div>
    </div>
  `
})
export class TokenRefreshComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isRefreshing = true;
  refreshError: string | null = null;
  refreshMessage = 'Refreshing your session...';

  ngOnInit() {
    this.attemptTokenRefresh();
  }

  private attemptTokenRefresh() {
    this.isRefreshing = true;
    this.refreshError = null;
    this.refreshMessage = 'Refreshing your session...';

    const refreshObservable = this.authService.refresh();

    if (refreshObservable) {
      refreshObservable.subscribe({
        next: (response) => {
          // Update tokens
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.authService.accessToken.set(response.accessToken);
          this.authService.refreshToken.set(response.refreshToken);

          this.refreshMessage = 'Session refreshed successfully! Redirecting...';

          // Redirect back to the appropriate dashboard
          setTimeout(() => {
            this.authService.redirectToDashboard(this.authService.role());
          }, 1500);
        },
        error: (error) => {
          this.isRefreshing = false;
          this.refreshError = 'Unable to refresh your session. Please try again or log in.';
          console.error('Token refresh failed:', error);
        }
      });
    } else {
      this.isRefreshing = false;
      this.refreshError = 'No refresh token available. Please log in again.';
    }
  }

  retryRefresh() {
    this.attemptTokenRefresh();
  }

  goToLogin() {
    this.authService.logout();
  }
}