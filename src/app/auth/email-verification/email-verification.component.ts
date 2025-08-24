import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <mat-card class="shadow-xl">
          <mat-card-content class="p-8 text-center">
            @if (isLoading) {
              <div class="flex flex-col items-center justify-center py-8">
                <mat-spinner diameter="48"></mat-spinner>
                <p class="mt-4 text-lg">Verifying your email...</p>
              </div>
            } @else if (isVerified) {
              <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <mat-icon class="text-green-600 text-3xl">check_circle</mat-icon>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                <p class="text-gray-600 mb-6">Your email has been successfully verified.</p>
                <button 
                  mat-raised-button 
                  color="primary" 
                  [routerLink]="['/auth/login']"
                  class="w-full h-12 text-lg font-medium"
                >
                  Proceed to Login
                </button>
              </div>
            } @else if (isExpired) {
              <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <mat-icon class="text-amber-600 text-3xl">schedule</mat-icon>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
                <p class="text-gray-600 mb-6">Your verification link has expired. Please request a new one.</p>
                <button 
                  mat-raised-button 
                  color="primary" 
                  (click)="resendVerificationEmail()"
                  class="w-full h-12 text-lg font-medium"
                  [disabled]="isResending"
                >
                  <mat-spinner 
                    *ngIf="isResending" 
                    diameter="20" 
                    class="mr-2"
                  ></mat-spinner>
                  {{ isResending ? 'Sending...' : 'Resend Verification Email' }}
                </button>
                <button 
                  mat-stroked-button 
                  [routerLink]="['/auth/login']"
                  class="w-full h-12 text-lg font-medium mt-4"
                >
                  Back to Login
                </button>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <mat-icon class="text-red-600 text-3xl">error</mat-icon>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                <p class="text-gray-600 mb-6">{{ errorMessage || 'We could not verify your email. Please try again or contact support.' }}</p>
                <button 
                  mat-raised-button 
                  color="primary" 
                  (click)="resendVerificationEmail()"
                  class="w-full h-12 text-lg font-medium"
                  [disabled]="isResending"
                >
                  <mat-spinner 
                    *ngIf="isResending" 
                    diameter="20" 
                    class="mr-2"
                  ></mat-spinner>
                  {{ isResending ? 'Sending...' : 'Resend Verification Email' }}
                </button>
                <button 
                  mat-stroked-button 
                  [routerLink]="['/auth/login']"
                  class="w-full h-12 text-lg font-medium mt-4"
                >
                  Back to Login
                </button>
              </div>
            }
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
export class EmailVerificationComponent implements OnInit {
  isLoading = true;
  isVerified = false;
  isExpired = false;
  isResending = false;
  errorMessage = '';
  email = '';
  token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      
      if (this.token && this.email) {
        this.verifyEmail();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Invalid verification link. Missing token or email.';
      }
    });
  }

  verifyEmail(): void {
    this.isLoading = true;
    this.authService.verifyEmail(this.token, this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isVerified = true;
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status === 410) {
          this.isExpired = true;
        } else {
          this.errorMessage = error.error?.message || 'Email verification failed. Please try again.';
        }
      }
    });
  }

  resendVerificationEmail(): void {
    if (!this.email) {
      this.snackBar.open('Email address is missing. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isResending = true;
    this.authService.resendVerificationEmail(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.snackBar.open('Verification email sent successfully. Please check your inbox.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isResending = false;
        this.snackBar.open(
          error.error?.message || 'Failed to send verification email. Please try again.', 
          'Close', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }
}