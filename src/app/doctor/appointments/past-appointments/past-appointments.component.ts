import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorAppointment } from '../../../models/appointment.model';

@Component({
  selector: 'app-past-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="past-appointments-container">
      <div class="header">
        <h2>Past Appointments</h2>
        <p class="subtitle">View your completed and past appointments</p>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading past appointments...</p>
      </div>

      <div *ngIf="error" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadPastAppointments()">Retry</button>
      </div>

      <div *ngIf="!loading && !error" class="appointments-content">
        <div *ngIf="pastAppointments.length === 0" class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <h3>No Past Appointments</h3>
          <p>You don't have any past appointments yet.</p>
        </div>

        <div *ngIf="pastAppointments.length > 0" class="appointments-grid">
          <mat-card *ngFor="let appointment of pastAppointments" class="appointment-card">
            <mat-card-header>
              <div class="appointment-header">
                <div class="patient-info">
                  <h3>{{ appointment.patientName }}</h3>
                  <p class="contact-info">{{ appointment.patientContactInfo }}</p>
                </div>
                <mat-chip [class]="'status-' + appointment.status.toLowerCase()">{{ appointment.status }}</mat-chip>
              </div>
            </mat-card-header>
            
            <mat-card-content>
              <div class="appointment-details">
                <div class="detail-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ appointment.appointmentDate | date:'MMM dd, yyyy - h:mm a' }}</span>
                </div>
                
                <div class="detail-row">
                  <mat-icon>description</mat-icon>
                  <span>{{ appointment.reason || 'General Consultation' }}</span>
                </div>
                
                <div *ngIf="appointment.medicalHistory && appointment.medicalHistory.length > 0 && appointment.medicalHistory[0].symptoms" class="detail-row">
                  <mat-icon>healing</mat-icon>
                  <span>{{ appointment.medicalHistory[0].symptoms }}</span>
                </div>
                
                <div *ngIf="appointment.medicalHistory && appointment.medicalHistory.length > 0 && appointment.medicalHistory[0].diagnosis" class="detail-row">
                  <mat-icon>assignment</mat-icon>
                  <span><strong>Diagnosis:</strong> {{ appointment.medicalHistory[0].diagnosis }}</span>
                </div>
                
                <div *ngIf="appointment.medicalHistory && appointment.medicalHistory.length > 0 && appointment.medicalHistory[0].treatment" class="detail-row">
                  <mat-icon>local_hospital</mat-icon>
                  <span><strong>Treatment:</strong> {{ appointment.medicalHistory[0].treatment }}</span>
                </div>
              </div>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-button [routerLink]="['/doctor/appointments', appointment.appointmentId]">
                <mat-icon>visibility</mat-icon>
                View Details
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .past-appointments-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
    }

    .header h2 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 500;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container mat-spinner {
      margin-bottom: 16px;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      color: #f44336;
    }

    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
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

    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .patient-info h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 500;
    }

    .contact-info {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .appointment-details {
      margin-top: 16px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
    }

    .detail-row mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .detail-row span {
      font-size: 14px;
      line-height: 1.4;
    }

    mat-card-actions {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .status-completed {
      background-color: #4caf50;
      color: white;
    }

    .status-cancelled {
      background-color: #f44336;
      color: white;
    }

    .status-rescheduled {
      background-color: #ff9800;
      color: white;
    }

    @media (max-width: 768px) {
      .past-appointments-container {
        padding: 16px;
      }

      .appointments-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .appointment-header {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class PastAppointmentsComponent implements OnInit {
  pastAppointments: DoctorAppointment[] = [];
  loading = false;
  error: string | null = null;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadPastAppointments();
  }

  loadPastAppointments(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService.getMyPatientsAppointments().subscribe({
      next: (appointments) => {
        // Filter past appointments based on current date
        const currentDate = new Date();
        this.pastAppointments = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate < currentDate;
        });
        
        // Sort by date (most recent first)
        this.pastAppointments.sort((a, b) => {
          return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading past appointments:', error);
        this.error = 'Failed to load past appointments. Please try again.';
        this.loading = false;
      }
    });
  }
}