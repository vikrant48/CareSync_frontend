import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { ToastService } from '../../core/services/toast.service';
import { PreVisitIntakeRequest, AppointmentStatus } from '../../core/models/appointment.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
    selector: 'app-pre-visit-intake',
    standalone: true,
    imports: [CommonModule, FormsModule, StatusBadgeComponent],
    templateUrl: './pre-visit-intake.component.html',
    styleUrl: './pre-visit-intake.component.css'
})
export class PreVisitIntakeComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private appointmentApi = inject(AppointmentApiService);
    private toast = inject(ToastService);

    appointmentId: number = 0;
    appointmentStatus: string = AppointmentStatus.BOOKED;

    activeStep: number = 1;
    completedSteps: number[] = [];
    submitting: boolean = false;

    intakeData: PreVisitIntakeRequest = {
        chiefComplaint: '',
        symptoms: [],
        duration: '1-3 Days',
        severity: 'Mild',
        currentMedications: '',
        allergies: '',
        consentGiven: true
    };

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.appointmentId = Number(idParam);
            this.loadExistingDraft();
        }
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

    saveDraft(): void {
        localStorage.setItem(`intake_draft_${this.appointmentId}`, JSON.stringify(this.intakeData));
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
