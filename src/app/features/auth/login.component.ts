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
    <div class="min-h-screen p-4 sm:p-6">
      <div class="panel max-w-md w-full mx-auto p-4 sm:p-6 mt-6 sm:mt-8">
        <h2 class="text-2xl font-semibold mb-4">Login</h2>
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
          <div>
            <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-user text-gray-400"></i> <span>Username</span></label>
            <input class="input" name="username" [(ngModel)]="model.username" required />
          </div>
          <div>
            <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-lock text-gray-400"></i> <span>Password</span></label>
            <div class="relative">
              <input class="input pr-10" [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="model.password" required />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="togglePassword()" aria-label="Toggle password visibility">
                <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </div>
          </div>
          <button class="btn-primary w-full" [disabled]="loading">Login</button>
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-400 mt-2">
            <span>
              Don’t have an account? <a routerLink="/register" class="text-emerald-400">Register</a>
            </span>
            <a routerLink="/reset-password" class="text-emerald-400">Forgot Password?</a>
          </div>
        </form>
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
        this.auth.redirectToDashboard(resp.role);
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