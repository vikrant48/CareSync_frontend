import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorAppointment } from '../../../models/appointment.model';

@Component({
  selector: 'app-upcoming-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Upcoming Appointments</h1>
        <p class="text-gray-600 mt-2">View your upcoming appointments with patients</p>
      </div>

      @if (isLoading) {
        <div class="flex justify-center items-center h-64">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else {
        @if (upcomingAppointments.length === 0) {
          <mat-card class="p-6">
            <div class="text-center py-12">
              <mat-icon class="text-6xl text-gray-400 mb-4">event_busy</mat-icon>
              <h2 class="text-xl font-semibold text-gray-700 mb-2">No Upcoming Appointments</h2>
              <p class="text-gray-500 mb-6">You don't have any upcoming appointments scheduled.</p>
              <button mat-raised-button color="primary" routerLink="/doctor/dashboard">
                <mat-icon>arrow_back</mat-icon>
                Back to Dashboard
              </button>
            </div>
          </mat-card>
        } @else {
          <div class="space-y-4">
            @for (appointment of upcomingAppointments; track appointment.appointmentId) {
              <mat-card class="p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-4">
                      <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <mat-icon class="text-blue-600">person</mat-icon>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">{{ appointment.patientName }}</h3>
                        <p class="text-sm text-gray-600">{{ appointment.patientEmail }}</p>
                        <p class="text-sm text-gray-600">{{ appointment.patientContactInfo }}</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p class="text-sm font-medium text-gray-700">Appointment Date & Time</p>
                        <p class="text-sm text-gray-600">{{ appointment.appointmentDate | date:'MMM d, y' }} at {{ appointment.appointmentTime }}</p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-700">Reason for Visit</p>
                        <p class="text-sm text-gray-600">{{ appointment.reason || 'General Consultation' }}</p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-700">Patient Condition</p>
                        <p class="text-sm text-gray-600">{{ appointment.patientIllnessDetails || 'Not specified' }}</p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-700">Status</p>
                        <mat-chip [color]="getStatusColor(appointment.status)" selected>
                          {{ appointment.status }}
                        </mat-chip>
                      </div>
                    </div>

                    @if (appointment.medicalHistory && appointment.medicalHistory.length > 0) {
                      <div class="mt-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">Medical History</p>
                        <div class="space-y-2">
                          @for (history of appointment.medicalHistory; track history.id) {
                            <div class="bg-gray-50 p-3 rounded-lg">
                              <div class="flex justify-between items-start mb-1">
                                <span class="text-sm font-medium text-gray-700">{{ history.visitDate | date:'MMM d, y' }}</span>
                                <span class="text-xs text-gray-500">ID: {{ history.id }}</span>
                              </div>
                              <p class="text-sm text-gray-600 mb-1">{{ history.diagnosis }}</p>
                              <p class="text-xs text-gray-500">Treatment: {{ history.treatment }}</p>
                              @if (history.symptoms) {
                                <p class="text-xs text-gray-500">Symptoms: {{ history.symptoms }}</p>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="flex flex-col space-y-2 ml-4">
                    <button mat-raised-button color="primary" [routerLink]="['/doctor/appointments', appointment.appointmentId]">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    <button mat-outlined-button (click)="startAppointment(appointment)">
                      <mat-icon>play_arrow</mat-icon>
                      Start
                    </button>
                    <button mat-outlined-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                      More
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="rescheduleAppointment(appointment)">
                        <mat-icon>schedule</mat-icon>
                        Reschedule
                      </button>
                      <button mat-menu-item (click)="cancelAppointment(appointment)">
                        <mat-icon>cancel</mat-icon>
                        Cancel
                      </button>
                    </mat-menu>
                  </div>
                </div>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
    
    .appointment-card {
      transition: all 0.3s ease;
    }
    
    .appointment-card:hover {
      transform: translateY(-2px);
    }
    
    .status-chip {
      font-size: 0.75rem;
      padding: 4px 8px;
    }
  `]
})
export class UpcomingAppointmentsComponent implements OnInit {
  upcomingAppointments: DoctorAppointment[] = [];
  isLoading = true;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUpcomingAppointments();
  }

  loadUpcomingAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getMyPatientsUpcomingAppointments().subscribe({
      next: (appointments) => {
        this.upcomingAppointments = appointments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming appointments:', error);
        this.showErrorMessage('Failed to load upcoming appointments. Please try again.');
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'BOOKED':
      case 'CONFIRMED':
        return 'primary';
      case 'COMPLETED':
        return 'accent';
      case 'CANCELLED':
        return 'warn';
      case 'RESCHEDULED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'accent';
      default:
        return 'primary';
    }
  }

  startAppointment(appointment: DoctorAppointment): void {
    // TODO: Implement start appointment logic
    this.showSuccessMessage(`Started appointment with ${appointment.patientName}`);
  }

  rescheduleAppointment(appointment: DoctorAppointment): void {
    // TODO: Implement reschedule logic
    this.showInfoMessage(`Reschedule functionality for ${appointment.patientName} coming soon`);
  }

  cancelAppointment(appointment: DoctorAppointment): void {
    // TODO: Implement cancel logic
    this.showInfoMessage(`Cancel functionality for ${appointment.patientName} coming soon`);
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

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }
}