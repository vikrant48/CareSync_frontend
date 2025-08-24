import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DoctorService } from '../../services/doctor.service';
import { TodayAppointmentForRecord } from '../../models/medical-record.model';
import { CreateMedicalRecordComponent } from './create-medical-record/create-medical-record.component';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="medical-records-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <h1>Medical Records</h1>
            <p class="subtitle">Create medical records for today's confirmed appointments</p>
          </div>
          <div class="header-actions">
            <button mat-raised-button routerLink="/doctor/dashboard" color="primary">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Today's Date Info -->
      <mat-card class="date-info-card">
        <mat-card-content>
          <div class="date-info">
            <mat-icon>today</mat-icon>
            <div>
              <h3>{{ getCurrentDate() }}</h3>
              <p>{{ todayAppointments.length }} confirmed appointments for today</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading today's appointments...</p>
      </div>

      <!-- No Appointments -->
      <mat-card *ngIf="!loading && todayAppointments.length === 0" class="no-appointments-card">
        <mat-card-content>
          <div class="no-appointments">
            <mat-icon>event_available</mat-icon>
            <h3>No Confirmed Appointments Today</h3>
            <p>There are no confirmed appointments for today that require medical records.</p>
            <button mat-raised-button routerLink="/doctor/appointments" color="primary">
              <mat-icon>calendar_today</mat-icon>
              View All Appointments
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Appointments List -->
      <div *ngIf="!loading && todayAppointments.length > 0" class="appointments-grid">
        <mat-card *ngFor="let appointment of todayAppointments" class="appointment-card">
          <mat-card-header>
            <div mat-card-avatar class="appointment-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>{{ appointment.patientName }}</mat-card-title>
            <mat-card-subtitle>
              <div class="appointment-time">
                <mat-icon>schedule</mat-icon>
                {{ appointment.appointmentTime }}
              </div>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="appointment-details">
              <div class="detail-item">
                <mat-icon>email</mat-icon>
                <span>{{ appointment.patientEmail }}</span>
              </div>
              <div class="detail-item">
                <mat-icon>verified</mat-icon>
                <mat-chip color="accent">{{ appointment.status }}</mat-chip>
              </div>
            </div>

            <!-- Medical Record Status -->
            <div class="record-status" [ngClass]="{
              'has-record': appointment.hasExistingRecord,
              'no-record': !appointment.hasExistingRecord
            }">
              <mat-icon>{{ appointment.hasExistingRecord ? 'assignment_turned_in' : 'assignment' }}</mat-icon>
              <span>{{ appointment.hasExistingRecord ? 'Medical Record Created' : 'No Medical Record' }}</span>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              *ngIf="!appointment.hasExistingRecord" 
              mat-raised-button 
              color="primary"
              (click)="createMedicalRecord(appointment)">
              <mat-icon>add</mat-icon>
              Create Medical Record
            </button>
            
            <button 
              *ngIf="appointment.hasExistingRecord" 
              mat-stroked-button 
              color="primary"
              (click)="viewMedicalRecord(appointment.medicalRecordId!)">
              <mat-icon>visibility</mat-icon>
              View Record
            </button>
            
            <button 
              *ngIf="appointment.hasExistingRecord" 
              mat-stroked-button 
              (click)="editMedicalRecord(appointment.medicalRecordId!)">
              <mat-icon>edit</mat-icon>
              Edit Record
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .medical-records-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section h1 {
      margin: 0;
      color: #1976d2;
      font-size: 2rem;
      font-weight: 500;
    }

    .subtitle {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 1rem;
    }

    .date-info-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      color: white;
    }

    .date-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .date-info mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .date-info h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .date-info p {
      margin: 4px 0 0 0;
      opacity: 0.9;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .no-appointments-card {
      text-align: center;
    }

    .no-appointments {
      padding: 48px 24px;
    }

    .no-appointments mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ccc;
      margin-bottom: 16px;
    }

    .no-appointments h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .no-appointments p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .appointments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .appointment-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .appointment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .appointment-avatar {
      background: #e3f2fd;
      color: #1976d2;
    }

    .appointment-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9rem;
    }

    .appointment-details {
      margin: 16px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #666;
    }

    .detail-item mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    .record-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .record-status.has-record {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .record-status.no-record {
      background: #fff3e0;
      color: #f57c00;
    }

    .record-status mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    mat-card-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .medical-records-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .appointments-grid {
        grid-template-columns: 1fr;
      }

      .title-section h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class DoctorMedicalRecordsComponent implements OnInit {
  todayAppointments: TodayAppointmentForRecord[] = [];
  loading = false;
  doctorId = 1; // This should come from auth service

  constructor(
    private doctorService: DoctorService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTodayAppointments();
  }

  loadTodayAppointments(): void {
    this.loading = true;
    this.doctorService.getTodayConfirmedAppointments(this.doctorId).subscribe({
      next: (appointments) => {
        this.todayAppointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading today appointments:', error);
        this.snackBar.open('Error loading appointments', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  createMedicalRecord(appointment: TodayAppointmentForRecord): void {
    const dialogRef = this.dialog.open(CreateMedicalRecordComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        appointment: appointment,
        doctorId: this.doctorId
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTodayAppointments(); // Refresh the list
        this.snackBar.open('Medical record created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  viewMedicalRecord(recordId: string): void {
    this.router.navigate(['/doctor/medical-records/view', recordId]);
  }

  editMedicalRecord(recordId: string): void {
    this.router.navigate(['/doctor/medical-records/edit', recordId]);
  }
}