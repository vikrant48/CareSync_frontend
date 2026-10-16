import { Component, HostBinding, Input } from '@angular/core';

/**
 * Action / pagination bar for list pages.
 *
 * - default: pinned above the mobile bottom nav (and the home indicator); on laptop widths (xl+) it
 *   falls back to normal flow at the end of the page. Uses the global `.sticky-cta` styles.
 * - `pinned`: always fixed to the bottom of the viewport, at every width. On xl+ it starts after the
 *   256px (w-64) sidebar; below xl it sits above the bottom nav.
 * - `compact`: slim padding, for a single-line bar (e.g. pagination).
 *
 * The bar keeps space free on the right for the floating AI-assistant button.
 * Give the page bottom padding (e.g. `pb-28`) so the last content isn't hidden behind the bar.
 */
@Component({
  selector: 'app-sticky-action-bar',
  standalone: true,
  template: `
    <div class="mx-auto w-full" [class]="maxWidthClass + ' ' + innerClass"><ng-content></ng-content></div>
  `,
})
export class StickyActionBarComponent {
  @Input() maxWidthClass = 'max-w-[1400px]';
  @Input() pinned = false;
  @Input() compact = false;

  @HostBinding('class') get hostClass(): string {
    return this.pinned
      ? 'block fixed left-0 right-0 xl:left-64 z-40 fixed-above-mobile-nav bg-[var(--panel)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)]'
      : 'block sticky-cta';
  }

  get innerClass(): string {
    if (!this.pinned) return '';
    // right padding clears the floating AI-assistant button (bottom-right)
    return this.compact
      // 40px row + 1px top border = 41px, the same height as the sidebar footer
      ? 'h-10 flex flex-col justify-center px-3 sm:px-5 py-0 pr-16 sm:pr-20 xl:pr-28'
      : 'px-3 sm:px-5 py-3 pr-16 sm:pr-20 xl:pr-28';
  }
}
