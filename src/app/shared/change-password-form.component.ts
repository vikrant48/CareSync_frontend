import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel p-6 space-y-4 max-w-xl">
      <h2 class="text-xl font-semibold">Change Password</h2>

      <div class="space-y-2">
        <label class="block text-sm">Current Password</label>
        <div class="relative">
          <input class="input w-full pr-10" [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="form.currentPassword" />
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="toggleCurrent()" aria-label="Toggle password visibility">
            <i [class]="showCurrent ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm">New Password</label>
        <div class="relative">
          <input class="input w-full pr-10" [type]="showNew ? 'text' : 'password'" [(ngModel)]="form.newPassword" />
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="toggleNew()" aria-label="Toggle password visibility">
            <i [class]="showNew ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm">Confirm New Password</label>
        <div class="relative">
          <input class="input w-full pr-10" [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="form.confirmPassword" />
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="toggleConfirm()" aria-label="Toggle password visibility">
            <i [class]="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3 mt-3">
        <button class="btn-primary" (click)="submit()" [disabled]="loading">{{ loading ? 'Saving...' : 'Change Password' }}</button>
      </div>
    </div>
  `,
})
export class ChangePasswordFormComponent {
  form = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  error: string | null = null;
  success: string | null = null;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient, private toast: ToastService) {}

  submit() {
    this.error = null;
    this.success = null;
    if (!this.form.currentPassword || !this.form.newPassword || !this.form.confirmPassword) {
      this.error = 'All fields are required.';
      this.toast.showError(this.error);
      return;
    }
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.error = 'New password and confirmation do not match.';
      this.toast.showError(this.error);
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
          this.toast.showSuccess(this.success ?? 'Password changed successfully.');
        },
        error: (err) => {
          const serverMsg = (err?.error?.message || err?.error?.error || '').toString();
          this.error = serverMsg || 'Failed to change password.';
          this.loading = false;
          this.toast.showError(serverMsg || 'Failed to change password.');
        },
      });
  }

  toggleCurrent() {
    this.showCurrent = !this.showCurrent;
  }
  toggleNew() {
    this.showNew = !this.showNew;
  }
  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }
}