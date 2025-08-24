import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MedicalHistoryService } from '../../../services/medical-history.service';
import { MedicalHistory } from '../../../models/user.model';

@Component({
  selector: 'app-medical-history-details',
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
    MatDividerModule
  ],
  template: `
    <div class="details-container">
      <div class="header">
        <button mat-icon-button routerLink="/patient/medical-history" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Medical Record Details</h1>
          <p *ngIf="medicalRecord">Visit Date: {{ formatDate(medicalRecord.visitDate) }}</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading medical record...</p>
      </div>

      <div *ngIf="!isLoading && medicalRecord" class="content">
        <!-- Main Information -->
        <mat-card class="main-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>medical_services</mat-icon>
              {{ medicalRecord.diagnosis }}
            </mat-card-title>
            <mat-card-subtitle>
              Visit on {{ formatDate(medicalRecord.visitDate) }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="record-details">
              <div class="detail-section">
                <h3><mat-icon>sick</mat-icon> Symptoms</h3>
                <p>{{ medicalRecord.symptoms || 'No symptoms recorded' }}</p>
              </div>

              <mat-divider></mat-divider>

              <div class="detail-section">
                <h3><mat-icon>healing</mat-icon> Treatment</h3>
                <p>{{ medicalRecord.treatment || 'No treatment recorded' }}</p>
              </div>

              <mat-divider *ngIf="medicalRecord.notes"></mat-divider>

              <div class="detail-section" *ngIf="medicalRecord.notes">
                <h3><mat-icon>note</mat-icon> Notes</h3>
                <p>{{ medicalRecord.notes }}</p>
              </div>

              <mat-divider *ngIf="medicalRecord.prescription"></mat-divider>

              <div class="detail-section" *ngIf="medicalRecord.prescription">
                <h3><mat-icon>medication</mat-icon> Prescription</h3>
                <p>{{ medicalRecord.prescription }}</p>
              </div>

              <mat-divider *ngIf="medicalRecord.followUpDate"></mat-divider>

              <div class="detail-section" *ngIf="medicalRecord.followUpDate">
                <h3><mat-icon>event</mat-icon> Follow-up Date</h3>
                <p>{{ formatDate(medicalRecord.followUpDate) }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Healthcare Provider Information -->
        <mat-card class="provider-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Healthcare Provider
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="provider-info">
              <div class="provider-detail">
                <span class="label">Doctor ID:</span>
                <span class="value">{{ medicalRecord.doctorId || '-' }}</span>
              </div>
              <div class="provider-detail">
                <span class="label">Specialization:</span>
                <span class="value">-</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Record Metadata -->
        <mat-card class="metadata-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              Record Information
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="metadata-info">
              <div class="metadata-item">
                <span class="label">Record ID:</span>
                <span class="value">{{ medicalRecord.id }}</span>
              </div>
              <div class="metadata-item">
                <span class="label">Created:</span>
                <span class="value">{{ formatDate(medicalRecord.createdAt) }}</span>
              </div>
              <div class="metadata-item" *ngIf="medicalRecord.updatedAt !== medicalRecord.createdAt">
                <span class="label">Last Updated:</span>
                <span class="value">{{ formatDate(medicalRecord.updatedAt) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="!isLoading && !medicalRecord" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Record Not Found</h2>
        <p>The medical record you're looking for could not be found.</p>
        <button mat-raised-button color="primary" routerLink="/patient/medical-history">
          <mat-icon>arrow_back</mat-icon>
          Back to Medical History
        </button>
      </div>
    </div>
  `,
  styles: [`
    .details-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      margin-bottom: 32px;
      gap: 16px;
    }

    .back-button {
      color: #1976d2;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 300;
      margin: 0;
      color: #1976d2;
    }

    .header-content p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 1rem;
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

    .content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .main-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .main-card mat-card-header {
      margin-bottom: 24px;
    }

    .main-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
    }

    .main-card mat-card-title mat-icon {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
    }

    .record-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0 0 12px 0;
      opacity: 0.9;
    }

    .detail-section h3 mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    .detail-section p {
      margin: 0;
      line-height: 1.6;
      font-size: 1rem;
    }

    .provider-card,
    .metadata-card {
      background: white;
    }

    .provider-info,
    .metadata-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .provider-detail,
    .metadata-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .provider-detail:last-child,
    .metadata-item:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
      text-align: right;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
      color: #666;
    }

    .error-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
      color: #f44336;
    }

    .error-container h2 {
      font-size: 1.5rem;
      margin-bottom: 8px;
      color: #333;
    }

    .error-container p {
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .details-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .provider-detail,
      .metadata-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .value {
        text-align: left;
      }
    }
  `]
})
export class MedicalHistoryDetailsComponent implements OnInit {
  medicalRecord: MedicalHistory | null = null;
  isLoading = true;
  recordId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalHistoryService: MedicalHistoryService,
    private snackBar: MatSnackBar
  ) {
    this.recordId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    if (this.recordId) {
      this.loadMedicalRecord();
    } else {
      this.isLoading = false;
      this.snackBar.open('Invalid record ID', 'Close', {
        duration: 3000
      });
    }
  }

  loadMedicalRecord(): void {
    this.isLoading = true;
    this.medicalHistoryService.getMedicalHistoryById(this.recordId)
      .subscribe({
        next: (record) => {
          this.medicalRecord = record;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading medical record:', error);
          this.isLoading = false;
          this.snackBar.open('Error loading medical record', 'Close', {
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
}