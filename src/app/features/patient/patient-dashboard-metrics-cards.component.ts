import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../../core/services/appointment.service';

@Component({
  selector: 'app-patient-dashboard-metrics-cards',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-4 sm:mt-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Pending Feedback Card -->
        <div class="panel p-3 sm:p-5 flex flex-col items-center justify-between transition-transform hover:scale-[1.02] shadow-lg">
          <div class="w-full flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span class="font-bold text-xs sm:text-base text-gray-800 dark:text-gray-200 truncate">Pending Feedback</span>
            <button class="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium shrink-0" (click)="openFeedback.emit()">View All</button>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
             <div class="hidden sm:block text-3xl sm:text-4xl mb-1 sm:mb-2">📝</div>
             <div *ngIf="loadingPending" class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
             <div *ngIf="!loadingPending" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white py-0.5 sm:py-0">{{ pendingFeedbackCount }}</div>
          </div>
        </div>

        <!-- My Appointments Card -->
        <div class="panel p-3 sm:p-5 flex flex-col items-center justify-between transition-transform hover:scale-[1.02] shadow-lg">
          <div class="w-full flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span class="font-bold text-xs sm:text-base text-gray-800 dark:text-gray-200 truncate">My Appointments</span>
            <button class="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium shrink-0" (click)="openMyAppointments.emit()">View All</button>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
             <div class="hidden sm:block text-3xl sm:text-4xl mb-1 sm:mb-2">📅</div>
             <div *ngIf="loadingAppointments" class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
             <div *ngIf="!loadingAppointments" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white py-0.5 sm:py-0">{{ (appointments || []).length }}</div>
          </div>
        </div>

        <!-- Today Appointments Card -->
        <div class="panel p-3 sm:p-5 flex flex-col items-center justify-between transition-transform hover:scale-[1.02] shadow-lg">
          <div class="w-full flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span class="font-bold text-xs sm:text-base text-gray-800 dark:text-gray-200 truncate">Today</span>
            <button class="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium shrink-0" (click)="openTodayAppointments.emit()">View All</button>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
             <div class="hidden sm:block text-3xl sm:text-4xl mb-1 sm:mb-2">📆</div>
             <div *ngIf="loadingAppointments" class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
             <div *ngIf="!loadingAppointments" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white py-0.5 sm:py-0">{{ todayAppointmentsCount }}</div>
          </div>
        </div>

        <!-- Lab Tests Card -->
        <div class="panel p-3 sm:p-5 flex flex-col items-center justify-between transition-transform hover:scale-[1.02] shadow-lg">
          <div class="w-full flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span class="font-bold text-xs sm:text-base text-gray-800 dark:text-gray-200 truncate">Lab Tests</span>
            <button class="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium shrink-0" (click)="openLabTests.emit()">View All</button>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
             <div class="hidden sm:block text-3xl sm:text-4xl mb-1 sm:mb-2">🧪</div>
             <div *ngIf="loadingLabTests" class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
             <div *ngIf="!loadingLabTests" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white py-0.5 sm:py-0">{{ labTestCount }}</div>
          </div>
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
