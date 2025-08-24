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
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { NotificationService } from '../../services/notification.service';
import { AnalyticsService } from '../../services/analytics.service';
import { FeedbackService } from '../../services/feedback.service';
import { User, UserRole } from '../../models/user.model';
import { Appointment, AppointmentStatus, DoctorAppointment } from '../../models/appointment.model';
import { MedicalHistory } from '../../models/user.model';
import { Notification, NotificationStatus } from '../../models/notification.model';

Chart.register(...registerables);

@Component({
  selector: 'app-doctor-dashboard',
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
  templateUrl: './doctor-dashboard.component.html'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('patientSatisfactionChart', { static: false }) patientSatisfactionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser: User | null = null;
  isLoading = true;
  
  // Dashboard data
  todayAppointments: Appointment[] = [];
  upcomingAppointments: DoctorAppointment[] = [];
  recentPatients: any[] = [];
  recentNotifications: Notification[] = [];
  
  // Stats
  todayAppointmentsCount = 0;
  totalPatientsCount = 0;
  monthlyRevenue: number = 0;
  pendingReviewsCount = 0;
  unreadNotifications = 0;
  
  // Charts
  private patientSatisfactionChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private medicalHistoryService: MedicalHistoryService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private feedbackService: FeedbackService,
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
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all dashboard data in parallel
    forkJoin({
      todayAppointments: this.appointmentService.getDoctorTodayAppointments(this.currentUser?.id || 0),
      upcomingAppointments: this.appointmentService.getMyPatientsUpcomingAppointments(),
      patients: this.patientService.getAllPatients(),
      notifications: this.doctorService.getDoctorNotifications(this.currentUser?.id || 0),
      analytics: this.analyticsService.getOverallAnalytics(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
        new Date().toISOString()
      )
    }).subscribe({
      next: (data) => {
        this.todayAppointments = data.todayAppointments;
        this.upcomingAppointments = data.upcomingAppointments.slice(0, 5);
        this.recentPatients = data.patients.slice(0, 5);
        this.recentNotifications = data.notifications.slice(0, 5);
        
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboard data:', error);
        this.snackBar.open('Error loading dashboard data', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private calculateStats(): void {
    this.todayAppointmentsCount = this.todayAppointments.length;
    this.totalPatientsCount = this.recentPatients.length;
    this.unreadNotifications = this.recentNotifications.filter(n => 
      n.status !== NotificationStatus.READ || !n.readAt
    ).length;
    
    // Load actual revenue and pending reviews data
    this.loadRevenueData();
    this.loadPendingReviewsData();
  }

  private loadRevenueData(): void {
    if (!this.currentUser?.id) return;
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    this.analyticsService.getRevenueAnalytics(
      this.currentUser.id,
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    ).subscribe({
      next: (revenueData) => {
        this.monthlyRevenue = revenueData.totalRevenue || 0;
      },
      error: (error: any) => {
        console.error('Error loading revenue data:', error);
        this.monthlyRevenue = 12500; // Fallback to mock data
      }
    });
  }

  private loadPendingReviewsData(): void {
    if (!this.currentUser?.id) return;
    
    this.feedbackService.getFeedbackByDoctor(this.currentUser.id).subscribe({
      next: (feedbackData: any) => {
        // Count feedback that doesn't have a response from the doctor
        this.pendingReviewsCount = feedbackData.content?.filter((feedback: any) => 
          !feedback.doctorResponse || feedback.doctorResponse.trim() === ''
        ).length || 0;
      },
      error: (error: any) => {
        console.error('Error loading pending reviews data:', error);
        this.pendingReviewsCount = 3; // Fallback to mock data
      }
    });
  }

  private initializeCharts(): void {
    this.initializePatientSatisfactionChart();
    this.initializeRevenueChart();
  }

  private initializePatientSatisfactionChart(): void {
    if (this.patientSatisfactionChartRef && this.patientSatisfactionChartRef.nativeElement && !this.patientSatisfactionChart) {
      const ctx = this.patientSatisfactionChartRef.nativeElement;
      this.patientSatisfactionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
          datasets: [{
            data: [65, 20, 10, 3, 2],
            backgroundColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(107, 114, 128)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
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
            data: [8500, 9200, 10500, 11200, 11800, 12500],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
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
    if (this.patientSatisfactionChart) {
      this.patientSatisfactionChart.destroy();
    }
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
  }

  getStatusColor(status: AppointmentStatus | string): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
      case 'CONFIRMED':
        return 'primary';
      case AppointmentStatus.PENDING:
      case 'PENDING':
        return 'accent';
      case AppointmentStatus.COMPLETED:
      case 'COMPLETED':
        return 'warn';
      case 'BOOKED':
        return 'primary';
      case 'CANCELLED':
        return 'warn';
      case 'RESCHEDULED':
        return 'accent';
      default:
        return 'primary';
    }
  }

  openNotifications(): void {
    this.router.navigate(['/doctor/notifications']);
  }

  startAppointment(appointment: Appointment): void {
    // Implement start appointment logic
    this.snackBar.open('Starting appointment...', 'Close', { duration: 3000 });
  }

  completeAppointment(appointment: Appointment): void {
    // Implement complete appointment logic
    this.snackBar.open('Completing appointment...', 'Close', { duration: 3000 });
  }

  logout(): void {
    // Use synchronous logout to avoid backend 403 error
    this.authService.logoutSync();
    console.log('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }
}
