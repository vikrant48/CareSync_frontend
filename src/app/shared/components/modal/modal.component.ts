import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Modal Backdrop & Centered Overlay -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#0b0f1a]/80 backdrop-blur-md animate-in fade-in duration-200"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Box Container -->
      <div
        (click)="$event.stopPropagation()"
        [ngClass]="[
          'w-full bg-[#151b2b] border border-[#2a3347] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all transform animate-in zoom-in-95 duration-200 relative',
          getSizeClasses()
        ]"
      >
        <!-- Top Loading Progress Bar -->
        <div *ngIf="loading" class="h-1 w-full bg-[#1b2333] overflow-hidden relative">
          <div class="h-full bg-[#5b6cf0] animate-pulse w-full"></div>
        </div>

        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-[#2a3347] flex items-center justify-between gap-4">
          <div class="flex flex-col min-w-0">
            <h3 *ngIf="title" class="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              {{ title }}
            </h3>
            <p *ngIf="description" class="text-xs text-[#9aa3b8] truncate mt-0.5">
              {{ description }}
            </p>
          </div>

          <!-- Close Icon Button -->
          <button
            type="button"
            (click)="close()"
            class="w-8 h-8 rounded-full bg-[#1b2333] hover:bg-[#252f44] text-[#9aa3b8] hover:text-white flex items-center justify-center transition-colors shrink-0 focus:outline-none"
            title="Close modal"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-4">
          <ng-content></ng-content>
        </div>

        <!-- Modal Footer Actions (Custom Slot or Default) -->
        <div class="px-6 py-4 bg-[#1b2333]/50 border-t border-[#2a3347] flex items-center justify-end gap-3">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title?: string;
    @Input() description?: string;
    @Input() size: ModalSize = 'md';
    @Input() loading = false;
    @Input() closeOnOverlay = true;

    @Output() closeModal = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        if (this.isOpen) {
            this.close();
        }
    }

    onBackdropClick(event: MouseEvent) {
        if (this.closeOnOverlay) {
            this.close();
        }
    }

    close() {
        this.closeModal.emit();
    }

    getSizeClasses(): string {
        switch (this.size) {
            case 'sm':
                return 'max-w-md';
            case 'lg':
                return 'max-w-2xl';
            case 'xl':
                return 'max-w-4xl';
            case 'md':
            default:
                return 'max-w-lg';
        }
    }
}
