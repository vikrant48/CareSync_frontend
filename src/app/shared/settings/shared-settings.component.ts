import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { DeleteAccountDialogComponent } from './delete-account-dialog.component';

@Component({
  selector: 'app-shared-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './shared-settings.component.html',
  styleUrls: ['./shared-settings.component.css']
})
export class SharedSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationForm!: FormGroup;
  currentUser: User | null = null;
  
  isUpdatingProfile = false;
  isChangingPassword = false;
  isUpdatingNotifications = false;

  isDarkMode = false;
  selectedColorTheme = 'blue';
  
  successMessage = '';
  errorMessage = '';
  
  colorThemes = [
    { name: 'Blue', value: 'blue', color: '#3b82f6' },
    { name: 'Green', value: 'green', color: '#10b981' },
    { name: 'Purple', value: 'purple', color: '#8b5cf6' },
    { name: 'Red', value: 'red', color: '#ef4444' },
    { name: 'Gray', value: 'gray', color: '#6b7280' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserPreferences();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phoneNumber: [''],
      address: [''],
      dateOfBirth: [''],
      specialization: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      appointmentReminders: [true],
      marketingEmails: [false]
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        phoneNumber: this.currentUser.phoneNumber || '',
        address: this.currentUser.address || '',
        dateOfBirth: this.isPatient() && 'dateOfBirth' in this.currentUser ? this.currentUser.dateOfBirth : '',
        specialization: this.isDoctor() && 'specialization' in this.currentUser ? this.currentUser.specialization : ''
      });
    }
  }

  private loadUserPreferences(): void {
    // Load preferences from localStorage or user service
    const preferences = localStorage.getItem('userPreferences');
    if (preferences) {
      const parsed = JSON.parse(preferences);
      this.notificationForm.patchValue(parsed.notifications || {});
      this.isDarkMode = parsed.theme?.darkMode || false;
      this.selectedColorTheme = parsed.theme?.colorTheme || 'blue';
    }
  }

  isPatient(): boolean {
    return this.currentUser?.role === 'PATIENT';
  }

  isDoctor(): boolean {
    return this.currentUser?.role === 'DOCTOR';
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) {
      return;
    }

    this.isUpdatingProfile = true;
    const profileData = this.profileForm.value;

    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.isUpdatingProfile = false;
        this.currentUser = updatedUser;
        this.profileForm.markAsPristine();
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isUpdatingProfile = false;
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

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isChangingPassword = true;
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Password updated successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isChangingPassword = false;
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

  onUpdateNotifications(): void {
    if (!this.notificationForm.dirty) {
      return;
    }

    this.isUpdatingNotifications = true;
    const preferences = this.getStoredPreferences();
    preferences.notifications = this.notificationForm.value;
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    this.notificationForm.markAsPristine();
    
    setTimeout(() => {
      this.isUpdatingNotifications = false;
      this.snackBar.open('Notification preferences saved', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }, 500);
  }

  onToggleDarkMode(): void {
    const preferences = this.getStoredPreferences();
    preferences.theme = preferences.theme || {};
    preferences.theme.darkMode = this.isDarkMode;
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    this.snackBar.open(
      `${this.isDarkMode ? 'Dark' : 'Light'} mode enabled`,
      'Close',
      { duration: 2000 }
    );
  }

  onSelectColorTheme(theme: string): void {
    this.selectedColorTheme = theme;
    
    const preferences = this.getStoredPreferences();
    preferences.theme = preferences.theme || {};
    preferences.theme.colorTheme = theme;
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    this.snackBar.open(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme selected`, 'Close', {
      duration: 2000
    });
  }

  onDeleteAccount(): void {
    const dialogRef = this.dialog.open(DeleteAccountDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.deleteAccount(result.password).subscribe({
          next: () => {
            this.snackBar.open('Account deleted successfully', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.authService.logout();
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
    });
  }

  private getStoredPreferences(): any {
    const stored = localStorage.getItem('userPreferences');
    return stored ? JSON.parse(stored) : {};
  }
}