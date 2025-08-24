import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reset-password-container">
      <div class="reset-password-card">
        <mat-card>
          <mat-card-header>
            <mat-card-title class="reset-password-title">
              <mat-icon class="title-icon">lock_open</mat-icon>
              Reset Password
            </mat-card-title>
            <mat-card-subtitle>Enter your new password</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-password-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput type="password" formControlName="newPassword" placeholder="Enter your new password">
                <mat-icon matSuffix>lock</mat-icon>
                <button mat-icon-button matSuffix (click)="togglePasswordVisibility()" type="button">
                  <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
                @if (resetPasswordForm.get('newPassword')?.hasError('required')) {
                  <mat-error>
                    New password is required
                  </mat-error>
                }
                @if (resetPasswordForm.get('newPassword')?.hasError('minlength')) {
                  <mat-error>
                    Password must be at least 6 characters
                  </mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput type="password" formControlName="confirmPassword" placeholder="Confirm your new password">
                <mat-icon matSuffix>lock</mat-icon>
                @if (resetPasswordForm.get('confirmPassword')?.hasError('required')) {
                  <mat-error>
                    Confirm password is required
                  </mat-error>
                }
                @if (resetPasswordForm.hasError('passwordMismatch')) {
                  <mat-error>
                    Passwords do not match
                  </mat-error>
                }
              </mat-form-field>

              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="submit-button"
                [disabled]="resetPasswordForm.invalid || isLoading"
              >
                @if (isLoading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <span>Reset Password</span>
                }
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions class="card-actions">
            <p class="back-to-login">
              Remember your password? 
              <a routerLink="/auth/login" class="login-link">Back to Login</a>
            </p>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .reset-password-card {
      width: 100%;
      max-width: 400px;
    }

    .reset-password-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .title-icon {
      color: #1976d2;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .reset-password-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
    }

    .submit-button {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
    }

    .card-actions {
      display: flex;
      justify-content: center;
      padding: 16px;
    }

    .back-to-login {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .login-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .reset-password-container {
        padding: 16px;
      }

      .reset-password-card {
        max-width: 100%;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  resetToken: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParams['token'] || '';
    if (!this.resetToken) {
      this.showErrorMessage('Invalid reset token. Please request a new password reset.');
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      const { newPassword, confirmPassword } = this.resetPasswordForm.value;

      this.authService.resetPassword({
        token: this.resetToken,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessMessage('Password reset successfully! Please log in with your new password.');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorMessage(error.error?.message || 'Failed to reset password. Please try again.');
        }
      });
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
