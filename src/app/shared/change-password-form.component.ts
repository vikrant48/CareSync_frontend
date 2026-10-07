import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      
      <!-- Card Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-xs shrink-0">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Change Password</h4>
            <p class="text-xs text-[#9aa3b8]">Ensure your account is secure by using a strong password.</p>
          </div>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="pt-4 border-t border-[#2a3347] space-y-5">

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          
          <!-- Form Fields (Left 7 cols) -->
          <div class="xl:col-span-7 space-y-3.5">
            
            <!-- Current Password -->
            <div>
              <label class="block text-xs font-bold text-white mb-1.5">Current Password</label>
              <div class="relative">
                <input [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="form.currentPassword"
                  name="current_user_pass_field" autocomplete="new-password" placeholder="••••••••"
                  class="w-full bg-[#1b2333] border border-[#2a3347] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#5b6cf0] transition-colors pr-10">
                <button type="button" (click)="toggleCurrent()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9aa3b8] hover:text-white transition-colors">
                  <i [class]="showCurrent ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-xs font-bold text-white mb-1.5">New Password</label>
              <div class="relative">
                <input [type]="showNew ? 'text' : 'password'" [(ngModel)]="form.newPassword"
                  name="new_user_pass_field" autocomplete="new-password" placeholder="Enter new password"
                  class="w-full bg-[#1b2333] border border-[#2a3347] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#5b6cf0] transition-colors pr-10">
                <button type="button" (click)="toggleNew()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9aa3b8] hover:text-white transition-colors">
                  <i [class]="showNew ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label class="block text-xs font-bold text-white mb-1.5">Confirm New Password</label>
              <div class="relative">
                <input [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="form.confirmPassword"
                  name="confirm_user_pass_field" autocomplete="new-password" placeholder="Confirm new password"
                  class="w-full bg-[#1b2333] border border-[#2a3347] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#5b6cf0] transition-colors pr-10">
                <button type="button" (click)="toggleConfirm()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9aa3b8] hover:text-white transition-colors">
                  <i [class]="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

          </div>

          <!-- Password Requirements (Right 5 cols) -->
          <div class="xl:col-span-5 bg-[#1b2333]/80 border border-[#2a3347] rounded-xl p-4 space-y-2.5">
            <h5 class="text-xs font-bold text-white">Password Requirements</h5>
            <div class="space-y-1.5 text-[11px]">
              <div class="flex items-center gap-2" [ngClass]="form.newPassword.length >= 8 ? 'text-emerald-400 font-semibold' : 'text-[#9aa3b8]'">
                <i class="fa-solid fa-circle-check text-[10px]"></i>
                <span>At least 8 characters</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasUppercase(form.newPassword) ? 'text-emerald-400 font-semibold' : 'text-[#9aa3b8]'">
                <i class="fa-solid fa-circle-check text-[10px]"></i>
                <span>One uppercase letter</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasLowercase(form.newPassword) ? 'text-emerald-400 font-semibold' : 'text-[#9aa3b8]'">
                <i class="fa-solid fa-circle-check text-[10px]"></i>
                <span>One lowercase letter</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasNumber(form.newPassword) ? 'text-emerald-400 font-semibold' : 'text-[#9aa3b8]'">
                <i class="fa-solid fa-circle-check text-[10px]"></i>
                <span>One number</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasSpecial(form.newPassword) ? 'text-emerald-400 font-semibold' : 'text-[#9aa3b8]'">
                <i class="fa-solid fa-circle-check text-[10px]"></i>
                <span>One special character</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Update Password Action -->
        <div class="flex justify-end pt-2">
          <button type="button" (click)="submit()" [disabled]="loading || !isValid()"
            class="bg-[#5b6cf0] hover:bg-[#4c5ce0] disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer">
            <i *ngIf="loading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            <span>{{ loading ? 'Updating...' : 'Update Password' }}</span>
          </button>
        </div>

      </div>

    </div>
  `,
})
export class ChangePasswordFormComponent implements OnInit, AfterViewInit {
  form = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private toast: ToastService) { }

  ngOnInit() {
    this.resetForm();
  }

  ngAfterViewInit() {
    // Clear any browser autofilled values shortly after render
    setTimeout(() => this.resetForm(), 100);
    setTimeout(() => this.resetForm(), 300);
  }

  isValid(): boolean {
    return !!(this.form.currentPassword && this.form.newPassword && this.form.confirmPassword);
  }

  hasUppercase(str: string): boolean { return /[A-Z]/.test(str); }
  hasLowercase(str: string): boolean { return /[a-z]/.test(str); }
  hasNumber(str: string): boolean { return /[0-9]/.test(str); }
  hasSpecial(str: string): boolean { return /[^A-Za-z0-9]/.test(str); }

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

