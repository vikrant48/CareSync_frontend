import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
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
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
    >
      <div class="max-w-md w-full">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4"
          >
            <mat-icon class="text-white text-2xl">medical_services</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Welcome to CareSync
          </h1>
          <p class="text-gray-600">Sign in to your account</p>
        </div>

        <!-- Login Form -->
        <mat-card class="shadow-xl">
          <mat-card-content class="p-8">
            <form
              [formGroup]="loginForm"
              (ngSubmit)="onSubmit()"
              class="space-y-6"
            >
              <!-- Email Field
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Email</mat-label>
                <input 
                  matInput 
                  type="email" 
                  formControlName="email" 
                  placeholder="Enter your email"
                  autocomplete="email"
                >
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field> -->

              <!-- Username Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Username</mat-label>
                <input
                  matInput
                  type="text"
                  formControlName="username"
                  placeholder="Enter your username"
                  autocomplete="username"
                />
                <mat-icon matSuffix>person</mat-icon>
                <mat-error
                  *ngIf="loginForm.get('username')?.hasError('required')"
                >
                  Username is required
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Password</mat-label>
                <input
                  matInput
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="showPassword"
                >
                  <mat-icon>{{
                    showPassword ? 'visibility_off' : 'visibility'
                  }}</mat-icon>
                </button>
                <mat-error
                  *ngIf="loginForm.get('password')?.hasError('required')"
                >
                  Password is required
                </mat-error>
                <mat-error
                  *ngIf="loginForm.get('password')?.hasError('minlength')"
                >
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <!-- Remember Me and Forgot Password -->
              <div class="flex items-center justify-between">
                <mat-checkbox formControlName="rememberMe" color="primary">
                  Remember me
                </mat-checkbox>
                <a
                  routerLink="/auth/forgot-password"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <!-- Submit Button -->
              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="w-full h-12 text-lg font-medium"
                [disabled]="loginForm.invalid || isLoading"
              >
                <mat-spinner
                  *ngIf="isLoading"
                  diameter="20"
                  class="mr-2"
                ></mat-spinner>
                {{ isLoading ? 'Signing in...' : 'Sign In' }}
              </button>

              <!-- Divider -->
              <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500"
                    >Or continue with</span
                  >
                </div>
              </div>

              <!-- Social Login Buttons -->
              <div class="grid grid-cols-2 gap-4">
                <button
                  mat-outlined-button
                  type="button"
                  class="h-12"
                  (click)="socialLogin('google')"
                  [disabled]="isLoading"
                >
                  <mat-icon>google</mat-icon>
                  Google
                </button>
                <button
                  mat-outlined-button
                  type="button"
                  class="h-12"
                  (click)="socialLogin('facebook')"
                  [disabled]="isLoading"
                >
                  <mat-icon>facebook</mat-icon>
                  Facebook
                </button>
              </div>

              <!-- Register Link -->
              <div class="text-center mt-6">
                <p class="text-gray-600">
                  Don't have an account?
                  <a
                    routerLink="/auth/register"
                    class="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Footer -->
        <div class="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 CareSync. All rights reserved.</p>
          <div class="mt-2 space-x-4">
            <a href="#" class="hover:text-gray-700 transition-colors"
              >Privacy Policy</a
            >
            <a href="#" class="hover:text-gray-700 transition-colors"
              >Terms of Service</a
            >
            <a href="#" class="hover:text-gray-700 transition-colors"
              >Support</a
            >
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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

      .mat-mdc-outlined-button {
        border-radius: 8px;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      // email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.redirectBasedOnRole(user.role);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const loginData: LoginRequest = this.loginForm.value;

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          // Redirect based on user role
          if (response.user && response.user.role) {
            this.redirectBasedOnRole(response.user.role);
          } else if (response.role) {
            this.redirectBasedOnRole(response.role);
          } else {
            // Fallback to default route if no role information
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Login failed. Please try again.';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  socialLogin(provider: string): void {
    this.isLoading = true;
    // Implement social login logic here
    this.snackBar.open(`${provider} login coming soon!`, 'Close', {
      duration: 3000,
    });
    this.isLoading = false;
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'PATIENT':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'DOCTOR':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/shared/dashboard']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
