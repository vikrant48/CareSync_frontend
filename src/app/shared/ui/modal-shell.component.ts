import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let nextShellId = 0;

/**
 * Shared modal chrome: backdrop, panel, header/close, dialog a11y.
 * Content stays in the parent — no API/business logic here.
 *
 * Accessibility behaviour (applies to every modal built on this shell):
 * - role="dialog" + aria-modal on the panel, with a unique aria-labelledby id
 * - focus moves into the dialog on open, is trapped while open (Tab / Shift+Tab),
 *   and returns to the previously focused element on close
 * - page scroll is locked while any shell modal is open
 * - Escape only acts on the top-most open modal
 */
@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-shell.component.html',
})
export class ModalShellComponent implements OnChanges, OnDestroy {
  /** Open shells, oldest first. The last entry is the top-most modal. */
  private static stack: ModalShellComponent[] = [];
  private static scrollLocks = 0;
  private static previousBodyOverflow = '';

  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  /** Optional. Defaults to a per-instance unique id so several open modals never share one. */
  @Input() titleId = '';
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

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;

  private readonly autoTitleId = `modal-shell-title-${++nextShellId}`;
  private registered = false;
  private returnFocusTo: HTMLElement | null = null;

  constructor(@Inject(DOCUMENT) private doc: Document) { }

  get resolvedTitleId(): string {
    return this.titleId || this.autoTitleId;
  }

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

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;
    if (this.open) this.onOpened();
    else this.onClosed();
  }

  ngOnDestroy(): void {
    this.onClosed();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open && this.isTop && this.closeOnEscape) {
      this.emitClose();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !this.isTop) return;
    const panel = this.panel?.nativeElement;
    if (!panel) return;

    const focusable = this.focusableElements(panel);
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.doc.activeElement as HTMLElement | null;
    const outside = !active || !panel.contains(active) || active === panel;

    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Phone Back button: an open modal adds a history entry for the same page, so Back closes the modal instead of
   * leaving the page. Only the top-most modal reacts.
   */
  @HostListener('window:popstate')
  onBrowserBack() {
    if (!this.ownsHistoryEntry || !this.open || !this.isTop) return;
    if (this.currentHistoryMarker() === this.autoTitleId) return; // our entry is still there: not a Back for us
    this.ownsHistoryEntry = false;
    this.emitClose();
  }

  onBackdrop() {
    if (this.closeOnBackdrop) {
      this.emitClose();
    }
  }

  emitClose() {
    this.close.emit();
  }

  private get isTop(): boolean {
    const stack = ModalShellComponent.stack;
    return stack.length > 0 && stack[stack.length - 1] === this;
  }

  private onOpened(): void {
    if (this.registered) return;
    this.registered = true;
    ModalShellComponent.stack.push(this);

    const body = this.doc.body;
    if (body) {
      if (ModalShellComponent.scrollLocks++ === 0) {
        ModalShellComponent.previousBodyOverflow = body.style.overflow;
        body.style.overflow = 'hidden';
      }
    }

    const active = this.doc.activeElement as HTMLElement | null;
    this.returnFocusTo = active && active !== body ? active : null;

    this.addHistoryEntry();

    // The panel is rendered by *ngIf, so wait for it before moving focus.
    setTimeout(() => this.moveFocusIntoPanel());
  }

  // ---- History entry for the phone Back button

  private ownsHistoryEntry = false;
  private static readonly HISTORY_KEY = 'caresyncModal';

  private addHistoryEntry(): void {
    const history = this.doc.defaultView?.history;
    if (!history) return;
    try {
      // Same URL: the router ignores it; existing state (the router's navigation id) is kept
      history.pushState({ ...(history.state ?? {}), [ModalShellComponent.HISTORY_KEY]: this.autoTitleId }, '');
      this.ownsHistoryEntry = true;
    } catch {
      // History not available (e.g. sandboxed frame): Back simply behaves as before
    }
  }

  /** Closed by its own button, the backdrop or Esc: remove our entry so Back later goes where the user expects */
  private removeHistoryEntry(): void {
    if (!this.ownsHistoryEntry) return;
    this.ownsHistoryEntry = false;
    const history = this.doc.defaultView?.history;
    // Only step back if our entry is still the current one (a page change has already moved past it)
    if (history && this.currentHistoryMarker() === this.autoTitleId) {
      history.back();
    }
  }

  private currentHistoryMarker(): string | undefined {
    return this.doc.defaultView?.history?.state?.[ModalShellComponent.HISTORY_KEY];
  }

  private onClosed(): void {
    if (!this.registered) return;
    this.registered = false;

    const stack = ModalShellComponent.stack;
    const idx = stack.indexOf(this);
    if (idx >= 0) stack.splice(idx, 1);

    this.removeHistoryEntry();

    const body = this.doc.body;
    if (body && ModalShellComponent.scrollLocks > 0 && --ModalShellComponent.scrollLocks === 0) {
      body.style.overflow = ModalShellComponent.previousBodyOverflow;
    }

    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target && this.doc.body.contains(target)) {
      target.focus({ preventScroll: true });
    }
  }

  private moveFocusIntoPanel(): void {
    const panel = this.panel?.nativeElement;
    if (!panel || !this.open) return;
    // Respect anything that already took focus inside the dialog (e.g. an autofocused field)
    if (panel.contains(this.doc.activeElement)) return;

    const preferred = panel.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
    // Focus the panel itself by default: screen readers announce the dialog,
    // and touch devices don't pop the keyboard open.
    (preferred ?? panel).focus({ preventScroll: true });
  }

  private focusableElements(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0
    );
  }
}
