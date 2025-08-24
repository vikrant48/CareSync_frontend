import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../services/auth.service';
import { ChangePasswordRequest } from '../../models/user.model';

@Component({
  selector: 'app-change-password',
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
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <mat-icon class="text-white text-2xl">lock</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Change Password</h1>
          <p class="text-gray-600">Update your password to keep your account secure</p>
        </div>

        <!-- Change Password Form -->
        <mat-card class="shadow-xl">
          <mat-card-content class="p-8">
            <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- Current Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Current Password</mat-label>
                <input 
                  matInput 
                  [type]="hideCurrentPassword ? 'password' : 'text'" 
                  formControlName="currentPassword" 
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                >
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button"
                  (click)="hideCurrentPassword = !hideCurrentPassword"
                >
                  <mat-icon>{{ hideCurrentPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="changePasswordForm.get('currentPassword')?.hasError('required')">
                  Current password is required
                </mat-error>
              </mat-form-field>

              <!-- New Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>New Password</mat-label>
                <input 
                  matInput 
                  [type]="hideNewPassword ? 'password' : 'text'" 
                  formControlName="newPassword" 
                  placeholder="Enter your new password"
                  autocomplete="new-password"
                >
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button"
                  (click)="hideNewPassword = !hideNewPassword"
                >
                  <mat-icon>{{ hideNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="changePasswordForm.get('newPassword')?.hasError('required')">
                  New password is required
                </mat-error>
                <mat-error *ngIf="changePasswordForm.get('newPassword')?.hasError('minlength')">
                  Password must be at least 8 characters
                </mat-error>
                <mat-error *ngIf="changePasswordForm.get('newPassword')?.hasError('pattern')">
                  Password must contain at least one uppercase letter, one lowercase letter, and one number
                </mat-error>
              </mat-form-field>
              
              <!-- Password Strength Meter -->
              <!-- Password strength meter temporarily removed until component is properly imported -->
              <!-- <app-password-strength [password]="changePasswordForm.get('newPassword')?.value || ''"></app-password-strength> -->

              <!-- Confirm Password Field -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Confirm New Password</mat-label>
                <input 
                  matInput 
                  [type]="hideConfirmPassword ? 'password' : 'text'" 
                  formControlName="confirmPassword" 
                  placeholder="Confirm your new password"
                  autocomplete="new-password"
                >
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button"
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                >
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="changePasswordForm.get('confirmPassword')?.hasError('required')">
                  Confirm password is required
                </mat-error>
                <mat-error *ngIf="changePasswordForm.hasError('passwordMismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>

              <!-- Submit Button -->
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="w-full h-12 text-lg font-medium"
                [disabled]="changePasswordForm.invalid || isLoading"
              >
                <mat-spinner 
                  *ngIf="isLoading" 
                  diameter="20" 
                  class="mr-2"
                ></mat-spinner>
                {{ isLoading ? 'Updating...' : 'Update Password' }}
              </button>

              <!-- Cancel Button -->
              <button 
                mat-stroked-button 
                type="button" 
                class="w-full h-12 text-lg font-medium"
                [routerLink]="['/shared/profile']"
              >
                Cancel
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isLoading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const request: ChangePasswordRequest = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword,
      confirmPassword: this.changePasswordForm.value.confirmPassword
    };

    this.authService.changePassword(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Password updated successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/shared/profile']);
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(
          error.error?.message || 'Failed to update password. Please try again.', 
          'Close', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }
}