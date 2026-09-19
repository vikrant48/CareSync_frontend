import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';
import { FeatureCarouselComponent } from './feature-carousel.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastContainerComponent, FeatureCarouselComponent],
  template: `
    <div class="min-h-[calc(100dvh-3.5rem)] bg-white dark:bg-gray-950 grid lg:grid-cols-2 overflow-hidden transition-all duration-500">
      
      <!-- Left Side: Auto-Rotating Feature Carousel (Hidden on Mobile) -->
      <div class="hidden lg:block h-full">
        <app-feature-carousel></app-feature-carousel>
      </div>

      <!-- Right Side: Interaction Panel -->
      <div class="relative flex flex-col justify-center min-h-[calc(100dvh-3.5rem)] py-3 sm:py-6 px-4 sm:px-6 lg:px-12 bg-white dark:bg-gray-950">
        <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
            <div class="text-center mb-4">
              <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 py-5 sm:py-6 px-4 sm:px-8 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
              <form class="space-y-3.5" (ngSubmit)="onSubmit()" #f="ngForm">
                
                <!-- Username Input -->
                <div>
                  <label for="username" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <div class="relative rounded-xl shadow-xs">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fa-solid fa-user text-gray-400 text-xs"></i>
                    </div>
                    <input type="text" name="username" [(ngModel)]="model.username" required
                          class="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-xs sm:text-sm dark:text-white" 
                          placeholder="Enter your username">
                  </div>
                </div>

                <!-- Password Input -->
                <div>
                  <label for="password" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div class="relative rounded-xl shadow-xs">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fa-solid fa-lock text-gray-400 text-xs"></i>
                    </div>
                    <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="model.password" required
                          class="block w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-xs sm:text-sm dark:text-white" 
                          placeholder="••••••••">
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
                            (click)="togglePassword()">
                      <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye' + ' text-xs'"></i>
                    </button>
                  </div>
                </div>

                <!-- Forgot Password & Links -->
                <div class="flex items-center justify-end">
                  <div class="text-xs">
                    <a routerLink="/reset-password" class="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                </div>

                <!-- Submit Button -->
                <div>
                  <button type="submit" [disabled]="loading || f.invalid"
                          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:-translate-y-0.5 active:translate-y-0">
                    <span *ngIf="!loading">Sign in</span>
                    <span *ngIf="loading" class="flex items-center">
                      <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Signing in...
                    </span>
                  </button>
                </div>
                
                <!-- Divider -->
                <div class="relative my-2.5">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div class="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold">Or continue with</span>
                  </div>
                </div>

                <!-- Google Role Selector Toggle & Button -->
                <div class="space-y-2">
                  <div class="flex items-center justify-center p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
                    <button type="button" (click)="selectedRole = 'PATIENT'"
                            [class]="selectedRole === 'PATIENT' ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'"
                            class="flex-1 py-1 text-[11px] text-center rounded-lg transition-all cursor-pointer">
                      <i class="fa-solid fa-user mr-1 text-[10px]"></i> Patient Account
                    </button>
                    <button type="button" (click)="selectedRole = 'DOCTOR'"
                            [class]="selectedRole === 'DOCTOR' ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'"
                            class="flex-1 py-1 text-[11px] text-center rounded-lg transition-all cursor-pointer">
                      <i class="fa-solid fa-user-md mr-1 text-[10px]"></i> Doctor Account
                    </button>
                  </div>

                  <button type="button" (click)="onGoogleLogin()" [disabled]="loading"
                          class="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xs text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-all hover:shadow-xs cursor-pointer">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google ({{ selectedRole | titlecase }})</span>
                  </button>
                </div>
                
                <div class="mt-3 pt-2 text-center border-t border-gray-100 dark:border-gray-700/50">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    New to CareSync? 
                    <a routerLink="/register" class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold ml-1 transition-colors">
                      Create an account
                    </a>
                  </p>
                </div>

              </form>
            </div>
          </div>
        </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  loading = false;
  error = '';
  showPassword = false;

  model: LoginRequest = { username: '', password: '' };
  selectedRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.model).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Logged in successfully. Redirecting...');
        setTimeout(() => {
          this.auth.redirectToDashboard(resp.role);
        }, 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  onGoogleLogin() {
    // Check if google library is loaded, if not load it dynamically
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => this.initGoogleAuth();
      document.head.appendChild(script);
    } else {
      this.initGoogleAuth();
    }
  }

  private initGoogleAuth() {
    const google = (window as any).google;
    if (!google) {
      this.toast.showError('Unable to load Google Identity Services');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleResponse(response),
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to standard OAuth popup if One Tap prompt is dismissed
        this.toast.showInfo('Select your Google account to sign in');
      }
    });
  }

  private handleGoogleResponse(response: any) {
    if (!response || !response.credential) {
      this.toast.showError('Google authentication cancelled or failed');
      return;
    }

    this.loading = true;
    this.auth.loginWithGoogle(response.credential, this.selectedRole).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Google Login successful!');
        setTimeout(() => {
          this.auth.redirectToDashboard(resp.role);
        }, 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Google login failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}