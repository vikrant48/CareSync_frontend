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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';
import { DeleteAccountDialogComponent } from './delete-account-dialog.component';

@Component({
  selector: 'app-profile',
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
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="container mx-auto p-4 max-w-4xl">
      <mat-card class="shadow-lg">
        <mat-card-header class="bg-blue-50 p-6">
          <div class="flex items-center w-full">
            <div class="flex-shrink-0 mr-4">
              <div class="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {{ userInitials }}
              </div>
            </div>
            <div class="flex-grow">
              <mat-card-title class="text-2xl font-bold">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</mat-card-title>
              <mat-card-subtitle class="text-lg">
                <span class="capitalize">{{ userRoleDisplay }}</span>
                @if (currentUser?.email) {
                  <span class="text-gray-500 ml-2">{{ currentUser?.email }}</span>
                }
              </mat-card-subtitle>
            </div>
            <div class="flex-shrink-0">
              <button 
                mat-raised-button 
                color="primary"
                [routerLink]="['/auth/change-password']"
              >
                <mat-icon class="mr-2">lock</mat-icon>
                Change Password
              </button>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content class="p-6">
          <mat-tab-group animationDuration="300ms">
            <mat-tab label="Profile Information">
              <div class="py-6">
                <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- First Name -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>First Name</mat-label>
                      <input 
                        matInput 
                        formControlName="firstName" 
                        placeholder="Enter your first name"
                      >
                      <mat-error *ngIf="profileForm.get('firstName')?.hasError('required')">
                        First name is required
                      </mat-error>
                    </mat-form-field>

                    <!-- Last Name -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Last Name</mat-label>
                      <input 
                        matInput 
                        formControlName="lastName" 
                        placeholder="Enter your last name"
                      >
                      <mat-error *ngIf="profileForm.get('lastName')?.hasError('required')">
                        Last name is required
                      </mat-error>
                    </mat-form-field>

                    <!-- Email -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Email</mat-label>
                      <input 
                        matInput 
                        formControlName="email" 
                        placeholder="Enter your email"
                        type="email"
                        readonly
                      >
                      <mat-icon matSuffix>email</mat-icon>
                    </mat-form-field>

                    <!-- Phone Number -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Phone Number</mat-label>
                      <input 
                        matInput 
                        formControlName="phoneNumber" 
                        placeholder="Enter your phone number"
                      >
                      <mat-icon matSuffix>phone</mat-icon>
                      <mat-error *ngIf="profileForm.get('phoneNumber')?.hasError('pattern')">
                        Please enter a valid phone number
                      </mat-error>
                    </mat-form-field>

                    <!-- Address -->
                    <mat-form-field appearance="outline" class="w-full md:col-span-2">
                      <mat-label>Address</mat-label>
                      <input 
                        matInput 
                        formControlName="address" 
                        placeholder="Enter your address"
                      >
                      <mat-icon matSuffix>home</mat-icon>
                    </mat-form-field>

                    <!-- Date of Birth (for patients) -->
                    @if (isPatient()) {
                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Date of Birth</mat-label>
                        <input 
                          matInput 
                          formControlName="dateOfBirth" 
                          placeholder="MM/DD/YYYY"
                          type="date"
                        >
                      </mat-form-field>
                    }

                    <!-- Specialization (for doctors) -->
                    @if (isDoctor()) {
                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Specialization</mat-label>
                        <input 
                          matInput 
                          formControlName="specialization" 
                          placeholder="Enter your specialization"
                        >
                      </mat-form-field>
                    }
                  </div>

                  <!-- Bio/About -->
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>{{ isDoctor() ? 'Professional Bio' : 'About Me' }}</mat-label>
                    <textarea 
                      matInput 
                      formControlName="bio" 
                      placeholder="Tell us about yourself"
                      rows="4"
                    ></textarea>
                  </mat-form-field>

                  <!-- Submit Button -->
                  <div class="flex justify-end">
                    <button 
                      mat-raised-button 
                      color="primary" 
                      type="submit" 
                      class="h-12 px-6 text-lg font-medium"
                      [disabled]="profileForm.invalid || isLoading || !profileForm.dirty"
                    >
                      <mat-spinner 
                        *ngIf="isLoading" 
                        diameter="20" 
                        class="mr-2"
                      ></mat-spinner>
                      {{ isLoading ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>

            <mat-tab label="Account Settings">
              <div class="py-6 space-y-8">
                <!-- Email Verification -->
                <div class="bg-blue-50 p-4 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-medium">Email Verification</h3>
                      <p class="text-gray-600">
                        @if (currentUser?.emailVerified) {
                          Your email has been verified.
                        } @else {
                          Please verify your email address to access all features.
                        }
                      </p>
                    </div>
                    <div>
                      @if (currentUser?.emailVerified) {
                        <div class="flex items-center text-green-600">
                          <mat-icon>check_circle</mat-icon>
                          <span class="ml-2">Verified</span>
                        </div>
                      } @else {
                        <button 
                          mat-stroked-button 
                          color="primary"
                          (click)="resendVerificationEmail()"
                          [disabled]="isResendingEmail"
                        >
                          <mat-spinner 
                            *ngIf="isResendingEmail" 
                            diameter="20" 
                            class="mr-2"
                          ></mat-spinner>
                          {{ isResendingEmail ? 'Sending...' : 'Resend Verification Email' }}
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Password Management -->
                <div>
                  <h3 class="text-lg font-medium mb-4">Password & Security</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-600">Change your password regularly to keep your account secure.</p>
                    </div>
                    <div>
                      <button 
                        mat-raised-button 
                        color="primary"
                        [routerLink]="['/auth/change-password']"
                      >
                        <mat-icon class="mr-2">lock</mat-icon>
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Delete Account -->
                <div>
                  <h3 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-600">Permanently delete your account and all associated data.</p>
                    </div>
                    <div>
                      <button 
                        mat-stroked-button 
                        color="warn"
                        (click)="confirmDeleteAccount()"
                      >
                        <mat-icon class="mr-2">delete_forever</mat-icon>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  isResendingEmail = false;

  get userInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
  }

  get userRoleDisplay(): string {
    if (!this.currentUser) return '';
    return this.currentUser.role.toLowerCase();
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      address: [''],
      bio: [''],
      // Fields specific to user roles
      dateOfBirth: [''],
      specialization: [''],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      // Set common fields
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        phoneNumber: this.currentUser.phoneNumber || '',
        address: this.currentUser.address || '',
      });

      // Set role-specific fields
      if (this.isPatient() && 'dateOfBirth' in this.currentUser) {
        this.profileForm.patchValue({
          dateOfBirth: this.currentUser.dateOfBirth || '',
          bio: this.currentUser.bio || ''
        });
      } else if (this.isDoctor() && 'specialization' in this.currentUser) {
        this.profileForm.patchValue({
          specialization: this.currentUser.specialization || '',
          bio: this.currentUser.bio || ''
        });
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) {
      return;
    }

    this.isLoading = true;
    const profileData = this.prepareProfileData();

    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.currentUser = updatedUser;
        this.profileForm.markAsPristine();
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(
          error.error?.message || 'Failed to update profile. Please try again.', 
          'Close', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  prepareProfileData(): any {
    const formValue = this.profileForm.getRawValue();
    const baseData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
    };

    if (this.isPatient()) {
      return {
        ...baseData,
        dateOfBirth: formValue.dateOfBirth,
        bio: formValue.bio
      };
    } else if (this.isDoctor()) {
      return {
        ...baseData,
        specialization: formValue.specialization,
        bio: formValue.bio
      };
    }

    return baseData;
  }

  resendVerificationEmail(): void {
    if (!this.currentUser?.email) return;

    this.isResendingEmail = true;
    this.authService.resendVerificationEmail(this.currentUser.email).subscribe({
      next: () => {
        this.isResendingEmail = false;
        this.snackBar.open('Verification email sent successfully. Please check your inbox.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isResendingEmail = false;
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

  confirmDeleteAccount(): void {
    const dialogRef = this.dialog.open(DeleteAccountDialogComponent, {
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed && result.password) {
        this.deleteAccount(result.password);
      }
    });
  }

  deleteAccount(password: string): void {
    this.authService.deleteAccount(password).subscribe({
      next: () => {
        this.snackBar.open('Your account has been deleted successfully.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to delete account. Please try again.', 
          'Close', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  isPatient(): boolean {
    return this.currentUser?.role === UserRole.PATIENT;
  }

  isDoctor(): boolean {
    return this.currentUser?.role === UserRole.DOCTOR;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }
}