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
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <!-- Pending Feedback Card -->
        <div class="panel rounded-none p-4 sm:p-6 w-full min-h-[180px] sm:min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Pending Feedback</span>
              <span *ngIf="loadingPending" class="flex items-center gap-2 text-gray-400 text-sm">
                <span class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
              <span *ngIf="!loadingPending" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ pendingFeedbackCount }}</span>
            </div>
            <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="openFeedback.emit()">View All</button>
          </div>
          <div class="text-4xl sm:text-5xl mt-4 sm:mt-6">📝</div>
        </div>

        <!-- My Appointments Card -->
        <div class="panel rounded-none p-4 sm:p-6 w-full min-h-[180px] sm:min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">My Appointments</span>
              <span *ngIf="loadingAppointments" class="flex items-center gap-2 text-gray-400 text-sm">
                <span class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
              <span *ngIf="!loadingAppointments" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ (appointments || []).length }}</span>
            </div>
            <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="openMyAppointments.emit()">View All</button>
          </div>
          <div class="text-4xl sm:text-5xl mt-4 sm:mt-6">📅</div>
        </div>

        <!-- Today Appointments Card -->
        <div class="panel rounded-none p-4 sm:p-6 w-full min-h-[180px] sm:min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Today Appointments</span>
              <span *ngIf="loadingAppointments" class="flex items-center gap-2 text-gray-400 text-sm">
                <span class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
              <span *ngIf="!loadingAppointments" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ todayAppointmentsCount }}</span>
            </div>
            <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="openTodayAppointments.emit()">View All</button>
          </div>
          <div class="text-4xl sm:text-5xl mt-4 sm:mt-6">📆</div>
        </div>

        <!-- Lab Tests Card -->
        <div class="panel rounded-none p-4 sm:p-6 w-full min-h-[180px] sm:min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">Lab Tests</span>
              <span *ngIf="loadingLabTests" class="flex items-center gap-2 text-gray-400 text-sm">
                <span class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
              <span *ngIf="!loadingLabTests" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ labTestCount }}</span>
            </div>
            <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="openLabTests.emit()">View All</button>
          </div>
          <div class="text-4xl sm:text-5xl mt-4 sm:mt-6">🧪</div>
        </div>

        <div class="panel rounded-none p-4 sm:p-6 w-full min-h-[180px] sm:min-h-[280px] flex flex-col items-center justify-start">
          <div class="w-full flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base">cooming soon</span>
              <span *ngIf="loadingLabTests" class="flex items-center gap-2 text-gray-400 text-sm">
                <span class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
              <span *ngIf="!loadingLabTests" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">0</span>
            </div>
            <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0">View All</button>
          </div>
          <div class="text-4xl sm:text-5xl mt-4 sm:mt-6">🧪</div>
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
