import { Component, Input, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { DoctorService, Doctor } from '../../core/services/doctor.service';

@Component({
  selector: 'app-patient-reports',
  standalone: true,
  imports: [CommonModule, ChartWidgetComponent, PatientLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-patient-layout>
      <div class="panel p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Insights / Reports</h2>
        </div>
        <!-- My Analytics -->
        <section class="mt-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- <div class="panel p-4">
              <div class="text-sm text-gray-400">Overview</div>
              <div class="mt-2 text-sm">
                <div>Total Appointments: {{ patientAnalytics?.totalAppointments ?? '�' }}</div>
                <div>Avg Visits/Month: {{ patientAnalytics?.averageVisitsPerMonth ?? '�' }}</div>
              </div>
            </div> -->
            <app-chart-widget
              *ngIf="overviewData.length > 0"
              title="Overview"
              [type]="'bar'"
              [labels]="overviewLabels"
              [data]="overviewData"
            ></app-chart-widget>
            <app-chart-widget
              *ngIf="doctorVisitLabels.length > 0"
              title="Visits by Doctor"
              [type]="'bar'"
              [labels]="doctorVisitLabels"
              [data]="doctorVisitData"
            ></app-chart-widget>
            <app-chart-widget
              *ngIf="appointmentStatusData.length > 0"
              title="Appointment Status"
              [type]="'pie'"
              [labels]="appointmentStatusLabels"
              [data]="appointmentStatusData"
            ></app-chart-widget>
          </div>
        </section>
      </div>
    </app-patient-layout>
  `,
})
export class PatientReportsComponent implements OnInit {
  @Input() patientId: number | null = null;

  private auth = inject(AuthService);
  private reportsApi = inject(ReportsApiService);
  private cdr = inject(ChangeDetectorRef);
  private doctorApi = inject(DoctorService);

  patientAnalytics: any = null;

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

  ngOnInit(): void {
    if (this.patientId == null) {
      const idStr = this.auth.userId();
      this.patientId = idStr ? Number(idStr) : null;
    }
    this.loadPatientAnalytics();
    this.loadDoctors();
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
      },
      error: () => {
        this.patientAnalytics = null;
        this.cdr.markForCheck();
      },
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
}
