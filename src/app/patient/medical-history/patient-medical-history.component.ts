import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { MedicalHistory } from '../../models/user.model';

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="medical-history-container">
      <div class="header">
        <h1>My Medical History</h1>
        <p>View and manage your medical records</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading medical history...</p>
      </div>

      <div *ngIf="!isLoading" class="content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon>medical_services</mat-icon>
                <div>
                  <h3>{{ medicalHistory.length }}</h3>
                  <p>Total Records</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon>event</mat-icon>
                <div>
                  <h3>{{ getLastVisitDate() }}</h3>
                  <p>Last Visit</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon>local_hospital</mat-icon>
                <div>
                  <h3>{{ getUniqueConditions() }}</h3>
                  <p>Conditions</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Medical History Records -->
        <mat-card class="records-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Medical Records
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="medicalHistory.length === 0" class="no-records">
              <mat-icon class="large-icon">medical_services</mat-icon>
              <h3>No Medical Records Found</h3>
              <p>Your medical history will appear here once you have visits with healthcare providers.</p>
            </div>

            <div *ngIf="medicalHistory.length > 0" class="records-list">
              <div *ngFor="let record of medicalHistory" class="record-item" [routerLink]="['/patient/medical-history', record.id]">
                <div class="record-header">
                  <div class="record-date">
                    <mat-icon>event</mat-icon>
                    <span>{{ formatDate(record.visitDate) }}</span>
                  </div>
                  <div class="record-actions">
                    <button mat-icon-button [routerLink]="['/patient/medical-history', record.id]">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </div>
                </div>
                
                <div class="record-content">
                  <div class="record-main">
                    <h4>{{ record.diagnosis }}</h4>
                    <p class="symptoms">{{ record.symptoms }}</p>
                  </div>
                  
                  <div class="record-details">
                    <div class="detail-item">
                      <span class="label">Treatment:</span>
                      <span class="value">{{ record.treatment }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Doctor ID:</span>
                      <span class="value">{{ record.doctorId || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .medical-history-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 8px;
      color: #1976d2;
    }

    .header p {
      font-size: 1.1rem;
      color: #666;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-item mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .summary-item h3 {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 0;
    }

    .summary-item p {
      font-size: 0.9rem;
      margin: 0;
      opacity: 0.9;
    }

    .records-card {
      margin-bottom: 32px;
    }

    .no-records {
      text-align: center;
      padding: 64px 32px;
      color: #666;
    }

    .no-records .large-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-records h3 {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .records-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .record-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
    }

    .record-item:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #1976d2;
      transform: translateY(-2px);
    }

    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .record-date {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      font-weight: 500;
    }

    .record-actions {
      display: flex;
      gap: 8px;
    }

    .record-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .record-main h4 {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .symptoms {
      color: #666;
      margin: 0;
      font-style: italic;
    }

    .record-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item .label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-item .value {
      font-size: 0.95rem;
      color: #333;
    }

    @media (max-width: 768px) {
      .medical-history-container {
        padding: 16px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .record-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .record-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientMedicalHistoryComponent implements OnInit, OnDestroy {
  medicalHistory: MedicalHistory[] = [];
  isLoading = true;
  currentUser: any;
  private destroy$ = new Subject<void>();

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private patientService: PatientService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupUserSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUserSubscription(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('Medical History - Current user:', user);
        this.currentUser = user;
        if (user?.username) {
          console.log('Medical History - Username found:', user.username);
          this.loadMedicalHistory();
        } else {
          console.log('Medical History - No user ID found');
          this.isLoading = false;
          this.snackBar.open('Please log in to view your medical history', 'Close', {
            duration: 3000
          });
        }
      });
  }

  loadMedicalHistory(): void {
    this.isLoading = true;
    console.log('Medical History - Loading medical history for username:', this.currentUser.username);
    this.patientService.getMyProfile(this.currentUser.username)
      .subscribe({
        next: (profile) => {
          console.log('Medical History - Profile loaded:', profile);
          this.medicalHistory = (profile.medicalHistories || []).sort((a, b) => 
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          );
          console.log('Medical History - Medical histories:', this.medicalHistory);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patient profile:', error);
          this.isLoading = false;
          this.snackBar.open('Error loading medical history', 'Close', {
            duration: 3000
          });
        }
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getLastVisitDate(): string {
    if (this.medicalHistory.length === 0) {
      return 'No visits';
    }
    const lastVisit = this.medicalHistory[0]; // Already sorted by date desc
    return this.formatDate(lastVisit.visitDate);
  }

  getUniqueConditions(): number {
    const conditions = new Set(this.medicalHistory.map(record => record.diagnosis));
    return conditions.size;
  }
}