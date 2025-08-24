import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { Feedback } from '../../models/feedback.model';

@Component({
  selector: 'app-patient-feedback-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="feedback-list-container">
      <div class="feedback-header">
        <div class="header-content">
          <div class="title-section">
            <h1>My Feedback</h1>
            <p>View and manage your submitted feedback</p>
          </div>
          <div class="header-actions">
            <button 
              mat-raised-button 
              color="primary" 
              routerLink="/patient/appointments"
            >
              <mat-icon>add</mat-icon>
              Give Feedback
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading your feedback...</p>
      </div>

      <div *ngIf="!isLoading" class="feedback-content">
        <!-- Feedback Statistics -->
        <div class="stats-section">
          <div class="stats-grid">
            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon class="stat-icon">rate_review</mat-icon>
                  <div class="stat-info">
                    <span class="stat-number">{{ feedbackList.length }}</span>
                    <span class="stat-label">Total Feedback</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon class="stat-icon">star</mat-icon>
                  <div class="stat-info">
                    <span class="stat-number">{{ averageRating.toFixed(1) }}</span>
                    <span class="stat-label">Average Rating</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon class="stat-icon">trending_up</mat-icon>
                  <div class="stat-info">
                    <span class="stat-number">{{ recentFeedbackCount }}</span>
                    <span class="stat-label">This Month</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Feedback List -->
        <div class="feedback-list-section">
          <div *ngIf="paginatedFeedback.length === 0" class="empty-state">
            <mat-card>
              <mat-card-content>
                <div class="empty-content">
                  <mat-icon>feedback</mat-icon>
                  <h3>No Feedback Yet</h3>
                  <p>You haven't submitted any feedback yet. After your appointments, you can share your experience to help us improve our services.</p>
                  <button 
                    mat-raised-button 
                    color="primary" 
                    routerLink="/patient/appointments"
                  >
                    View Appointments
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div *ngIf="paginatedFeedback.length > 0" class="feedback-cards">
            <mat-card *ngFor="let feedback of paginatedFeedback" class="feedback-card">
              <mat-card-header>
                <div class="feedback-header-content">
                  <div class="doctor-info">
                    <mat-icon>person</mat-icon>
                    <div class="doctor-details">
                      <span class="doctor-name">Dr. {{ feedback.doctor?.firstName }} {{ feedback.doctor?.lastName }}</span>
                      <span class="specialization">{{ feedback.doctor?.specialization }}</span>
                    </div>
                  </div>
                  <div class="feedback-actions">
                    <button mat-icon-button [matMenuTriggerFor]="feedbackMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #feedbackMenu="matMenu">
                      <button mat-menu-item (click)="viewFeedbackDetails(feedback)">
                        <mat-icon>visibility</mat-icon>
                        View Details
                      </button>
                      <button mat-menu-item (click)="editFeedback(feedback)" [disabled]="!canEditFeedback(feedback)">
                        <mat-icon>edit</mat-icon>
                        Edit Feedback
                      </button>
                    </mat-menu>
                  </div>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <div class="feedback-content-section">
                  <!-- Rating Display -->
                  <div class="rating-display">
                    <div class="stars">
                      <mat-icon 
                        *ngFor="let star of [1,2,3,4,5]; let i = index" 
                        [class.filled]="i < feedback.rating"
                      >
                        {{ i < feedback.rating ? 'star' : 'star_border' }}
                      </mat-icon>
                    </div>
                    <span class="rating-text">{{ getRatingText(feedback.rating) }}</span>
                  </div>

                  <!-- Appointment Info -->
                  <div class="appointment-info">
                    <div class="info-item">
                      <mat-icon>event</mat-icon>
                      <span>{{ feedback.appointment?.appointmentDateTime | date:'medium' }}</span>
                    </div>
                    <div class="info-item" *ngIf="feedback.appointment?.reason">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ feedback.appointment?.reason }}</span>
                    </div>
                  </div>

                  <!-- Comment -->
                  <div class="comment-section" *ngIf="feedback.comment">
                    <h4>Your Comments:</h4>
                    <p class="comment-text">{{ feedback.comment }}</p>
                  </div>

                  <!-- Feedback Date -->
                  <div class="feedback-meta">
                    <mat-chip-set>
                      <mat-chip>
                        <mat-icon matChipAvatar>schedule</mat-icon>
                        Submitted {{ feedback.createdAt | date:'short' }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Pagination -->
          <div *ngIf="feedbackList.length > pageSize" class="pagination-container">
            <mat-paginator
              [length]="feedbackList.length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 20]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            >
            </mat-paginator>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .feedback-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .title-section p {
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

    .stats-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card:nth-child(2) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-card:nth-child(3) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      opacity: 0.8;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-top: 4px;
    }

    .feedback-list-section {
      margin-bottom: 32px;
    }

    .empty-state {
      margin-top: 40px;
    }

    .empty-content {
      text-align: center;
      padding: 60px 40px;
    }

    .empty-content mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #9ca3af;
      margin-bottom: 24px;
    }

    .empty-content h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .empty-content p {
      color: #6b7280;
      margin-bottom: 32px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .feedback-cards {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .feedback-card {
      transition: all 0.3s ease;
    }

    .feedback-card:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .feedback-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .doctor-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .doctor-details {
      display: flex;
      flex-direction: column;
    }

    .doctor-name {
      font-weight: 600;
      color: #1f2937;
    }

    .specialization {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .feedback-content-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stars {
      display: flex;
      gap: 4px;
    }

    .stars mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      color: #d1d5db;
    }

    .stars mat-icon.filled {
      color: #fbbf24;
    }

    .rating-text {
      font-weight: 500;
      color: #374151;
    }

    .appointment-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .info-item mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    .comment-section h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .comment-text {
      color: #374151;
      line-height: 1.6;
      background-color: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .feedback-meta {
      display: flex;
      justify-content: flex-end;
    }

    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 32px;
    }

    @media (max-width: 768px) {
      .feedback-list-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .feedback-header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .rating-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .empty-content {
        padding: 40px 20px;
      }
    }
  `]
})
export class PatientFeedbackListComponent implements OnInit {
  feedbackList: Feedback[] = [];
  paginatedFeedback: Feedback[] = [];
  isLoading = false;
  pageSize = 10;
  currentPage = 0;
  averageRating = 0;
  recentFeedbackCount = 0;

  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPatientFeedback();
  }

  loadPatientFeedback(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.showErrorMessage('User not authenticated.');
      return;
    }

    this.isLoading = true;
    this.feedbackService.getFeedbackByPatient(currentUser.id).subscribe({
      next: (feedback) => {
        this.feedbackList = feedback.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateStatistics();
        this.updatePaginatedFeedback();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showErrorMessage('Failed to load feedback.');
        console.error('Error loading feedback:', error);
      }
    });
  }

  calculateStatistics(): void {
    if (this.feedbackList.length === 0) {
      this.averageRating = 0;
      this.recentFeedbackCount = 0;
      return;
    }

    // Calculate average rating
    const totalRating = this.feedbackList.reduce((sum, feedback) => sum + feedback.rating, 0);
    this.averageRating = totalRating / this.feedbackList.length;

    // Calculate recent feedback count (this month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    this.recentFeedbackCount = this.feedbackList.filter(feedback => {
      const feedbackDate = new Date(feedback.createdAt);
      return feedbackDate.getMonth() === currentMonth && feedbackDate.getFullYear() === currentYear;
    }).length;
  }

  updatePaginatedFeedback(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedFeedback = this.feedbackList.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedFeedback();
  }

  getRatingText(rating: number): string {
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  }

  viewFeedbackDetails(feedback: Feedback): void {
    // Could open a dialog or navigate to a detailed view
    this.showInfoMessage(`Feedback submitted on ${new Date(feedback.createdAt).toLocaleDateString()}`);
  }

  editFeedback(feedback: Feedback): void {
    // For now, show a message. In a real app, you might navigate to an edit form
    this.showInfoMessage('Feedback editing is not available at this time.');
  }

  canEditFeedback(feedback: Feedback): boolean {
    // Allow editing within 24 hours of submission
    const feedbackDate = new Date(feedback.createdAt);
    const now = new Date();
    const hoursDifference = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 24;
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