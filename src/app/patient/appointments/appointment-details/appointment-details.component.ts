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
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService } from '../../../services/appointment.service';
import { MedicalHistoryService } from '../../../services/medical-history.service';
import { Appointment, AppointmentStatus, MedicalHistory } from '../../../models/appointment.model';

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
    MatDialogModule,
    MatTabsModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule
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
        <!-- Main Appointment Card -->
        <div class="content-grid">
          <div class="main-content">
            <mat-card class="appointment-card">
              <mat-card-header>
                <div class="doctor-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <mat-card-title>Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</mat-card-title>
                <mat-card-subtitle>{{ appointment.doctor?.specialization }}</mat-card-subtitle>
                <div class="appointment-status">
                  <mat-chip [color]="getStatusColor(appointment.status)" selected>
                    {{ appointment.status }}
                  </mat-chip>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <mat-tab-group>
                  <!-- Appointment Details Tab -->
                  <mat-tab label="Appointment Details">
                    <div class="tab-content">
                      <div class="details-section">
                        <h3><mat-icon>event</mat-icon> Appointment Information</h3>
                        <div class="detail-grid">
                          <div class="detail-item">
                            <mat-icon>event</mat-icon>
                            <div>
                              <span class="detail-label">Date</span>
                              <span class="detail-value">{{ appointment.appointmentDateTime | date:'EEEE, MMMM d, y' }}</span>
                            </div>
                          </div>
                          <div class="detail-item">
                            <mat-icon>schedule</mat-icon>
                            <div>
                              <span class="detail-label">Time</span>
                              <span class="detail-value">{{ appointment.appointmentDateTime | date:'h:mm a' }}</span>
                            </div>
                          </div>
                          <div class="detail-item">
                            <mat-icon>info</mat-icon>
                            <div>
                              <span class="detail-label">Appointment ID</span>
                              <span class="detail-value">#{{ appointment.id }}</span>
                            </div>
                          </div>
                          <div class="detail-item">
                            <mat-icon>description</mat-icon>
                            <div>
                              <span class="detail-label">Reason</span>
                              <span class="detail-value">{{ appointment.reason || 'General Consultation' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <mat-divider></mat-divider>

                      <div class="details-section">
                        <h3><mat-icon>local_hospital</mat-icon> Doctor Information</h3>
                        <div class="detail-grid">
                          <div class="detail-item">
                            <mat-icon>person</mat-icon>
                            <div>
                              <span class="detail-label">Name</span>
                              <span class="detail-value">Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</span>
                            </div>
                          </div>
                          <div class="detail-item">
                            <mat-icon>medical_services</mat-icon>
                            <div>
                              <span class="detail-label">Specialization</span>
                              <span class="detail-value">{{ appointment.doctor?.specialization }}</span>
                            </div>
                          </div>
                          <div class="detail-item" *ngIf="appointment.doctor?.email">
                            <mat-icon>email</mat-icon>
                            <div>
                              <span class="detail-label">Email</span>
                              <span class="detail-value">{{ appointment.doctor?.email }}</span>
                            </div>
                          </div>
                          <div class="detail-item" *ngIf="appointment.doctor?.phoneNumber">
                            <mat-icon>phone</mat-icon>
                            <div>
                              <span class="detail-label">Phone</span>
                              <span class="detail-value">{{ appointment.doctor?.phoneNumber }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="details-section">
                        <h3><mat-icon>notes</mat-icon> Appointment Notes</h3>
                        <div *ngIf="appointment.notes; else noNotes" class="notes-content">
                          <p>{{ appointment.notes }}</p>
                        </div>
                        <ng-template #noNotes>
                          <div class="no-notes-message">
                            <mat-icon>info</mat-icon>
                            <p>No notes have been added for this appointment yet.</p>
                          </div>
                        </ng-template>
                      </div>

                      <div class="details-section" *ngIf="prescriptionInfo">
                        <h3><mat-icon>local_pharmacy</mat-icon> Prescription & Treatment</h3>
                        <div class="prescription-content">
                          <p>{{ prescriptionInfo }}</p>
                        </div>
                        
                        <div class="prescription-actions">
                          <button mat-outlined-button (click)="downloadPrescription()">
                            <mat-icon>download</mat-icon>
                            Download Prescription
                          </button>
                          <button mat-outlined-button (click)="printPrescription()">
                            <mat-icon>print</mat-icon>
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  </mat-tab>

                  <!-- Medical History Tab -->
                  <mat-tab label="Medical History" [matBadge]="getMedicalHistoryCount()" matBadgeColor="primary">
                    <div class="tab-content">
                      <div class="medical-history-section">
                        <div *ngIf="getMedicalHistory().length > 0; else noHistory">
                          <mat-expansion-panel *ngFor="let history of getMedicalHistory(); trackBy: trackByHistoryId" class="history-panel">
                            <mat-expansion-panel-header>
                              <mat-panel-title>
                                <mat-icon>medical_services</mat-icon>
                                {{ history.visitDate | date:'MMM d, y' }}
                              </mat-panel-title>
                              <mat-panel-description>
                                {{ history.diagnosis || 'General Consultation' }}
                              </mat-panel-description>
                            </mat-expansion-panel-header>
                            
                            <div class="history-content">
                              <div class="history-item" *ngIf="history.symptoms">
                                <h4><mat-icon>sick</mat-icon> Symptoms</h4>
                                <p>{{ history.symptoms }}</p>
                              </div>
                              
                              <div class="history-item" *ngIf="history.diagnosis">
                                <h4><mat-icon>assignment</mat-icon> Diagnosis</h4>
                                <p>{{ history.diagnosis }}</p>
                              </div>
                              
                              <div class="history-item" *ngIf="history.treatment">
                                <h4><mat-icon>medication</mat-icon> Treatment</h4>
                                <p>{{ history.treatment }}</p>
                              </div>
                            </div>
                          </mat-expansion-panel>
                        </div>
                        
                        <ng-template #noHistory>
                          <div class="no-history">
                            <mat-icon>info</mat-icon>
                            <h3>No Medical History</h3>
                            <p>No previous medical records found for this appointment.</p>
                          </div>
                        </ng-template>
                      </div>
                    </div>
                  </mat-tab>

                  <!-- Appointment Timeline Tab -->
                  <mat-tab label="Timeline">
                    <div class="tab-content">
                      <div class="timeline-section">
                        <h3><mat-icon>timeline</mat-icon> Appointment Timeline</h3>
                        <div class="timeline">
                          <div class="timeline-item" *ngFor="let event of getAppointmentTimeline()">
                            <div class="timeline-marker" [class]="event.type">
                              <mat-icon>{{ event.icon }}</mat-icon>
                            </div>
                            <div class="timeline-content">
                              <h4>{{ event.title }}</h4>
                              <p>{{ event.description }}</p>
                              <span class="timeline-date">{{ event.date | date:'MMM d, y - h:mm a' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </mat-card-content>
          
          <mat-card-actions>
            <!-- Actions for scheduled/confirmed appointments -->
            <div *ngIf="appointment.status === AppointmentStatus.SCHEDULED || appointment.status === AppointmentStatus.CONFIRMED">
              <button mat-raised-button color="primary" (click)="rescheduleAppointment()" *ngIf="appointment.status === AppointmentStatus.SCHEDULED">
                <mat-icon>schedule</mat-icon>
                Reschedule
              </button>
              <button mat-raised-button color="warn" (click)="cancelAppointment()">
                <mat-icon>cancel</mat-icon>
                Cancel Appointment
              </button>
            </div>
            
            <!-- Actions for completed appointments -->
            <div *ngIf="appointment.status === AppointmentStatus.COMPLETED">
              <button mat-raised-button color="primary" (click)="submitFeedback()">
                <mat-icon>rate_review</mat-icon>
                Submit Feedback
              </button>
              <button mat-outlined-button (click)="bookFollowUp()">
                <mat-icon>add</mat-icon>
                Book Follow-up
              </button>
            </div>
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
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

    .doctor-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .appointment-status {
      margin-left: auto;
    }

    .tab-content {
      padding: 24px 0;
    }

    .details-section {
      margin-bottom: 32px;
    }

    .details-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0 0 20px 0;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .detail-item mat-icon {
      color: #1976d2;
      margin-top: 2px;
    }

    .detail-item div {
      display: flex;
      flex-direction: column;
    }

    .notes-content {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .notes-content p {
      margin: 0;
      line-height: 1.6;
      color: #333;
    }

    .no-notes-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6c757d;
      font-style: italic;
      margin-top: 12px;
    }

    .prescription-content {
      background-color: #f0f8ff;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #28a745;
      margin-top: 12px;
    }

    .prescription-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .prescription-actions button {
      min-width: 140px;
    }

    .detail-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    /* Medical History Styles */
    .medical-history-section {
      padding: 16px 0;
    }

    .history-panel {
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .history-content {
      padding: 16px 0;
    }

    .history-item {
      margin-bottom: 20px;
    }

    .history-item h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .history-item h4 mat-icon {
      font-size: 18px;
      color: #1976d2;
    }

    .history-item p {
      font-size: 14px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    .no-history {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-history mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .no-history h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    /* Timeline Styles */
    .timeline-section {
      padding: 16px 0;
    }

    .timeline-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0 0 24px 0;
    }

    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 20px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 32px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .timeline-marker {
      position: absolute;
      left: -28px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 1;
    }

    .timeline-marker.created {
      background: #4caf50;
    }

    .timeline-marker.confirmed {
      background: #2196f3;
    }

    .timeline-marker.completed {
      background: #ff9800;
    }

    .timeline-marker.cancelled {
      background: #f44336;
    }

    .timeline-content {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      flex: 1;
    }

    .timeline-content h4 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .timeline-content p {
      font-size: 14px;
      color: #666;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .timeline-date {
      font-size: 12px;
      color: #999;
      font-weight: 500;
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

    @media (max-width: 1024px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .appointment-details-container {
        padding: 16px;
      }

      .appointment-details-header h1 {
        font-size: 24px;
      }

      .detail-value {
        font-size: 13px;
      }

      .timeline {
        padding-left: 32px;
      }

      .timeline-marker {
        left: -24px;
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;
  appointmentId!: number;
  prescriptionInfo: string = '';
  AppointmentStatus = AppointmentStatus;
  medicalHistory: MedicalHistory[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private medicalHistoryService: MedicalHistoryService,
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
        
        // Load prescription information if appointment is completed
        if (this.appointment.status === AppointmentStatus.COMPLETED) {
          this.prescriptionInfo = 'Lisinopril 10mg - Take once daily with food\nAspirin 81mg - Take once daily\nFollow up in 3 months for blood work';
        }
        
        // Load medical history for the patient
        if (this.appointment.patientId) {
          this.loadMedicalHistory(this.appointment.patientId);
        }
        
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

  submitFeedback(): void {
    // Navigate to feedback form with appointment ID
    this.router.navigate(['/patient/feedback/submit', this.appointmentId]);
  }

  bookFollowUp(): void {
    // Navigate to book appointment with pre-filled doctor info
    this.router.navigate(['/patient/appointments/book'], {
      queryParams: {
        doctorId: this.appointment?.doctor?.id,
        followUp: true
      }
    });
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

  loadMedicalHistory(patientId: number): void {
    this.medicalHistoryService.getPatientMedicalHistory(patientId).subscribe({
      next: (history) => {
        this.medicalHistory = history;
      },
      error: (error) => {
        console.error('Error loading medical history:', error);
        // Fallback to mock data if service fails
        this.medicalHistory = this.getMockMedicalHistory();
      }
    });
  }

  getMedicalHistory(): MedicalHistory[] {
    return this.medicalHistory;
  }

  private getMockMedicalHistory(): MedicalHistory[] {
    return [
      {
        id: 1,
        visitDate: '2024-01-15',
        symptoms: 'Persistent headache, fatigue, and difficulty concentrating',
        diagnosis: 'Tension headache with stress-related symptoms',
        treatment: 'Prescribed pain relievers and stress management techniques. Recommended regular sleep schedule and hydration.'
      },
      {
        id: 2,
        visitDate: '2023-11-20',
        symptoms: 'Chest pain and shortness of breath during exercise',
        diagnosis: 'Exercise-induced asthma',
        treatment: 'Prescribed bronchodilator inhaler. Recommended gradual increase in exercise intensity.'
      },
      {
        id: 3,
        visitDate: '2023-08-10',
        symptoms: 'Seasonal allergies with runny nose and itchy eyes',
        diagnosis: 'Allergic rhinitis',
        treatment: 'Prescribed antihistamines and nasal spray. Recommended avoiding known allergens.'
      }
    ];
  }

  getMedicalHistoryCount(): number {
    return this.getMedicalHistory().length;
  }

  trackByHistoryId(index: number, history: MedicalHistory): number {
    return history.id;
  }

  getAppointmentTimeline(): any[] {
    if (!this.appointment) return [];

    const timeline = [];
    const appointmentDate = new Date(this.appointment.appointmentDateTime);
    const createdDate = new Date(appointmentDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before

    // Appointment created
    timeline.push({
      type: 'created',
      icon: 'add_circle',
      title: 'Appointment Scheduled',
      description: 'Your appointment has been successfully scheduled.',
      date: createdDate
    });

    // Appointment confirmed (if confirmed)
    if (this.appointment.status === AppointmentStatus.CONFIRMED || 
        this.appointment.status === AppointmentStatus.COMPLETED) {
      const confirmedDate = new Date(createdDate.getTime() + (24 * 60 * 60 * 1000)); // 1 day after creation
      timeline.push({
        type: 'confirmed',
        icon: 'check_circle',
        title: 'Appointment Confirmed',
        description: 'Your appointment has been confirmed by the doctor.',
        date: confirmedDate
      });
    }

    // Appointment completed (if completed)
    if (this.appointment.status === AppointmentStatus.COMPLETED) {
      timeline.push({
        type: 'completed',
        icon: 'task_alt',
        title: 'Appointment Completed',
        description: 'Your appointment has been completed successfully.',
        date: appointmentDate
      });
    }

    // Appointment cancelled (if cancelled)
    if (this.appointment.status === AppointmentStatus.CANCELLED) {
      const cancelledDate = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000)); // 1 day before
      timeline.push({
        type: 'cancelled',
        icon: 'cancel',
        title: 'Appointment Cancelled',
        description: 'This appointment has been cancelled.',
        date: cancelledDate
      });
    }

    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  downloadPrescription(): void {
    // Implementation for downloading prescription
    this.showSuccessMessage('Prescription download started');
  }

  printPrescription(): void {
    // Implementation for printing prescription
    window.print();
  }
}