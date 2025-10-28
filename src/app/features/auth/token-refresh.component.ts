import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-token-refresh',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
              </path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Refreshing Session</h2>
          <p class="text-gray-600">
            Your session is being refreshed. Please wait a moment...
          </p>
        </div>

        <div *ngIf="isRefreshing" class="mb-6">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-sm text-gray-500 mt-2">{{ refreshMessage }}</p>
        </div>

        <div *ngIf="refreshError" class="mb-6">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Refresh Failed</h3>
                <p class="text-sm text-red-700 mt-1">{{ refreshError }}</p>
              </div>
            </div>
          </div>
          
          <button 
            (click)="retryRefresh()"
            class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            Try Again
          </button>
          
          <button 
            (click)="goToLogin()"
            class="mt-2 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
            Go to Login
          </button>
        </div>

        <div *ngIf="!isRefreshing && !refreshError" class="text-sm text-gray-500">
          <p>If this takes too long, you may need to log in again.</p>
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