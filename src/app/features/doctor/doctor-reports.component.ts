import { Component, Input, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { DoctorReportsSummaryComponent } from './doctor-reports-summary.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

@Component({
  selector: 'app-doctor-reports',
  standalone: true,
  imports: [CommonModule, ChartWidgetComponent, DoctorLayoutComponent, DoctorReportsSummaryComponent,PageLoaderComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-reports.component.html',
  styleUrl: './doctor-reports.component.css'
})
export class DoctorReportsComponent implements OnInit {
  @Input() doctorId: number | null = null;

  private auth = inject(AuthService);
  private analyticsApi = inject(AnalyticsApiService);
  private reportsApi = inject(ReportsApiService);
  private apptApi = inject(AppointmentService);
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
  selectedTimeRange: string = 'THIS_MONTH';
  reportRange: 'month' | 'sixMonths' = 'month';
  doctorAppointments: DoctorAppointmentItem[] = [];
  loadingAppointments = true;
  readonly demographicColors = ['#a855f7', '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#94a3b8'];
  readonly satisfactionRows = [
    { key: 'excellent', label: 'Excellent', icon: 'fa-face-smile', color: '#10b981' },
    { key: 'good', label: 'Good', icon: 'fa-face-meh', color: 'var(--primary)' },
    { key: 'average', label: 'Average', icon: 'fa-face-frown', color: '#f59e0b' },
    { key: 'poor', label: 'Poor', icon: 'fa-face-angry', color: '#ef4444' },
  ];

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

  exportReport() {
    window.print();
  }

  ngOnInit(): void {
    if (this.doctorId == null) {
      const idStr = this.auth.userId();
      this.doctorId = idStr ? Number(idStr) : null;
    }
    this.loadDoctorAppointments();
    this.loadAnalytics();
  }

  setReportRange(value: string): void {
    this.reportRange = value === 'sixMonths' ? 'sixMonths' : 'month';
    this.selectedTimeRange = this.reportRange === 'sixMonths' ? 'LAST_6_MONTHS' : 'THIS_MONTH';
    this.loadAnalytics();
  }

  get reportRangeLabel(): string {
    return this.reportRange === 'sixMonths' ? 'Last 6 Months' : 'This Month';
  }

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  loadAnalytics() {
    if (this.doctorId == null) return;
    const end = new Date().toISOString().slice(0, 10);
    const start = this.rangeStart();
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
        const short = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.dayOfWeekLabels = short;
        this.dayOfWeekData = order.map((day) => this.countForDay(dist, day));
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
        const dist = this.patientDemographics?.ageGroups || this.patientDemographics?.ageDistribution || {};
        const order = ['Under 18', '18-29', '30-44', '45-59', '60-74', '75+', 'Unknown'];
        const extra = Object.keys(dist).filter((key) => !order.includes(key));
        const labels = [...order, ...extra].filter((key) => Number(dist[key] || 0) > 0);
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

  private loadDoctorAppointments(): void {
    this.loadingAppointments = true;
    this.apptApi.getDoctorAllAppointments().subscribe({
      next: (rows) => {
        this.doctorAppointments = rows || [];
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.doctorAppointments = [];
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      }
    });
  }

  private rangeStart(): string {
    if (this.reportRange === 'sixMonths') return this.isoDaysAgo(182);
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private countForDay(dist: Record<string, number>, day: string): number {
    const title = day.charAt(0) + day.slice(1).toLowerCase();
    return Number(dist[day] ?? dist[day.toUpperCase()] ?? dist[title] ?? 0);
  }

  get overviewChart(): { labels: string[]; data: number[] } {
    const counts = new Map<string, number>();
    for (const appointment of this.activeAppointmentsInRange()) {
      const day = this.dayKey(appointment.appointmentDate);
      if (!day) continue;
      const bucket = this.reportRange === 'sixMonths' ? day.slice(0, 7) : day;
      counts.set(bucket, (counts.get(bucket) || 0) + 1);
    }
    const labels = Array.from(counts.keys()).sort();
    return {
      labels: labels.map((key) => this.formatBucket(key)),
      data: labels.map((key) => counts.get(key) || 0),
    };
  }

  get visitTrend(): { labels: string[]; data: number[] } {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dist = this.seasonalTrends?.monthlyDistribution || {};
    const labels: string[] = [];
    const data: number[] = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      if (monthDate.getFullYear() !== this.currentYear) continue;
      labels.push(short[monthDate.getMonth()]);
      data.push(Number(dist[names[monthDate.getMonth()]] || 0));
    }
    return { labels, data };
  }

  get weeklyHasActivity(): boolean {
    return this.dayOfWeekData.some((count) => count > 0);
  }

  get visitTrendHasData(): boolean {
    return this.visitTrend.data.some((count) => count > 0);
  }

  get appointmentTypeBars(): { label: string; count: number; percent: number; color: string; icon: string }[] {
    const firstVisits = this.firstVisitByPatient();
    const counts = new Map<string, number>([
      ['New Patient', 0],
      ['Follow-up', 0],
      ['Lab Review', 0],
      ['Others', 0],
    ]);
    for (const appointment of this.activeAppointmentsInRange()) {
      const label = this.consultationKind(appointment, firstVisits);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    const style = [
      { label: 'New Patient', color: 'var(--accent)', icon: 'fa-user-doctor' },
      { label: 'Follow-up', color: 'var(--primary)', icon: 'fa-rotate' },
      { label: 'Lab Review', color: '#f59e0b', icon: 'fa-flask' },
      { label: 'Others', color: 'var(--muted)', icon: 'fa-briefcase-medical' },
    ];
    return style.map((item) => {
      const count = counts.get(item.label) || 0;
      return { ...item, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }

  get appointmentTypeTotal(): number {
    return this.appointmentTypeBars.reduce((sum, item) => sum + item.count, 0);
  }

  get satisfaction(): { total: number; average: number | null; percents: Record<string, number> } {
    const excellent = this.ratingCount(5);
    const good = this.ratingCount(4);
    const average = this.ratingCount(3);
    const poor = this.ratingCount(1) + this.ratingCount(2);
    const total = excellent + good + average + poor;
    const percent = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;
    const score = total > 0
      ? Math.round(((5 * excellent + 4 * good + 3 * average + 2 * this.ratingCount(2) + this.ratingCount(1)) / total) * 10) / 10
      : null;
    return {
      total,
      average: score,
      percents: { excellent: percent(excellent), good: percent(good), average: percent(average), poor: percent(poor) },
    };
  }

  get filledStars(): number {
    return this.satisfaction.average == null ? 0 : Math.round(this.satisfaction.average);
  }

  get demographicTotal(): number {
    const reported = Number(this.patientDemographics?.totalUniquePatients);
    if (reported > 0) return reported;
    return this.demographicsData.reduce((sum, count) => sum + count, 0);
  }

  get demographicRows(): { label: string; percent: number; color: string }[] {
    const total = this.demographicsData.reduce((sum, count) => sum + count, 0);
    return this.demographicsLabels.map((label, index) => ({
      label,
      percent: total > 0 ? Math.round((this.demographicsData[index] / total) * 100) : 0,
      color: this.demographicColors[index % this.demographicColors.length],
    }));
  }

  get cancellationRateLabel(): string {
    if (!this.cancellationPatterns) return '—';
    return `${Math.round(Number(this.cancellationPatterns.cancellationRate || 0))}%`;
  }

  get cancellationRows(): { label: string; count: number; percent: number | null; color: string }[] {
    const source = this.cancellationPatterns || {};
    const patient = Number(source.patientCancelled || 0);
    const doctor = Number(source.doctorCancelled || 0);
    const other = Number(source.otherCancelled || 0);
    const cancelledTotal = patient + doctor + other;
    const percent = (count: number) => cancelledTotal > 0 ? Math.round((count / cancelledTotal) * 100) : 0;
    return [
      { label: 'Patient cancelled', count: patient, percent: percent(patient), color: '#ef4444' },
      { label: 'Doctor cancelled', count: doctor, percent: percent(doctor), color: 'var(--primary)' },
      { label: 'Other cancelled', count: other, percent: percent(other), color: '#f59e0b' },
      { label: 'Rescheduled', count: Number(source.rescheduled || 0), percent: null, color: '#94a3b8' },
    ];
  }

  get cancellationTiming(): { label: string; count: number }[] {
    const timing = this.cancellationPatterns?.cancellationTiming || {};
    return Object.keys(timing)
      .map((label) => ({ label, count: Number(timing[label] || 0) }))
      .filter((entry) => entry.count > 0);
  }

  private ratingCount(rating: number): number {
    const dist = this.feedbackSentiment?.ratingDistribution || {};
    return Number(dist[rating] ?? dist[String(rating)] ?? 0);
  }

  private activeAppointmentsInRange(): DoctorAppointmentItem[] {
    const start = this.rangeStart();
    const end = new Date().toISOString().slice(0, 10);
    return this.doctorAppointments.filter((appointment) => {
      if (String(appointment.status || '').toUpperCase().includes('CANCEL')) return false;
      const day = this.dayKey(appointment.appointmentDate);
      return !!day && day >= start && day <= end;
    });
  }

  private firstVisitByPatient(): Map<number, string> {
    const first = new Map<number, string>();
    for (const appointment of this.doctorAppointments) {
      if (String(appointment.status || '').toUpperCase().includes('CANCEL') || appointment.patientId == null) continue;
      const day = this.dayKey(appointment.appointmentDate);
      if (!day) continue;
      const current = first.get(appointment.patientId);
      if (!current || day < current) first.set(appointment.patientId, day);
    }
    return first;
  }

  private consultationKind(appointment: DoctorAppointmentItem, firstVisits: Map<number, string>): string {
    const reason = (appointment.reason || '').toLowerCase();
    if (reason.includes('lab')) return 'Lab Review';
    const day = this.dayKey(appointment.appointmentDate);
    const earliest = firstVisits.get(appointment.patientId);
    if (reason.includes('follow') || (earliest && day && day !== earliest)) return 'Follow-up';
    if (earliest && day === earliest) return 'New Patient';
    return 'Others';
  }

  private dayKey(value: string | undefined): string | null {
    if (!value) return null;
    const iso = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  private formatBucket(key: string): string {
    if (/^\d{4}-\d{2}$/.test(key)) {
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    const [year, month, day] = key.split('-').map(Number);
    if (!year || !month || !day) return key;
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
