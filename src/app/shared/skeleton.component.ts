import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class]="containerClass">
      <ng-container *ngFor="let item of items">

        <!-- Doctor Card Variant -->
        <div *ngIf="type === 'doctor-card'" class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse space-y-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
          <div class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/60">
            <div class="flex justify-between items-center">
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
          </div>
          <div class="flex gap-2 pt-2">
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-24"></div>
          </div>
        </div>

        <!-- Appointment Card Variant -->
        <div *ngIf="type === 'appointment-card'" class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 w-full sm:w-auto">
            <div class="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800 flex-shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-40"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-20"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-24"></div>
          </div>
        </div>

        <!-- Patient History Variant -->
        <div *ngIf="type === 'patient-history'" class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-36"></div>
            </div>
            <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div>
          </div>
          <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>

        <!-- Table Row Variant -->
        <div *ngIf="type === 'table-row'" class="p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-between gap-4">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/6"></div>
          <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-16"></div>
        </div>

      </ng-container>
    </div>
  `
})
export class SkeletonLoaderComponent {
    @Input() type: 'doctor-card' | 'appointment-card' | 'patient-history' | 'table-row' = 'doctor-card';
    @Input() count: number = 3;
    @Input() containerClass: string = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    get items(): number[] {
        return Array.from({ length: this.count });
    }
}
