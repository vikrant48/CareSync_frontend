import { Component, inject, computed, effect, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourService } from '../../core/services/tour.service';

@Component({
  selector: 'app-product-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tour.isOpen() && step()) {
      <!-- Backdrop (optional, enables focus) -->
      <div class="fixed inset-0 bg-black/30 z-[90]" (click)="tour.skipTour()"></div>

      <!-- Popup -->
      <div 
        #popup
        class="fixed z-[9999] w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border border-blue-100 dark:border-blue-900 animate-in fade-in zoom-in-95 duration-200"
        [style.top.px]="coords().top"
        [style.left.px]="coords().left"
      >
        <!-- Arrow -->
        <div 
          class="absolute w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t border-blue-100 dark:border-blue-900"
          [style.top.px]="arrowCoords().top"
          [style.left.px]="arrowCoords().left"
          [style.bottom.px]="arrowCoords().bottom"
          [style.right.px]="arrowCoords().right"
        ></div>

        <!-- Content -->
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Tutorial
            </span>
            <button (click)="tour.skipTour()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ step()?.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {{ step()?.content }}
          </p>

          <div class="flex items-center justify-between mt-2">
            <button 
              (click)="tour.skipTour()"
              class="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip Tour
            </button>
            <button 
              (click)="tour.nextStep()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              {{ tour.isLastStep() ? 'Finish' : 'Next' }}
              <i class="fas" [ngClass]="tour.isLastStep() ? 'fa-check' : 'fa-arrow-right'"></i>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProductTourComponent {
  tour = inject(TourService);
  step = this.tour.currentStep;

  coords = computed(() => {
    return this.calculatePosition();
  });

  arrowCoords = computed(() => {
    return this.calculateArrowPosition();
  });

  // Re-calculate on window resize
  @HostListener('window:resize')
  onResize() {
    // Force re-computation hack or just rely on CDR if needed, 
    // but computed signals usually handle dependencies. 
    // Since window size isn't a signal, we might need a signal for it if we want reactivity.
    // For now, simple implementation.
  }

  private calculatePosition() {
    const s = this.step();
    if (!s || typeof document === 'undefined') return { top: 0, left: 0 };

    const target = document.getElementById(s.targetId);
    if (!target) return { top: 0, left: 0 };

    const rect = target.getBoundingClientRect();
    const popupWidth = 256; // w-64 = 16rem = 256px
    const popupHeight = 180; // Approx height
    const gap = 20; // Increased gap 

    let top = 0;
    let left = 0;

    switch (s.position) {
      case 'left':
        top = rect.top;
        left = rect.left - popupWidth - gap;
        break;
      case 'right':
        top = rect.top;
        left = rect.right + gap;
        break;
      case 'top':
        top = rect.top - popupHeight - gap;
        left = rect.left + (rect.width / 2) - (popupWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + (rect.width / 2) - (popupWidth / 2);
        break;
    }

    // Safety check for bottom edge to prevent hiding behind bottom bar
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const bottomEdge = top + popupHeight;
    if (bottomEdge > windowHeight - 80) { // 80px buffer for bottom bar
      top = windowHeight - popupHeight - 80;
    }

    // Boundary checks (basic)
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    return { top, left };
  }

  private calculateArrowPosition() {
    const s = this.step();
    if (!s) return {};

    // Basic arrow positioning logic based on side
    switch (s.position) {
      case 'left':
        return { top: 20, right: -8 }; // arrow on right side of popup
      case 'right':
        return { top: 20, left: -8 }; // arrow on left side
      case 'top':
        return { bottom: -8, left: 134 }; // arrow on bottom
      case 'bottom':
        return { top: -8, left: 134 }; // arrow on top
    }
    return {};
  }
}
