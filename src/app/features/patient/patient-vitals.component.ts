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
  template: `
    <app-patient-layout>
      <div class="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        <!-- Header -->
        <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Health Vitals Tracking</h1>
            <p class="text-gray-500 dark:text-gray-400">Log and monitor your key health metrics over time.</p>
          </div>
          <button (click)="showLogForm = !showLogForm" class="btn-primary flex items-center gap-2">
            <i class="fa-solid" [class.fa-plus]="!showLogForm" [class.fa-minus]="showLogForm"></i>
            {{ showLogForm ? 'Close Form' : 'Log New Vitals' }}
          </button>
        </header>

        <!-- Log Form -->
        <section *ngIf="showLogForm" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-t-4 border-blue-500 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
            <i class="fa-solid fa-file-medical text-blue-500"></i> Log Your Current Metrics
          </h2>
          <form [formGroup]="vitalsForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Systolic BP (mmHg)</label>
              <input type="number" formControlName="systolicBP" class="form-input w-full" placeholder="e.g. 120" />
            </div>
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diastolic BP (mmHg)</label>
              <input type="number" formControlName="diastolicBP" class="form-input w-full" placeholder="e.g. 80" />
            </div>
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sugar Level (mg/dL)</label>
              <input type="number" formControlName="sugarLevel" class="form-input w-full" placeholder="e.g. 100" />
            </div>
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
              <input type="number" formControlName="weight" class="form-input w-full" placeholder="e.g. 70" />
            </div>
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature (°F)</label>
              <input type="number" step="0.1" formControlName="temperature" class="form-input w-full" placeholder="e.g. 98.6" />
            </div>
            <div class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heart Rate (bpm)</label>
              <input type="number" formControlName="heartRate" class="form-input w-full" placeholder="e.g. 72" />
            </div>
            <div class="md:col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" (click)="showLogForm = false" class="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Cancel</button>
              <button type="submit" [disabled]="loading" class="btn-primary px-8">
                <span *ngIf="loading" class="animate-spin mr-2">●</span> Save Logs
              </button>
            </div>
          </form>
        </section>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <i class="fa-solid fa-heart-pulse text-red-500"></i> Blood Pressure Trend
            </h3>
            <canvas #bpChart></canvas>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <i class="fa-solid fa-droplet text-orange-500"></i> Sugar Level Trend
            </h3>
            <canvas #sugarChart></canvas>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <i class="fa-solid fa-weight-scale text-blue-500"></i> Weight Trend
            </h3>
            <canvas #weightChart></canvas>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-gray-100">
              <i class="fa-solid fa-thermometer text-yellow-500"></i> Body Temperature Trend
            </h3>
            <canvas #tempChart></canvas>
          </div>
        </div>

        <!-- History Table -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-semibold dark:text-gray-100">Log History</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm uppercase font-medium">
                <tr>
                  <th class="px-6 py-4">Date</th>
                  <th class="px-6 py-4">BP (S/D)</th>
                  <th class="px-6 py-4">Sugar</th>
                  <th class="px-6 py-4">Weight</th>
                  <th class="px-6 py-4">Temp</th>
                  <th class="px-6 py-4">Heart Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr *ngFor="let vital of vitalsHistory" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ vital.recordedAt | date:'medium' }}</td>
                  <td class="px-6 py-4 text-sm font-medium dark:text-gray-200">{{ vital.systolicBP || '--' }}/{{ vital.diastolicBP || '--' }} <span class="text-xs text-gray-400">mmHg</span></td>
                  <td class="px-6 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">{{ vital.sugarLevel || '--' }} <span class="text-xs text-gray-400">mg/dL</span></td>
                  <td class="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">{{ vital.weight || '--' }} <span class="text-xs text-gray-400">kg</span></td>
                  <td class="px-6 py-4 text-sm font-medium text-yellow-600 dark:text-yellow-400">{{ vital.temperature || '--' }} <span class="text-xs text-gray-400">°F</span></td>
                  <td class="px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400">{{ vital.heartRate || '--' }} <span class="text-xs text-gray-400">bpm</span></td>
                </tr>
                 <tr *ngIf="vitalsHistory.length === 0">
                  <td colspan="6" class="px-6 py-10 text-center text-gray-400 italic">No logs found. Start by tracking your metrics today!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </app-patient-layout>
  `,
  styles: [`
    .form-input {
      @apply bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5;
    }
    .btn-primary {
      @apply bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50;
    }
    .btn-secondary {
      @apply bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 transition-colors;
    }
  `]
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
