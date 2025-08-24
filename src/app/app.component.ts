import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from './services/auth.service';
import { User, UserRole } from './models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <div class="app-container">
      <!-- Header -->
      <mat-toolbar color="primary" class="header">
        <div class="header-content">
          <div class="logo-section">
            <mat-icon class="logo-icon">medical_services</mat-icon>
            <span class="logo-text">CareSync</span>
          </div>
          
          <div class="nav-section" *ngIf="currentUser">
            <button mat-button [routerLink]="getDashboardRoute()">
              <mat-icon>dashboard</mat-icon>
              Dashboard
            </button>
            
            <button mat-button [matMenuTriggerFor]="appointmentsMenu">
              <mat-icon>event</mat-icon>
              Appointments
            </button>
            <mat-menu #appointmentsMenu="matMenu">
              <button mat-menu-item [routerLink]="getAppointmentsRoute()">
                <mat-icon>list</mat-icon>
                All Appointments
              </button>
              <button mat-menu-item [routerLink]="getAppointmentsRoute() + '/upcoming'">
                <mat-icon>schedule</mat-icon>
                Upcoming
              </button>
              <button mat-menu-item [routerLink]="getAppointmentsRoute() + '/past'">
                <mat-icon>history</mat-icon>
                Past
              </button>
            </mat-menu>
            
            <button mat-button [matMenuTriggerFor]="profileMenu">
              <mat-icon>account_circle</mat-icon>
              Profile
            </button>
            <mat-menu #profileMenu="matMenu">
              <button mat-menu-item [routerLink]="getProfileRoute()">
                <mat-icon>person</mat-icon>
                My Profile
              </button>
              <button mat-menu-item [routerLink]="getSettingsRoute()">
                <mat-icon>settings</mat-icon>
                Settings
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                Logout
              </button>
            </mat-menu>
          </div>
          
          <div class="auth-section" *ngIf="!currentUser">
            <button mat-button routerLink="/auth/login">Login</button>
            <button mat-raised-button color="accent" routerLink="/auth/register">Register</button>
          </div>
        </div>
      </mat-toolbar>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <p>&copy; 2024 CareSync. All rights reserved.</p>
          <div class="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 600;
    }

    .nav-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .auth-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .main-content {
      flex: 1;
      margin-top: 64px;
      padding: 20px;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    }

    .footer {
      background-color: #f5f5f5;
      padding: 20px 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-links {
      display: flex;
      gap: 20px;
    }

    .footer-links a {
      color: #666;
      text-decoration: none;
    }

    .footer-links a:hover {
      color: #333;
    }

    @media (max-width: 768px) {
      .header-content {
        padding: 0 16px;
      }

      .nav-section {
        display: none;
      }

      .main-content {
        padding: 16px;
      }

      .footer-content {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  UserRole = UserRole;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // No need to subscribe with signals
  }
  
  // Use computed getter to access the current user
  get currentUser(): User | null {
    return this.authService.currentUser();
  }

  logout(): void {
    // Use synchronous logout to avoid backend 403 error
    this.authService.logoutSync();
    console.log('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }

  getUserRole(): string {
    return this.currentUser?.role || '';
  }

  getDashboardRoute(): string {
    if (!this.currentUser) return '/auth/login';
    switch (this.currentUser.role) {
      case UserRole.PATIENT: return '/patient/dashboard';
      case UserRole.DOCTOR: return '/doctor/dashboard';
      case UserRole.ADMIN: return '/admin/dashboard';
      default: return '/shared/dashboard';
    }
  }

  getAppointmentsRoute(): string {
    if (!this.currentUser) return '/auth/login';
    switch (this.currentUser.role) {
      case UserRole.PATIENT: return '/patient/appointments';
      case UserRole.DOCTOR: return '/doctor/appointments';
      case UserRole.ADMIN: return '/admin/appointments';
      default: return '/shared/appointments';
    }
  }

  getProfileRoute(): string {
    if (!this.currentUser) return '/auth/login';
    switch (this.currentUser.role) {
      case UserRole.PATIENT: return '/patient/profile';
      case UserRole.DOCTOR: return '/doctor/profile';
      case UserRole.ADMIN: return '/admin/profile';
      default: return '/shared/profile';
    }
  }

  getSettingsRoute(): string {
    if (!this.currentUser) return '/auth/login';
    switch (this.currentUser.role) {
      case UserRole.PATIENT: return '/patient/settings';
      case UserRole.DOCTOR: return '/doctor/settings';
      case UserRole.ADMIN: return '/admin/settings';
      default: return '/shared/settings';
    }
  }
}
