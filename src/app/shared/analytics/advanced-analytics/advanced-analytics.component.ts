import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

import { AnalyticsService } from '../../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-advanced-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
            <p class="text-gray-600">Comprehensive insights and data visualization</p>
          </div>
          
          <!-- Date Range Selector -->
          <div class="flex items-center space-x-4">
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
            
            <button 
              mat-raised-button 
              color="primary" 
              (click)="updateAnalytics()"
              [disabled]="isLoading"
            >
              <mat-spinner *ngIf="isLoading" diameter="20" class="mr-2"></mat-spinner>
              Update
            </button>
          </div>
        </div>

        <!-- Analytics Tabs -->
        <mat-tab-group class="bg-white rounded-lg shadow-lg">
          <!-- Overview Tab -->
          <mat-tab label="Overview">
            <div class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Key Metrics -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Key Performance Indicators</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <p class="text-2xl font-bold text-blue-600">{{ totalUsers }}</p>
                        <p class="text-sm text-blue-800">Total Users</p>
                      </div>
                      <div class="text-center p-4 bg-green-50 rounded-lg">
                        <p class="text-2xl font-bold text-green-600">{{ activeUsers }}</p>
                        <p class="text-sm text-green-800">Active Users</p>
                      </div>
                      <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <p class="text-2xl font-bold text-purple-600">{{ totalRevenue | currency }}</p>
                        <p class="text-sm text-purple-800">Total Revenue</p>
                      </div>
                      <div class="text-center p-4 bg-orange-50 rounded-lg">
                        <p class="text-2xl font-bold text-orange-600">{{ avgRating }}/5</p>
                        <p class="text-sm text-orange-800">Avg Rating</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- User Growth Chart -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>User Growth Trend</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #userGrowthChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- User Analytics Tab -->
          <mat-tab label="User Analytics">
            <div class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- User Demographics -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>User Demographics</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #demographicsChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- User Activity Heatmap -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>User Activity Heatmap</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #activityHeatmapChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Financial Analytics Tab -->
          <mat-tab label="Financial Analytics">
            <div class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Revenue Analysis -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Revenue Analysis</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #revenueChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Profit Margins -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Profit Margins by Service</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #profitMarginsChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Operational Analytics Tab -->
          <mat-tab label="Operational Analytics">
            <div class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Appointment Analytics -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Appointment Analytics</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #appointmentChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- System Performance -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>System Performance Metrics</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="h-64">
                      <canvas #performanceChart></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Additional Insights -->
        <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Trending Topics -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Trending Topics</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="space-y-3">
                <div *ngFor="let topic of trendingTopics" class="flex items-center justify-between">
                  <span class="text-sm font-medium">{{ topic.name }}</span>
                  <mat-chip [color]="topic.trend === 'up' ? 'primary' : 'warn'" selected>
                    {{ topic.percentage }}%
                  </mat-chip>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Anomaly Detection -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Anomaly Detection</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="space-y-3">
                <div *ngFor="let anomaly of anomalies" class="flex items-center space-x-3">
                  <mat-icon [class]="anomaly.severity === 'high' ? 'text-red-600' : 'text-yellow-600'">
                    {{ anomaly.severity === 'high' ? 'warning' : 'info' }}
                  </mat-icon>
                  <div>
                    <p class="text-sm font-medium">{{ anomaly.description }}</p>
                    <p class="text-xs text-gray-500">{{ anomaly.timestamp | date:'short' }}</p>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Predictive Insights -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Predictive Insights</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="space-y-3">
                <div *ngFor="let insight of predictiveInsights" class="p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm font-medium text-blue-900">{{ insight.title }}</p>
                  <p class="text-xs text-blue-700 mt-1">{{ insight.description }}</p>
                  <p class="text-xs text-blue-600 mt-2">Confidence: {{ insight.confidence }}%</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
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
    
    .mat-mdc-tab-group {
      border-radius: 12px;
    }
  `]
})
export class AdvancedAnalyticsComponent implements OnInit, OnDestroy {
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  endDate = new Date();
  isLoading = false;
  
  // Mock data
  totalUsers = 1250;
  activeUsers = 890;
  totalRevenue = 125000;
  avgRating = 4.6;
  
  trendingTopics = [
    { name: 'Telemedicine', percentage: 15, trend: 'up' },
    { name: 'Mental Health', percentage: 12, trend: 'up' },
    { name: 'Preventive Care', percentage: 8, trend: 'up' },
    { name: 'Chronic Disease', percentage: -5, trend: 'down' }
  ];
  
  anomalies = [
    { severity: 'high', description: 'Unusual spike in appointment cancellations', timestamp: new Date() },
    { severity: 'medium', description: 'Increased response time detected', timestamp: new Date(Date.now() - 1000 * 60 * 60) }
  ];
  
  predictiveInsights = [
    { title: 'User Growth Prediction', description: 'Expected 20% increase in new users next month', confidence: 85 },
    { title: 'Revenue Forecast', description: 'Revenue likely to grow by 15% in Q2', confidence: 78 },
    { title: 'Peak Usage Times', description: 'System usage peaks between 2-4 PM daily', confidence: 92 }
  ];
  
  // Charts
  private userGrowthChart: Chart | null = null;
  private demographicsChart: Chart | null = null;
  private activityHeatmapChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private profitMarginsChart: Chart | null = null;
  private appointmentChart: Chart | null = null;
  private performanceChart: Chart | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeCharts();
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyAllCharts();
  }

  updateAnalytics(): void {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('Analytics updated successfully!', 'Close', { duration: 3000 });
    }, 2000);
  }

  private initializeCharts(): void {
    this.initializeUserGrowthChart();
    this.initializeDemographicsChart();
    this.initializeActivityHeatmapChart();
    this.initializeRevenueChart();
    this.initializeProfitMarginsChart();
    this.initializeAppointmentChart();
    this.initializePerformanceChart();
  }

  private initializeUserGrowthChart(): void {
    const ctx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (ctx) {
      this.userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'New Users',
            data: [120, 150, 180, 200, 220, 250],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private initializeDemographicsChart(): void {
    const ctx = document.getElementById('demographicsChart') as HTMLCanvasElement;
    if (ctx) {
      this.demographicsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['18-25', '26-35', '36-45', '46-55', '55+'],
          datasets: [{
            data: [25, 35, 20, 15, 5],
            backgroundColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(147, 51, 234)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  private initializeActivityHeatmapChart(): void {
    const ctx = document.getElementById('activityHeatmapChart') as HTMLCanvasElement;
    if (ctx) {
      this.activityHeatmapChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Activity Level',
            data: [85, 90, 75, 95, 80, 60, 45],
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }
  }

  private initializeRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (ctx) {
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [85000, 92000, 105000, 112000, 118000, 125000],
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
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private initializeProfitMarginsChart(): void {
    const ctx = document.getElementById('profitMarginsChart') as HTMLCanvasElement;
    if (ctx) {
      this.profitMarginsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Consultations', 'Procedures', 'Medications', 'Lab Tests'],
          datasets: [{
            label: 'Profit Margin %',
            data: [65, 45, 30, 55],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { beginAtZero: true, max: 100 }
          }
        }
      });
    }
  }

  private initializeAppointmentChart(): void {
    const ctx = document.getElementById('appointmentChart') as HTMLCanvasElement;
    if (ctx) {
      this.appointmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'],
          datasets: [{
            label: 'Appointments',
            data: [12, 18, 22, 8, 15, 20, 16, 10],
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private initializePerformanceChart(): void {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (ctx) {
      this.performanceChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Response Time', 'Uptime', 'User Satisfaction', 'Data Accuracy', 'Security'],
          datasets: [{
            label: 'Current Performance',
            data: [85, 98, 92, 95, 99],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
            pointBackgroundColor: 'rgb(147, 51, 234)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(147, 51, 234)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20
              }
            }
          }
        }
      });
    }
  }

  private destroyAllCharts(): void {
    const charts = [
      this.userGrowthChart,
      this.demographicsChart,
      this.activityHeatmapChart,
      this.revenueChart,
      this.profitMarginsChart,
      this.appointmentChart,
      this.performanceChart
    ];
    
    charts.forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }
}
