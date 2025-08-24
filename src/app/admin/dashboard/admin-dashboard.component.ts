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
  dashboardData: any = null;
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
    // Load recent activities from various services
    this.loadRecentActivities();
    // Load recent users from appointments and notifications
    this.loadRecentUsers();
  }

  private loadRecentActivities(): void {
    // Combine activities from different sources
    const activities: any[] = [];
    
    // Get recent appointments as activities
     if (this.dashboardData?.appointments) {
       this.dashboardData.appointments.slice(0, 3).forEach((appointment: any, index: number) => {
         activities.push({
           id: index + 1,
           title: `Appointment ${appointment.status?.toLowerCase() || 'scheduled'}`,
           description: `${appointment.patientName || 'Patient'} with ${appointment.doctorName || 'Doctor'}`,
           timestamp: new Date(appointment.appointmentDate || appointment.createdAt || Date.now())
         });
       });
     }

     // Get recent notifications as activities
     if (this.dashboardData?.notifications) {
       this.dashboardData.notifications.slice(0, 2).forEach((notification: any, index: number) => {
         activities.push({
           id: activities.length + index + 1,
           title: 'System Notification',
           description: notification.message || 'System notification received',
           timestamp: new Date(notification.createdAt || Date.now())
         });
       });
     }

     // Add system activity if analytics data is available
     if (this.dashboardData?.analytics) {
       activities.push({
         id: activities.length + 1,
         title: 'System Status Update',
         description: `System health status: ${this.dashboardData.analytics.systemHealth || 'Good'}`,
         timestamp: new Date()
       });
     }

     // Fallback to mock data if no real data available
     if (activities.length === 0) {
       activities.push(
         {
           id: 1,
           title: 'New appointment scheduled',
           description: 'Dr. Sarah Johnson scheduled with patient John Doe',
           timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
         },
         {
           id: 2,
           title: 'New user registration',
           description: 'Dr. Sarah Johnson registered as a new doctor',
           timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
         },
         {
           id: 3,
           title: 'System backup completed',
           description: 'Daily system backup completed successfully',
           timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
         }
       );
     }

    this.recentActivities = activities.slice(0, 5); // Limit to 5 activities
  }

  private loadRecentUsers(): void {
    // Extract users from appointments and notifications
    const users: User[] = [];
    const userMap = new Map<string, User>();

    // Extract users from appointments
    if (this.dashboardData?.appointments) {
      this.dashboardData.appointments.forEach((appointment: any) => {
        if (appointment.patientName && appointment.patientEmail && !userMap.has(appointment.patientEmail)) {
          const user: User = {
            id: users.length + 1,
            firstName: appointment.patientName.split(' ')[0] || 'Unknown',
            lastName: appointment.patientName.split(' ')[1] || 'User',
            email: appointment.patientEmail,
            role: UserRole.PATIENT,
            username: appointment.patientEmail.split('@')[0],
            phoneNumber: appointment.patientPhone || '+1234567890',
            address: appointment.patientAddress || 'Address not provided',
            isActive: true,
            createdAt: appointment.createdAt || new Date().toISOString(),
            updatedAt: appointment.updatedAt || new Date().toISOString()
          };
          userMap.set(appointment.patientEmail, user);
          users.push(user);
        }
        
        if (appointment.doctorName && appointment.doctorEmail && !userMap.has(appointment.doctorEmail)) {
          const user: User = {
            id: users.length + 1,
            firstName: appointment.doctorName.split(' ')[0] || 'Dr.',
            lastName: appointment.doctorName.split(' ')[1] || 'Doctor',
            email: appointment.doctorEmail,
            role: UserRole.DOCTOR,
            username: appointment.doctorEmail.split('@')[0],
            phoneNumber: appointment.doctorPhone || '+1234567890',
            address: appointment.doctorAddress || 'Address not provided',
            isActive: true,
            createdAt: appointment.createdAt || new Date().toISOString(),
            updatedAt: appointment.updatedAt || new Date().toISOString()
          };
          userMap.set(appointment.doctorEmail, user);
          users.push(user);
        }
      });
    }

    // Fallback to mock data if no real data available
    if (users.length === 0) {
      users.push(
        {
          id: 1,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          role: UserRole.DOCTOR,
          username: 'jane.smith',
          phoneNumber: '+1234567890',
          address: '123 Medical St',
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
      );
    }

    this.recentUsers = users.slice(0, 5); // Limit to 5 users
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
    // Use synchronous logout to avoid backend 403 error
    this.authService.logoutSync();
    console.log('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }
}
