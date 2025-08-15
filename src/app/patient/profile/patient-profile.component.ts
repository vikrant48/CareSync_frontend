import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/user.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div class="profile-content">
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading profile information...</p>
        </div>

        <div *ngIf="!isLoading && patient" class="profile-sections">
          <!-- Personal Information -->
          <mat-card class="profile-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Personal Information
              </mat-card-title>
              <mat-card-subtitle>Your basic details</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="profile-info">
                <div class="info-row">
                  <span class="label">Full Name:</span>
                  <span class="value">{{ patient.firstName }} {{ patient.lastName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">{{ patient.email }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Username:</span>
                  <span class="value">{{ patient.username }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date of Birth:</span>
                  <span class="value">{{ patient.dateOfBirth | date:'mediumDate' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">{{ patient.phoneNumber || 'Not provided' }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Medical Information -->
          <mat-card class="profile-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>medical_services</mat-icon>
                Medical Information
              </mat-card-title>
              <mat-card-subtitle>Your health details</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="profile-info">
                <div class="info-row">
                  <span class="label">Blood Type:</span>
                  <span class="value">{{ patient.bloodType || 'Not specified' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Allergies:</span>
                  <span class="value">
                    <mat-chip *ngFor="let allergy of patient.allergies" color="warn" selected>
                      {{ allergy }}
                    </mat-chip>
                    <span *ngIf="!patient.allergies?.length">None reported</span>
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Emergency Contact:</span>
                  <span class="value">
                    {{ patient.emergencyContactName || 'Not provided' }}
                    <span *ngIf="patient.emergencyContact">({{ patient.emergencyContact }})</span>
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Edit Profile Form -->
          <mat-card class="profile-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>edit</mat-icon>
                Edit Profile
              </mat-card-title>
              <mat-card-subtitle>Update your information</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName">
                    <mat-error *ngIf="profileForm.get('firstName')?.hasError('required')">
                      First name is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName">
                    <mat-error *ngIf="profileForm.get('lastName')?.hasError('required')">
                      Last name is required
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                                     <mat-form-field appearance="outline">
                     <mat-label>Phone</mat-label>
                     <input matInput formControlName="phoneNumber" placeholder="Enter phone number">
                     <mat-icon matSuffix>phone</mat-icon>
                   </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date of Birth</mat-label>
                    <input matInput type="date" formControlName="dateOfBirth">
                    <mat-icon matSuffix>calendar_today</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Blood Type</mat-label>
                    <input matInput formControlName="bloodType" placeholder="e.g., A+, B-, O+">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Emergency Contact Name</mat-label>
                    <input matInput formControlName="emergencyContactName" placeholder="Emergency contact name">
                  </mat-form-field>
                </div>

                <div class="form-row">
                                     <mat-form-field appearance="outline">
                     <mat-label>Emergency Contact Phone</mat-label>
                     <input matInput formControlName="emergencyContact" placeholder="Emergency contact phone">
                     <mat-icon matSuffix>phone</mat-icon>
                   </mat-form-field>
                </div>

                <div class="form-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    type="submit"
                    [disabled]="profileForm.invalid || isSubmitting"
                  >
                    <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
                    <span *ngIf="!isSubmitting">Update Profile</span>
                  </button>
                  <button mat-stroked-button type="button" (click)="resetForm()">
                    Reset
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .profile-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px 0;
    }

    .profile-header p {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .loading-container p {
      color: #666;
      font-size: 16px;
    }

    .profile-sections {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .profile-card mat-card-header {
      margin-bottom: 16px;
    }

    .profile-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .profile-card mat-card-title mat-icon {
      color: #1976d2;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #333;
      min-width: 150px;
      margin-right: 16px;
    }

    .value {
      color: #666;
      flex: 1;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 16px;
      }

      .profile-header h1 {
        font-size: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .label {
        min-width: auto;
        margin-right: 0;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class PatientProfileComponent implements OnInit {
  patient: Patient | null = null;
  profileForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      dateOfBirth: [''],
      bloodType: [''],
      emergencyContactName: [''],
      emergencyContact: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatientProfile();
  }

  loadPatientProfile(): void {
    this.isLoading = true;
    this.patientService.getMyProfile('').subscribe({
      next: (patient) => {
        this.patient = patient;
        this.populateForm(patient);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient profile:', error);
        this.isLoading = false;
        this.showErrorMessage('Failed to load profile information.');
      }
    });
  }

  populateForm(patient: Patient): void {
    this.profileForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      phoneNumber: patient.phoneNumber,
      dateOfBirth: patient.dateOfBirth,
      bloodType: patient.bloodType,
      emergencyContactName: patient.emergencyContactName,
      emergencyContact: patient.emergencyContact
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      const updateData = this.profileForm.value;

      this.patientService.updatePatientProfile(updateData).subscribe({
        next: (updatedPatient) => {
          this.patient = updatedPatient;
          this.isSubmitting = false;
          this.showSuccessMessage('Profile updated successfully!');
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showErrorMessage(error.error?.message || 'Failed to update profile.');
        }
      });
    }
  }

  resetForm(): void {
    if (this.patient) {
      this.populateForm(this.patient);
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
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
