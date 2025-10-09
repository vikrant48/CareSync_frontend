import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="panel max-w-md mx-auto p-6">
      <h2 class="text-xl font-semibold mb-4">Login</h2>
      <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
        <div>
          <label class="block mb-1">Username</label>
          <input class="input" name="username" [(ngModel)]="model.username" required />
        </div>
        <div>
          <label class="block mb-1">Password</label>
          <input class="input" type="password" name="password" [(ngModel)]="model.password" required />
        </div>
        <button class="btn-primary w-full" [disabled]="loading">Login</button>
        <div class="flex items-center justify-between text-sm text-gray-400 mt-2">
          <span>
            Don’t have an account? <a routerLink="/register" class="text-emerald-400">Register</a>
          </span>
          <a routerLink="/reset-password" class="text-emerald-400">Forgot Password?</a>
        </div>
      </form>
      <p *ngIf="error" class="text-red-400 mt-3">{{ error }}</p>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  loading = false;
  error = '';

  model: LoginRequest = { username: '', password: '' };

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.model).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.auth.redirectToDashboard(resp.role);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
        this.loading = false;
      },
    });
  }
}