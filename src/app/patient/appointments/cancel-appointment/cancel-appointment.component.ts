import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Component({
  selector: 'app-cancel-appointment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  template: `
    <div class="cancel-container">
      <div class="cancel-header">
        <button mat-icon-button color="primary" routerLink="/patient/appointments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Cancel Appointment</h1>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading appointment details...</p>
      </div>

      <div *ngIf="!isLoading && appointment" class="cancel-content">
        <mat-card class="cancel-card">
          <mat-card-header>
            <mat-card-title>Appointment with Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="appointment-details">
              <h2>Appointment Details</h2>
              <div class="detail-row">
                <mat-icon>event</mat-icon>
                <span>{{ appointment.appointmentDateTime | date:'EEEE, MMMM d, y' }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>schedule</mat-icon>
                <span>{{ appointment.appointmentDateTime | date:'h:mm a' }}</span>
              </div>
              <div class="detail-row" *ngIf="appointment.reason">
                <mat-icon>subject</mat-icon>
                <span>{{ appointment.reason }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>info</mat-icon>
                <span>Status: <span class="status-badge" [style.background-color]="getStatusColor(appointment.status)">{{ appointment.status }}</span></span>
              </div>
            </div>

            <div class="cancellation-form">
              <h2>Cancellation Reason</h2>
              <p class="info-text">Please provide a reason for cancelling this appointment. This helps us improve our services.</p>
              
              <form [formGroup]="cancelForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Reason for cancellation</mat-label>
                  <textarea 
                    matInput 
                    formControlName="cancellationReason" 
                    rows="4"
                    placeholder="Please explain why you need to cancel this appointment"></textarea>
                  <mat-error *ngIf="cancelForm.get('cancellationReason')?.hasError('required')">Reason is required</mat-error>
                  <mat-error *ngIf="cancelForm.get('cancellationReason')?.hasError('minlength')">Reason must be at least 10 characters</mat-error>
                </mat-form-field>
              </form>

              <div class="cancellation-policy">
                <h3>Cancellation Policy</h3>
                <p>Please note that cancellations made less than 24 hours before the appointment time may incur a fee. Repeated cancellations may affect your ability to book future appointments.</p>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button routerLink="/patient/appointments">Back to Appointments</button>
            <button 
              mat-raised-button 
              color="warn" 
              [disabled]="cancelForm.invalid || isSubmitting"
              (click)="confirmCancellation()">
              <mat-icon *ngIf="isSubmitting">
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              </mat-icon>
              <span *ngIf="!isSubmitting">Cancel Appointment</span>
              <span *ngIf="isSubmitting">Cancelling...</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && !appointment" class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h2>Appointment Not Found</h2>
        <p>The appointment you're trying to cancel doesn't exist or you don't have permission to modify it.</p>
        <button mat-raised-button color="primary" routerLink="/patient/appointments">
          Back to Appointments
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cancel-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .cancel-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }

    .cancel-header h1 {
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

    .cancel-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .appointment-details {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .appointment-details h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .detail-row mat-icon {
      color: #1976d2;
      margin-right: 12px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      font-weight: 500;
    }

    .cancellation-form {
      margin-top: 24px;
    }

    .cancellation-form h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .info-text {
      color: #666;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .cancellation-policy {
      margin-top: 24px;
      padding: 16px;
      background-color: #fff4e5;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
    }

    .cancellation-policy h3 {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin: 0 0 8px 0;
    }

    .cancellation-policy p {
      color: #666;
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
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
      .cancel-container {
        padding: 16px;
      }

      .cancel-header h1 {
        font-size: 24px;
      }
    }
  `]
})
export class CancelAppointmentComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;
  isSubmitting = false;
  appointmentId!: number;
  cancelForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {
    this.cancelForm = this.fb.group({
      cancellationReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

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
        
        // Check if appointment status is valid for cancellation
        if (appointment.status !== AppointmentStatus.SCHEDULED && 
            appointment.status !== AppointmentStatus.CONFIRMED && 
            appointment.status !== AppointmentStatus.PENDING) {
          this.showErrorMessage('This appointment cannot be cancelled due to its current status.');
          setTimeout(() => {
            this.router.navigate(['/patient/appointments']);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.isLoading = false;
        this.showErrorMessage('Failed to load appointment details.');
      }
    });
  }

  confirmCancellation(): void {
    if (this.cancelForm.invalid) return;

    this.isSubmitting = true;
    const reason = this.cancelForm.get('cancellationReason')?.value;

    this.appointmentService.cancelPatientAppointment(this.appointmentId, reason).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessMessage('Appointment cancelled successfully');
        this.router.navigate(['/patient/appointments']);
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.isSubmitting = false;
        this.showErrorMessage('Failed to cancel appointment.');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return '#1976d2'; // Blue
      case AppointmentStatus.CONFIRMED:
        return '#388e3c'; // Green
      case AppointmentStatus.COMPLETED:
        return '#7cb342'; // Light Green
      case AppointmentStatus.CANCELLED:
        return '#d32f2f'; // Red
      case AppointmentStatus.RESCHEDULED:
        return '#ff9800'; // Orange
      case AppointmentStatus.PENDING:
        return '#9c27b0'; // Purple
      default:
        return '#757575'; // Grey
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