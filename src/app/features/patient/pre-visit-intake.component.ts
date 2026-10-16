import { Component, OnDestroy, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { ToastService } from '../../core/services/toast.service';
import { PreVisitIntakeRequest, AppointmentStatus } from '../../core/models/appointment.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

@Component({
    selector: 'app-pre-visit-intake',
    standalone: true,
    imports: [CommonModule, FormsModule, StatusBadgeComponent],
    templateUrl: './pre-visit-intake.component.html',
    styleUrl: './pre-visit-intake.component.css'
})
export class PreVisitIntakeComponent implements OnInit, OnDestroy, HasUnsavedChanges {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private appointmentApi = inject(AppointmentApiService);
    private toast = inject(ToastService);
    private aiAssistant = inject(AiAssistantService);

    appointmentId: number = 0;
    appointmentStatus: string = AppointmentStatus.BOOKED;

    activeStep: number = 1;
    completedSteps: number[] = [];
    submitting: boolean = false;
    aiNarrative: string = '';
    drafting: boolean = false;
    aiDraftApplied: boolean = false;
    listening: boolean = false;
    speechSupported: boolean = false;
    emergencyMessage: string = '';
    private recognition: any;

    intakeData: PreVisitIntakeRequest = {
        chiefComplaint: '',
        symptoms: [],
        duration: '',
        severity: '',
        currentMedications: '',
        allergies: '',
        consentGiven: false
    };

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.appointmentId = Number(idParam);
            this.loadExistingDraft();
        }
        this.savedSnapshot = JSON.stringify(this.intakeData);
        this.setupSpeechRecognition();
    }

    ngOnDestroy(): void {
        this.recognition?.stop();
    }

    private setupSpeechRecognition(): void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        this.speechSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (event: any) => {
            let spoken = '';
            for (let index = event.resultIndex; index < event.results.length; index++) {
                if (event.results[index].isFinal) spoken += `${event.results[index][0].transcript} `;
            }
            this.aiNarrative = `${this.aiNarrative} ${spoken}`.trim();
        };
        this.recognition.onend = () => this.listening = false;
        this.recognition.onerror = () => {
            this.listening = false;
            this.toast.show('Voice capture stopped. You can continue by typing.', 'warning');
        };
    }

    toggleListening(): void {
        if (!this.recognition) return;
        if (this.listening) {
            this.recognition.stop();
            this.listening = false;
            return;
        }
        this.recognition.start();
        this.listening = true;
    }

    draftWithAi(): void {
        if (this.aiNarrative.trim().length < 5) {
            this.toast.show('Describe the concern in at least 5 characters.', 'warning');
            return;
        }
        this.drafting = true;
        this.emergencyMessage = '';
        this.aiAssistant.draftIntake(this.aiNarrative.trim()).subscribe({
            next: draft => {
                this.drafting = false;
                this.intakeData = {
                    ...this.intakeData,
                    chiefComplaint: draft.chiefComplaint || this.intakeData.chiefComplaint,
                    symptoms: draft.symptoms || [],
                    duration: draft.duration || '',
                    severity: draft.severity || '',
                    currentMedications: draft.currentMedications || '',
                    allergies: draft.allergies || ''
                };
                this.emergencyMessage = draft.emergencyMessage || '';
                this.aiDraftApplied = true;
                this.activeStep = 1;
                this.toast.showSuccess('AI draft applied. Review every field before submitting.');
            },
            error: err => {
                this.drafting = false;
                this.toast.showError(err?.error?.message || err?.error?.error || 'Could not create the intake draft.');
            }
        });
    }

    loadExistingDraft(): void {
        const saved = localStorage.getItem(`intake_draft_${this.appointmentId}`);
        if (saved) {
            try {
                this.intakeData = JSON.parse(saved);
                this.toast.showInfo('Restored saved intake draft.');
            } catch (e) {
                console.error('Failed to parse saved draft');
            }
        }
    }

    isStepValid(): boolean {
        if (this.activeStep === 1) {
            return !!this.intakeData.chiefComplaint && this.intakeData.chiefComplaint.trim().length >= 5;
        }
        return true;
    }

    get symptomsText(): string {
        return Array.isArray(this.intakeData.symptoms)
            ? this.intakeData.symptoms.join(', ')
            : (this.intakeData.symptoms || '');
    }

    set symptomsText(value: string) {
        this.intakeData.symptoms = value.split(',').map(item => item.trim()).filter(Boolean);
    }

    nextStep(): void {
        if (this.isStepValid()) {
            if (!this.completedSteps.includes(this.activeStep)) {
                this.completedSteps.push(this.activeStep);
            }
            this.activeStep = Math.min(3, this.activeStep + 1);
        } else {
            this.toast.show('Please describe your chief complaint (at least 5 characters).', 'warning');
        }
    }

    previousStep(): void {
        this.activeStep = Math.max(1, this.activeStep - 1);
    }

    /** JSON of the intake as last loaded/saved, to detect unsaved edits */
    private savedSnapshot = '';
    private submitted = false;

    hasUnsavedChanges(): boolean {
        return !this.submitted && JSON.stringify(this.intakeData) !== this.savedSnapshot;
    }

    /** Browser close / refresh with unsaved edits */
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent) {
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    saveDraft(): void {
        localStorage.setItem(`intake_draft_${this.appointmentId}`, JSON.stringify(this.intakeData));
        this.savedSnapshot = JSON.stringify(this.intakeData);
        this.toast.showSuccess('Intake draft saved locally.');
    }

    submitIntake(): void {
        if (!this.intakeData.consentGiven) {
            this.toast.show('Please grant consent to submit your intake.', 'warning');
            return;
        }

        this.submitting = true;
        this.appointmentApi.submitPreVisitIntake(this.appointmentId, this.intakeData).subscribe({
            next: (res) => {
                this.submitting = false;
                localStorage.removeItem(`intake_draft_${this.appointmentId}`);
                this.submitted = true;
                this.toast.showSuccess('Pre-visit intake submitted! AI summary generated for your doctor.');
                this.router.navigate(['/patient/appointments', this.appointmentId]);
            },
            error: (err) => {
                this.submitting = false;
                this.toast.showError('Failed to submit pre-visit intake. Please try again.');
            }
        });
    }

    goBack(): void {
        this.location.back();
    }
}
