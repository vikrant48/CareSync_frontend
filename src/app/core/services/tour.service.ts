import { Injectable, signal, computed } from '@angular/core';

export interface TourStep {
    id: string;
    targetId: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    order: number;
}

@Injectable({
    providedIn: 'root'
})
export class TourService {
    private readonly STORAGE_KEY = 'caresync_tour_completed_v2';

    // State
    activeStepIndex = signal<number>(-1);
    isOpen = signal<boolean>(false);
    private shouldShowTour = false;

    // Configured Steps
    private steps: TourStep[] = [
        {
            id: 'ai-widget',
            targetId: 'ai-widget-trigger',
            title: 'AI Health Assistant',
            content: 'Chat here to book appointments, ask health questions, or check vitals.',
            position: 'left',
            order: 0
        },
        {
            id: 'book-appointment',
            targetId: 'nav-book-appointment',
            title: 'Smart Booking',
            content: 'Find the right specialist and book easily using AI filters.',
            position: 'right',
            order: 1
        },
        {
            id: 'lab-tests',
            targetId: 'nav-lab-tests',
            title: 'Lab Tests',
            content: 'Book diagnostic tests and view reports digitally.',
            position: 'right',
            order: 2
        },
        {
            id: 'reports',
            targetId: 'nav-reports',
            title: 'Records',
            content: 'Your prescriptions and history in one place.',
            position: 'right',
            order: 3
        },
        {
            id: 'vitals',
            targetId: 'nav-health-vitals',
            title: 'Vitals',
            content: 'Track BP, Heart Rate, and other metrics.',
            position: 'right',
            order: 4
        }
    ];

    currentStep = computed(() => {
        const index = this.activeStepIndex();
        return index >= 0 && index < this.steps.length ? this.steps[index] : null;
    });

    isLastStep = computed(() => {
        return this.activeStepIndex() === this.steps.length - 1;
    });

    constructor() { }

    requestTour() {
        console.log('TourService: Tour requested');
        this.shouldShowTour = true;
    }

    startTourIfRequested() {
        console.log('TourService: Checking if tour requested. Flag:', this.shouldShowTour);
        if (this.shouldShowTour) {
            this.shouldShowTour = false; // Reset immediately
            console.log('TourService: Starting tour after delay...');
            setTimeout(() => this.startTour(), 2000);
        }
    }

    startTour() {
        console.log('TourService: startTour() called');
        this.activeStepIndex.set(0);
        this.isOpen.set(true);
    }

    nextStep() {
        if (this.isLastStep()) {
            this.endTour();
        } else {
            this.activeStepIndex.update(i => i + 1);
        }
    }

    skipTour() {
        console.log('TourService: Tour skipped');
        this.endTour();
    }

    endTour() {
        console.log('TourService: Tour ended');
        this.isOpen.set(false);
        this.activeStepIndex.set(-1);
        this.markAsCompleted();
    }

    private markAsCompleted() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, 'true');
        }
    }
}
