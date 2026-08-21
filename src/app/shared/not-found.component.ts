import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <!-- Animated Background Glows -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>

      <div class="max-w-lg w-full text-center space-y-8 relative z-10 animate-fade-in px-4">
        
        <!-- Header Logo -->
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 text-lg shadow-lg shadow-emerald-500/10">
            <i class="fa-solid fa-heart-pulse"></i>
          </div>
          <span class="text-xl font-black tracking-tight text-white uppercase">Care<span class="text-emerald-400">Sync</span></span>
        </div>

        <!-- 404 Visual -->
        <div class="relative py-4">
          <h1 class="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 tracking-tighter drop-shadow-2xl select-none">
            404
          </h1>
          <div class="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 mx-auto rounded-full mt-2 shadow-lg shadow-emerald-500/50"></div>
        </div>

        <!-- Message -->
        <div class="space-y-3">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Page Not Found</h2>
          <p class="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            The page or medical record you are searching for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <!-- Dynamic Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button (click)="navigateHome()" 
                  class="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
            <i class="fa-solid fa-house text-xs"></i>
            {{ getHomeButtonText() }}
          </button>

          <button (click)="goBack()" 
                  class="w-full sm:w-auto px-7 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 flex items-center justify-center gap-2">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            Go Back
          </button>
        </div>

        <!-- Footer -->
        <div class="pt-8 border-t border-gray-900 text-xs text-gray-600">
          Need assistance? <a routerLink="/login" class="text-emerald-500 hover:underline">Contact Support</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
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
