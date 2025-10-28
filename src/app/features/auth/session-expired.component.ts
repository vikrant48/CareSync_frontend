import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z">
              </path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p class="text-gray-600 mb-4">
            Your session has expired due to inactivity. For your security, you need to log in again.
          </p>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Security Notice</h3>
              <p class="text-sm text-yellow-700 mt-1">
                Your session has been automatically logged out to protect your account.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <button 
            (click)="goToLogin()"
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium">
            Login Again
          </button>
          
          <button 
            (click)="goToRegister()"
            class="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium">
            Create New Account
          </button>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500">
            For your security, we automatically log you out after extended periods of inactivity.
          </p>
        </div>

        <div class="mt-4">
          <button 
            (click)="goToHome()"
            class="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `
})
export class SessionExpiredComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  goToLogin() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/auth/register']);
  }

  goToHome() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/']);
  }
}