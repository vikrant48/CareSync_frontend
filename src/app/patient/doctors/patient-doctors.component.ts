import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/user.model';

@Component({
  selector: 'app-patient-doctors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    RouterModule
  ],
  template: `
    <div class="doctors-container">
      <div class="header">
        <h1>Find Doctors</h1>
        <p>Browse and connect with healthcare professionals</p>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Loading doctors...</p>
      </div>

      <div class="doctors-grid" *ngIf="!loading && doctors.length > 0">
        <mat-card class="doctor-card" *ngFor="let doctor of doctors">
          <mat-card-header>
            <div mat-card-avatar class="doctor-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ doctor.specialization }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="doctor-info">
              <div class="info-item">
                <mat-icon>email</mat-icon>
                <span>{{ doctor.email }}</span>
              </div>
              <div class="info-item" *ngIf="doctor.contactInfo">
                <mat-icon>phone</mat-icon>
                <span>{{ doctor.contactInfo }}</span>
              </div>
              <div class="info-item" *ngIf="doctor.experience && doctor.experience.length > 0">
                <mat-icon>business</mat-icon>
                <span>{{ doctor.experience[0].hospitalName }} - {{ doctor.experience[0].position }}</span>
              </div>
              <div class="info-item" *ngIf="doctor.experience && doctor.experience.length > 0">
                <mat-icon>work</mat-icon>
                <span>{{ doctor.experience[0].yearsOfService }} years experience</span>
              </div>
            </div>

            <div class="education-section" *ngIf="doctor.education && doctor.education.length > 0">
                <h4><mat-icon>school</mat-icon> Education</h4>
                <div class="education-item" *ngFor="let education of doctor.education">
                <strong>{{ education.degree }}</strong> - {{ education.institution }} ({{ education.yearOfCompletion }})
              </div>
            </div>

            <div class="certificates-section" *ngIf="doctor.certificates && doctor.certificates.length > 0">
              <h4>Certifications</h4>
              <mat-chip-listbox>
                <mat-chip *ngFor="let cert of doctor.certificates">{{ cert.name }}</mat-chip>
              </mat-chip-listbox>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary" [routerLink]="['/patient/doctors', doctor.id]">
              <mat-icon>visibility</mat-icon>
              View Profile
            </button>
            <button mat-stroked-button color="accent">
              <mat-icon>event</mat-icon>
              Book Appointment
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="no-doctors" *ngIf="!loading && doctors.length === 0">
        <mat-icon>search_off</mat-icon>
        <h3>No doctors found</h3>
        <p>There are currently no doctors available in the system.</p>
      </div>
    </div>
  `,
  styles: [`
    .doctors-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header h1 {
      color: #1976d2;
      margin-bottom: 8px;
    }

    .header p {
      color: #666;
      font-size: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .doctor-card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .doctor-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .doctor-avatar {
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .doctor-info {
      margin: 16px 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .info-item mat-icon {
      color: #666;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .info-item span {
      font-size: 14px;
      color: #333;
    }

    .education-section,
    .certificates-section {
      margin-top: 16px;
    }

    .education-section h4,
    .certificates-section h4 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 14px;
      font-weight: 500;
    }

    .education-item {
      font-size: 13px;
      margin-bottom: 4px;
      color: #555;
    }

    mat-card-actions {
      display: flex;
      gap: 8px;
      padding: 16px;
    }

    mat-card-actions button {
      flex: 1;
    }

    .no-doctors {
      text-align: center;
      padding: 48px;
      color: #666;
    }

    .no-doctors mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .no-doctors h3 {
      margin: 16px 0 8px 0;
    }

    @media (max-width: 768px) {
      .doctors-container {
        padding: 16px;
      }

      .doctors-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      mat-card-actions {
        flex-direction: column;
      }

      mat-card-actions button {
        width: 100%;
      }
    }
  `]
})
export class PatientDoctorsComponent implements OnInit, OnDestroy {
  doctors: Doctor[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  private doctorService: DoctorService = inject(DoctorService);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDoctors(): void {
    this.loading = true;
    
    this.doctorService.getAllDoctors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          this.loading = false;
          console.log('Doctors loaded:', doctors);
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.loading = false;
          this.snackBar.open('Failed to load doctors. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
}