import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div class="panel max-w-xl w-full mx-auto p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        <h2 class="text-2xl font-semibold">Reset Password</h2>

        <!-- Request OTP -->
        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Request OTP</h3>
          <p class="text-sm text-gray-400">Enter your email to receive a 6-digit OTP.</p>
          <div class="space-y-2">
            <label class="block text-sm">Email</label>
            <input type="email" class="input w-full" [(ngModel)]="forgotEmail" placeholder="you@example.com" />
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="requestOtp()" [disabled]="forgotLoading">{{ forgotLoading ? 'Sending…' : 'Send OTP' }}</button>
            <span *ngIf="forgotSuccess" class="text-green-500 text-sm">{{ forgotSuccess }}</span>
            <span *ngIf="forgotError" class="text-red-500 text-sm">{{ forgotError }}</span>
          </div>
        </section>

        <hr class="border-gray-800" />

        <!-- Verify OTP -->
        <section class="space-y-3" *ngIf="otpStage !== 'hidden'">
          <h3 class="text-lg font-semibold">Verify OTP</h3>
          <p class="text-sm text-gray-400">Enter the 6-digit OTP sent to your email.</p>
          <div class="space-y-2">
            <label class="block text-sm">OTP</label>
            <input type="text" class="input w-full" [(ngModel)]="otp" maxlength="6" placeholder="123456" />
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="verifyOtp()" [disabled]="verifyLoading || !forgotEmail">{{ verifyLoading ? 'Verifying…' : 'Verify OTP' }}</button>
            <span *ngIf="verifySuccess" class="text-green-500 text-sm">{{ verifySuccess }}</span>
            <span *ngIf="verifyError" class="text-red-500 text-sm">{{ verifyError }}</span>
          </div>
        </section>

        <hr class="border-gray-800" />

        <!-- Reset Password Using Verified OTP -->
        <section class="space-y-3" *ngIf="verified">
          <h3 class="text-lg font-semibold">Set New Password</h3>
          <p class="text-sm text-gray-400">Your OTP is verified. Set a new password.</p>
          <div class="space-y-2">
            <label class="block text-sm">New Password</label>
            <input type="password" class="input w-full" [(ngModel)]="resetForm.newPassword" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm">Confirm Password</label>
            <input type="password" class="input w-full" [(ngModel)]="resetForm.confirmPassword" />
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-primary" (click)="resetWithOtp()" [disabled]="resetLoading">{{ resetLoading ? 'Resetting…' : 'Reset Password' }}</button>
            <span *ngIf="resetSuccess" class="text-green-500 text-sm">{{ resetSuccess }}</span>
            <span *ngIf="resetError" class="text-red-500 text-sm">{{ resetError }}</span>
          </div>
          <p class="text-sm text-gray-400">Remembered your password? <a routerLink="/login" class="text-emerald-400">Back to Login</a></p>
        </section>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
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

  resetForm = { newPassword: '', confirmPassword: '' };
  resetLoading = false;
  resetError: string | null = null;
  resetSuccess: string | null = null;

  constructor(private http: HttpClient) {}

  requestOtp() {
    this.forgotError = null;
    this.forgotSuccess = null;
    if (!this.forgotEmail) {
      this.forgotError = 'Email is required';
      return;
    }
    this.forgotLoading = true;
    this.http
      .post(`${this.baseUrl}/api/auth/forgot-password-otp`, { email: this.forgotEmail })
      .subscribe({
        next: (resp: any) => {
          this.forgotSuccess = resp?.message || 'OTP sent to your email';
          this.otpStage = 'visible';
          this.forgotLoading = false;
        },
        error: (err) => {
          this.forgotError = err?.error?.error || 'Failed to request reset';
          this.forgotLoading = false;
        },
      });
  }

  verifyOtp() {
    this.verifyError = null;
    this.verifySuccess = null;
    if (!this.forgotEmail) {
      this.verifyError = 'Email is required';
      return;
    }
    if (!this.otp || this.otp.length !== 6) {
      this.verifyError = 'Enter the 6-digit OTP';
      return;
    }
    this.verifyLoading = true;
    this.http
      .post(`${this.baseUrl}/api/auth/verify-otp`, { email: this.forgotEmail, otp: this.otp })
      .subscribe({
        next: (resp: any) => {
          this.verifySuccess = resp?.message || 'OTP verified';
          this.verified = true;
          this.verifyLoading = false;
        },
        error: (err) => {
          this.verifyError = err?.error?.error || 'Invalid or expired OTP';
          this.verifyLoading = false;
        },
      });
  }

  resetWithOtp() {
    this.resetError = null;
    this.resetSuccess = null;
    const { newPassword, confirmPassword } = this.resetForm;
    if (!this.verified) {
      this.resetError = 'Please verify OTP first';
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      this.resetError = 'New password must be at least 6 characters';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.resetError = 'Passwords do not match';
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
          this.resetSuccess = resp?.message || 'Password reset successfully';
          this.resetLoading = false;
        },
        error: (err) => {
          this.resetError = err?.error?.error || 'Failed to reset password';
          this.resetLoading = false;
        },
      });
  }
}