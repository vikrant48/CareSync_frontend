import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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

  vitalsForm: FormGroup;
  showLogForm = false;
  loading = false;
  vitalsHistory: VitalLog[] = [];
  charts: any[] = [];

  constructor() {
    this.vitalsForm = this.fb.group({
      systolicBP: [null],
      diastolicBP: [null],
      sugarLevel: [null],
      weight: [null],
      temperature: [null],
      heartRate: [null]
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
        this.vitalsHistory = history;
        // History is descending, reverse for charts
        this.updateCharts([...history].reverse());
      },
      error: (err) => this.toast.showError('Failed to load vitals history')
    });
  }

  onSubmit() {
    if (this.vitalsForm.invalid) return;

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
      error: (err) => {
        this.toast.showError('Failed to log vitals');
        this.loading = false;
      }
    });
  }

  updateCharts(history: VitalLog[]) {
    const labels = history.map(v => new Date(v.recordedAt!).toLocaleDateString());

    this.destroyCharts();

    this.charts.push(this.createChart(this.bpChartRef, 'Blood Pressure', [
      { label: 'Systolic', data: history.map(v => v.systolicBP), borderColor: '#3b82f6', tension: 0.3 },
      { label: 'Diastolic', data: history.map(v => v.diastolicBP), borderColor: '#ef4444', tension: 0.3 }
    ], labels));

    this.charts.push(this.createChart(this.sugarChartRef, 'Sugar Level', [
      { label: 'Sugar (mg/dL)', data: history.map(v => v.sugarLevel), borderColor: '#f97316', tension: 0.3 }
    ], labels));

    this.charts.push(this.createChart(this.weightChartRef, 'Weight', [
      { label: 'Weight (kg)', data: history.map(v => v.weight), borderColor: '#10b981', tension: 0.3 }
    ], labels));

    this.charts.push(this.createChart(this.tempChartRef, 'Temperature', [
      { label: 'Temp (°F)', data: history.map(v => v.temperature), borderColor: '#eab308', tension: 0.3 }
    ], labels));
  }

  createChart(ref: ElementRef, title: string, datasets: any[], labels: string[]) {
    if (!ref) return null;
    return new Chart(ref.nativeElement, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  destroyCharts() {
    this.charts.forEach(c => c?.destroy());
    this.charts = [];
  }
}
