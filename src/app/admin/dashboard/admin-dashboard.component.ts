import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Subject, takeUntil, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';
import { User, UserRole } from '../../models/user.model';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { Notification } from '../../models/notification.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('userGrowthChart', { static: false }) userGrowthChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser: User | null = null;
  isLoading = true;
  
  // Dashboard data
  recentActivities: any[] = [];
  recentUsers: User[] = [];
  recentNotifications: Notification[] = [];
  
  // Stats
  totalUsers = 0;
  activeAppointmentsCount = 0;
  systemRevenue: number = 0;
  systemHealth = 0;
  unreadNotifications = 0;
  
  // Charts
  private userGrowthChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupUserSubscription();
  }

  ngAfterViewInit(): void {
    // Wait for view to be initialized before creating charts
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyAllCharts();
  }

  private setupUserSubscription(): void {
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
          // Load data in parallel
      forkJoin({
        appointments: this.appointmentService.getAppointmentStatistics(),
        notifications: this.notificationService.getNotifications(),
        analytics: this.analyticsService.getOverallAnalytics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
          new Date().toISOString()
        )
      }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.calculateStats(data);
        this.loadMockData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loadMockData();
        this.isLoading = false;
      }
    });
  }

  private calculateStats(data: any): void {
    if (data.appointments) {
      this.activeAppointmentsCount = data.appointments.totalAppointments || 0;
    }
    
    if (data.analytics) {
      this.totalUsers = data.analytics.totalUsers || 0;
      this.systemRevenue = data.analytics.totalRevenue || 0;
      this.systemHealth = data.analytics.systemHealth || 0;
    }
    
    if (data.notifications) {
      this.unreadNotifications = data.notifications.filter((n: Notification) => n.status === 'PENDING').length;
    }
  }

  private loadMockData(): void {
    // Mock data for demonstration
    this.recentActivities = [
      {
        title: 'New user registration',
        description: 'Dr. Sarah Johnson registered as a new doctor',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        title: 'Appointment completed',
        description: 'Patient visit completed successfully',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        title: 'System backup completed',
        description: 'Daily system backup completed successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    this.recentUsers = [
      {
        id: 1,
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        role: UserRole.DOCTOR,
        username: 'sarah.johnson',
        phoneNumber: '+1234567890',
        address: '123 Medical Center Dr',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.PATIENT,
        username: 'john.doe',
        phoneNumber: '+1234567891',
        address: '456 Health Ave',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private initializeCharts(): void {
    this.initializeUserGrowthChart();
    this.initializeRevenueChart();
  }

  private initializeUserGrowthChart(): void {
    if (this.userGrowthChartRef && this.userGrowthChartRef.nativeElement && !this.userGrowthChart) {
      const ctx = this.userGrowthChartRef.nativeElement;
      this.userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'User Growth',
            data: [100, 150, 200, 280, 350, 420],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private initializeRevenueChart(): void {
    if (this.revenueChartRef && this.revenueChartRef.nativeElement && !this.revenueChart) {
      const ctx = this.revenueChartRef.nativeElement;
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [15000, 18000, 22000, 25000, 28000, 32000],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private destroyAllCharts(): void {
    if (this.userGrowthChart) {
      this.userGrowthChart.destroy();
      this.userGrowthChart = null;
    }
    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null;
    }
  }

  openNotifications(): void {
    // Navigate to notifications page or open notifications panel
    this.router.navigate(['/admin/notifications']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
