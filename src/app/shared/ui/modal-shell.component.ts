import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared modal chrome: backdrop, panel, header/close, dialog a11y.
 * Content stays in the parent — no API/business logic here.
 */
@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open"
      class="fixed inset-0 flex justify-center p-4 animate-fade-in bg-black/60 backdrop-blur-sm"
      [ngClass]="[
        zIndexClass,
        backdropClass,
        fullScreenMobile ? 'items-end sm:items-center' : 'items-center'
      ]"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="title ? titleId : null"
      [attr.aria-label]="!title ? ariaLabel : null"
      (click)="onBackdrop()"
    >
      <div
        class="w-full flex flex-col overflow-hidden shadow-2xl safe-bottom animate-scale-in"
        [ngClass]="panelClasses"
        (click)="$event.stopPropagation()"
      >
        <!-- Built-in header -->
        <div
          *ngIf="showHeader"
          class="flex items-center justify-between gap-3 shrink-0 border-b border-gray-200 dark:border-gray-700/60"
          [ngClass]="headerClass || 'px-4 sm:px-6 py-3 sm:py-4'"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              *ngIf="icon"
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              [ngClass]="iconWrapClass"
            >
              <i [class]="icon" aria-hidden="true"></i>
            </div>
            <div class="min-w-0">
              <h3
                *ngIf="title"
                [id]="titleId"
                class="font-bold text-gray-900 dark:text-gray-100 truncate"
                [class.text-base]="!!subtitle"
                [class.text-lg]="!subtitle"
              >
                {{ title }}
              </h3>
              <p *ngIf="subtitle" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ subtitle }}</p>
              <ng-content select="[modalHeaderExtra]"></ng-content>
            </div>
          </div>
          <button
            *ngIf="showClose"
            type="button"
            class="touch-target inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0"
            [attr.aria-label]="closeLabel"
            (click)="emitClose()"
          >
            <i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Custom header projection -->
        <ng-content select="[modalHeader]"></ng-content>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0" [ngClass]="bodyClass">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div
          *ngIf="hasFooter"
          class="shrink-0 border-t border-gray-200 dark:border-gray-700/60 modal-sticky-footer"
          [ngClass]="footerClass || 'p-4'"
        >
          <ng-content select="[modalFooter]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class ModalShellComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() titleId = 'modal-shell-title';
  @Input() ariaLabel = 'Dialog';
  @Input() icon = '';
  @Input() iconWrapClass = 'bg-blue-500/10 text-blue-500';
  @Input() maxWidthClass = 'max-w-md';
  @Input() zIndexClass = 'z-50';
  /** Extra panel classes (background, border, radius overrides) */
  @Input() panelClass = '';
  @Input() headerClass = '';
  @Input() bodyClass = 'p-4 sm:p-6';
  @Input() footerClass = '';
  @Input() backdropClass = '';
  @Input() showHeader = true;
  @Input() showClose = true;
  @Input() closeLabel = 'Close dialog';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() fullScreenMobile = true;
  /** Set true when projecting [modalFooter] */
  @Input() hasFooter = false;

  @Output() close = new EventEmitter<void>();

  get panelClasses(): string[] {
    const base = this.panelClass
      || 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl';
    const size = [
      this.maxWidthClass,
      this.fullScreenMobile
        ? 'max-h-[92dvh] sm:max-h-[85dvh] rounded-t-2xl sm:rounded-2xl'
        : 'max-h-[85dvh]',
    ];
    return [base, ...size];
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open && this.closeOnEscape) {
      this.emitClose();
    }
  }

  onBackdrop() {
    if (this.closeOnBackdrop) {
      this.emitClose();
    }
  }

  emitClose() {
    this.close.emit();
  }
}
