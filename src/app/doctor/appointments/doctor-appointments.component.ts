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
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { DoctorAppointment } from '../../models/appointment.model';

@Component({
  selector: 'app-doctor-appointments',
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
    MatDividerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p class="text-gray-600 mt-2">Manage your scheduled appointments with patients</p>
        
        <!-- Navigation Buttons -->
        <div class="flex space-x-4 mt-4">
          <button mat-raised-button color="primary" routerLink="/doctor/appointments/upcoming">
            <mat-icon>upcoming</mat-icon>
            Upcoming Appointments
          </button>
          <button mat-outlined-button routerLink="/doctor/appointments/past">
            <mat-icon>history</mat-icon>
            Past Appointments
          </button>
          <button mat-outlined-button routerLink="/doctor/appointments/schedule">
            <mat-icon>schedule</mat-icon>
            Manage Schedule
          </button>
        </div>
        
        <!-- Filter Controls -->
        <mat-card class="p-4 mt-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(value)]="selectedStatus" (selectionChange)="applyFilters()">
                <mat-option value="">All Statuses</mat-option>
                <mat-option value="PENDING">Pending</mat-option>
                <mat-option value="BOOKED">Booked</mat-option>
                <mat-option value="CONFIRMED">Confirmed</mat-option>
                <mat-option value="COMPLETED">Completed</mat-option>
                <mat-option value="CANCELLED">Cancelled</mat-option>
                <mat-option value="RESCHEDULED">Rescheduled</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Search Patient</mat-label>
              <input matInput [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Patient name or email">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>From Date</mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>To Date</mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>
          </div>
          
          <div class="flex justify-between items-center mt-4">
            <div class="text-sm text-gray-600">
              Showing {{ filteredAppointments.length }} of {{ appointments.length }} appointments
            </div>
            <button mat-outlined-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card>
      </div>

      @if (isLoading) {
        <div class="flex justify-center items-center h-64">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else {
        @if (filteredAppointments.length === 0) {
          <mat-card class="p-6">
            <div class="text-center py-12">
              <mat-icon class="text-6xl text-gray-400 mb-4">event_busy</mat-icon>
              <h2 class="text-xl font-semibold text-gray-700 mb-2">No Appointments Found</h2>
              <p class="text-gray-500 mb-6">You don't have any appointments scheduled yet.</p>
              <button mat-raised-button color="primary" routerLink="/doctor/dashboard">
                <mat-icon>arrow_back</mat-icon>
                Back to Dashboard
              </button>
            </div>
          </mat-card>
        } @else {
          <div class="space-y-4">
            @for (appointment of filteredAppointments; track appointment.appointmentId) {
              <mat-card class="hover:shadow-lg transition-shadow">
                <mat-card-content class="p-6">
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
                          <p class="text-sm text-gray-600">{{ appointment.appointmentDate }} at {{ appointment.appointmentTime }}</p>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-700">Reason</p>
                          <p class="text-sm text-gray-600">{{ appointment.reason }}</p>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-700">Patient Condition</p>
                          <p class="text-sm text-gray-600">{{ appointment.patientIllnessDetails }}</p>
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
                                  <span class="text-sm font-medium text-gray-700">{{ history.visitDate }}</span>
                                  <span class="text-xs text-gray-500">ID: {{ history.id }}</span>
                                </div>
                                <p class="text-sm text-gray-600 mb-1"><strong>Symptoms:</strong> {{ history.symptoms }}</p>
                                <p class="text-sm text-gray-600 mb-1"><strong>Diagnosis:</strong> {{ history.diagnosis }}</p>
                                <p class="text-sm text-gray-600"><strong>Treatment:</strong> {{ history.treatment }}</p>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    
                    <div class="ml-4">
                      <button mat-icon-button [matMenuTriggerFor]="appointmentMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #appointmentMenu="matMenu">
                        <button mat-menu-item [routerLink]="['/doctor/appointments', appointment.appointmentId]">
                          <mat-icon>visibility</mat-icon>
                          <span>View Details</span>
                        </button>
                        @if (appointment.status === 'BOOKED' || appointment.status === 'PENDING' || appointment.status === 'SCHEDULED') {
                           <button mat-menu-item (click)="confirmAppointment(appointment)">
                             <mat-icon>check</mat-icon>
                             <span>Confirm</span>
                           </button>
                         }
                         @if (appointment.status === 'CONFIRMED' || appointment.status === 'BOOKED' || appointment.status === 'SCHEDULED') {
                           <button mat-menu-item (click)="completeAppointment(appointment)">
                             <mat-icon>check_circle</mat-icon>
                             <span>Mark Complete</span>
                           </button>
                         }
                        @if (appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED') {
                          <button mat-menu-item (click)="cancelAppointment(appointment)">
                            <mat-icon>cancel</mat-icon>
                            <span>Cancel</span>
                          </button>
                        }
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="updateAppointmentStatus(appointment, 'RESCHEDULED')">
                          <mat-icon>schedule</mat-icon>
                          <span>Reschedule</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      }
      
      <div class="mt-6 flex justify-center">
        <button mat-outlined-button routerLink="/doctor/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
  `]
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: DoctorAppointment[] = [];
  filteredAppointments: DoctorAppointment[] = [];
  isLoading = true;
  
  // Filter properties
  selectedStatus: string = '';
  searchTerm: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getMyPatientsAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.filteredAppointments = appointments;
        this.isLoading = false;
        console.log('Loaded appointments:', appointments);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading appointments. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'SCHEDULED':
        return 'warn';
      case 'BOOKED':
        return 'primary';
      case 'CONFIRMED':
        return 'accent';
      case 'COMPLETED':
        return 'primary';
      case 'CANCELLED':
        return 'warn';
      case 'RESCHEDULED':
        return 'accent';
      default:
        return 'primary';
    }
  }

  confirmAppointment(appointment: DoctorAppointment): void {
    this.doctorService.confirmAppointment(appointment.appointmentId).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment confirmed:', updatedAppointment);
        this.snackBar.open('Appointment confirmed successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.snackBar.open('Error confirming appointment. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  completeAppointment(appointment: DoctorAppointment): void {
    this.doctorService.completeAppointment(appointment.appointmentId).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment completed:', updatedAppointment);
        this.snackBar.open('Appointment marked as completed', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
        this.snackBar.open('Error completing appointment. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  cancelAppointment(appointment: DoctorAppointment): void {
    this.doctorService.cancelAppointmentByDoctor(appointment.appointmentId).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment cancelled:', updatedAppointment);
        this.snackBar.open('Appointment cancelled successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.snackBar.open('Error cancelling appointment. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateAppointmentStatus(appointment: DoctorAppointment, newStatus: string): void {
    this.doctorService.updateAppointmentStatus(appointment.appointmentId, newStatus).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment status updated:', updatedAppointment);
        this.snackBar.open(`Appointment status updated to ${newStatus}`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.snackBar.open('Error updating appointment status. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
     });
   }

   applyFilters(): void {
     let filtered = [...this.appointments];

     // Filter by status
     if (this.selectedStatus) {
       filtered = filtered.filter(appointment => 
         appointment.status === this.selectedStatus
       );
     }

     // Filter by search term (patient name or email)
     if (this.searchTerm) {
       const searchLower = this.searchTerm.toLowerCase();
       filtered = filtered.filter(appointment => 
         appointment.patientName.toLowerCase().includes(searchLower) ||
         appointment.patientEmail.toLowerCase().includes(searchLower)
       );
     }

     // Filter by date range
     if (this.fromDate) {
       filtered = filtered.filter(appointment => {
         const appointmentDate = new Date(appointment.appointmentDate);
         return appointmentDate >= this.fromDate!;
       });
     }

     if (this.toDate) {
       filtered = filtered.filter(appointment => {
         const appointmentDate = new Date(appointment.appointmentDate);
         return appointmentDate <= this.toDate!;
       });
     }

     this.filteredAppointments = filtered;
   }

   clearFilters(): void {
     this.selectedStatus = '';
     this.searchTerm = '';
     this.fromDate = null;
     this.toDate = null;
     this.filteredAppointments = [...this.appointments];
   }

}