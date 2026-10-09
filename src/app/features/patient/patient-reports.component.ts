import { Component, Input, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { AnalyticsApiService } from '../../core/services/analytics.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar.component';
import { PatientReportsActivityComponent } from './patient-reports-activity.component';

@Component({
  selector: 'app-patient-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartWidgetComponent, PatientLayoutComponent, UserAvatarComponent, PatientReportsActivityComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-reports.component.html',
  styleUrl: './patient-reports.component.css'
})
export class PatientReportsComponent implements OnInit {
  @Input() patientId: number | null = null;

  private auth = inject(AuthService);
  private reportsApi = inject(ReportsApiService);
  private analyticsApi = inject(AnalyticsApiService);
  private cdr = inject(ChangeDetectorRef);
  private doctorApi = inject(DoctorService);
  private apptApi = inject(AppointmentService);
  private router = inject(Router);

  patientAnalytics: any = null;
  financialStats: any = null;
  recentAppointments: PatientAppointmentItem[] = [];

  // Status chart metrics
  statusCounts = {
    completed: 0,
    scheduled: 0,
    cancelled: 0,
    rescheduled: 0,
    noShow: 0
  };
  totalStatusCount = 0;

  // Chart data holders
  doctorVisitLabels: string[] = [];
  doctorVisitData: number[] = [];
  appointmentStatusLabels: string[] = ['Completed', 'Scheduled', 'Cancelled', 'Rescheduled', 'No Show'];
  appointmentStatusData: number[] = [0, 0, 0, 0, 0];
  statusColors: string[] = ['#3b82f6', '#a78bfa', '#ef4444', '#eab308', '#64748b'];
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
    this.pendingLoads = this.patientId == null ? 1 : 4;
    this.loadingReports = true;
    if (this.patientId != null) {
      this.loadPatientAnalytics();
      this.loadFinancialStats();
      this.loadMyAppointments();
    }
    this.loadDoctors();
  }

  loadMyAppointments() {
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.recentAppointments = res || [];
        this.calculateStatusCounts();
        this.cdr.markForCheck();
        this.completeLoad();
      },
      error: () => {
        this.recentAppointments = [];
        this.calculateStatusCounts();
        this.cdr.markForCheck();
        this.completeLoad();
      }
    });
  }

  private calculateStatusCounts() {
    let completed = 0;
    let scheduled = 0;
    let cancelled = 0;
    let rescheduled = 0;
    let noShow = 0;

    if (this.recentAppointments.length > 0) {
      this.recentAppointments.forEach(a => {
        const st = (a.status || '').toUpperCase();
        if (st === 'COMPLETED') completed++;
        else if (st === 'CANCELLED') cancelled++;
        else if (st === 'RESCHEDULED') rescheduled++;
        else if (st === 'NO_SHOW') noShow++;
        else scheduled++;
      });
      this.totalStatusCount = this.recentAppointments.length;
    } else if (this.patientAnalytics) {
      completed = Number(this.patientAnalytics?.totalVisits || 0);
      cancelled = Number(this.patientAnalytics?.cancelledAppointments || 0);
      const total = Number(this.patientAnalytics?.totalAppointments || 0);
      scheduled = Math.max(0, total - completed - cancelled);
      this.totalStatusCount = total || (completed + cancelled + scheduled);
    } else {
      this.totalStatusCount = 0;
    }

    this.statusCounts = { completed, scheduled, cancelled, rescheduled, noShow };
    this.appointmentStatusData = [completed, scheduled, cancelled, rescheduled, noShow];
  }

  getStatusPercent(count: number): number {
    if (!this.totalStatusCount || this.totalStatusCount === 0) return 0;
    return Math.round((count / this.totalStatusCount) * 100);
  }

  trackDoctor(_index: number, doc: { doctorId: number; name: string }): string {
    return `${doc.doctorId}-${doc.name}`;
  }

  trackIndex(index: number): number {
    return index;
  }

  viewAppointment(id: number) {
    if (id) {
      this.router.navigate(['/patient/appointments', id]);
    } else {
      this.router.navigate(['/patient/appointments']);
    }
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
    this.doctorApi.getAllForPatients(0, 50).subscribe({
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

  get doctorVisitList(): Array<{ doctorId: number; name: string; count: number; percent: number }> {
    const total = this.doctorVisitData.reduce((a, b) => a + b, 0) || 1;
    const keys = Object.keys(this.patientAnalytics?.doctorVisitCount || {});
    return this.doctorVisitLabels.map((name, i) => {
      const count = this.doctorVisitData[i] || 0;
      return {
        doctorId: Number(keys[i] || 0),
        name,
        count,
        percent: Math.round((count / total) * 100)
      };
    });
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
