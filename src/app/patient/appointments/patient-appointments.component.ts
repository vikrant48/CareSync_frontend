import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <div class="appointments-container">
      <div class="appointments-header">
        <h1>My Appointments</h1>
        <p>Manage and view your scheduled appointments</p>
        <button mat-raised-button color="primary" routerLink="/patient/appointments/book">
          <mat-icon>add</mat-icon>
          Book New Appointment
        </button>
      </div>

      <div class="appointments-content">
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading appointments...</p>
        </div>

        <div *ngIf="!isLoading" class="appointments-tabs">
          <mat-tab-group (selectedTabChange)="onTabChange($event)">
            <mat-tab label="Upcoming">
              <div class="tab-content">
                <div *ngIf="upcomingAppointments.length === 0" class="empty-state">
                  <mat-icon>event_busy</mat-icon>
                  <h3>No Upcoming Appointments</h3>
                  <p>You don't have any upcoming appointments scheduled.</p>
                  <button mat-raised-button color="primary" routerLink="/patient/appointments/book">
                    Book Your First Appointment
                  </button>
                </div>

                <div *ngIf="upcomingAppointments.length > 0" class="appointments-grid">
                  <mat-card *ngFor="let appointment of upcomingAppointments" class="appointment-card">
                    <mat-card-header>
                      <mat-card-title>
                        Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}
                      </mat-card-title>
                      <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="appointment-details">
                        <div class="detail-row">
                          <mat-icon>schedule</mat-icon>
                          <span>{{ appointment.appointmentDateTime | date:'MMM dd, yyyy - h:mm a' }}</span>
                        </div>
                        <div class="detail-row">
                          <mat-icon>description</mat-icon>
                          <span>{{ appointment.reason || 'General Consultation' }}</span>
                        </div>
                      </div>
                      <div class="appointment-status">
                        <mat-chip [color]="getStatusColor(appointment.status)" selected>
                          {{ appointment.status }}
                        </mat-chip>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button [matMenuTriggerFor]="menu">
                        <mat-icon>more_vert</mat-icon>
                        Actions
                      </button>
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="viewAppointment(appointment)">
                          <mat-icon>visibility</mat-icon>
                          View Details
                        </button>
                        <button mat-menu-item (click)="rescheduleAppointment(appointment)" 
                                *ngIf="appointment.status === AppointmentStatus.SCHEDULED">
                          <mat-icon>schedule</mat-icon>
                          Reschedule
                        </button>
                        <button mat-menu-item (click)="cancelAppointment(appointment)"
                                *ngIf="appointment.status === AppointmentStatus.SCHEDULED">
                          <mat-icon>cancel</mat-icon>
                          Cancel
                        </button>
                      </mat-menu>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Past">
              <div class="tab-content">
                <div *ngIf="pastAppointments.length === 0" class="empty-state">
                  <mat-icon>history</mat-icon>
                  <h3>No Past Appointments</h3>
                  <p>You haven't had any appointments yet.</p>
                </div>

                <div *ngIf="pastAppointments.length > 0" class="appointments-grid">
                  <mat-card *ngFor="let appointment of pastAppointments" class="appointment-card">
                    <mat-card-header>
                      <mat-card-title>
                        Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}
                      </mat-card-title>
                      <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="appointment-details">
                        <div class="detail-row">
                          <mat-icon>schedule</mat-icon>
                          <span>{{ appointment.appointmentDateTime | date:'MMM dd, yyyy - h:mm a' }}</span>
                        </div>
                        <div class="detail-row">
                          <mat-icon>description</mat-icon>
                          <span>{{ appointment.reason || 'General Consultation' }}</span>
                        </div>
                      </div>
                      <div class="appointment-status">
                        <mat-chip [color]="getStatusColor(appointment.status)" selected>
                          {{ appointment.status }}
                        </mat-chip>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button [matMenuTriggerFor]="menu">
                        <mat-icon>more_vert</mat-icon>
                        Actions
                      </button>
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="viewAppointment(appointment)">
                          <mat-icon>visibility</mat-icon>
                          View Details
                        </button>
                        <button mat-menu-item (click)="bookFollowUp(appointment)"
                                *ngIf="appointment.status === AppointmentStatus.COMPLETED">
                          <mat-icon>add</mat-icon>
                          Book Follow-up
                        </button>
                      </mat-menu>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .appointments-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .appointments-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px 0;
    }

    .appointments-header p {
      font-size: 16px;
      color: #666;
      margin: 0 0 24px 0;
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

    .tab-content {
      padding: 24px 0;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 16px;
      margin: 0 0 24px 0;
    }

    .appointments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .appointment-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .appointment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .appointment-card mat-card-header {
      margin-bottom: 16px;
    }

    .appointment-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .appointment-card mat-card-subtitle {
      color: #666;
      font-size: 14px;
    }

    .appointment-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .detail-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .appointment-status {
      margin-bottom: 16px;
    }

    .appointment-status mat-chip {
      font-weight: 500;
    }

    .appointment-card mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 16px 16px;
    }

    @media (max-width: 768px) {
      .appointments-container {
        padding: 16px;
      }

      .appointments-header h1 {
        font-size: 24px;
      }

      .appointments-grid {
        grid-template-columns: 1fr;
      }

      .appointment-card {
        margin-bottom: 16px;
      }
    }
  `]
})
export class PatientAppointmentsComponent implements OnInit {
  upcomingAppointments: Appointment[] = [];
  pastAppointments: Appointment[] = [];
  isLoading = false;
  AppointmentStatus = AppointmentStatus;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    
    // Load upcoming appointments
    this.appointmentService.getPatientUpcomingAppointments().subscribe({
      next: (appointments) => {
        this.upcomingAppointments = appointments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming appointments:', error);
        this.isLoading = false;
        this.showErrorMessage('Failed to load upcoming appointments.');
      }
    });

    // Load all appointments to get past ones
    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments) => {
        this.pastAppointments = appointments.filter(apt => 
          apt.status === AppointmentStatus.COMPLETED || 
          apt.status === AppointmentStatus.CANCELLED
        );
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
      }
    });
  }

  onTabChange(event: any): void {
    console.log('Tab changed to:', event.index);
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

  viewAppointment(appointment: Appointment): void {
    console.log('View appointment:', appointment);
  }

  rescheduleAppointment(appointment: Appointment): void {
    console.log('Reschedule appointment:', appointment);
  }

  cancelAppointment(appointment: Appointment): void {
    console.log('Cancel appointment:', appointment);
  }

  bookFollowUp(appointment: Appointment): void {
    console.log('Book follow-up with:', appointment.doctor);
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
