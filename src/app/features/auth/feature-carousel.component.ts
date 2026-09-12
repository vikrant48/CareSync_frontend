import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface FeatureSlide {
    id: string;
    title: string;
    badge: string;
    description: string;
    icon: string;
    image: string;
    fallbackGradient?: string;
}

@Component({
    selector: 'app-feature-carousel',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      #carouselContainer
      class="relative w-full h-full flex flex-col justify-between p-6 sm:p-7 lg:p-8 pb-6 lg:pb-8 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-950 text-white select-none overflow-hidden group transition-all duration-500"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseLeave()"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <!-- Animated Ambient Background Glowing Elements -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div class="absolute bottom-10 right-0 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Pinned Branding Header -->
      <div class="relative z-20 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/25 shadow-xl shadow-emerald-950/40">
            <i class="fa-solid fa-heart-pulse text-2xl text-emerald-300"></i>
          </div>
          <span class="text-2xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-300">
            CareSync
          </span>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-emerald-200">
          Digital Health Platform
        </span>
      </div>

      <!-- Main Carousel Content Area -->
      <div class="relative z-10 mt-3 sm:mt-5 mb-auto py-2 sm:py-3">
        
        <!-- Pinned Section Title -->
        <div class="mb-4 sm:mb-5 space-y-1.5">
          <h1 class="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
            Your Health, <br />
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-white">
              Synchronized
            </span>.
          </h1>
          <p class="text-xs sm:text-sm text-emerald-100/70 font-light max-w-md leading-relaxed">
            Join the next-generation medical ecosystem built for providers & patients.
          </p>
        </div>

        <!-- Slides Wrapper Viewport -->
        <div class="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl p-5 sm:p-7">
          
          <!-- Track Container with smooth CSS translateX transition -->
          <div 
            class="flex transition-transform ease-out cursor-grab active:cursor-grabbing"
            [style.transform]="getTrackTransform()"
            [style.transition-duration.ms]="isDragging ? 0 : 500"
          >
            <div 
              *ngFor="let slide of slides; let i = index" 
              class="w-full flex-shrink-0 flex flex-col md:flex-row items-center gap-5"
            >
              <!-- Feature Illustration / Image Container -->
              <div class="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white/10 p-3 border border-white/20 shadow-inner group/img overflow-hidden">
                <img 
                  [src]="slide.image" 
                  [alt]="slide.title"
                  (error)="handleImageError($event, slide)"
                  class="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover/img:scale-105"
                />
                <!-- Floating Icon Badge -->
                <div class="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-emerald-500/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-white/30">
                  <i [class]="slide.icon + ' text-xs'"></i>
                </div>
              </div>

              <!-- Feature Details -->
              <div class="flex-1 text-center md:text-left space-y-1.5">
                <span class="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  {{ slide.badge }}
                </span>
                <h3 class="text-lg sm:text-xl font-black text-white tracking-tight">
                  {{ slide.title }}
                </h3>
                <p class="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-light">
                  {{ slide.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Subtle Hover Navigation Arrows for Desktop -->
          <button 
            type="button"
            (click)="prevSlide(); $event.stopPropagation()"
            aria-label="Previous slide"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-emerald-500/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 shadow-lg"
          >
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>

          <button 
            type="button"
            (click)="nextSlide(); $event.stopPropagation()"
            aria-label="Next slide"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-emerald-500/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-lg"
          >
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        <!-- Pagination Dots Bar -->
        <div class="mt-4 flex items-center justify-center gap-2">
          <button
            *ngFor="let slide of slides; let i = index"
            type="button"
            (click)="goToSlide(i); $event.stopPropagation()"
            [attr.aria-label]="'Go to slide ' + (i + 1)"
            class="h-2.5 transition-all duration-300 rounded-full cursor-pointer focus:outline-none"
            [ngClass]="{
              'w-8 bg-emerald-300 shadow-md shadow-emerald-400/50': currentSlide === i,
              'w-2.5 bg-white/30 hover:bg-white/60': currentSlide !== i
            }"
          ></button>
        </div>
      </div>

      <!-- Bottom Pinned Footer Copyright -->
      <div class="relative z-20 flex items-center justify-between text-[11px] text-emerald-200/60 font-medium pt-3 mb-10 sm:mb-14 lg:mb-16 border-t border-white/10">
        <span>© 2026 CareSync Platform</span>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            HIPAA Verified
          </span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class FeatureCarouselComponent implements OnInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private cdr = inject(ChangeDetectorRef);

    @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLDivElement>;

    slides: FeatureSlide[] = [
        {
            id: 'security',
            title: 'Security & Compliance',
            badge: 'HIPAA Certified',
            description: 'HIPAA compliant, end-to-end encrypted vaults protecting your critical diagnostic records.',
            icon: 'fa-solid fa-shield-halved',
            image: '/assets/features/security.png'
        },
        {
            id: 'ai-ready',
            title: 'AI Diagnostics',
            badge: 'Smart Engine',
            description: 'AI-assisted medical summarization, intelligent appointment sorting, and automated triaging.',
            icon: 'fa-solid fa-brain',
            image: '/assets/features/ai-ready.png'
        },
        {
            id: 'video-consulting',
            title: 'Video Consulting',
            badge: 'Tele-Health HD',
            description: 'HD encrypted video sessions bridging patients with specialists anytime, anywhere.',
            icon: 'fa-solid fa-video',
            image: '/assets/features/video-consulting.png'
        },
        {
            id: 'unified-health',
            title: 'Unified Health Records',
            badge: 'Complete Sync',
            description: 'Centralized access to prescriptions, lab reports, and longitudinal health history in one click.',
            icon: 'fa-solid fa-file-waveform',
            image: '/assets/features/unified-health.png'
        }
    ];

    currentSlide = 0;
    private autoPlayTimer: any = null;
    readonly autoPlayInterval = 5000; // 5 seconds

    // Drag / Swipe State
    isDragging = false;
    startX = 0;
    dragOffset = 0;

    ngOnInit() {
        this.startAutoPlay();
    }

    ngOnDestroy() {
        this.stopAutoPlay();
    }

    // --- Auto Play Timer Management ---
    startAutoPlay() {
        if (!isPlatformBrowser(this.platformId)) return;
        this.stopAutoPlay();
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide(false); // don't reset timer on auto advance
        }, this.autoPlayInterval);
    }

    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    restartAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    // --- Navigation Controls ---
    nextSlide(manual = true) {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.cdr.markForCheck();
        if (manual) this.restartAutoPlay();
    }

    prevSlide(manual = true) {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.cdr.markForCheck();
        if (manual) this.restartAutoPlay();
    }

    goToSlide(index: number) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.cdr.markForCheck();
            this.restartAutoPlay();
        }
    }

    // --- Track CSS Transform helper ---
    getTrackTransform(): string {
        const baseTranslate = -this.currentSlide * 100;
        if (this.isDragging && this.carouselContainer?.nativeElement) {
            const width = this.carouselContainer.nativeElement.clientWidth || 1;
            const dragPercent = (this.dragOffset / width) * 100;
            return `translateX(${baseTranslate + dragPercent}%)`;
        }
        return `translateX(${baseTranslate}%)`;
    }

    // --- Image Fallback Handler ---
    handleImageError(event: any, slide: FeatureSlide) {
        // If PNG fails to load for any reason, replace with inline styled icon container
        const imgElem = event.target as HTMLImageElement;
        if (imgElem) {
            imgElem.style.display = 'none';
        }
    }

    // --- Drag & Swipe Handlers (Mouse & Touch) ---
    onMouseDown(event: MouseEvent) {
        this.startDrag(event.clientX);
    }

    onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;
        this.updateDrag(event.clientX);
    }

    onMouseUp() {
        this.endDrag();
    }

    onMouseLeave() {
        if (this.isDragging) {
            this.endDrag();
        }
    }

    onTouchStart(event: TouchEvent) {
        if (event.touches.length > 0) {
            this.startDrag(event.touches[0].clientX);
        }
    }

    onTouchMove(event: TouchEvent) {
        if (this.isDragging && event.touches.length > 0) {
            this.updateDrag(event.touches[0].clientX);
        }
    }

    onTouchEnd() {
        this.endDrag();
    }

    private startDrag(clientX: number) {
        this.isDragging = true;
        this.startX = clientX;
        this.dragOffset = 0;
        this.stopAutoPlay();
    }

    private updateDrag(clientX: number) {
        this.dragOffset = clientX - this.startX;
        this.cdr.markForCheck();
    }

    private endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;

        const threshold = 50; // px threshold to trigger slide change
        if (this.dragOffset < -threshold) {
            this.nextSlide(true);
        } else if (this.dragOffset > threshold) {
            this.prevSlide(true);
        } else {
            this.restartAutoPlay();
        }
        this.dragOffset = 0;
        this.cdr.markForCheck();
    }
}
