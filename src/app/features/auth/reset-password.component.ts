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
    <div class="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center pt-12 pb-40 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse-slow"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 translate-x-1/2"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reset Password</h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Recover your account access securely</p>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm overflow-hidden flex flex-col">
          
          <div class="p-8 space-y-6">

            <!-- Step 1: Request OTP -->
            <section *ngIf="!verified && otpStage === 'hidden'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div class="text-center">
                 <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                    <i class="fa-solid fa-envelope text-2xl"></i>
                 </div>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Forgot your password?</h3>
                 <p class="text-sm text-gray-500 dark:text-gray-400 px-4">Enter your registered email address and we'll send you a verification code.</p>
              </div>

              <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <div class="relative">
                  <input type="email" class="input-modern" [(ngModel)]="forgotEmail" placeholder="you@example.com" [class.opacity-50]="forgotLoading" [disabled]="forgotLoading" />
                </div>
              </div>
              
              <button class="btn-primary w-full py-3 rounded-xl shadow-lg shadow-blue-500/20" (click)="requestOtp()" [disabled]="forgotLoading">
                <span *ngIf="!forgotLoading">Send Verification Code <i class="fa-solid fa-arrow-right ml-2"></i></span>
                <span *ngIf="forgotLoading"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sending...</span>
              </button>
            </section>


            <!-- Step 2: Verify OTP -->
            <section *ngIf="!verified && otpStage === 'visible'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div class="text-center">
                 <div class="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
                    <i class="fa-solid fa-shield-halved text-2xl"></i>
                 </div>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Verify OTP</h3>
                 <p class="text-sm text-gray-500 dark:text-gray-400">Enter the 6-digit code sent to <span class="font-medium text-gray-700 dark:text-gray-300">{{ forgotEmail }}</span></p>
                 <button (click)="changeEmail()" class="text-xs text-blue-500 hover:text-blue-600 underline mt-1">Change email</button>
              </div>

              <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Code</label>
                <input type="text" class="input-modern text-center text-2xl tracking-[0.5em] py-3 font-mono" [(ngModel)]="otp" maxlength="6" placeholder="••••••" />
              </div>

              <div class="space-y-3">
                <button class="btn-primary w-full py-3 rounded-xl shadow-lg shadow-purple-500/20" (click)="verifyOtp()" [disabled]="verifyLoading || !otp || otp.length !== 6">
                   <span *ngIf="!verifyLoading">Verify Code <i class="fa-solid fa-check ml-2"></i></span>
                   <span *ngIf="verifyLoading"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Verifying...</span>
                </button>
                
                <div class="text-center">
                   <button class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" (click)="resendOtp()" [disabled]="resendCooldown > 0 || forgotLoading" [class.opacity-50]="resendCooldown > 0 || forgotLoading">
                     <i class="fa-solid fa-rotate-right mr-1" [class.fa-spin]="forgotLoading"></i>
                     {{ resendCooldown > 0 ? ('Resend in ' + resendCooldown + 's') : 'Resend Code' }}
                   </button>
                </div>
              </div>
            </section>


            <!-- Step 3: Set New Password -->
            <section *ngIf="verified" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div class="text-center">
                 <div class="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <i class="fa-solid fa-lock text-2xl"></i>
                 </div>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Set New Password</h3>
                 <p class="text-sm text-gray-500 dark:text-gray-400">Create a strong password to secure your account.</p>
              </div>

              <div class="space-y-4">
                 <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <div class="relative">
                      <input [type]="showNewPassword ? 'text' : 'password'" class="input-modern pr-10" [(ngModel)]="resetForm.newPassword" placeholder="••••••••" />
                      <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" (click)="showNewPassword = !showNewPassword">
                        <i [class]="showNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                      </button>
                    </div>
                 </div>

                 <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                    <div class="relative">
                      <input [type]="showConfirmPassword ? 'text' : 'password'" class="input-modern pr-10" [(ngModel)]="resetForm.confirmPassword" placeholder="••••••••" />
                      <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" (click)="showConfirmPassword = !showConfirmPassword">
                        <i [class]="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                      </button>
                    </div>
                 </div>
              </div>

               <button class="btn-primary w-full py-3 rounded-xl shadow-lg shadow-green-500/20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" (click)="resetWithOtp()" [disabled]="resetLoading">
                  <span *ngIf="!resetLoading">Reset Password <i class="fa-solid fa-check ml-2"></i></span>
                  <span *ngIf="resetLoading"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Resetting...</span>
               </button>
            </section>

          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-100 dark:border-gray-700 text-center">
             <p class="text-sm text-gray-600 dark:text-gray-400">
               Remembered your password? <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">Sign in</a>
             </p>
          </div>

        </div>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .input-modern {
      @apply block w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400;
    }
    .btn-primary {
      @apply bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100;
    }
  `]
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

  constructor(private http: HttpClient, private toast: ToastService) { }

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
          const msg = resp?.message || 'OTP verified';
          this.toast.showSuccess(msg);
          this.verified = true;
          this.otpStage = 'hidden'; // Hide OTP stage, show Reset Stage
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
          // Optionally redirect to login or show success state
          this.verified = false;
          this.otpStage = 'hidden';
          // Navigate to login after short delay? 
          // For now, let's just reset form or letting user click 'Sign in'
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