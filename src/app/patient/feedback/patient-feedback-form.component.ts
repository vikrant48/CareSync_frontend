import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { FeedbackService } from '../../services/feedback.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { FeedbackCreate } from '../../models/feedback.model';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-patient-feedback-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,

  ],
  template: `
    <div class="feedback-form-container">
      <div class="feedback-header">
        <h1>Submit Feedback</h1>
        <p>Share your experience with your recent appointment</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading appointment details...</p>
      </div>

      <div *ngIf="!isLoading && appointment" class="feedback-content">
        <!-- Appointment Details -->
        <mat-card class="appointment-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>event</mat-icon>
              Appointment Details
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="appointment-info">
              <div class="info-item">
                <span class="label">Doctor:</span>
                <span class="value">Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Date & Time:</span>
                <span class="value">{{ appointment.appointmentDateTime | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Reason:</span>
                <span class="value">{{ appointment.reason }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Feedback Form -->
        <mat-card class="feedback-form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>rate_review</mat-icon>
              Your Feedback
            </mat-card-title>
            <mat-card-subtitle>Help us improve our services</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
              <!-- Rating Section -->
              <div class="rating-section">
                <h3>Overall Rating</h3>
                <div class="rating-container">
                  <div class="star-rating">
                    <button 
                      type="button"
                      *ngFor="let star of [1,2,3,4,5]; let i = index"
                      class="star-button"
                      [class.active]="i < selectedRating"
                      (click)="setRating(i + 1)"
                    >
                      <mat-icon>{{ i < selectedRating ? 'star' : 'star_border' }}</mat-icon>
                    </button>
                  </div>
                  <span class="rating-text">{{ getRatingText(selectedRating) }}</span>
                </div>
              </div>

              <!-- Comment Section -->
              <div class="comment-section">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Your Comments</mat-label>
                  <textarea 
                    matInput 
                    formControlName="comment"
                    rows="6"
                    placeholder="Please share your experience with the appointment, doctor's care, and any suggestions for improvement..."
                  ></textarea>
                  <mat-hint>Optional: Share more details about your experience</mat-hint>
                </mat-form-field>
              </div>

              <!-- Specific Feedback Areas -->
              <div class="specific-feedback">
                <h3>Rate Specific Areas (Optional)</h3>
                <div class="feedback-areas">
                  <div class="feedback-area">
                    <label>Doctor's Communication</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      [value]="communicationRating"
                      (input)="onCommunicationRatingChange($event)"
                      class="rating-slider"
                    />
                    <span class="slider-value">{{ communicationRating }}/5</span>
                  </div>
                  
                  <div class="feedback-area">
                    <label>Wait Time</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      [value]="waitTimeRating"
                      (input)="onWaitTimeRatingChange($event)"
                      class="rating-slider"
                    />
                    <span class="slider-value">{{ waitTimeRating }}/5</span>
                  </div>
                  
                  <div class="feedback-area">
                    <label>Facility Cleanliness</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      [value]="cleanlinessRating"
                      (input)="onCleanlinessRatingChange($event)"
                      class="rating-slider"
                    />
                    <span class="slider-value">{{ cleanlinessRating }}/5</span>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button 
                  mat-button 
                  type="button" 
                  (click)="goBack()"
                >
                  Cancel
                </button>
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="feedbackForm.invalid || isSubmitting || selectedRating === 0"
                >
                  <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
                  {{ isSubmitting ? 'Submitting...' : 'Submit Feedback' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && !appointment" class="error-container">
        <mat-card>
          <mat-card-content>
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <h3>Appointment Not Found</h3>
              <p>The appointment you're trying to provide feedback for could not be found.</p>
              <button mat-raised-button color="primary" (click)="goBack()">Go Back</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .feedback-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .feedback-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .feedback-header h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .feedback-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #6b7280;
    }

    .appointment-card, .feedback-form-card {
      margin-bottom: 24px;
    }

    .appointment-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #374151;
    }

    .value {
      color: #6b7280;
    }

    .rating-section {
      margin-bottom: 32px;
    }

    .rating-section h3 {
      margin-bottom: 16px;
      font-size: 1.2rem;
      font-weight: 500;
      color: #1f2937;
    }

    .rating-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .star-rating {
      display: flex;
      gap: 8px;
    }

    .star-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .star-button:hover {
      background-color: #f3f4f6;
    }

    .star-button mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #d1d5db;
      transition: color 0.2s;
    }

    .star-button.active mat-icon {
      color: #fbbf24;
    }

    .rating-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #374151;
    }

    .comment-section {
      margin-bottom: 32px;
    }

    .full-width {
      width: 100%;
    }

    .specific-feedback {
      margin-bottom: 32px;
    }

    .specific-feedback h3 {
      margin-bottom: 20px;
      font-size: 1.2rem;
      font-weight: 500;
      color: #1f2937;
    }

    .feedback-areas {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .feedback-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .feedback-area label {
      min-width: 180px;
      font-weight: 500;
      color: #374151;
    }

    .rating-slider {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #e5e7eb;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }

    .rating-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .rating-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .slider-value {
      min-width: 40px;
      text-align: center;
      font-weight: 500;
      color: #6b7280;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .error-message {
      text-align: center;
      padding: 40px;
    }

    .error-message mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #ef4444;
      margin-bottom: 16px;
    }

    .error-message h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .error-message p {
      color: #6b7280;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .feedback-form-container {
        padding: 16px;
      }

      .feedback-area {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .feedback-area label {
        min-width: auto;
      }

      .form-actions {
        flex-direction: column;
        gap: 16px;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class PatientFeedbackFormComponent implements OnInit {
  feedbackForm: FormGroup;
  appointment: Appointment | null = null;
  isLoading = false;
  isSubmitting = false;
  selectedRating = 0;
  communicationRating = 3;
  waitTimeRating = 3;
  cleanlinessRating = 3;
  appointmentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.feedbackForm = this.fb.group({
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.appointmentId = params['appointmentId'] ? +params['appointmentId'] : null;
      if (this.appointmentId) {
        this.loadAppointmentDetails();
      } else {
        this.showErrorMessage('No appointment ID provided.');
      }
    });
  }

  loadAppointmentDetails(): void {
    if (!this.appointmentId) return;

    this.isLoading = true;
    this.appointmentService.getAppointment(this.appointmentId).subscribe({
      next: (appointment: Appointment) => {
        this.appointment = appointment;
        this.isLoading = false;
        
        // Check if feedback already exists for this appointment
        this.checkExistingFeedback();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showErrorMessage('Failed to load appointment details.');
        console.error('Error loading appointment:', error);
      }
    });
  }

  checkExistingFeedback(): void {
    if (!this.appointmentId) return;

    this.feedbackService.getFeedbackByAppointment(this.appointmentId).subscribe({
      next: (feedback) => {
        if (feedback) {
          this.showErrorMessage('Feedback has already been submitted for this appointment.');
          this.router.navigate(['/patient/appointments']);
        }
      },
      error: (error) => {
        // If no feedback found (404), that's expected and we can proceed
        if (error.status !== 404) {
          console.error('Error checking existing feedback:', error);
        }
      }
    });
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
  }

  getRatingText(rating: number): string {
    const ratingTexts = {
      0: 'Please select a rating',
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  }

  onSubmit(): void {
    if (this.feedbackForm.valid && this.selectedRating > 0 && this.appointmentId) {
      this.isSubmitting = true;

      const feedbackData: FeedbackCreate = {
        appointmentId: this.appointmentId,
        rating: this.selectedRating,
        comment: this.feedbackForm.get('comment')?.value || ''
      };

      this.feedbackService.createFeedback(feedbackData).subscribe({
        next: (feedback) => {
          this.isSubmitting = false;
          this.showSuccessMessage('Thank you for your feedback! Your review has been submitted successfully.');
          this.router.navigate(['/patient/appointments']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showErrorMessage(error.error?.message || 'Failed to submit feedback. Please try again.');
          console.error('Error submitting feedback:', error);
        }
      });
    } else {
      if (this.selectedRating === 0) {
        this.showErrorMessage('Please select a rating before submitting.');
      } else {
        this.showErrorMessage('Please fill in all required fields.');
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/patient/appointments']);
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

  onCommunicationRatingChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.communicationRating = target.valueAsNumber || 1;
  }

  onWaitTimeRatingChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.waitTimeRating = target.valueAsNumber || 1;
  }

  onCleanlinessRatingChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cleanlinessRating = target.valueAsNumber || 1;
  }
}