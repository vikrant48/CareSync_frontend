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
    <div class="w-full max-w-lg mx-auto bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-lock text-indigo-400"></i>
          Change Password
        </h2>
        <p class="text-gray-400 text-xs mt-1">Ensure your account is secure by using a strong password.</p>
      </div>

      <div class="p-6 space-y-6">
        
        <!-- Current Password -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-300">Current Password</label>
          <div class="relative group">
            <input 
              [type]="showCurrent ? 'text' : 'password'" 
              [(ngModel)]="form.currentPassword"
              placeholder="Enter current password"
              class="w-full pl-4 pr-12 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:border-gray-600"
            />
            <button 
              type="button" 
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              (click)="toggleCurrent()" 
              [attr.aria-label]="showCurrent ? 'Hide password' : 'Show password'">
              <i [class]="showCurrent ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div class="space-y-4 pt-2 border-t border-gray-800/50">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-300">New Password</label>
            <div class="relative group">
              <input 
                [type]="showNew ? 'text' : 'password'" 
                [(ngModel)]="form.newPassword"
                placeholder="Enter new password"
                class="w-full pl-4 pr-12 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:border-gray-600"
              />
              <button 
                type="button" 
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                (click)="toggleNew()"
                [attr.aria-label]="showNew ? 'Hide password' : 'Show password'">
                <i [class]="showNew ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-300">Confirm New Password</label>
            <div class="relative group">
              <input 
                [type]="showConfirm ? 'text' : 'password'" 
                [(ngModel)]="form.confirmPassword"
                placeholder="Confirm new password"
                class="w-full pl-4 pr-12 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:border-gray-600"
              />
              <button 
                type="button" 
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                (click)="toggleConfirm()"
                [attr.aria-label]="showConfirm ? 'Hide password' : 'Show password'">
                <i [class]="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-4 flex items-center justify-end gap-3">
          <!-- Optional Cancel Button if context allows, keeping it simple for now -->
          
          <button 
            (click)="submit()" 
            [disabled]="loading || !isValid()"
            class="relative overflow-hidden group bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 py-2.5 font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            
            <div class="relative z-10 flex items-center gap-2">
              <i *ngIf="loading" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ loading ? 'Updating...' : 'Update Password' }}</span>
            </div>
            
            <!-- Hover Shine -->
            <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          </button>
        </div>

      </div>
    </div>
  `,
})
export class ChangePasswordFormComponent {
  form = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private toast: ToastService) { }

  isValid(): boolean {
    return !!(this.form.currentPassword && this.form.newPassword && this.form.confirmPassword);
  }

  submit() {
    if (!this.isValid()) {
      this.toast.showError('All fields are required.');
      return;
    }
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.toast.showError('New password and confirmation do not match.');
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
          this.toast.showSuccess(res?.message || 'Password changed successfully!');
          this.loading = false;
          this.resetForm();
        },
        error: (err) => {
          const serverMsg = (err?.error?.message || err?.error?.error || 'Failed to change password.').toString();
          this.toast.showError(serverMsg);
          this.loading = false;
        },
      });
  }

  toggleCurrent() { this.showCurrent = !this.showCurrent; }
  toggleNew() { this.showNew = !this.showNew; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  resetForm() {
    this.form = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showCurrent = false;
    this.showNew = false;
    this.showConfirm = false;
  }
}