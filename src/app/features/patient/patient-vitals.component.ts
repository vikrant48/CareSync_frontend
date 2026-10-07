import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VitalsService, VitalLog } from '../../core/services/vitals.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Chart, registerables } from 'chart.js';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

Chart.register(...registerables);

@Component({
  selector: 'app-patient-vitals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PatientLayoutComponent],
  templateUrl: './patient-vitals.component.html',
  styleUrl: './patient-vitals.component.css'
})
export class VitalsTrackingComponent implements OnInit {
  @ViewChild('bpChart') bpChartRef!: ElementRef;
  @ViewChild('sugarChart') sugarChartRef!: ElementRef;
  @ViewChild('weightChart') weightChartRef!: ElementRef;
  @ViewChild('tempChart') tempChartRef!: ElementRef;

  private fb = inject(FormBuilder);
  private vitalsService = inject(VitalsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  vitalsForm: FormGroup;
  showLogForm = false;
  loading = false;
  vitalsHistory: VitalLog[] = [];
  latestVital: VitalLog | null = null;
  charts: any[] = [];

  selectedTimeframe: string = '7_days';
  selectedVitalDetails: VitalLog | null = null;

  constructor() {
    this.vitalsForm = this.fb.group({
      systolicBP: [null, [Validators.min(40), Validators.max(250)]],
      diastolicBP: [null, [Validators.min(30), Validators.max(150)]],
      sugarLevel: [null, [Validators.min(20), Validators.max(600)]],
      weight: [null, [Validators.min(2), Validators.max(300)]],
      temperature: [null, [Validators.min(90), Validators.max(110)]],
      heartRate: [null, [Validators.min(30), Validators.max(220)]]
    });
  }

  ngOnInit() {
    this.loadVitals();
  }

  loadVitals() {
    const idStr = this.authService.userId();
    if (!idStr) return;
    const patientId = Number(idStr);

    this.vitalsService.getPatientVitals(patientId).subscribe({
      next: (history) => {
        this.vitalsHistory = history || [];
        this.latestVital = this.vitalsHistory.length > 0 ? this.vitalsHistory[0] : null;

        // Reverse history for chronological chart rendering (oldest to newest)
        const chronological = [...this.vitalsHistory].reverse();
        this.updateCharts(chronological);
        this.cdr.markForCheck();
      },
      error: () => {
        this.vitalsHistory = [];
        this.latestVital = null;
        this.toast.showError('Failed to load vitals history');
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit() {
    if (this.vitalsForm.invalid) {
      this.toast.showError('Please check form fields for valid entries');
      return;
    }

    const idStr = this.authService.userId();
    if (!idStr) return;
    const patientId = Number(idStr);

    this.loading = true;
    const log: VitalLog = {
      ...this.vitalsForm.value,
      patientId: patientId,
      recordedAt: new Date().toISOString()
    };

    this.vitalsService.logVital(log).subscribe({
      next: () => {
        this.toast.showSuccess('Vitals logged successfully');
        this.showLogForm = false;
        this.vitalsForm.reset();
        this.loading = false;
        this.loadVitals();
      },
      error: () => {
        this.toast.showError('Failed to log vitals');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onTimeframeChange(timeframe: string) {
    this.selectedTimeframe = timeframe;
    const chronological = [...this.vitalsHistory].reverse();
    this.updateCharts(chronological);
  }

  filterDataByTimeframe(history: VitalLog[]): VitalLog[] {
    if (this.selectedTimeframe === 'all') return history;
    const days = this.selectedTimeframe === '30_days' ? 30 : 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const filtered = history.filter(v => v.recordedAt && new Date(v.recordedAt) >= cutoff);
    // Fallback to all if timeframe filter yields empty set but we have history
    return filtered.length > 0 ? filtered : history;
  }

  updateCharts(history: VitalLog[]) {
    const dataSet = this.filterDataByTimeframe(history);
    const labels = dataSet.map(v => {
      if (!v.recordedAt) return '';
      const d = new Date(v.recordedAt);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    });

    this.destroyCharts();

    setTimeout(() => {
      this.charts.push(this.createChart(this.bpChartRef, 'Blood Pressure', [
        {
          label: 'Systolic (mmHg)',
          data: dataSet.map(v => v.systolicBP ?? null),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#3b82f6',
          pointBorderWidth: 2,
        },
        {
          label: 'Diastolic (mmHg)',
          data: dataSet.map(v => v.diastolicBP ?? null),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ef4444',
          pointBorderWidth: 2,
        }
      ], labels));

      this.charts.push(this.createChart(this.sugarChartRef, 'Sugar Level', [
        {
          label: 'Sugar (mg/dL)',
          data: dataSet.map(v => v.sugarLevel ?? null),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#f97316',
          pointBorderWidth: 2,
        }
      ], labels));

      this.charts.push(this.createChart(this.weightChartRef, 'Weight', [
        {
          label: 'Weight (kg)',
          data: dataSet.map(v => v.weight ?? null),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.15)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#a78bfa',
          pointBorderWidth: 2,
        }
      ], labels));

      this.charts.push(this.createChart(this.tempChartRef, 'Temperature', [
        {
          label: 'Temperature (°F)',
          data: dataSet.map(v => v.temperature ?? null),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ef4444',
          pointBorderWidth: 2,
        }
      ], labels));
    }, 0);
  }

  createChart(ref: ElementRef, title: string, datasets: any[], labels: string[]) {
    if (!ref || !ref.nativeElement) return null;
    return new Chart(ref.nativeElement, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#9aa3b8',
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              padding: 15,
              font: { size: 11, family: 'Inter, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: '#1b2333',
            titleColor: '#ffffff',
            bodyColor: '#9aa3b8',
            borderColor: '#2a3347',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#9aa3b8', font: { size: 11 } },
            border: { color: '#2a3347' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#9aa3b8', font: { size: 11 } },
            border: { color: '#2a3347' }
          }
        }
      }
    });
  }

  destroyCharts() {
    this.charts.forEach(c => c?.destroy());
    this.charts = [];
  }

  // Dynamic clinical status helpers
  getBPStatus(systolic?: number, diastolic?: number) {
    if (!systolic || !diastolic) {
      return { label: 'No Data', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: 'fa-minus' };
    }
    if (systolic <= 120 && diastolic <= 80) {
      return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
    }
    if (systolic <= 130 && diastolic <= 85) {
      return { label: 'Elevated', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'fa-arrow-up' };
    }
    return { label: 'High', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
  }

  getSugarStatus(level?: number) {
    if (!level) {
      return { label: 'No Data', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: 'fa-minus' };
    }
    if (level <= 100) {
      return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
    }
    if (level <= 125) {
      return { label: 'Elevated', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'fa-arrow-up' };
    }
    return { label: 'High', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
  }

  getWeightStatus(weight?: number) {
    if (!weight) {
      return { label: 'No Data', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: 'fa-minus' };
    }
    return { label: 'Stable', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
  }

  getTempStatus(temp?: number) {
    if (!temp) {
      return { label: 'No Data', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: 'fa-minus' };
    }
    if (temp <= 99.0) {
      return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-minus' };
    }
    return { label: 'Fever', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
  }

  openDetailsModal(vital: VitalLog) {
    this.selectedVitalDetails = vital;
  }

  closeDetailsModal() {
    this.selectedVitalDetails = null;
  }
}

