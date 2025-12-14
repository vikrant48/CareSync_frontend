import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse-slow"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 translate-x-1/2"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        
        <div class="bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in duration-300">
          
          <div class="mb-6">
             <div class="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <i class="fa-solid fa-hourglass-end text-3xl"></i>
             </div>
             <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Expired</h2>
             <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
               Your session has expired due to inactivity. For your security, please log in again to continue.
             </p>
          </div>

          <div class="space-y-4">
            <button 
              (click)="goToLogin()"
              class="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-3.5 px-4 rounded-xl shadow-lg shadow-red-500/20 font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
              <i class="fa-solid fa-right-to-bracket"></i> Login Again
            </button>
            
            <button 
              (click)="goToRegister()"
              class="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-medium">
              Create New Account
            </button>
          </div>

          <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button 
              (click)="goToHome()"
              class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-1 mx-auto group">
              <i class="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back to Home
            </button>
          </div>

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