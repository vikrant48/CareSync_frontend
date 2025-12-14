import { Component, Input, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';

@Component({
  selector: 'app-doctor-reports',
  standalone: true,
  imports: [CommonModule, ChartWidgetComponent, DoctorLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics & Insights</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Track your performance and patient engagement metrics.</p>
          </div>
          <div class="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
             <i class="fa-regular fa-calendar text-blue-500"></i>
             <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ analyticsRangeText || 'Last 30 Days' }}</span>
          </div>
        </div>

        <!-- Key Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Appointments -->
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i class="fa-solid fa-calendar-check text-5xl"></i>
                </div>
                <p class="text-blue-100 text-sm font-medium mb-1">Total Appointments</p>
                <div class="flex items-end gap-2">
                    <h3 class="text-3xl font-bold">{{ overall?.totalAppointments ?? '-' }}</h3>
                    <span *ngIf="loadingOverall" class="text-xs animate-pulse">Loading...</span>
                </div>
                <div class="mt-2 text-xs text-blue-100/80 bg-white/10 inline-block px-2 py-0.5 rounded-lg backdrop-blur-sm">
                   Last 30 days
                </div>
            </div>

            <!-- Revenue -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                 <div class="absolute top-0 right-0 p-4 text-gray-100 dark:text-gray-700 group-hover:text-green-500/10 transition-colors">
                    <i class="fa-solid fa-sack-dollar text-5xl"></i>
                </div>
                <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Revenue</p>
                <div class="flex items-end gap-2">
                     <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ overall?.totalRevenue ?? '-' }}</h3>
                     <span *ngIf="loadingOverall" class="text-xs text-gray-400 animate-pulse">Loading...</span>
                </div>
                <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                   <i class="fa-solid fa-arrow-trend-up"></i>
                   <span class="text-gray-500 dark:text-gray-400 font-normal">Gross income</span>
                </p>
            </div>

             <!-- Avg Rating -->
             <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-yellow-200 dark:hover:border-yellow-800 transition-colors">
                <div class="absolute top-0 right-0 p-4 text-gray-100 dark:text-gray-700 group-hover:text-yellow-500/10 transition-colors">
                   <i class="fa-solid fa-star text-5xl"></i>
               </div>
               <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Average Rating</p>
               <div class="flex items-end gap-2">
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ overall?.avgRating ?? '-' }}</h3>
                    <i class="fa-solid fa-star text-yellow-400 text-xl mb-1"></i>
                    <span *ngIf="loadingOverall" class="text-xs text-gray-400 animate-pulse">Loading...</span>
               </div>
                <p class="text-xs text-gray-400 mt-2">Based on patient feedback</p>
           </div>
           
           <!-- Completion Rate -->
           <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
               <div class="absolute top-0 right-0 p-4 text-gray-100 dark:text-gray-700 group-hover:text-purple-500/10 transition-colors">
                  <i class="fa-solid fa-clipboard-check text-5xl"></i>
              </div>
              <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completion Rate</p>
              <div class="flex items-end gap-2">
                   <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ retention?.retentionRate ?? '-' }}%</h3>
                   <span *ngIf="loadingRetention" class="text-xs text-gray-400 animate-pulse">Loading...</span>
              </div>
               <p class="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium flex items-center gap-1">
                   New vs Returning Ratio
               </p>
          </div>
        </div>

        <!-- Charts Grid 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Peak Hours -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Hourly Distribution</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Peak hour: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ peakHours?.peakHour ?? '-' }}</span></p>
                    </div>
                    <div *ngIf="loadingPeakHours" class="text-blue-600 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                <div class="h-64 w-full">
                     <app-chart-widget
                        *ngIf="peakHours?.hourlyDistribution"
                        [type]="'bar'"
                        [labels]="peakHoursLabels"
                        [data]="peakHoursData"
                      ></app-chart-widget>
                </div>
            </div>

            <!-- Day of Week -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Weekly Activity</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Busiest day: <span class="font-semibold text-purple-600 dark:text-purple-400">{{ dayOfWeek?.busiestDay ?? '-' }}</span></p>
                    </div>
                     <div *ngIf="loadingDayOfWeek" class="text-purple-600 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                 <div class="h-64 w-full">
                    <app-chart-widget
                      *ngIf="dayOfWeek?.dayDistribution"
                      [type]="'bar'"
                      [labels]="dayOfWeekLabels"
                      [data]="dayOfWeekData"
                    ></app-chart-widget>
                 </div>
            </div>
        </div>

        <!-- Feedback & Demographics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Feedback Sentiment -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-1">
                 <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-gray-900 dark:text-white">Patient Sentiment</h3>
                    <div *ngIf="loadingFeedbackSentiment" class="text-gray-400 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                 <div class="h-64 w-full relative">
                    <app-chart-widget
                      *ngIf="feedbackSentiment"
                      [type]="'pie'"
                      [labels]="feedbackLabels"
                      [data]="feedbackData"
                    ></app-chart-widget>
                 </div>
                 <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                     <div class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                         <div class="font-bold text-lg">{{ feedbackSentiment?.positivePercentage ?? 0 }}%</div>
                         <div>Positive</div>
                     </div>
                      <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                         <div class="font-bold text-lg">{{ feedbackSentiment?.neutralPercentage ?? 0 }}%</div>
                         <div>Neutral</div>
                     </div>
                      <div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                         <div class="font-bold text-lg">{{ feedbackSentiment?.negativePercentage ?? 0 }}%</div>
                         <div>Negative</div>
                     </div>
                 </div>
            </div>

            <!-- Patient Demographics -->
             <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
                 <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-gray-900 dark:text-white">Patient Demographics</h3>
                    <div *ngIf="loadingPatientDemographics" class="text-gray-400 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                 <div class="h-64 w-full">
                   <app-chart-widget
                    *ngIf="patientDemographics?.ageDistribution"
                    [type]="'bar'"
                    [labels]="demographicsLabels"
                    [data]="demographicsData"
                  ></app-chart-widget>
                 </div>
            </div>
        </div>

        <!-- Appointment Trends -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
             <div class="flex items-center justify-between mb-6">
                <div>
                     <h3 class="font-bold text-gray-900 dark:text-white">Daily Appointment Trends</h3>
                     <p class="text-sm text-gray-500 dark:text-gray-400">Last 30 days activity</p>
                </div>
                <div *ngIf="loadingAppointmentTrendsDaily" class="text-indigo-600 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
            </div>
             <div class="h-72 w-full flex items-center justify-center">
               <app-chart-widget
                *ngIf="!loadingAppointmentTrendsDaily && dailyTrendLabels.length > 0; else noTrendData"
                class="w-full h-full"
                [type]="'line'"
                [labels]="dailyTrendLabels"
                [data]="dailyTrendData"
              ></app-chart-widget>
              <ng-template #noTrendData>
                  <div *ngIf="!loadingAppointmentTrendsDaily" class="text-center text-gray-400">
                      <i class="fa-solid fa-chart-line text-4xl mb-2 opacity-50"></i>
                      <p>No appointment data for this period</p>
                  </div>
              </ng-template>
             </div>
        </div>

        <!-- Seasonal & Cancellation -->
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Seasonal Trends -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                 <div class="flex items-center justify-between mb-6">
                    <div>
                         <h3 class="font-bold text-gray-900 dark:text-white">Seasonal Trends</h3>
                         <p class="text-sm text-gray-500 dark:text-gray-400">Year: {{ seasonalTrends?.year || currentYear }} | Peak: {{ seasonalTrends?.busiestSeason ?? '-' }}</p>
                    </div>
                    <div *ngIf="loadingSeasonalTrends" class="text-teal-600 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                <div class="h-64 w-full">
                   <app-chart-widget
                    *ngIf="seasonalTrends?.monthlyDistribution"
                    [type]="'line'"
                    [labels]="seasonalLabels"
                    [data]="seasonalData"
                  ></app-chart-widget>
                </div>
            </div>

            <!-- Cancellation Stats -->
             <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                 <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-gray-900 dark:text-white">Cancellation Insights</h3>
                    <div *ngIf="loadingCancellationPatterns" class="text-red-500 animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Cancellation Rate</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ cancellationPatterns?.cancellationRate ?? '0' }}%</p>
                    </div>
                     <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Most Common Time</p>
                        <p class="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate" [title]="cancellationPatterns?.commonTiming">
                            {{ cancellationPatterns?.commonTiming ?? 'N/A' }}
                        </p>
                    </div>
                </div>
                 <div class="space-y-3">
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Average Duration Gaps</h4>
                    <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                        <span class="text-gray-600 dark:text-gray-400">Average</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ appointmentDuration?.averageGapMinutes ?? 0 }}m</span>
                    </div>
                     <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                        <span class="text-gray-600 dark:text-gray-400">Minimum</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ appointmentDuration?.minGapMinutes ?? 0 }}m</span>
                    </div>
                     <div class="flex items-center justify-between text-sm py-2">
                        <span class="text-gray-600 dark:text-gray-400">Maximum</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ appointmentDuration?.maxGapMinutes ?? 0 }}m</span>
                    </div>
                 </div>
            </div>
         </div>
      </div>
    </app-doctor-layout>
  `,
  styles: [`
    :host { display: block; }
    .pattern-dots {
      background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }
    :host-context(.dark) .pattern-dots {
      background-image: radial-gradient(#374151 1.5px, transparent 1.5px);
    }
  `]
})
export class DoctorReportsComponent implements OnInit {
  @Input() doctorId: number | null = null;

  private auth = inject(AuthService);
  private analyticsApi = inject(AnalyticsApiService);
  private reportsApi = inject(ReportsApiService);
  private cdr = inject(ChangeDetectorRef);

  overall: OverallAnalytics | null = null;
  peakHours: any = null;
  dayOfWeek: any = null;
  retention: any = null;
  feedbackSentiment: any = null;
  performance: any = null;
  appointmentDuration: any = null;
  seasonalTrends: any = null;
  cancellationPatterns: any = null;
  patientDemographics: any = null;
  appointmentTrendsDaily: any = null;
  revenueAnalysis: any = null;
  analyticsRangeText: string | null = null;
  currentYear: number = new Date().getFullYear();

  peakHoursLabels: string[] = [];
  peakHoursData: number[] = [];
  dayOfWeekLabels: string[] = [];
  dayOfWeekData: number[] = [];
  feedbackLabels: string[] = ['Positive', 'Neutral', 'Negative'];
  feedbackData: number[] = [];
  demographicsLabels: string[] = [];
  demographicsData: number[] = [];
  seasonalLabels: string[] = [];
  seasonalData: number[] = [];
  dailyTrendLabels: string[] = [];
  dailyTrendData: number[] = [];

  // Per-card loading flags
  loadingOverall = true;
  loadingPeakHours = true;
  loadingDayOfWeek = true;
  loadingRetention = true;
  loadingFeedbackSentiment = true;
  loadingPerformance = true;
  loadingAppointmentDuration = true;
  loadingCancellationPatterns = true;
  loadingPatientDemographics = true;
  loadingSeasonalTrends = true;
  loadingAppointmentTrendsDaily = true;
  loadingRevenueAnalysis = true;

  ngOnInit(): void {
    if (this.doctorId == null) {
      const idStr = this.auth.userId();
      this.doctorId = idStr ? Number(idStr) : null;
    }
    this.loadAnalytics();
  }

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  loadAnalytics() {
    if (this.doctorId == null) return;
    const end = new Date().toISOString().slice(0, 10);
    const start = this.isoDaysAgo(30);
    this.analyticsRangeText = `${start}  ${end}`;
    // Initialize all loading flags
    this.loadingOverall = true;
    this.loadingPeakHours = true;
    this.loadingDayOfWeek = true;
    this.loadingRetention = true;
    this.loadingFeedbackSentiment = true;
    this.loadingPerformance = true;
    this.loadingAppointmentDuration = true;
    this.loadingCancellationPatterns = true;
    this.loadingPatientDemographics = true;
    this.loadingSeasonalTrends = true;
    this.loadingAppointmentTrendsDaily = true;
    this.loadingRevenueAnalysis = true;

    this.analyticsApi.getOverallAnalytics(start, end).subscribe({
      next: (o) => { this.overall = o || null; this.loadingOverall = false; this.cdr.markForCheck(); },
      error: () => { this.overall = null; this.loadingOverall = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getPeakHours(this.doctorId, start, end).subscribe({
      next: (res) => {
        this.peakHours = res || null;
        const dist = this.peakHours?.hourlyDistribution || {};
        const labels = Object.keys(dist).sort((a, b) => Number(a) - Number(b));
        this.peakHoursLabels = labels;
        this.peakHoursData = labels.map((k) => Number(dist[k] || 0));
        this.loadingPeakHours = false;
        this.cdr.markForCheck();
      },
      error: () => { this.peakHours = null; this.loadingPeakHours = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getDayOfWeek(this.doctorId, start, end).subscribe({
      next: (res) => {
        this.dayOfWeek = res || null;
        const dist = this.dayOfWeek?.dayDistribution || {};
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const labels = order.filter((d) => (dist as any).hasOwnProperty(d));
        this.dayOfWeekLabels = labels;
        this.dayOfWeekData = labels.map((k) => Number(dist[k] || 0));
        this.loadingDayOfWeek = false;
        this.cdr.markForCheck();
      },
      error: () => { this.dayOfWeek = null; this.loadingDayOfWeek = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getPatientRetention(this.doctorId).subscribe({
      next: (res) => { this.retention = res || null; this.loadingRetention = false; this.cdr.markForCheck(); },
      error: () => { this.retention = null; this.loadingRetention = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getFeedbackSentiment(this.doctorId).subscribe({
      next: (res) => {
        this.feedbackSentiment = res || null;
        const s: any = this.feedbackSentiment || {};
        this.feedbackData = [Number(s.positivePercentage || 0), Number(s.neutralPercentage || 0), Number(s.negativePercentage || 0)];
        this.loadingFeedbackSentiment = false;
        this.cdr.markForCheck();
      },
      error: () => { this.feedbackSentiment = null; this.loadingFeedbackSentiment = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getAppointmentDuration(this.doctorId, start, end).subscribe({
      next: (res) => { this.appointmentDuration = res || null; this.loadingAppointmentDuration = false; this.cdr.markForCheck(); },
      error: () => { this.appointmentDuration = null; this.loadingAppointmentDuration = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getSeasonalTrends(this.doctorId, new Date().getFullYear()).subscribe({
      next: (res) => {
        this.seasonalTrends = res || null;
        const dist = this.seasonalTrends?.monthlyDistribution || {};
        const order = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const labels = order.filter((m) => (dist as any).hasOwnProperty(m));
        this.seasonalLabels = labels;
        this.seasonalData = labels.map((k) => Number(dist[k] || 0));
        this.loadingSeasonalTrends = false;
        this.cdr.markForCheck();
      },
      error: () => { this.seasonalTrends = null; this.loadingSeasonalTrends = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getCancellationPatterns(this.doctorId, start, end).subscribe({
      next: (res) => { this.cancellationPatterns = res || null; this.loadingCancellationPatterns = false; this.cdr.markForCheck(); },
      error: () => { this.cancellationPatterns = null; this.loadingCancellationPatterns = false; this.cdr.markForCheck(); }
    });
    this.analyticsApi.getPatientDemographicsByDoctor(this.doctorId).subscribe({
      next: (res) => {
        this.patientDemographics = res || null;
        const dist = this.patientDemographics?.ageDistribution || {};
        const labels = Object.keys(dist);
        this.demographicsLabels = labels;
        this.demographicsData = labels.map((k) => Number(dist[k] || 0));
        this.loadingPatientDemographics = false;
        this.cdr.markForCheck();
      },
      error: () => { this.patientDemographics = null; this.loadingPatientDemographics = false; this.cdr.markForCheck(); }
    });
    this.reportsApi.getDoctorPerformance(this.doctorId, start, end).subscribe({
      next: (res) => { this.performance = res || null; this.loadingPerformance = false; this.cdr.markForCheck(); },
      error: () => { this.performance = null; this.loadingPerformance = false; this.cdr.markForCheck(); }
    });
    this.reportsApi.getAppointmentTrends('daily', start, end).subscribe({
      next: (res) => {
        this.appointmentTrendsDaily = res || null;
        const dist = this.appointmentTrendsDaily?.daily || {};
        const labels = Object.keys(dist).sort((a, b) => a.localeCompare(b));
        this.dailyTrendLabels = labels;
        this.dailyTrendData = labels.map((k) => Number(dist[k] || 0));
        this.loadingAppointmentTrendsDaily = false;
        this.cdr.markForCheck();
      },
      error: () => { this.appointmentTrendsDaily = null; this.loadingAppointmentTrendsDaily = false; this.cdr.markForCheck(); }
    });
    this.reportsApi.getRevenueAnalysis(start, end).subscribe({
      next: (res) => { this.revenueAnalysis = res || null; this.loadingRevenueAnalysis = false; this.cdr.markForCheck(); },
      error: () => { this.revenueAnalysis = null; this.loadingRevenueAnalysis = false; this.cdr.markForCheck(); }
    });
  }
}
