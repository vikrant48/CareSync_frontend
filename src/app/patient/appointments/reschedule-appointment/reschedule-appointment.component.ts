import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment, AppointmentStatus, AppointmentUpdate, AvailableSlot } from '../../../models/appointment.model';

@Component({
  selector: 'app-reschedule-appointment',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="reschedule-container">
      <div class="reschedule-header">
        <button mat-icon-button color="primary" routerLink="/patient/appointments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Reschedule Appointment</h1>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading appointment details...</p>
      </div>

      <div *ngIf="!isLoading && appointment" class="reschedule-content">
        <mat-card class="reschedule-card">
          <mat-card-header>
            <mat-card-title>Appointment with Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="current-details">
              <h2>Current Appointment</h2>
              <div class="detail-row">
                <mat-icon>event</mat-icon>
                <span>{{ appointment.appointmentDateTime | date:'EEEE, MMMM d, y' }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>schedule</mat-icon>
                <span>{{ appointment.appointmentDateTime | date:'h:mm a' }}</span>
              </div>
            </div>

            <div class="reschedule-form">
              <h2>Select New Date & Time</h2>
              <form [formGroup]="rescheduleForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>New Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date" [min]="minDate" (dateChange)="onDateChange($event)">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="rescheduleForm.get('date')?.hasError('required')">Date is required</mat-error>
                </mat-form-field>

                <div class="time-slots-container" *ngIf="availableSlots.length > 0">
                  <h3>Available Time Slots</h3>
                  <div class="time-slots">
                    <button 
                      *ngFor="let slot of availableSlots" 
                      type="button"
                      mat-stroked-button 
                      [class.selected]="selectedTimeSlot === slot"
                      (click)="selectTimeSlot(slot)">
                      {{ slot }}
                    </button>
                  </div>
                  <mat-error *ngIf="rescheduleForm.get('timeSlot')?.hasError('required') && rescheduleForm.get('timeSlot')?.touched">
                    Please select a time slot
                  </mat-error>
                </div>

                <div *ngIf="selectedDate && availableSlots.length === 0 && !loadingSlots" class="no-slots">
                  <mat-icon>event_busy</mat-icon>
                  <p>No available time slots for the selected date. Please choose another date.</p>
                </div>

                <div *ngIf="loadingSlots" class="loading-slots">
                  <mat-spinner diameter="30"></mat-spinner>
                  <p>Loading available time slots...</p>
                </div>
              </form>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button routerLink="/patient/appointments">Cancel</button>
            <button 
              mat-raised-button 
              color="primary" 
              [disabled]="rescheduleForm.invalid || isSubmitting"
              (click)="submitReschedule()">
              <mat-icon *ngIf="isSubmitting">
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              </mat-icon>
              <span *ngIf="!isSubmitting">Reschedule Appointment</span>
              <span *ngIf="isSubmitting">Rescheduling...</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && !appointment" class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h2>Appointment Not Found</h2>
        <p>The appointment you're trying to reschedule doesn't exist or you don't have permission to modify it.</p>
        <button mat-raised-button color="primary" routerLink="/patient/appointments">
          Back to Appointments
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reschedule-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .reschedule-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }

    .reschedule-header h1 {
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

    .reschedule-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .current-details {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .current-details h2 {
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

    .reschedule-form {
      margin-top: 24px;
    }

    .reschedule-form h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .time-slots-container {
      margin-top: 24px;
    }

    .time-slots-container h3 {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin: 0 0 12px 0;
    }

    .time-slots {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .time-slots button {
      padding: 8px;
    }

    .time-slots button.selected {
      background-color: #1976d2;
      color: white;
    }

    .no-slots {
      text-align: center;
      padding: 24px;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-top: 16px;
    }

    .no-slots mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #999;
      margin-bottom: 12px;
    }

    .no-slots p {
      color: #666;
      margin: 0;
    }

    .loading-slots {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 12px;
    }

    .loading-slots p {
      color: #666;
      margin: 0;
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
      .reschedule-container {
        padding: 16px;
      }

      .reschedule-header h1 {
        font-size: 24px;
      }

      .time-slots {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      }
    }
  `]
})
export class RescheduleAppointmentComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;
  isSubmitting = false;
  loadingSlots = false;
  appointmentId!: number;
  rescheduleForm: FormGroup;
  minDate = new Date();
  availableSlots: string[] = [];
  selectedTimeSlot: string = '';
  selectedDate: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {
    this.rescheduleForm = this.fb.group({
      date: ['', Validators.required],
      timeSlot: ['', Validators.required]
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
        
        // Check if appointment status is valid for rescheduling
        if (appointment.status !== AppointmentStatus.SCHEDULED && 
            appointment.status !== AppointmentStatus.CONFIRMED && 
            appointment.status !== AppointmentStatus.PENDING) {
          this.showErrorMessage('This appointment cannot be rescheduled due to its current status.');
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

  onDateChange(event: any): void {
    this.selectedDate = event.value;
    this.loadAvailableSlots();
  }

  loadAvailableSlots(): void {
    if (!this.selectedDate || !this.appointment?.doctor?.id) return;

    this.loadingSlots = true;
    this.availableSlots = [];
    this.rescheduleForm.get('timeSlot')?.setValue('');
    
    const formattedDate = this.formatDate(this.selectedDate);
    
    this.appointmentService.getAvailableSlots(this.appointment.doctor.id, formattedDate).subscribe({
      next: (response) => {
        this.availableSlots = response.timeSlots || [];
        this.loadingSlots = false;
      },
      error: (error) => {
        console.error('Error loading available slots:', error);
        this.loadingSlots = false;
        this.showErrorMessage('Failed to load available time slots.');
      }
    });
  }

  selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
    this.rescheduleForm.get('timeSlot')?.setValue(slot);
  }

  submitReschedule(): void {
    if (this.rescheduleForm.invalid) return;

    const formValues = this.rescheduleForm.value;
    const date = this.formatDate(formValues.date);
    const timeSlot = formValues.timeSlot;
    
    // Combine date and time for the new appointment datetime
    const newDateTime = this.combineDateTime(date, timeSlot);

    this.isSubmitting = true;
    this.appointmentService.reschedulePatientAppointment(this.appointmentId, newDateTime).subscribe({
      next: (updatedAppointment) => {
        this.isSubmitting = false;
        this.showSuccessMessage('Appointment rescheduled successfully');
        this.router.navigate(['/patient/appointments']);
      },
      error: (error) => {
        console.error('Error rescheduling appointment:', error);
        this.isSubmitting = false;
        this.showErrorMessage('Failed to reschedule appointment.');
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private combineDateTime(date: string, timeSlot: string): string {
    // Extract hours and minutes from the time slot (format: "HH:MM AM/PM")
    const timeParts = timeSlot.match(/([0-9]{1,2}):([0-9]{2})\s*(AM|PM)/i);
    if (!timeParts) return `${date}T00:00:00`;
    
    let hours = parseInt(timeParts[1]);
    const minutes = timeParts[2];
    const period = timeParts[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${date}T${hours.toString().padStart(2, '0')}:${minutes}:00`;
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