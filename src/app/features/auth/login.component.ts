import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse-slow"></div>
        <div class="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div class="text-center mb-8">
            <div class="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                <i class="fa-solid fa-heart-pulse text-3xl text-white"></i>
            </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome back
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
          <form class="space-y-6" (ngSubmit)="onSubmit()" #f="ngForm">
            
            <!-- Username Input -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <div class="relative rounded-xl shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-user text-gray-400"></i>
                </div>
                <input type="text" name="username" [(ngModel)]="model.username" required
                       class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all sm:text-sm dark:text-white" 
                       placeholder="Enter your username">
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div class="relative rounded-xl shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-lock text-gray-400"></i>
                </div>
                <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="model.password" required
                       class="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all sm:text-sm dark:text-white" 
                       placeholder="••••••••">
                <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
                        (click)="togglePassword()">
                  <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Forgot Password & Links -->
            <div class="flex items-center justify-between">
              <div class="text-sm">
                <a routerLink="/reset-password" class="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button type="submit" [disabled]="loading || f.invalid"
                      class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:-translate-y-0.5 active:translate-y-0">
                <span *ngIf="!loading">Sign in</span>
                <span *ngIf="loading" class="flex items-center">
                  <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Signing in...
                </span>
              </button>
            </div>
            
             <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    New to CareSync?
                  </span>
                </div>
              </div>

              <div class="mt-6 text-center">
                  <a routerLink="/register" class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition-colors">
                      Create an account
                  </a>
              </div>
            </div>

          </form>
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

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.model).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Logged in successfully. Redirecting...');
        // Small delay to let user see success message before redirect
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}