import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight loading skeleton blocks. UI only.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="wrapperClass" role="status" aria-label="Loading" aria-busy="true">
      <ng-container *ngIf="variant === 'card'">
        <div class="ui-panel p-3.5 sm:p-5 space-y-3 animate-pulse" *ngFor="let _ of countArray">
          <div class="flex items-center gap-3">
            <div class="skeleton-circle w-10 h-10 sm:w-12 sm:h-12"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton-line w-2/3 h-3"></div>
              <div class="skeleton-line w-1/3 h-2.5"></div>
            </div>
            <div class="skeleton-line w-16 h-6 rounded-full"></div>
          </div>
          <div class="skeleton-line w-full h-2.5"></div>
          <div class="skeleton-line w-4/5 h-2.5"></div>
          <div class="flex gap-2 pt-1">
            <div class="skeleton-line flex-1 h-9 rounded-xl"></div>
            <div class="skeleton-line flex-1 h-9 rounded-xl"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'list'">
        <div class="space-y-2.5 animate-pulse" *ngFor="let _ of countArray">
          <div class="ui-panel p-3 flex items-center gap-3">
            <div class="skeleton-circle w-9 h-9"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton-line w-1/2 h-3"></div>
              <div class="skeleton-line w-1/3 h-2"></div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'metrics'">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
          <div class="ui-panel p-4 space-y-2" *ngFor="let _ of [1,2,3]">
            <div class="skeleton-line w-20 h-2.5"></div>
            <div class="skeleton-line w-24 h-7"></div>
            <div class="skeleton-line w-16 h-2"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'line'">
        <div class="animate-pulse space-y-2">
          <div class="skeleton-line" [style.width]="width" [style.height]="height"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'table'">
        <div class="ui-panel overflow-hidden animate-pulse" [ngClass]="panelClass">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 flex gap-4">
            <div class="skeleton-line h-3 w-24" *ngFor="let _ of [1,2,3,4]"></div>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-800" *ngFor="let _ of countArray">
            <div class="px-4 py-3.5 flex items-center gap-4">
              <div class="skeleton-circle w-8 h-8 shrink-0"></div>
              <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="skeleton-line h-2.5 w-full"></div>
                <div class="skeleton-line h-2.5 w-3/4"></div>
                <div class="skeleton-line h-2.5 w-1/2 hidden sm:block"></div>
                <div class="skeleton-line h-2.5 w-2/3 hidden sm:block"></div>
              </div>
              <div class="skeleton-line h-7 w-16 rounded-lg shrink-0"></div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'focus'">
        <div class="rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 animate-pulse">
          <div class="bg-white dark:bg-gray-800 rounded-[0.9rem] sm:rounded-[1.3rem] p-4 sm:p-8 space-y-4">
            <div class="flex items-center justify-between">
              <div class="skeleton-line h-4 w-32"></div>
              <div class="skeleton-line h-7 w-16 rounded-full"></div>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div class="skeleton-circle w-16 h-16 sm:w-24 sm:h-24 !rounded-xl sm:!rounded-2xl"></div>
              <div class="flex-1 space-y-2 w-full">
                <div class="skeleton-line h-5 w-40"></div>
                <div class="skeleton-line h-3 w-56"></div>
              </div>
              <div class="skeleton-line h-11 w-full sm:w-40 rounded-xl"></div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class SkeletonComponent {
  /** card | list | metrics | line | table | focus */
  @Input() variant: 'card' | 'list' | 'metrics' | 'line' | 'table' | 'focus' = 'card';
  @Input() count = 3;
  @Input() width = '100%';
  @Input() height = '0.75rem';
  @Input() wrapperClass = '';
  @Input() panelClass = '';

  get countArray(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }
}
