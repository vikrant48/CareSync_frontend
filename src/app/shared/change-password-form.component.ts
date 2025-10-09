import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel p-6 space-y-4 max-w-xl">
      <h2 class="text-xl font-semibold">Change Password</h2>

      <div class="space-y-2">
        <label class="block text-sm">Current Password</label>
        <input type="password" class="input w-full" [(ngModel)]="form.currentPassword" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm">New Password</label>
        <input type="password" class="input w-full" [(ngModel)]="form.newPassword" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm">Confirm New Password</label>
        <input type="password" class="input w-full" [(ngModel)]="form.confirmPassword" />
      </div>

      <div class="flex items-center gap-3 mt-3">
        <button class="btn-primary" (click)="submit()" [disabled]="loading">{{ loading ? 'Saving...' : 'Change Password' }}</button>
      </div>

      <div *ngIf="error" class="text-red-500 text-sm">{{ error }}</div>
      <div *ngIf="success" class="text-green-500 text-sm">{{ success }}</div>
    </div>
  `,
})
export class ChangePasswordFormComponent {
  form = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  submit() {
    this.error = null;
    this.success = null;
    if (!this.form.currentPassword || !this.form.newPassword || !this.form.confirmPassword) {
      this.error = 'All fields are required.';
      return;
    }
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.error = 'New password and confirmation do not match.';
      return;
    }
    this.loading = true;
    this.http
      .post<{ message?: string }>(`${this.baseUrl}/api/auth/change-password`, {
        currentPassword: this.form.currentPassword,
        newPassword: this.form.newPassword,
        confirmPassword: this.form.confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.success = res?.message || 'Password changed successfully.';
          this.loading = false;
          this.form = { currentPassword: '', newPassword: '', confirmPassword: '' };
        },
        error: (err) => {
          this.error = (err?.error?.message || 'Failed to change password.').toString();
          this.loading = false;
        },
      });
  }
}