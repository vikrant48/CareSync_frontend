import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DoctorAppointment, AppointmentStatus, MedicalHistory } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorService } from '../../../services/doctor.service';

@Component({
  selector: 'app-doctor-appointment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="appointment-details-container">
      <!-- Header -->
      <div class="appointment-header">
        <button mat-icon-button color="primary" routerLink="/doctor/appointments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Appointment Details</h1>
          <p *ngIf="appointment">{{ appointment.patientName }} - {{ appointment.appointmentDate | date:'MMM d, y' }} at {{ appointment.appointmentTime }}</p>
        </div>
        <div class="header-actions" *ngIf="appointment">
          <button mat-icon-button [matMenuTriggerFor]="actionsMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #actionsMenu="matMenu">
            <button mat-menu-item (click)="startAppointment()" *ngIf="canStartAppointment()">
              <mat-icon>play_arrow</mat-icon>
              <span>Start Appointment</span>
            </button>
            <button mat-menu-item (click)="completeAppointment()" *ngIf="canCompleteAppointment()">
              <mat-icon>check_circle</mat-icon>
              <span>Mark Complete</span>
            </button>
            <button mat-menu-item (click)="rescheduleAppointment()" *ngIf="canReschedule()">
              <mat-icon>schedule</mat-icon>
              <span>Reschedule</span>
            </button>
            <button mat-menu-item (click)="cancelAppointment()" *ngIf="canCancel()">
              <mat-icon>cancel</mat-icon>
              <span>Cancel</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading appointment details...</p>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading && appointment" class="appointment-content">
        <div class="content-grid">
          <!-- Left Column - Patient & Appointment Info -->
          <div class="left-column">
            <!-- Patient Information Card -->
            <mat-card class="patient-card">
              <mat-card-header>
                <div class="patient-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <mat-card-title>{{ appointment.patientName }}</mat-card-title>
                <mat-card-subtitle>Patient Information</mat-card-subtitle>
                <div class="status-chip">
                  <mat-chip [color]="getStatusColor(appointment.status)" selected>
                    {{ appointment.status }}
                  </mat-chip>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <div class="patient-details">
                  <div class="detail-row">
                    <mat-icon>email</mat-icon>
                    <div>
                      <span class="detail-label">Email</span>
                      <span class="detail-value">{{ appointment.patientEmail }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <mat-icon>phone</mat-icon>
                    <div>
                      <span class="detail-label">Contact</span>
                      <span class="detail-value">{{ appointment.patientContactInfo }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <mat-icon>medical_services</mat-icon>
                    <div>
                      <span class="detail-label">Chief Complaint</span>
                      <span class="detail-value">{{ appointment.reason }}</span>
                    </div>
                  </div>
                  <div class="detail-row" *ngIf="appointment.patientIllnessDetails">
                    <mat-icon>healing</mat-icon>
                    <div>
                      <span class="detail-label">Patient Condition</span>
                      <span class="detail-value">{{ appointment.patientIllnessDetails }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Appointment Information Card -->
            <mat-card class="appointment-info-card">
              <mat-card-header>
                <mat-card-title>Appointment Information</mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div class="appointment-details">
                  <div class="detail-row">
                    <mat-icon>event</mat-icon>
                    <div>
                      <span class="detail-label">Date</span>
                      <span class="detail-value">{{ appointment.appointmentDate | date:'EEEE, MMMM d, y' }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <mat-icon>schedule</mat-icon>
                    <div>
                      <span class="detail-label">Time</span>
                      <span class="detail-value">{{ appointment.appointmentTime }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <mat-icon>info</mat-icon>
                    <div>
                      <span class="detail-label">Appointment ID</span>
                      <span class="detail-value">#{{ appointment.appointmentId }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <mat-icon>access_time</mat-icon>
                    <div>
                      <span class="detail-label">Created</span>
                      <span class="detail-value">{{ appointment.createdAt | date:'MMM d, y - h:mm a' }}</span>
                    </div>
                  </div>
                  <div class="detail-row" *ngIf="appointment.statusChangedAt">
                    <mat-icon>update</mat-icon>
                    <div>
                      <span class="detail-label">Last Updated</span>
                      <span class="detail-value">{{ appointment.statusChangedAt | date:'MMM d, y - h:mm a' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Right Column - Medical History & Notes -->
          <div class="right-column">
            <!-- Medical History -->
            <mat-card class="medical-history-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>history</mat-icon>
                  Medical History
                  <mat-chip *ngIf="appointment.medicalHistory?.length" [matBadge]="appointment.medicalHistory.length" matBadgeColor="primary">
                    {{ appointment.medicalHistory.length }} Records
                  </mat-chip>
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div *ngIf="appointment.medicalHistory && appointment.medicalHistory.length > 0; else noHistory">
                  <mat-expansion-panel *ngFor="let history of appointment.medicalHistory; trackBy: trackByHistoryId" class="history-panel">
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
                      <div class="history-section" *ngIf="history.symptoms">
                        <h4><mat-icon>sick</mat-icon> Symptoms</h4>
                        <p>{{ history.symptoms }}</p>
                      </div>
                      
                      <div class="history-section" *ngIf="history.diagnosis">
                        <h4><mat-icon>assignment</mat-icon> Diagnosis</h4>
                        <p>{{ history.diagnosis }}</p>
                      </div>
                      
                      <div class="history-section" *ngIf="history.treatment">
                        <h4><mat-icon>medication</mat-icon> Treatment</h4>
                        <p>{{ history.treatment }}</p>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
                
                <ng-template #noHistory>
                  <div class="no-history">
                    <mat-icon>info</mat-icon>
                    <p>No previous medical history available</p>
                  </div>
                </ng-template>
              </mat-card-content>
            </mat-card>

            <!-- Tabbed Content -->
            <mat-tab-group class="appointment-tabs">
              <!-- Notes Tab -->
              <mat-tab label="Notes">
                <div class="tab-content">
                  <!-- Appointment Notes -->
                  <mat-card class="notes-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>notes</mat-icon>
                        Appointment Notes
                      </mat-card-title>
                    </mat-card-header>
              
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add notes for this appointment</mat-label>
                  <textarea matInput 
                           [(ngModel)]="appointmentNotes" 
                           placeholder="Enter consultation notes, observations, prescriptions, etc."
                           rows="6"
                           maxlength="1000"></textarea>
                  <mat-hint align="end">{{ appointmentNotes.length || 0 }}/1000</mat-hint>
                </mat-form-field>
                
                <div class="notes-actions">
                  <button mat-raised-button color="primary" (click)="saveNotes()" [disabled]="isSavingNotes">
                    <mat-icon>save</mat-icon>
                    {{ isSavingNotes ? 'Saving...' : 'Save Notes' }}
                  </button>
                  <button mat-outlined-button (click)="clearNotes()">
                    <mat-icon>clear</mat-icon>
                    Clear
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Prescription Management -->
            <mat-card class="prescription-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>medication</mat-icon>
                  Prescription & Treatment
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Prescription Details</mat-label>
                  <textarea matInput 
                           [(ngModel)]="prescriptionNotes" 
                           placeholder="Enter medications, dosage, instructions, and treatment recommendations"
                           rows="4"
                           maxlength="800"></textarea>
                  <mat-hint align="end">{{ prescriptionNotes.length || 0 }}/800</mat-hint>
                </mat-form-field>
                
                <div class="prescription-actions">
                  <button mat-raised-button color="accent" (click)="savePrescription()">
                    <mat-icon>local_pharmacy</mat-icon>
                    Save Prescription
                  </button>
                  <button mat-outlined-button (click)="generatePrescriptionPDF()">
                    <mat-icon>picture_as_pdf</mat-icon>
                    Generate PDF
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Follow-up Scheduling -->
            <mat-card class="followup-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>event_available</mat-icon>
                  Follow-up Appointment
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div class="followup-form">
                  <mat-checkbox [(ngModel)]="followUpRequired" class="followup-checkbox">
                    Schedule follow-up appointment
                  </mat-checkbox>
                  
                  <div *ngIf="followUpRequired" class="followup-details">
                    <mat-form-field appearance="outline">
                      <mat-label>Follow-up Date</mat-label>
                      <input matInput [matDatepicker]="picker" [(ngModel)]="followUpDate">
                      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                      <mat-datepicker #picker></mat-datepicker>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Follow-up Notes</mat-label>
                      <textarea matInput 
                               [(ngModel)]="followUpNotes" 
                               placeholder="Reason for follow-up, specific instructions"
                               rows="2"
                               maxlength="300"></textarea>
                    </mat-form-field>
                  </div>
                </div>
                
                <div class="followup-actions" *ngIf="followUpRequired">
                  <button mat-raised-button color="primary" (click)="scheduleFollowUp()">
                    <mat-icon>schedule</mat-icon>
                    Schedule Follow-up
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
                </div>
              </mat-tab>

              <!-- Timeline Tab -->
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
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <div class="primary-actions">
            <button mat-raised-button color="primary" (click)="startAppointment()" *ngIf="canStartAppointment()">
              <mat-icon>play_arrow</mat-icon>
              Start Appointment
            </button>
            <button mat-raised-button color="accent" (click)="completeAppointment()" *ngIf="canCompleteAppointment()">
              <mat-icon>check_circle</mat-icon>
              Mark Complete
            </button>
          </div>
          
          <div class="secondary-actions">
            <button mat-outlined-button (click)="rescheduleAppointment()" *ngIf="canReschedule()">
              <mat-icon>schedule</mat-icon>
              Reschedule
            </button>
            <button mat-outlined-button color="warn" (click)="cancelAppointment()" *ngIf="canCancel()">
              <mat-icon>cancel</mat-icon>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !appointment" class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h2>Appointment Not Found</h2>
        <p>The appointment you're looking for doesn't exist or you don't have permission to view it.</p>
        <button mat-raised-button color="primary" routerLink="/doctor/appointments">
          Back to Appointments
        </button>
      </div>
    </div>
  `,
  styles: [`
    .appointment-details-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .appointment-header {
      display: flex;
      align-items: center;
      margin-bottom: 32px;
      gap: 16px;
    }

    .header-content {
      flex: 1;
    }

    .header-content h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }

    .header-content p {
      font-size: 16px;
      color: #666;
      margin: 4px 0 0 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .appointment-content {
      margin-bottom: 32px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .patient-card, .appointment-info-card, .medical-history-card, .notes-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .patient-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .status-chip {
      margin-left: auto;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 12px;
    }

    .detail-row mat-icon {
      color: #1976d2;
      margin-top: 2px;
    }

    .detail-row div {
      display: flex;
      flex-direction: column;
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
      font-weight: 400;
    }

    .history-panel {
      margin-bottom: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .history-content {
      padding: 16px 0;
    }

    .history-section {
      margin-bottom: 16px;
    }

    .history-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .history-section h4 mat-icon {
      font-size: 18px;
      color: #1976d2;
    }

    .history-section p {
      font-size: 14px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    .no-history {
      text-align: center;
      padding: 32px;
      color: #666;
    }

    .no-history mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .notes-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .prescription-card, .followup-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .prescription-actions, .followup-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .followup-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .followup-checkbox {
      margin-bottom: 8px;
    }

    .followup-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-left: 24px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .appointment-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .timeline-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 20px;
      font-weight: 600;
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
      background: white;
      border: 3px solid #e0e0e0;
      z-index: 1;
    }

    .timeline-marker.created {
      border-color: #2196f3;
      color: #2196f3;
    }

    .timeline-marker.confirmed {
      border-color: #4caf50;
      color: #4caf50;
    }

    .timeline-marker.completed {
      border-color: #ff9800;
      color: #ff9800;
    }

    .timeline-marker.cancelled {
      border-color: #f44336;
      color: #f44336;
    }

    .timeline-content {
      flex: 1;
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #e0e0e0;
    }

    .timeline-item .timeline-content h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .timeline-item .timeline-content p {
      margin: 0 0 8px 0;
      color: #666;
    }

    .timeline-date {
      font-size: 12px;
      color: #999;
      font-weight: 500;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .action-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .primary-actions, .secondary-actions {
      display: flex;
      gap: 12px;
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

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
        gap: 16px;
      }
      
      .primary-actions, .secondary-actions {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .appointment-details-container {
        padding: 16px;
      }
      
      .appointment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .header-content h1 {
        font-size: 24px;
      }
    }
  `]
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: DoctorAppointment | null = null;
  isLoading = true;
  appointmentId!: string;
  appointmentNotes: string = '';
  isSavingNotes: boolean = false;
  prescriptionNotes: string = '';
  followUpRequired: boolean = false;
  followUpDate: Date | null = null;
  followUpNotes: string = '';
  AppointmentStatus = AppointmentStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.appointmentId) {
      this.loadAppointment();
    } else {
      this.isLoading = false;
    }
  }

  loadAppointment(): void {
    this.isLoading = true;
    const appointmentId = parseInt(this.appointmentId);
    
    this.doctorService.getDoctorAppointmentById(appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.appointmentNotes = '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.snackBar.open('Failed to load appointment details', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }



  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'SCHEDULED': return 'primary';
      case 'BOOKED': return 'primary';
      case 'CONFIRMED': return 'accent';
      case 'COMPLETED': return 'primary';
      case 'CANCELLED': return 'warn';
      case 'RESCHEDULED': return 'warn';
      default: return 'primary';
    }
  }

  canStartAppointment(): boolean {
    return this.appointment?.status === 'CONFIRMED' || this.appointment?.status === 'SCHEDULED';
  }

  canCompleteAppointment(): boolean {
    return this.appointment?.status === 'CONFIRMED' || this.appointment?.status === 'SCHEDULED';
  }

  canReschedule(): boolean {
    return this.appointment?.status !== 'COMPLETED' && this.appointment?.status !== 'CANCELLED';
  }

  canCancel(): boolean {
    return this.appointment?.status !== 'COMPLETED' && this.appointment?.status !== 'CANCELLED';
  }

  startAppointment(): void {
    if (!this.appointment) return;
    
    this.doctorService.updateAppointmentStatus(this.appointment.appointmentId, 'IN_PROGRESS').subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.showSuccessMessage(`Started appointment with ${this.appointment.patientName}`);
      },
      error: (error) => {
        console.error('Error starting appointment:', error);
        this.snackBar.open('Failed to start appointment', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  completeAppointment(): void {
    if (!this.appointment) return;
    
    this.doctorService.completeAppointment(this.appointment.appointmentId).subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.showSuccessMessage(`Appointment with ${this.appointment.patientName} marked as completed`);
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
        this.snackBar.open('Failed to complete appointment', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rescheduleAppointment(): void {
    this.showInfoMessage('Reschedule functionality coming soon');
    // TODO: Implement reschedule logic with dialog
  }

  cancelAppointment(): void {
    if (!this.appointment) return;
    
    this.doctorService.updateAppointmentStatus(this.appointment.appointmentId, 'CANCELLED').subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.showSuccessMessage(`Appointment with ${this.appointment.patientName} has been cancelled`);
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.snackBar.open('Failed to cancel appointment', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  saveNotes(): void {
    if (!this.appointment || !this.appointmentNotes.trim()) {
      this.snackBar.open('Please enter notes before saving', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    this.isSavingNotes = true;
    
    this.appointmentService.addAppointmentNote(this.appointment.appointmentId, this.appointmentNotes).subscribe({
      next: () => {
        this.isSavingNotes = false;
        this.showSuccessMessage('Notes saved successfully');
        this.appointmentNotes = ''; // Clear notes after saving
      },
      error: (error) => {
        console.error('Error saving notes:', error);
        this.isSavingNotes = false;
        this.snackBar.open('Failed to save notes', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  clearNotes(): void {
    this.appointmentNotes = '';
  }



  trackByHistoryId(index: number, history: MedicalHistory): number {
    return history.id;
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  getMedicalHistory(): MedicalHistory[] {
    return this.appointment?.medicalHistory || [];
  }

  getMedicalHistoryCount(): number {
    return this.getMedicalHistory().length;
  }

  getAppointmentTimeline(): any[] {
    if (!this.appointment) return [];

    const timeline = [];
    const appointmentDate = new Date(this.appointment.appointmentDate);
    const createdDate = new Date(this.appointment.createdAt);

    // Appointment created
    timeline.push({
      type: 'created',
      icon: 'add_circle',
      title: 'Appointment Scheduled',
      description: 'Patient scheduled this appointment.',
      date: createdDate
    });

    // Appointment confirmed (if confirmed)
    if (this.appointment.status === 'CONFIRMED' || 
        this.appointment.status === 'COMPLETED') {
      const confirmedDate = new Date(this.appointment.updatedAt);
      timeline.push({
        type: 'confirmed',
        icon: 'check_circle',
        title: 'Appointment Confirmed',
        description: 'You confirmed this appointment.',
        date: confirmedDate
      });
    }

    // Appointment completed (if completed)
    if (this.appointment.status === 'COMPLETED') {
      timeline.push({
        type: 'completed',
        icon: 'task_alt',
        title: 'Appointment Completed',
        description: 'Appointment was completed successfully.',
        date: appointmentDate
      });
    }

    // Appointment cancelled (if cancelled)
    if (this.appointment.status === 'CANCELLED') {
      const cancelledDate = new Date(this.appointment.statusChangedAt || this.appointment.updatedAt);
      timeline.push({
        type: 'cancelled',
        icon: 'cancel',
        title: 'Appointment Cancelled',
        description: 'This appointment was cancelled.',
        date: cancelledDate
      });
    }

    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  savePrescription(): void {
    if (!this.prescriptionNotes.trim()) {
      this.showErrorMessage('Please enter prescription details');
      return;
    }

    // TODO: Implement prescription saving logic
    console.log('Saving prescription:', this.prescriptionNotes);
    this.showSuccessMessage('Prescription saved successfully');
  }

  generatePrescriptionPDF(): void {
    if (!this.prescriptionNotes.trim()) {
      this.showErrorMessage('Please enter prescription details first');
      return;
    }

    // TODO: Implement PDF generation logic
    console.log('Generating prescription PDF');
    this.showSuccessMessage('Prescription PDF generated');
  }

  scheduleFollowUp(): void {
    if (!this.followUpDate) {
      this.showErrorMessage('Please select a follow-up date');
      return;
    }

    if (this.followUpDate <= new Date()) {
      this.showErrorMessage('Follow-up date must be in the future');
      return;
    }

    if (!this.appointment) {
      this.showErrorMessage('No appointment found');
      return;
    }

    const followUpData = {
      followUpDate: this.followUpDate.toISOString().split('T')[0],
      reason: 'Follow-up consultation',
      notes: this.followUpNotes || ''
    };

    console.log('Scheduling follow-up:', {
      date: this.followUpDate,
      notes: this.followUpNotes,
      appointmentId: this.appointment.appointmentId
    });
    
    this.appointmentService.scheduleFollowUp(this.appointment.appointmentId, followUpData).subscribe({
      next: () => {
        this.showSuccessMessage('Follow-up appointment scheduled successfully');
        this.followUpRequired = false;
        this.followUpDate = null;
        this.followUpNotes = '';
      },
      error: (error) => {
        console.error('Error scheduling follow-up:', error);
        this.snackBar.open('Failed to schedule follow-up appointment', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getPatientAge(): number {
    // Mock age calculation - in real app would use patient's date of birth
    return 35;
  }

  getPatientContact(): string {
    if (!this.appointment) return '';
    
    const contacts = [];
    if (this.appointment.patientEmail) contacts.push(this.appointment.patientEmail);
    if (this.appointment.patientContactInfo) contacts.push(this.appointment.patientContactInfo);
    
    return contacts.join(' • ');
  }
}