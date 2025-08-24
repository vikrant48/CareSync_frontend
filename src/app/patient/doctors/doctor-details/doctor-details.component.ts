import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DoctorService } from '../../../services/doctor.service';
import { Doctor } from '../../../models/user.model';

@Component({
  selector: 'app-doctor-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="doctor-details-container">
      <div class="back-button">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>Back to Doctors</span>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Loading doctor details...</p>
      </div>

      <div class="doctor-profile" *ngIf="!loading && doctor">
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="doctor-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ doctor.specialization }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="contact-info">
              <h3>Contact Information</h3>
              <div class="info-item">
                <mat-icon>email</mat-icon>
                <span>{{ doctor.email }}</span>
              </div>
              <div class="info-item" *ngIf="doctor.contactInfo">
                <mat-icon>phone</mat-icon>
                <span>{{ doctor.contactInfo }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="experience-section" *ngIf="doctor.experience && doctor.experience.length > 0">
              <h3><mat-icon>work</mat-icon> Experience</h3>
              <div class="experience-item" *ngFor="let exp of doctor.experience">
                <div class="exp-header">
                  <strong>{{ exp.position }}</strong>
                  <span class="years">{{ exp.yearsOfService }} years</span>
                </div>
                <div class="exp-details">
                  <mat-icon>business</mat-icon>
                  <span>{{ exp.hospitalName }}</span>
                </div>
                <div class="exp-description" *ngIf="exp.details">
                  <p>{{ exp.details }}</p>
                </div>
              </div>
            </div>

            <mat-divider *ngIf="doctor.education && doctor.education.length > 0"></mat-divider>

            <div class="education-section" *ngIf="doctor.education && doctor.education.length > 0">
              <h3><mat-icon>school</mat-icon> Education</h3>
              <div class="education-item" *ngFor="let education of doctor.education">
                <div class="edu-header">
                  <strong>{{ education.degree }}</strong>
                  <span class="year">({{ education.yearOfCompletion }})</span>
                </div>
                <div class="edu-institution">
                  <mat-icon>school</mat-icon>
                  <span>{{ education.institution }}</span>
                </div>
              </div>
            </div>

            <mat-divider *ngIf="doctor.certificates && doctor.certificates.length > 0"></mat-divider>

            <div class="certificates-section" *ngIf="doctor.certificates && doctor.certificates.length > 0">
              <h3>Certifications</h3>
              <mat-chip-listbox>
                <mat-chip *ngFor="let cert of doctor.certificates">
                  {{ cert.name }}
                  <span *ngIf="cert.issuingOrganization"> - {{ cert.issuingOrganization }}</span>
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>event</mat-icon>
              Book Appointment
            </button>
            <button mat-stroked-button>
              <mat-icon>message</mat-icon>
              Send Message
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="error-state" *ngIf="!loading && !doctor">
        <mat-icon>error_outline</mat-icon>
        <h3>Doctor not found</h3>
        <p>The requested doctor profile could not be found.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Doctors
        </button>
      </div>
    </div>
  `,
  styles: [`
    .doctor-details-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .back-button {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      cursor: pointer;
      color: #1976d2;
    }

    .back-button span {
      margin-left: 8px;
      font-weight: 500;
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

    .profile-card {
      margin-bottom: 24px;
    }

    .doctor-avatar {
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contact-info,
    .experience-section,
    .education-section,
    .certificates-section {
      margin: 24px 0;
    }

    .contact-info h3,
    .experience-section h3,
    .education-section h3,
    .certificates-section h3 {
      color: #1976d2;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
    }

    .info-item mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .experience-item,
    .education-item {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .exp-header,
    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .years,
    .year {
      color: #666;
      font-size: 14px;
    }

    .exp-details,
    .edu-institution {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .exp-details mat-icon,
    .edu-institution mat-icon {
      color: #666;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .exp-description {
      margin-top: 12px;
    }

    .exp-description p {
      color: #555;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    mat-divider {
      margin: 24px 0;
    }

    mat-card-actions {
      display: flex;
      gap: 12px;
      padding: 24px;
    }

    mat-card-actions button {
      flex: 1;
    }

    .error-state {
      text-align: center;
      padding: 48px;
      color: #666;
    }

    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #f44336;
    }

    .error-state h3 {
      margin: 16px 0 8px 0;
    }

    @media (max-width: 768px) {
      .doctor-details-container {
        padding: 16px;
      }

      .exp-header,
      .edu-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
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
export class DoctorDetailsComponent implements OnInit, OnDestroy {
  doctor: Doctor | null = null;
  loading = false;
  doctorId: number | null = null;
  private destroy$ = new Subject<void>();

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private doctorService: DoctorService = inject(DoctorService);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.doctorId = +params['id'];
        if (this.doctorId) {
          this.loadDoctorDetails();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDoctorDetails(): void {
    if (!this.doctorId) return;
    
    this.loading = true;
    
    this.doctorService.getDoctorById(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctor) => {
          this.doctor = doctor;
          this.loading = false;
          console.log('Doctor details loaded:', doctor);
        },
        error: (error) => {
          console.error('Error loading doctor details:', error);
          this.loading = false;
          this.snackBar.open('Failed to load doctor details. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/patient/doctors']);
  }
}