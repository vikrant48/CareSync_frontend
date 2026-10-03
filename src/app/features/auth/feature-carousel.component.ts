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
  templateUrl: './feature-carousel.component.html',
  styleUrl: './feature-carousel.component.css'
})
export class FeatureCarouselComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLDivElement>;

  slides: (FeatureSlide & { tabLabel?: string })[] = [
    {
      id: 'vision-scanner',
      title: 'Vision AI Prescription & Lab Scanner',
      tabLabel: 'Vision AI',
      badge: 'Multimodal AI',
      description: 'Upload or capture prescriptions & lab reports; Vision AI automatically extracts medications, dosages, & test values in seconds.',
      icon: 'fa-solid fa-eye',
      image: '/assets/features/vision-scanner.png'
    },
    {
      id: 'voice-dictation',
      title: 'AI Voice Dictation & SOAP Notes',
      tabLabel: 'Voice SOAP',
      badge: 'Doctor Voice AI',
      description: 'Doctors speak consultation notes into a microphone; AI transcribes & structures them into Diagnosis, Prescription, & SOAP fields.',
      icon: 'fa-solid fa-microphone-lines',
      image: '/assets/features/voice-dictation.png'
    },
    {
      id: 'ai-booking',
      title: 'AI Appointment Bookings',
      tabLabel: 'AI Bookings',
      badge: 'Smart Scheduling',
      description: '24/7 intelligent scheduling assistant parsing natural language to book specialist appointments in seconds.',
      icon: 'fa-solid fa-calendar-check',
      image: '/assets/features/ai-booking.png'
    },
    {
      id: 'ai-ready',
      title: 'AI Diagnostics & Triage',
      tabLabel: 'AI Triage',
      badge: 'Groq + Gemini AI',
      description: 'Real-time symptom evaluation, intelligent appointment sorting, and automated patient triaging.',
      icon: 'fa-solid fa-brain',
      image: '/assets/features/ai-ready.png'
    },
    {
      id: 'realtime-chat',
      title: 'Real-Time Doctor-Patient Chat',
      tabLabel: 'Live Chat',
      badge: 'Instant Messaging',
      description: 'Encrypted live chat connecting patients directly with dedicated medical providers for quick advice.',
      icon: 'fa-solid fa-comments',
      image: '/assets/features/realtime-chat.png'
    },
    {
      id: 'ai-consulting',
      title: 'AI Video Consulting',
      tabLabel: 'AI Video',
      badge: 'Tele-Health HD',
      description: 'HD virtual video consultations enriched with real-time AI triage summaries and notes.',
      icon: 'fa-solid fa-video',
      image: '/assets/features/ai-consulting.png'
    },
    {
      id: 'ai-summary',
      title: 'AI Medical History Summary',
      tabLabel: 'AI Summary',
      badge: 'Clinical AI',
      description: 'Automated longitudinal health record analysis, doctor note synthesis, and structured prescription breakdowns.',
      icon: 'fa-solid fa-file-waveform',
      image: '/assets/features/ai-summary.png'
    },
    {
      id: 'video-consulting',
      title: 'HD Tele-Consultations',
      tabLabel: 'HD Video',
      badge: 'Encrypted Stream',
      description: 'Ultra-low latency encrypted video sessions bridging specialists and patients globally.',
      icon: 'fa-solid fa-display',
      image: '/assets/features/video-consulting.png'
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      tabLabel: 'Security',
      badge: 'HIPAA Vault',
      description: 'HIPAA-compliant, end-to-end encrypted vaults protecting your sensitive diagnostic records.',
      icon: 'fa-solid fa-shield-halved',
      image: '/assets/features/security.png'
    },
    {
      id: 'unified-health',
      title: 'Unified Health Records',
      tabLabel: 'Unified Sync',
      badge: 'Complete Sync',
      description: 'Centralized access to prescriptions, lab reports, and longitudinal health history in one click.',
      icon: 'fa-solid fa-notes-medical',
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
