import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../services/auth.service';
import { ForgotPasswordRequest } from '../../models/user.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <mat-icon class="text-white text-2xl">lock_reset</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p class="text-gray-600">Enter your email to reset your password</p>
        </div>

        <!-- Forgot Password Form -->
        <mat-card class="shadow-xl">
          <mat-card-content class="p-8">
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- Email Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Email Address</mat-label>
                <input 
                  matInput 
                  type="email" 
                  formControlName="email" 
                  placeholder="Enter your email address"
                  autocomplete="email"
                >
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <!-- Submit Button -->
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="w-full h-12 text-lg font-medium"
                [disabled]="forgotPasswordForm.invalid || isLoading"
              >
                <mat-spinner 
                  *ngIf="isLoading" 
                  diameter="20" 
                  class="mr-2"
                ></mat-spinner>
                {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>

              <!-- Divider -->
              <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <!-- Back to Login -->
              <div class="text-center">
                <a 
                  routerLink="/auth/login" 
                  class="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <mat-icon class="align-text-bottom mr-1">arrow_back</mat-icon>
                  Back to Login
                </a>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Success Message -->
        <div *ngIf="isSuccess" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center space-x-3">
            <mat-icon class="text-green-600">check_circle</mat-icon>
            <div>
              <h3 class="text-green-800 font-medium">Reset Link Sent!</h3>
              <p class="text-green-700 text-sm">
                We've sent a password reset link to your email address. 
                Please check your inbox and follow the instructions.
              </p>
            </div>
          </div>
          
          <!-- Resend Section -->
          <div class="mt-4 pt-4 border-t border-green-200">
            <p class="text-green-700 text-sm mb-3">
              Didn't receive the email? Check your spam folder or request a new link.
            </p>
            <button 
              mat-outlined-button 
              color="primary" 
              (click)="resendResetLink()"
              [disabled]="resendCountdown > 0"
              class="w-full"
            >
              <mat-icon>refresh</mat-icon>
              {{ resendCountdown > 0 ? 'Resend in ' + resendCountdown + 's' : 'Resend Reset Link' }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 CareSync. All rights reserved.</p>
          <div class="mt-2 space-x-4">
            <a href="#" class="hover:text-gray-700 transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-gray-700 transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-gray-700 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    mat-card {
      border-radius: 16px;
    }
    
    mat-form-field {
      margin-bottom: 0;
    }
    
    .mat-mdc-form-field {
      width: 100%;
    }
    
    .mat-mdc-raised-button {
      border-radius: 8px;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  resendCountdown = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const request: ForgotPasswordRequest = this.forgotPasswordForm.value;

      this.authService.forgotPassword(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.startResendCountdown();
          
          this.snackBar.open('Password reset link sent successfully!', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Failed to send reset link. Please try again.';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 404) {
            errorMessage = 'Email address not found. Please check your email or register.';
          } else if (error.status === 429) {
            errorMessage = 'Too many requests. Please wait before trying again.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  resendResetLink(): void {
    if (this.forgotPasswordForm.valid && this.resendCountdown === 0) {
      this.onSubmit();
    }
  }

  private startResendCountdown(): void {
    this.resendCountdown = 60; // 60 seconds
    const timer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
}
