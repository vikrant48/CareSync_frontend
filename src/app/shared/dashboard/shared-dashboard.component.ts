import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-shared-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="loading-content" *ngIf="isLoading">
        <mat-card class="loading-card">
          <div class="loading-spinner">
            <mat-spinner diameter="60"></mat-spinner>
          </div>
          <h2>Loading your dashboard...</h2>
          <p>Please wait while we redirect you to the appropriate dashboard.</p>
        </mat-card>
      </div>

      <div class="error-content" *ngIf="!isLoading && !userRole">
        <mat-card class="error-card">
          <div class="error-icon">
            <mat-icon>error_outline</mat-icon>
          </div>
          <h1>Access Error</h1>
          <p>Unable to determine your user role. Please log in again.</p>
          <div class="error-actions">
            <button mat-raised-button color="primary" (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
            <button mat-stroked-button routerLink="/auth/login">
              <mat-icon>login</mat-icon>
              Login Again
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .loading-content, .error-content {
      text-align: center;
      max-width: 500px;
    }

    .loading-card, .error-card {
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .loading-card h2 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
    }

    .loading-card p {
      color: #666;
      margin: 0;
    }

    .error-icon {
      margin-bottom: 24px;
    }

    .error-icon mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #f44336;
    }

    .error-card h1 {
      font-size: 32px;
      font-weight: 700;
      color: #333;
      margin: 0 0 16px 0;
    }

    .error-card p {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }

    .error-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .error-actions button {
      min-width: 140px;
    }

    @media (max-width: 480px) {
      .dashboard-container {
        padding: 16px;
      }

      .loading-card, .error-card {
        padding: 24px;
      }

      .error-card h1 {
        font-size: 24px;
      }

      .error-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class SharedDashboardComponent implements OnInit {
  isLoading = true;
  userRole: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserRole();
  }

  private loadUserRole(): void {
    setTimeout(() => {
      this.userRole = this.authService.getUserRole();
      this.isLoading = false;
      
      if (this.userRole) {
        this.redirectToRoleDashboard();
      }
    }, 1000); // Small delay for better UX
  }

  private redirectToRoleDashboard(): void {
    switch (this.userRole) {
      case UserRole.DOCTOR:
        this.router.navigate(['/doctor/dashboard']);
        break;
      case UserRole.PATIENT:
        this.router.navigate(['/patient/dashboard']);
        break;
      case UserRole.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        // Stay on this page to show error
        break;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
