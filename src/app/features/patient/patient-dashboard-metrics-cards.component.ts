import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../../core/services/appointment.service';

@Component({
  selector: 'app-patient-dashboard-metrics-cards',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Pending Feedback Card -->
        <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Pending Feedback</span>
              <span *ngIf="loadingPending" class="text-gray-400 text-sm">Loading…</span>
              <span *ngIf="!loadingPending" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ pendingFeedbackCount }}</span>
            </div>
            <button class="btn-primary" (click)="openFeedback.emit()">View All</button>
          </div>
          <div class="text-5xl mt-6">📝</div>
        </div>

        <!-- My Appointments Card -->
        <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">My Appointments</span>
              <span *ngIf="loadingAppointments" class="text-gray-400 text-sm">Loading…</span>
              <span *ngIf="!loadingAppointments" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ (appointments || []).length }}</span>
            </div>
            <button class="btn-primary" (click)="openMyAppointments.emit()">View All</button>
          </div>
          <div class="text-5xl mt-6">📅</div>
        </div>

        <!-- Today Appointments Card -->
        <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Today Appointments</span>
              <span *ngIf="loadingAppointments" class="text-gray-400 text-sm">Loading…</span>
              <span *ngIf="!loadingAppointments" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ todayAppointmentsCount }}</span>
            </div>
            <button class="btn-primary" (click)="openTodayAppointments.emit()">View All</button>
          </div>
          <div class="text-5xl mt-6">📆</div>
        </div>

        <!-- Lab Tests Card -->
        <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Lab Tests</span>
              <span *ngIf="loadingLabTests" class="text-gray-400 text-sm">Loading…</span>
              <span *ngIf="!loadingLabTests" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ labTestCount }}</span>
            </div>
            <button class="btn-primary" (click)="openLabTests.emit()">View All</button>
          </div>
          <div class="text-5xl mt-6">🧪</div>
        </div>

        <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">cooming soon</span>
              <span *ngIf="loadingLabTests" class="text-gray-400 text-sm">Loading…</span>
              <span *ngIf="!loadingLabTests" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">0</span>
            </div>
            <button class="btn-primary">View All</button>
          </div>
          <div class="text-5xl mt-6">🧪</div>
        </div>
      </div>

    </section>
  `,
})
export class PatientDashboardMetricsCardsComponent {
  @Input() loadingPending = false;
  @Input() pendingFeedbackCount = 0;

  @Input() loadingAppointments = false;
  @Input() appointments: PatientAppointmentItem[] = [];
  @Input() todayAppointmentsCount = 0;

  @Input() loadingLabTests = false;
  @Input() labTestCount = 0;

  @Output() openFeedback = new EventEmitter<void>();
  @Output() openMyAppointments = new EventEmitter<void>();
  @Output() openTodayAppointments = new EventEmitter<void>();
  @Output() openLabTests = new EventEmitter<void>();
}