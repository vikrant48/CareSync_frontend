import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div class="panel max-w-xl w-full mx-auto p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        <h2 class="text-2xl font-semibold">Reset Password</h2>

        <!-- Request OTP -->
        <section class="space-y-3" *ngIf="!verified">
          <h3 class="text-lg font-semibold">Request OTP</h3>
          <p class="text-sm text-gray-400">Enter your email to receive a 6-digit OTP.</p>
          <div class="space-y-2">
            <label class="block text-sm">Email</label>
            <input type="email" class="input w-full" [(ngModel)]="forgotEmail" placeholder="you@example.com" />
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="requestOtp()" [disabled]="forgotLoading">{{ forgotLoading ? 'Sending…' : 'Send OTP' }}</button>
          </div>
        </section>

        <hr class="border-gray-800" />

        <!-- Verify OTP -->
        <section class="space-y-3" *ngIf="!verified && otpStage !== 'hidden'">
          <h3 class="text-lg font-semibold">Verify OTP</h3>
          <p class="text-sm text-gray-400">Enter the 6-digit OTP sent to your email.</p>
          <div class="space-y-2">
            <label class="block text-sm">OTP</label>
            <input type="text" class="input w-full" [(ngModel)]="otp" maxlength="6" placeholder="123456" />
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="verifyOtp()" [disabled]="verifyLoading || !forgotEmail">{{ verifyLoading ? 'Verifying…' : 'Verify OTP' }}</button>
            <button class="btn-secondary" (click)="resendOtp()" [disabled]="resendCooldown > 0 || forgotLoading">
              {{ resendCooldown > 0 ? ('Resend in ' + resendCooldown + 's') : 'Resend OTP' }}
            </button>
          </div>
        </section>

        <hr class="border-gray-800" />

        <!-- Reset Password Using Verified OTP -->
        <section class="space-y-3" *ngIf="verified">
          <h3 class="text-lg font-semibold">Set New Password</h3>
          <p class="text-sm text-gray-400">Your OTP is verified. Set a new password.</p>
          <div class="space-y-2">
            <label class="block text-sm">New Password</label>
            <div class="relative">
              <input [type]="showNewPassword ? 'text' : 'password'" class="input w-full pr-10" [(ngModel)]="resetForm.newPassword" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      (click)="showNewPassword = !showNewPassword" [attr.aria-label]="showNewPassword ? 'Hide password' : 'Show password'">
                <i class="fa-solid" [ngClass]="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm">Confirm Password</label>
            <div class="relative">
              <input [type]="showConfirmPassword ? 'text' : 'password'" class="input w-full pr-10" [(ngModel)]="resetForm.confirmPassword" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      (click)="showConfirmPassword = !showConfirmPassword" [attr.aria-label]="showConfirmPassword ? 'Hide password' : 'Show password'">
                <i class="fa-solid" [ngClass]="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="resetWithOtp()" [disabled]="resetLoading">{{ resetLoading ? 'Resetting…' : 'Reset Password' }}</button>
          </div>
          <p class="text-sm text-gray-400">Remembered your password? <a routerLink="/login" class="text-emerald-400">Back to Login</a></p>
        </section>
      </div>
      <!-- Global toast container for auth pages -->
      <app-toast-container></app-toast-container>
    </div>
  `,
})
export class ResetPasswordComponent implements OnDestroy {
  private baseUrl = environment.apiBaseUrl;

  // Forgot password state
  forgotEmail = '';
  forgotLoading = false;
  forgotError: string | null = null;
  forgotSuccess: string | null = null;

  // OTP and reset state
  otp: string = '';
  otpStage: 'hidden' | 'visible' = 'hidden';
  verifyLoading = false;
  verifyError: string | null = null;
  verifySuccess: string | null = null;
  verified = false;

  // Resend cooldown
  resendCooldown = 0;
  private resendTimer: any = null;

  resetForm = { newPassword: '', confirmPassword: '' };
  resetLoading = false;
  resetError: string | null = null;
  resetSuccess: string | null = null;

  // UI toggles for password visibility
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private http: HttpClient, private toast: ToastService) {}

  requestOtp() {
    if (!this.forgotEmail) {
      this.toast.showError('Email is required');
      return;
    }
    this.forgotLoading = true;
    this.http
      .post(`${this.baseUrl}/api/auth/forgot-password-otp`, { email: this.forgotEmail })
      .subscribe({
        next: (resp: any) => {
          const msg = resp?.message || 'OTP sent to your email';
          this.toast.showSuccess(msg);
          this.otpStage = 'visible';
          this.forgotLoading = false;
          this.startResendCooldown(60);
        },
        error: (err) => {
          const msg = err?.error?.error || 'Failed to request reset';
          this.toast.showError(msg);
          this.forgotLoading = false;
        },
      });
  }

  verifyOtp() {
    if (!this.forgotEmail) {
      this.toast.showError('Email is required');
      return;
    }
    if (!this.otp || this.otp.length !== 6) {
      this.toast.showError('Enter the 6-digit OTP');
      return;
    }
    this.verifyLoading = true;
    this.http
      .post(`${this.baseUrl}/api/auth/verify-otp`, { email: this.forgotEmail, otp: this.otp })
      .subscribe({
        next: (resp: any) => {
          const msg = resp?.message || 'OTP verified';
          this.toast.showSuccess(msg);
          this.verified = true;
          this.otpStage = 'hidden';
          this.verifyLoading = false;
        },
        error: (err) => {
          const msg = err?.error?.error || 'Invalid or expired OTP';
          this.toast.showError(msg);
          this.verifyLoading = false;
        },
      });
  }

  resendOtp() {
    if (this.resendCooldown > 0 || this.forgotLoading) return;
    this.requestOtp();
  }

  private startResendCooldown(seconds: number) {
    this.clearResendCooldown();
    this.resendCooldown = seconds;
    this.resendTimer = setInterval(() => {
      this.resendCooldown = Math.max(0, this.resendCooldown - 1);
      if (this.resendCooldown === 0) this.clearResendCooldown();
    }, 1000);
  }

  private clearResendCooldown() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  resetWithOtp() {
    const { newPassword, confirmPassword } = this.resetForm;
    if (!this.verified) {
      this.toast.showError('Please verify OTP first');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      this.toast.showError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.toast.showError('Passwords do not match');
      return;
    }
    this.resetLoading = true;
    this.http
      .post(`${this.baseUrl}/api/auth/reset-password-otp`, {
        email: this.forgotEmail,
        otp: this.otp,
        newPassword,
        confirmPassword,
      })
      .subscribe({
        next: (resp: any) => {
          const msg = resp?.message || 'Password reset successfully';
          this.toast.showSuccess(msg);
          this.resetLoading = false;
        },
        error: (err) => {
          const msg = err?.error?.error || 'Failed to reset password';
          this.toast.showError(msg);
          this.resetLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.clearResendCooldown();
  }
}