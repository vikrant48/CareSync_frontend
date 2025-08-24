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
import { PatientService } from '../../services/patient.service';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { NotificationService } from '../../services/notification.service';
import { AnalyticsService } from '../../services/analytics.service';
import { FeedbackService } from '../../services/feedback.service';
import { User, UserRole } from '../../models/user.model';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { MedicalHistory } from '../../models/user.model';
import { Notification } from '../../models/notification.model';
import { Feedback } from '../../models/feedback.model';

Chart.register(...registerables);

@Component({
  selector: 'app-patient-dashboard',
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
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <mat-icon class="text-white">person</mat-icon>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
                  <p class="text-gray-600">Welcome back, {{ currentUser?.firstName }}!</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button 
                mat-icon-button 
                [matBadge]="unreadNotifications" 
                matBadgeColor="warn"
                matTooltip="Notifications"
                (click)="openNotifications()"
              >
                <mat-icon>notifications</mat-icon>
              </button>
              
              <!-- User Menu -->
              <button mat-icon-button [matMenuTriggerFor]="userMenu">
                <mat-icon>account_circle</mat-icon>
              </button>
              <mat-menu #userMenu="matMenu">
                <button mat-menu-item routerLink="/patient/profile">
                  <mat-icon>person</mat-icon>
                  <span>Profile</span>
                </button>
                <button mat-menu-item routerLink="/patient/settings">
                  <mat-icon>settings</mat-icon>
                  <span>Settings</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="logout()">
                  <mat-icon>logout</mat-icon>
                  <span>Logout</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div *ngIf="isLoading" class="flex justify-center items-center h-64">
          <mat-spinner diameter="50"></mat-spinner>
        </div>

        <div *ngIf="!isLoading" class="space-y-8">
          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <mat-card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow" 
                      (click)="navigateToAppointments()">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-blue-100 text-sm font-medium">Upcoming Appointments</p>
                    <p class="text-3xl font-bold">{{ upcomingAppointmentsCount }}</p>
                  </div>
                  <mat-icon class="text-blue-200 text-4xl">event</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow" 
                      (click)="navigateToMedicalHistory()">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-green-100 text-sm font-medium">Completed Visits</p>
                    <p class="text-3xl font-bold">{{ completedVisitsCount }}</p>
                  </div>
                  <mat-icon class="text-green-200 text-4xl">check_circle</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow" 
                      (click)="navigateToMedicalHistory()">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-purple-100 text-sm font-medium">Medical Records</p>
                    <p class="text-3xl font-bold">{{ medicalRecordsCount }}</p>
                  </div>
                  <mat-icon class="text-purple-200 text-4xl">medical_services</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-shadow" 
                      (click)="navigateToFeedback()">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-orange-100 text-sm font-medium">Pending Feedback</p>
                    <p class="text-3xl font-bold">{{ pendingFeedbackCount }}</p>
                  </div>
                  <mat-icon class="text-orange-200 text-4xl">rate_review</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Main Dashboard Content -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column -->
            <div class="lg:col-span-2 space-y-8">
              <!-- Upcoming Appointments -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title class="flex items-center space-x-2">
                    <mat-icon>event</mat-icon>
                    <span>Upcoming Appointments</span>
                  </mat-card-title>
                  <mat-card-subtitle>Your scheduled appointments</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content class="p-0">
                  <div *ngIf="upcomingAppointments.length === 0" class="p-6 text-center text-gray-500">
                    <mat-icon class="text-4xl mb-4">event_busy</mat-icon>
                    <p>No upcoming appointments</p>
                    <button mat-raised-button color="primary" routerLink="/patient/appointments/book" class="mt-4">
                      Book Appointment
                    </button>
                  </div>
                  <mat-list *ngIf="upcomingAppointments.length > 0">
                    <mat-list-item *ngFor="let appointment of upcomingAppointments" class="border-b">
                      <div class="flex items-center justify-between w-full py-4">
                        <div class="flex items-center space-x-4">
                          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <mat-icon class="text-blue-600">person</mat-icon>
                          </div>
                          <div>
                            <h3 class="font-medium">Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}</h3>
                            <p class="text-sm text-gray-600">{{ appointment.doctor?.specialization }}</p>
                            <p class="text-sm text-gray-500">{{ appointment.appointmentDateTime | date:'medium' }}</p>
                          </div>
                        </div>
                        <div class="flex items-center space-x-2">
                          <mat-chip [color]="getStatusColor(appointment.status)" selected>
                            {{ appointment.status }}
                          </mat-chip>
                          <button mat-icon-button [matMenuTriggerFor]="appointmentMenu">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #appointmentMenu="matMenu">
                            <button mat-menu-item [routerLink]="['/patient/appointments', appointment.id]">
                              <mat-icon>visibility</mat-icon>
                              <span>View Details</span>
                            </button>
                            <button mat-menu-item (click)="rescheduleAppointment(appointment)">
                              <mat-icon>schedule</mat-icon>
                              <span>Reschedule</span>
                            </button>
                            <button mat-menu-item (click)="cancelAppointment(appointment)">
                              <mat-icon>cancel</mat-icon>
                              <span>Cancel</span>
                            </button>
                          </mat-menu>
                        </div>
                      </div>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
                <mat-card-actions class="p-4">
                  <button mat-button routerLink="/patient/appointments">View All Appointments</button>
                  <button mat-raised-button color="primary" routerLink="/patient/appointments/book">Book New Appointment</button>
                </mat-card-actions>
              </mat-card>

              <!-- Health Analytics -->
              @defer (on viewport) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="flex items-center space-x-2">
                      <mat-icon>analytics</mat-icon>
                      <span>Health Analytics</span>
                    </mat-card-title>
                    <mat-card-subtitle>Your health trends and insights</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #healthChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              } @placeholder {
                <div class="placeholder-card p-4 border border-dashed border-gray-300 rounded-lg flex items-center justify-center h-64">
                  <span class="text-gray-500">Health analytics will load when visible</span>
                </div>
              } @loading {
                <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
            </div>

            <!-- Right Column -->
            <div class="space-y-8">
              <!-- Quick Actions -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Quick Actions</mat-card-title>
                </mat-card-header>
                <mat-card-content class="p-4">
                  <div class="space-y-3">
                    <button mat-raised-button color="primary" routerLink="/patient/appointments/book" class="w-full">
                      <mat-icon>add</mat-icon>
                      Book Appointment
                    </button>
                    <button mat-outlined-button routerLink="/patient/medical-history" class="w-full">
                      <mat-icon>medical_services</mat-icon>
                      View Medical History
                    </button>
                    <button mat-outlined-button routerLink="/patient/doctors" class="w-full">
                      <mat-icon>search</mat-icon>
                      Find Doctors
                    </button>
                    <button mat-outlined-button routerLink="/patient/feedback" class="w-full">
                      <mat-icon>rate_review</mat-icon>
                      View Feedback
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Recent Medical Records -->
              @defer (on viewport) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Recent Medical Records</mat-card-title>
                  </mat-card-header>
                  <mat-card-content class="p-0">

                    <div *ngIf="recentMedicalHistory.length === 0" class="p-6 text-center text-gray-500">
                      <mat-icon class="text-4xl mb-4">medical_services</mat-icon>
                      <p>No medical records found</p>
                    </div>
                    <mat-list *ngIf="recentMedicalHistory.length > 0">
                      <mat-list-item *ngFor="let record of recentMedicalHistory" class="border-b">
                        <div class="w-full py-2">
                          <div class="flex items-center justify-between">
                            <div>
                              <h4 class="font-medium">{{ record.diagnosis }}</h4>
                              <p class="text-sm text-gray-600">{{ record.visitDate | date:'shortDate' }}</p>
                              <p class="text-sm text-gray-500">{{ record.treatment }}</p>
                            </div>
                            <button mat-icon-button [routerLink]="['/patient/medical-history', record.id]">
                              <mat-icon>visibility</mat-icon>
                            </button>
                          </div>
                        </div>
                      </mat-list-item>
                    </mat-list>
                  </mat-card-content>
                  <mat-card-actions class="p-4">
                    <button mat-button routerLink="/patient/medical-history">View All Records</button>
                  </mat-card-actions>
                </mat-card>
              } @placeholder {
                <div class="placeholder-card p-4 border border-dashed border-gray-300 rounded-lg flex items-center justify-center h-64">
                  <span class="text-gray-500">Medical records will load when visible</span>
                </div>
              } @loading {
                <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }

              <!-- Notifications -->
              @defer (on viewport) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Recent Notifications</mat-card-title>
                  </mat-card-header>
                  <mat-card-content class="p-0">
                    <div *ngIf="recentNotifications.length === 0" class="p-6 text-center text-gray-500">
                      <mat-icon class="text-4xl mb-4">notifications_none</mat-icon>
                      <p>No notifications</p>
                    </div>
                    <mat-list *ngIf="recentNotifications.length > 0">
                      <mat-list-item *ngFor="let notification of recentNotifications" class="border-b">
                        <div class="w-full py-2">
                          <div class="flex items-start space-x-3">
                            <mat-icon class="text-blue-600 mt-1">info</mat-icon>
                            <div class="flex-1">
                              <h4 class="font-medium text-sm">{{ notification.title }}</h4>
                              <p class="text-xs text-gray-600">{{ notification.message }}</p>
                              <p class="text-xs text-gray-500">{{ notification.createdAt | date:'short' }}</p>
                            </div>
                          </div>
                        </div>
                      </mat-list-item>
                    </mat-list>
                  </mat-card-content>
                  <mat-card-actions class="p-4">
                    <button mat-button routerLink="/patient/notifications">View All Notifications</button>
                  </mat-card-actions>
                </mat-card>
              } @placeholder {
                <div class="placeholder-card p-4 border border-dashed border-gray-300 rounded-lg flex items-center justify-center h-64">
                  <span class="text-gray-500">Notifications will load when visible</span>
                </div>
              } @loading {
                <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    mat-card {
      border-radius: 12px;
    }
    
    .mat-mdc-card-header {
      padding: 24px 24px 0 24px;
    }
    
    .mat-mdc-card-content {
      padding: 24px;
    }
    
    .mat-mdc-card-actions {
      padding: 16px 24px 24px 24px;
    }
  `]
})
export class PatientDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('healthChart', { static: false }) healthChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser: User | null = null;
  isLoading = true;
  
  // Dashboard data
  upcomingAppointments: Appointment[] = [];
  recentMedicalHistory: MedicalHistory[] = [];
  recentNotifications: Notification[] = [];
  patientFeedback: Feedback[] = [];
  
  // Stats
  upcomingAppointmentsCount = 0;
  completedVisitsCount = 0;
  medicalRecordsCount = 0;
  pendingFeedbackCount = 0;
  unreadNotifications = 0;
  
  // Chart
  private healthChart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private medicalHistoryService: MedicalHistoryService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private feedbackService: FeedbackService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupUserSubscription();
  }

  ngAfterViewInit(): void {
    // Wait for view to be initialized before creating charts
    setTimeout(() => {
      this.initializeHealthChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.healthChart) {
      this.healthChart.destroy();
    }
  }

  private setupUserSubscription(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all dashboard data in parallel
    forkJoin({
      profile: this.patientService.getMyProfile(this.currentUser?.username || ''),
      appointments: this.appointmentService.getPatientAppointments(),
      medicalHistory: this.medicalHistoryService.getRecentMedicalHistory(this.currentUser?.id || 0, 5),
      notifications: this.notificationService.getNotifications(),
      feedback: this.feedbackService.getFeedbackByPatient(this.currentUser?.id || 0),
      analytics: this.analyticsService.getPatientAnalytics(this.currentUser?.id || 0, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
        new Date().toISOString())
    }).subscribe({
      next: (data) => {
        console.log('Patient profile data:', data.profile);
        console.log('All appointments:', data.appointments);
        
        // Update current user with fresh profile data
        if (data.profile) {
          this.currentUser = { ...this.currentUser, ...data.profile };
        }
        
        // Filter upcoming appointments (PENDING, CONFIRMED, and future dates)
        const now = new Date();
        this.upcomingAppointments = data.appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointmentDateTime);
          const isUpcoming = appointmentDate >= now;
          const isValidStatus = apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.CONFIRMED;
          console.log(`Appointment ${apt.id}: Date=${appointmentDate}, Status=${apt.status}, IsUpcoming=${isUpcoming}, IsValidStatus=${isValidStatus}`);
          return isUpcoming && isValidStatus;
        });
        
        console.log('Filtered upcoming appointments:', this.upcomingAppointments);
        
        this.recentMedicalHistory = data.medicalHistory;
        this.recentNotifications = data.notifications.slice(0, 5);
        this.patientFeedback = data.feedback;
        
        this.calculateStats(data.appointments);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.snackBar.open('Error loading dashboard data', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private calculateStats(allAppointments: Appointment[]): void {
    this.upcomingAppointmentsCount = this.upcomingAppointments.length;
    this.completedVisitsCount = this.recentMedicalHistory.length;
    
    // Calculate pending feedback count (completed appointments without feedback)
    const completedAppointments = allAppointments.filter(apt => apt.status === AppointmentStatus.COMPLETED);
    const appointmentsWithFeedback = this.patientFeedback?.map(f => f.appointmentId) || [];
    this.pendingFeedbackCount = completedAppointments.filter(apt => 
       !appointmentsWithFeedback.includes(apt.id)
     ).length;
     this.medicalRecordsCount = this.recentMedicalHistory.length;
    this.unreadNotifications = this.recentNotifications.filter(n => n.status === 'PENDING').length;
  }

  private initializeHealthChart(): void {
    if (this.healthChartRef && this.healthChartRef.nativeElement && !this.healthChart) {
      const ctx = this.healthChartRef.nativeElement;
      this.healthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Health Score',
            data: [85, 88, 92, 87, 90, 94],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
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
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'primary';
      case AppointmentStatus.PENDING:
        return 'accent';
      case AppointmentStatus.COMPLETED:
        return 'warn';
      default:
        return 'primary';
    }
  }

  openNotifications(): void {
    this.router.navigate(['/patient/notifications']);
  }

  rescheduleAppointment(appointment: Appointment): void {
    // Implement reschedule logic
    this.snackBar.open('Reschedule feature coming soon!', 'Close', { duration: 3000 });
  }

  cancelAppointment(appointment: Appointment): void {
    // Implement cancel logic
    this.snackBar.open('Cancel feature coming soon!', 'Close', { duration: 3000 });
  }

  logout(): void {
    // Use synchronous logout to avoid backend 403 error
    this.authService.logoutSync();
    console.log('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }

  // Navigation methods for stat cards
  navigateToAppointments(): void {
    this.router.navigate(['/patient/appointments']);
  }

  navigateToMedicalHistory(): void {
    this.router.navigate(['/patient/medical-history']);
  }

  navigateToFeedback(): void {
    this.router.navigate(['/patient/feedback']);
  }
}
