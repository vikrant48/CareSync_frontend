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
    <div class="panel p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Insights / Reports</h2>
      </div>
      <!-- Insights & Analytics -->
      <section class="p-4 border rounded">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">Insights</h3>
        <div class="text-xs text-gray-400" *ngIf="analyticsRangeText">{{ analyticsRangeText }}</div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Overall (last 30d)</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingOverall">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Total Appointments: {{ overall?.totalAppointments ?? '�' }}</div>
            <div>Average Rating: {{ overall?.avgRating ?? '�' }}</div>
            <div>Total Revenue: {{ overall?.totalRevenue ?? '�' }}</div>
          </div>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Peak Hours</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingPeakHours">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Peak Hour: {{ peakHours?.peakHour ?? '�' }}</div>
            <div>Total Appointments: {{ peakHours?.totalAppointments ?? '�' }}</div>
          </div>
          <app-chart-widget
            *ngIf="peakHours?.hourlyDistribution"
            title="Hourly Distribution"
            [type]="'bar'"
            [labels]="peakHoursLabels"
            [data]="peakHoursData"
          ></app-chart-widget>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Patient Retention</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingRetention">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>New: {{ retention?.newPatients ?? '�' }}</div>
            <div>Returning: {{ retention?.returningPatients ?? '�' }}</div>
            <div>Retention Rate: {{ retention?.retentionRate ?? '�' }}%</div>
          </div>
        </div>
      </div>

       <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
         <div class="p-4 border rounded">
         <div class="text-sm text-gray-400">Day of Week</div>
           <div class="text-xs text-gray-500 mt-1" *ngIf="loadingDayOfWeek">
             <span class="inline-flex items-center gap-1">
               <i class="fa-solid fa-spinner animate-spin"></i>
               <span>Loading…</span>
             </span>
           </div>
           <div class="mt-2 text-sm">
             <div>Busiest Day: {{ dayOfWeek?.busiestDay ?? '�' }}</div>
           </div>
           <app-chart-widget
             *ngIf="dayOfWeek?.dayDistribution"
             title="Day Distribution"
             [type]="'bar'"
             [labels]="dayOfWeekLabels"
             [data]="dayOfWeekData"
           ></app-chart-widget>
         </div>
         <div class="p-4 border rounded">
           <div class="text-sm text-gray-400">Feedback Sentiment</div>
           <div class="text-xs text-gray-500 mt-1" *ngIf="loadingFeedbackSentiment">
             <span class="inline-flex items-center gap-1">
               <i class="fa-solid fa-spinner animate-spin"></i>
               <span>Loading…</span>
             </span>
           </div>
           <div class="mt-2 text-sm">
             <div>Positive: {{ feedbackSentiment?.positivePercentage ?? '�' }}%</div>
             <div>Neutral: {{ feedbackSentiment?.neutralPercentage ?? '�' }}%</div>
             <div>Negative: {{ feedbackSentiment?.negativePercentage ?? '�' }}%</div>
           </div>
           <app-chart-widget
             *ngIf="feedbackSentiment"
             title="Sentiment"
             [type]="'pie'"
             [labels]="feedbackLabels"
             [data]="feedbackData"
           ></app-chart-widget>
         </div>
         <div class="p-4 border rounded">
           <div class="text-sm text-gray-400">Performance</div>
           <div class="text-xs text-gray-500 mt-1" *ngIf="loadingPerformance">
             <span class="inline-flex items-center gap-1">
               <i class="fa-solid fa-spinner animate-spin"></i>
               <span>Loading…</span>
             </span>
           </div>
           <div class="mt-2 text-sm">
             <div>Completed: {{ performance?.completedAppointments ?? '�' }}</div>
             <div>Cancellation Rate: {{ performance?.cancellationRate ?? '�' }}%</div>
             <div>Avg Rating: {{ performance?.averageRating ?? '�' }}</div>
           </div>
         </div>
       </div>

      <!-- More Insights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Appointment Duration</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingAppointmentDuration">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Average Gap: {{ appointmentDuration?.averageGapMinutes ?? '�' }}m</div>
            <div>Min Gap: {{ appointmentDuration?.minGapMinutes ?? '�' }}m</div>
            <div>Max Gap: {{ appointmentDuration?.maxGapMinutes ?? '�' }}m</div>
          </div>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Cancellation Patterns</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingCancellationPatterns">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Total: {{ cancellationPatterns?.totalCancellations ?? '�' }}</div>
            <div>Rate: {{ cancellationPatterns?.cancellationRate ?? '�' }}%</div>
            <div>Common Timing: {{ cancellationPatterns?.commonTiming ?? '�' }}</div>
          </div>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Patient Demographics</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingPatientDemographics">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div *ngFor="let kv of (patientDemographics?.ageDistribution | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
          </div>
          <app-chart-widget
            *ngIf="patientDemographics?.ageDistribution"
            title="Age Distribution"
            [type]="'bar'"
            [labels]="demographicsLabels"
            [data]="demographicsData"
          ></app-chart-widget>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Seasonal Trends ({{ seasonalTrends?.year || currentYear }})</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingSeasonalTrends">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Busiest Season: {{ seasonalTrends?.busiestSeason ?? '�' }}</div>
            <div *ngFor="let kv of (seasonalTrends?.monthlyDistribution | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
          </div>
          <app-chart-widget
            *ngIf="seasonalTrends?.monthlyDistribution"
            title="Monthly Distribution"
            [type]="'line'"
            [labels]="seasonalLabels"
            [data]="seasonalData"
          ></app-chart-widget>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Appointment Trends (30d)</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingAppointmentTrendsDaily">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div *ngFor="let kv of (appointmentTrendsDaily?.daily | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
          </div>
          <app-chart-widget
            *ngIf="appointmentTrendsDaily?.daily"
            title="Daily Appointments"
            [type]="'line'"
            [labels]="dailyTrendLabels"
            [data]="dailyTrendData"
          ></app-chart-widget>
        </div>
        <div class="p-4 border rounded">
          <div class="text-sm text-gray-400">Revenue</div>
          <div class="text-xs text-gray-500 mt-1" *ngIf="loadingRevenueAnalysis">
            <span class="inline-flex items-center gap-1">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading…</span>
            </span>
          </div>
          <div class="mt-2 text-sm">
            <div>Total: {{ revenueAnalysis?.totalRevenue ?? '�' }}</div>
            <div>Average per Appointment: {{ revenueAnalysis?.averageRevenue ?? '�' }}</div>
          </div>
        </div>
      </div>
     </section>
    </div>
    </app-doctor-layout>
  `,
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
        const order = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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
