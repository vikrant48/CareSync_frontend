import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-token-refresh',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './token-refresh.component.html',
  styleUrl: './token-refresh.component.css'
})
export class TokenRefreshComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isRefreshing = true;
  refreshError: string | null = null;
  refreshMessage = 'Refreshing your session...';

  ngOnInit() {
    this.attemptTokenRefresh();
  }

  private attemptTokenRefresh() {
    this.isRefreshing = true;
    this.refreshError = null;
    this.refreshMessage = 'Refreshing your session...';

    const refreshObservable = this.authService.refresh();

    if (refreshObservable) {
      refreshObservable.subscribe({
        next: (response) => {
          // Update tokens
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.authService.accessToken.set(response.accessToken);
          this.authService.refreshToken.set(response.refreshToken);

          this.refreshMessage = 'Session refreshed successfully! Redirecting...';

          // Redirect back to the appropriate dashboard
          setTimeout(() => {
            this.authService.redirectToDashboard(this.authService.role());
          }, 1500);
        },
        error: (error) => {
          this.isRefreshing = false;
          this.refreshError = 'Unable to refresh your session. Please try again or log in.';
          console.error('Token refresh failed:', error);
        }
      });
    } else {
      this.isRefreshing = false;
      this.refreshError = 'No refresh token available. Please log in again.';
    }
  }

  retryRefresh() {
    this.attemptTokenRefresh();
  }

  goToLogin() {
    this.authService.logout();
  }
}