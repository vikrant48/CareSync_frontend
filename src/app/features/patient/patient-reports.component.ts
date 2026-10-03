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
