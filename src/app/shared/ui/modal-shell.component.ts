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
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.css'
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
