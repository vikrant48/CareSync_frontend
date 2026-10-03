import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastContainerComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
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

  // UI toggles for password visibility and modal state
  showNewPassword = false;
  showConfirmPassword = false;
  showResetModal = false;

  constructor(private http: HttpClient, private toast: ToastService, private router: Router) { }

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

  changeEmail() {
    this.otpStage = 'hidden';
    this.otp = '';
    this.clearResendCooldown();
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
          const msg = resp?.message || 'OTP verified successfully';
          this.toast.showSuccess(msg);
          this.verified = true;
          this.showResetModal = true;
          this.verifyLoading = false;
        },
        error: (err) => {
          const msg = err?.error?.error || 'Invalid or expired OTP';
          this.toast.showError(msg);
          this.verifyLoading = false;
        },
      });
  }

  closeResetModal() {
    this.showResetModal = false;
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
          const msg = resp?.message || 'Password reset successfully!';
          this.toast.showSuccess(msg + ' Redirecting to login page...');
          this.resetLoading = false;
          this.showResetModal = false;
          this.verified = false;
          this.otpStage = 'hidden';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
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