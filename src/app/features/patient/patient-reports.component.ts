import { Component, Input, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { AnalyticsApiService } from '../../core/services/analytics.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { DoctorService, Doctor } from '../../core/services/doctor.service';

@Component({
  selector: 'app-patient-reports',
  standalone: true,
  imports: [CommonModule, ChartWidgetComponent, PatientLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-patient-layout>
      <div class="space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Analytics & Insights</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your health journey and appointment history.</p>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <i class="fa-regular fa-calendar"></i>
            <span>Last 12 Months</span>
          </div>
        </div>

        <!-- content -->
        <div *ngIf="!loadingReports; else loadingTpl" class="space-y-8 animate-in fade-in duration-500">
          
          <!-- Summary Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Appointments -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Appointments</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ patientAnalytics?.totalAppointments || 0 }}</div>
                <div class="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-arrow-up"></i>
                  <span>All time</span>
                </div>
              </div>
            </div>

            <!-- Avg Visits -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Avg. Visits / Month</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ patientAnalytics?.averageVisitsPerMonth || 0 }}</div>
                <div class="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-chart-line"></i>
                  <span>Activity Level</span>
                </div>
              </div>
            </div>

             <!-- Cancelled (Derived) -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Cancelled</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ patientAnalytics?.cancelledAppointments || 0 }}</div>
                <div class="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-ban"></i>
                  <span>Missed</span>
                </div>
              </div>
            </div>

            <!-- Completed (Derived) -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ patientAnalytics?.totalVisits || 0 }}</div>
                <div class="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-check-double"></i>
                  <span>Successful</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Total Spend -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Spend</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">₹{{ financialStats?.totalSpend || 0 }}</div>
                <div class="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-wallet"></i>
                  <span>Lifetime</span>
                </div>
              </div>
            </div>

            <!-- Appointment Spend -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-cyan-50 dark:bg-cyan-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Appointment Spend</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">₹{{ financialStats?.totalAppointmentSpend || 0 }}</div>
                <div class="mt-2 text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-user-doctor"></i>
                  <span>Consultations</span>
                </div>
              </div>
            </div>

            <!-- Lab Test Spend -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Lab Test Spend</div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">₹{{ financialStats?.totalLabTestSpend || 0 }}</div>
                <div class="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-flask"></i>
                  <span>Tests & Diagnostics</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Doctor Visits Chart -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Visits by Doctor</h3>
              <div class="flex-1 min-h-[300px]">
                <app-chart-widget
                  *ngIf="doctorVisitLabels.length > 0; else noDataDocs"
                  [type]="'bar'"
                  [labels]="doctorVisitLabels"
                  [data]="doctorVisitData"
                ></app-chart-widget>
                <ng-template #noDataDocs>
                  <div class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <i class="fa-solid fa-user-doctor text-4xl mb-3 opacity-20"></i>
                    <p>No doctor visit data available</p>
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- Appointment Status Chart -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Appointment Status</h3>
              <div class="flex-1 min-h-[300px]">
                <app-chart-widget
                  *ngIf="appointmentStatusData.length > 0 && hasData(appointmentStatusData); else noDataStatus"
                  [type]="'pie'"
                  [labels]="appointmentStatusLabels"
                  [data]="appointmentStatusData"
                ></app-chart-widget>
                 <ng-template #noDataStatus>
                  <div class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <i class="fa-regular fa-calendar-xmark text-4xl mb-3 opacity-20"></i>
                    <p>No appointment status data</p>
                  </div>
                </ng-template>
              </div>
            </div>

             <!-- Overview Bar Chart (Full Width) -->
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Appointment Overview</h3>
              <div class="flex-1 min-h-[300px]">
                 <app-chart-widget
                  *ngIf="overviewData.length > 0; else noDataOverview"
                  [type]="'bar'"
                  [labels]="overviewLabels"
                  [data]="overviewData"
                ></app-chart-widget>
                <ng-template #noDataOverview>
                   <div class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <i class="fa-solid fa-chart-simple text-4xl mb-3 opacity-20"></i>
                    <p>No overview data available</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>

        </div>

        <ng-template #loadingTpl>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
             <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" *ngFor="let i of [1,2,3,4]"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 animate-pulse">
             <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" *ngFor="let i of [1,2,3]"></div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-pulse">
             <div class="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
             <div class="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
             <div class="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl lg:col-span-2"></div>
          </div>
        </ng-template>
      </div>
    </app-patient-layout>
  `,
})
export class PatientReportsComponent implements OnInit {
  @Input() patientId: number | null = null;

  private auth = inject(AuthService);
  private reportsApi = inject(ReportsApiService);
  private analyticsApi = inject(AnalyticsApiService);
  private cdr = inject(ChangeDetectorRef);
  private doctorApi = inject(DoctorService);

  patientAnalytics: any = null;
  financialStats: any = null;

  // Chart data holders
  doctorVisitLabels: string[] = [];
  doctorVisitData: number[] = [];
  appointmentStatusLabels: string[] = ['Completed', 'Cancelled'];
  appointmentStatusData: number[] = [];
  overviewLabels: string[] = [];
  overviewData: number[] = [];

  // Doctors mapping for label resolution
  doctors: Doctor[] = [];
  doctorNameById: Record<number, string> = {};

  // Loading state for the whole reports page
  loadingReports = true;
  private pendingLoads = 0;

  ngOnInit(): void {
    if (this.patientId == null) {
      const idStr = this.auth.userId();
      this.patientId = idStr ? Number(idStr) : null;
    }
    // Determine how many async loads we will wait for
    this.pendingLoads = this.patientId == null ? 1 : 3;
    this.loadingReports = true;
    if (this.patientId != null) {
      this.loadPatientAnalytics();
      this.loadFinancialStats();
    }
    this.loadDoctors();
  }

  hasData(data: number[]): boolean {
    return data.some(v => v > 0);
  }

  loadPatientAnalytics() {
    if (this.patientId == null) return;
    this.reportsApi.getPatientAnalytics(this.patientId).subscribe({
      next: (res) => {
        this.patientAnalytics = res || null;
        // Update doctor visits chart with resolved doctor names
        this.updateDoctorVisitsChart();

        // Correct appointment status chart using completed = totalVisits
        const completed = Number(this.patientAnalytics?.totalVisits || 0);
        const cancelled = Number(this.patientAnalytics?.cancelledAppointments || 0);
        this.appointmentStatusData = [completed, cancelled];

        // Overview chart
        const total = Number(this.patientAnalytics?.totalAppointments || 0);
        const avgPerMonth = Number(this.patientAnalytics?.averageVisitsPerMonth || 0);
        this.overviewLabels = ['Total Appointments', 'Avg Visits/Month'];
        this.overviewData = [total, avgPerMonth];
        this.cdr.markForCheck();
        this.completeLoad();
      },
      error: () => {
        this.patientAnalytics = null;
        this.cdr.markForCheck();
        this.completeLoad();
      },
    });
  }

  loadFinancialStats() {
    if (this.patientId == null) return;
    this.analyticsApi.getPatientFinancialStats(this.patientId).subscribe({
      next: (res) => {
        this.financialStats = res || null;
        this.cdr.markForCheck();
        this.completeLoad();
      },
      error: () => {
        this.financialStats = null;
        this.cdr.markForCheck();
        this.completeLoad();
      }
    });
  }

  private loadDoctors() {
    this.doctorApi.getAllForPatients().subscribe({
      next: (list) => {
        this.doctors = list || [];
        this.doctorNameById = {};
        for (const d of this.doctors) {
          this.doctorNameById[d.id] = this.formatDoctorName(d);
        }
        // Recompute chart labels now that we have names
        this.updateDoctorVisitsChart();
        this.cdr.markForCheck();
        this.completeLoad();
      },
      error: () => {
        // Still complete the loading state even if doctors fail to load
        this.cdr.markForCheck();
        this.completeLoad();
      },
    });
  }

  private updateDoctorVisitsChart() {
    const visits: Record<string, number> = (this.patientAnalytics?.doctorVisitCount) || {};
    const ids = Object.keys(visits);
    this.doctorVisitLabels = ids.map((idStr) => {
      const id = Number(idStr);
      return this.doctorNameById[id] || `Doctor ${id}`;
    });
    this.doctorVisitData = ids.map((k) => Number(visits[k] || 0));
  }

  private formatDoctorName(d: Doctor): string {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const hasPrefix = /^dr\.?\s/i.test(base);
    return hasPrefix ? base : `Dr ${base}`;
  }

  private completeLoad() {
    this.pendingLoads = Math.max(this.pendingLoads - 1, 0);
    if (this.pendingLoads === 0) {
      this.loadingReports = false;
      this.cdr.markForCheck();
    }
  }
}
