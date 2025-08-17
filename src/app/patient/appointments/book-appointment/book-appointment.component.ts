import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorService } from '../../../services/doctor.service';
import { AppointmentCreate, AvailableSlot as ApiAvailableSlot } from '../../../models/appointment.model';
import { Doctor } from '../../../models/user.model';

// Local interface for time slots that matches the component usage
interface AvailableSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatChipsModule
  ],
  template: `
    <div class="book-appointment-container">
      <div class="book-appointment-header">
        <h1>Book an Appointment</h1>
        <p>Schedule a consultation with one of our healthcare professionals</p>
      </div>

      <div class="book-appointment-content">
        <mat-card class="booking-card">
          <mat-stepper #stepper [linear]="true" class="booking-stepper">
            <!-- Step 1: Select Doctor -->
            <mat-step [stepControl]="doctorForm" label="Select Doctor">
              <form [formGroup]="doctorForm">
                <div class="step-content">
                  <h3>Choose a Doctor</h3>
                  <p>Select a doctor based on your health needs</p>
                  
                  <div *ngIf="isLoadingDoctors" class="loading-container">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Loading doctors...</p>
                  </div>

                  <div *ngIf="!isLoadingDoctors && doctors.length === 0" class="empty-state">
                    <mat-icon>medical_services</mat-icon>
                    <p>No doctors available at the moment.</p>
                  </div>

                  <div *ngIf="!isLoadingDoctors && doctors.length > 0" class="doctors-grid">
                    <mat-card 
                      *ngFor="let doctor of doctors" 
                      class="doctor-card"
                      [class.selected]="selectedDoctor?.id === doctor.id"
                      (click)="selectDoctor(doctor)"
                    >
                      <mat-card-content>
                        <div class="doctor-info">
                          <div class="doctor-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div class="doctor-details">
                            <h4>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</h4>
                            <p class="specialization">{{ doctor.specialization }}</p>
                            <p class="experience">{{ doctor.yearsOfExperience }} years experience</p>
                            <div class="rating">
                              <mat-icon>star</mat-icon>
                              <span>{{ doctor.rating }}/5</span>
                            </div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperNext [disabled]="!selectedDoctor">
                    Next
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Select Date and Time -->
            <mat-step [stepControl]="datetimeForm" label="Select Date & Time">
              <form [formGroup]="datetimeForm">
                <div class="step-content">
                  <h3>Choose Date and Time</h3>
                  <p>Select a convenient time for your appointment</p>

                  <div class="datetime-selection">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Select Date</mat-label>
                      <input matInput [matDatepicker]="picker" formControlName="appointmentDate" 
                             (dateChange)="onDateChange($event)">
                      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                      <mat-datepicker #picker></mat-datepicker>
                      <mat-error *ngIf="datetimeForm.get('appointmentDate')?.hasError('required')">
                        Date is required
                      </mat-error>
                    </mat-form-field>

                    <div *ngIf="availableSlots.length > 0" class="time-slots">
                      <h4>Available Time Slots</h4>
                      <div class="slots-grid">
                        <button 
                          *ngFor="let slot of availableSlots" 
                          mat-stroked-button
                          class="time-slot"
                          [class.selected]="selectedSlot?.startTime === slot.startTime"
                          (click)="selectTimeSlot(slot)"
                        >
                          {{ slot.startTime }} - {{ slot.endTime }}
                        </button>
                      </div>
                    </div>

                    <div *ngIf="selectedDate && availableSlots.length === 0" class="no-slots">
                      <mat-icon>schedule</mat-icon>
                      <p>No available slots for the selected date.</p>
                      <p>Please choose a different date.</p>
                    </div>
                  </div>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-button matStepperNext [disabled]="!selectedSlot">
                    Next
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Appointment Details -->
            <mat-step [stepControl]="detailsForm" label="Appointment Details">
              <form [formGroup]="detailsForm">
                <div class="step-content">
                  <h3>Appointment Details</h3>
                  <p>Provide information about your visit</p>

                  <div class="details-form">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Reason for Visit</mat-label>
                      <textarea matInput formControlName="reason" rows="3" 
                                placeholder="Describe your symptoms or reason for the appointment"></textarea>
                      <mat-error *ngIf="detailsForm.get('reason')?.hasError('required')">
                        Reason is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Additional Notes (Optional)</mat-label>
                      <textarea matInput formControlName="notes" rows="2" 
                                placeholder="Any additional information you'd like to share"></textarea>
                    </mat-form-field>
                  </div>

                  <!-- Appointment Summary -->
                  <div class="appointment-summary">
                    <h4>Appointment Summary</h4>
                    <div class="summary-item">
                      <span class="label">Doctor:</span>
                      <span class="value">Dr. {{ selectedDoctor?.firstName }} {{ selectedDoctor?.lastName }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Specialization:</span>
                      <span class="value">{{ selectedDoctor?.specialization }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Date:</span>
                      <span class="value">{{ selectedDate | date:'fullDate' }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Time:</span>
                      <span class="value">{{ selectedSlot?.startTime }} - {{ selectedSlot?.endTime }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="label">Reason:</span>
                      <span class="value">{{ detailsForm.get('reason')?.value || 'Not specified' }}</span>
                    </div>
                  </div>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" (click)="bookAppointment()" 
                          [disabled]="detailsForm.invalid || isBooking">
                    <mat-spinner diameter="20" *ngIf="isBooking"></mat-spinner>
                    <span *ngIf="!isBooking">Book Appointment</span>
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .book-appointment-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .book-appointment-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .book-appointment-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px 0;
    }

    .book-appointment-header p {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .booking-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .booking-stepper {
      padding: 24px;
    }

    .step-content {
      padding: 24px 0;
    }

    .step-content h3 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .step-content p {
      color: #666;
      margin: 0 0 24px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 16px;
    }

    .loading-container p {
      color: #666;
      margin: 0;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .doctor-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .doctor-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .doctor-card.selected {
      border-color: #1976d2;
      background-color: #f3f8ff;
    }

    .doctor-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .doctor-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .doctor-avatar mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .doctor-details h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .doctor-details p {
      margin: 2px 0;
      font-size: 14px;
      color: #666;
    }

    .specialization {
      color: #1976d2 !important;
      font-weight: 500;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
    }

    .rating mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ffc107;
    }

    .datetime-selection {
      max-width: 500px;
    }

    .full-width {
      width: 100%;
    }

    .time-slots {
      margin-top: 24px;
    }

    .time-slots h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .time-slot {
      height: 48px;
      font-size: 14px;
    }

    .time-slot.selected {
      background-color: #1976d2;
      color: white;
    }

    .no-slots {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-slots mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .details-form {
      max-width: 600px;
      margin-bottom: 32px;
    }

    .appointment-summary {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
    }

    .appointment-summary h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item .label {
      font-weight: 600;
      color: #333;
    }

    .summary-item .value {
      color: #666;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .book-appointment-container {
        padding: 16px;
      }

      .book-appointment-header h1 {
        font-size: 24px;
      }

      .booking-stepper {
        padding: 16px;
      }

      .doctors-grid {
        grid-template-columns: 1fr;
      }

      .slots-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .step-actions {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class BookAppointmentComponent implements OnInit {
  doctorForm: FormGroup;
  datetimeForm: FormGroup;
  detailsForm: FormGroup;
  
  doctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;
  selectedDate: Date | null = null;
  selectedSlot: AvailableSlot | null = null;
  availableSlots: AvailableSlot[] = [];
  
  isLoadingDoctors = false;
  isBooking = false;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.doctorForm = this.fb.group({});
    this.datetimeForm = this.fb.group({
      appointmentDate: ['', [Validators.required]]
    });
    this.detailsForm = this.fb.group({
      reason: ['', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    
    // Check if doctor is pre-selected from query params
    const doctorId = this.route.snapshot.queryParams['doctorId'];
    if (doctorId) {
      // Pre-select the doctor
    }
  }

  loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.isLoadingDoctors = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.isLoadingDoctors = false;
        this.showErrorMessage('Failed to load doctors.');
      }
    });
  }

  selectDoctor(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.availableSlots = []; // Clear previous slots
    this.selectedSlot = null;
  }

  onDateChange(event: any): void {
    this.selectedDate = event.value;
    this.selectedSlot = null;
    
    if (this.selectedDate && this.selectedDoctor) {
      this.loadAvailableSlots();
    }
  }

  loadAvailableSlots(): void {
    if (!this.selectedDoctor || !this.selectedDate) return;
    const dateString = this.selectedDate.toISOString().split('T')[0];
    this.appointmentService.getAvailableSlots(this.selectedDoctor.id, dateString).subscribe({
      next: (response: ApiAvailableSlot) => {
        // Transform the API response to match our local interface
        if (response && response.timeSlots) {
          this.availableSlots = response.timeSlots.map(timeSlot => {
            // Parse the time slot string (assuming format like "09:00-10:00")
            const [startTime, endTime] = timeSlot.split('-');
            return {
              startTime: startTime.trim(),
              endTime: endTime.trim(),
              isAvailable: true
            };
          });
        } else {
          this.availableSlots = [];
        }
      },
      error: (error) => {
        console.error('Error loading available slots:', error);
        this.showErrorMessage('Failed to load available time slots.');
      }
    });
  }

  selectTimeSlot(slot: AvailableSlot): void {
    this.selectedSlot = slot;
  }

  bookAppointment(): void {
    if (!this.selectedDoctor || !this.selectedSlot || this.detailsForm.invalid) {
      return;
    }

    this.isBooking = true;
    
    const appointmentData: AppointmentCreate = {
      doctorId: this.selectedDoctor.id,
      appointmentDateTime: this.selectedSlot.startTime,
      reason: this.detailsForm.get('reason')?.value,
      notes: this.detailsForm.get('notes')?.value || ''
    };

    this.appointmentService.bookAppointment(appointmentData).subscribe({
      next: (appointment) => {
        this.isBooking = false;
        this.showSuccessMessage('Appointment booked successfully!');
        this.router.navigate(['/patient/appointments']);
      },
      error: (error) => {
        this.isBooking = false;
        this.showErrorMessage(error.error?.message || 'Failed to book appointment.');
      }
    });
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
}
