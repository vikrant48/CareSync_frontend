import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule
  ],
  template: `
    <div class="appointment-details-container">
      <div class="appointment-details-header">
        <button mat-icon-button color="primary" routerLink="/patient/appointments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Appointment Details</h1>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading appointment details...</p>
      </div>

      <div *ngIf="!isLoading && appointment" class="appointment-details-content">
        <mat-card class="appointment-card">
          <mat-card-header>
            <mat-card-title>Appointment with Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
            <div class="appointment-status">
              <mat-chip [color]="getStatusColor(appointment.status)" selected>
                {{ appointment.status }}
              </mat-chip>
            </div>
          </mat-card-header>
          
          <mat-card-content>
            <div class="details-section">
              <h2>Appointment Information</h2>
              <div class="detail-row">
                <mat-icon>event</mat-icon>
                <div>
                  <span class="detail-label">Date</span>
                  <span class="detail-value">{{ appointment.appointmentDateTime | date:'EEEE, MMMM d, y' }}</span>
                </div>
              </div>
              <div class="detail-row">
                <mat-icon>schedule</mat-icon>
                <div>
                  <span class="detail-label">Time</span>
                  <span class="detail-value">{{ appointment.appointmentDateTime | date:'h:mm a' }}</span>
                </div>
              </div>
              <div class="detail-row">
                <mat-icon>description</mat-icon>
                <div>
                  <span class="detail-label">Reason</span>
                  <span class="detail-value">{{ appointment.reason || 'General Consultation' }}</span>
                </div>
              </div>
              <div class="detail-row" *ngIf="appointment.notes">
                <mat-icon>notes</mat-icon>
                <div>
                  <span class="detail-label">Notes</span>
                  <span class="detail-value">{{ appointment.notes }}</span>
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="details-section">
              <h2>Doctor Information</h2>
              <div class="detail-row">
                <mat-icon>person</mat-icon>
                <div>
                  <span class="detail-label">Name</span>
                  <span class="detail-value">Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</span>
                </div>
              </div>
              <div class="detail-row">
                <mat-icon>local_hospital</mat-icon>
                <div>
                  <span class="detail-label">Specialization</span>
                  <span class="detail-value">{{ appointment.doctor?.specialization }}</span>
                </div>
              </div>
              <div class="detail-row" *ngIf="appointment.doctor?.email">
                <mat-icon>email</mat-icon>
                <div>
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ appointment.doctor?.email }}</span>
                </div>
              </div>
              <div class="detail-row" *ngIf="appointment.doctor?.phoneNumber">
                <mat-icon>phone</mat-icon>
                <div>
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">{{ appointment.doctor?.phoneNumber }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions *ngIf="appointment.status === AppointmentStatus.SCHEDULED || appointment.status === AppointmentStatus.CONFIRMED">
            <button mat-raised-button color="primary" (click)="rescheduleAppointment()" *ngIf="appointment.status === AppointmentStatus.SCHEDULED">
              <mat-icon>schedule</mat-icon>
              Reschedule
            </button>
            <button mat-raised-button color="warn" (click)="cancelAppointment()">
              <mat-icon>cancel</mat-icon>
              Cancel Appointment
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && !appointment" class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h2>Appointment Not Found</h2>
        <p>The appointment you're looking for doesn't exist or you don't have permission to view it.</p>
        <button mat-raised-button color="primary" routerLink="/patient/appointments">
          Back to Appointments
        </button>
      </div>
    </div>
  `,
  styles: [`
    .appointment-details-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .appointment-details-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }

    .appointment-details-header h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 0 16px;
      color: #333;
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

    .appointment-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .appointment-status {
      margin-left: auto;
    }

    .details-section {
      padding: 16px 0;
    }

    .details-section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .detail-row mat-icon {
      color: #1976d2;
      margin-right: 16px;
      margin-top: 2px;
    }

    .detail-row div {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 16px;
      color: #333;
    }

    mat-divider {
      margin: 16px 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px;
    }

    .error-container {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-container h2 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .error-container p {
      font-size: 16px;
      margin: 0 0 24px 0;
    }

    @media (max-width: 768px) {
      .appointment-details-container {
        padding: 16px;
      }

      .appointment-details-header h1 {
        font-size: 24px;
      }

      .detail-value {
        font-size: 15px;
      }
    }
  `]
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;
  appointmentId!: number;
  AppointmentStatus = AppointmentStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.appointmentId = +id;
        this.loadAppointment();
      } else {
        this.router.navigate(['/patient/appointments']);
      }
    });
  }

  loadAppointment(): void {
    this.isLoading = true;
    this.appointmentService.getAppointment(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.isLoading = false;
        this.showErrorMessage('Failed to load appointment details.');
      }
    });
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'primary';
      case AppointmentStatus.CONFIRMED:
        return 'accent';
      case AppointmentStatus.COMPLETED:
        return 'primary';
      case AppointmentStatus.CANCELLED:
        return 'warn';
      case AppointmentStatus.RESCHEDULED:
        return 'accent';
      default:
        return 'primary';
    }
  }

  rescheduleAppointment(): void {
    // Navigate to reschedule page or open dialog
    this.router.navigate(['/patient/appointments/reschedule', this.appointmentId]);
  }

  cancelAppointment(): void {
    // Navigate to cancel appointment page
    this.router.navigate(['/patient/appointments/cancel', this.appointmentId]);
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