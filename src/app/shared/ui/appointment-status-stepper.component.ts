import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStatus } from '../../core/models/appointment.models';
import { StatusBadgeComponent } from './status-badge.component';

export interface MilestoneStep {
    key: string;
    label: string;
    statuses: AppointmentStatus[];
}

@Component({
    selector: 'app-appointment-status-stepper',
    standalone: true,
    imports: [CommonModule, StatusBadgeComponent],
    templateUrl: './appointment-status-stepper.component.html',
    styleUrl: './appointment-status-stepper.component.css'
})
export class AppointmentStatusStepperComponent {
    @Input() currentStatus: AppointmentStatus | string = AppointmentStatus.BOOKED;

    readonly steps: MilestoneStep[] = [
        {
            key: 'HELD',
            label: 'Slot Held',
            statuses: [AppointmentStatus.HELD]
        },
        {
            key: 'BOOKED',
            label: 'Booked',
            statuses: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED]
        },
        {
            key: 'INTAKE',
            label: 'Intake',
            statuses: [AppointmentStatus.INTAKE, AppointmentStatus.INTAKE_COMPLETED, AppointmentStatus.WAITING_ROOM, AppointmentStatus.READY_FOR_VISIT]
        },
        {
            key: 'CONSULT',
            label: 'Consultation',
            statuses: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.MEDICAL_RECORD, AppointmentStatus.REPORT_DRAFTED]
        },
        {
            key: 'COMPLETED',
            label: 'Completed',
            statuses: [AppointmentStatus.COMPLETED]
        }
    ];

    get normalizedStatus(): AppointmentStatus {
        return (this.currentStatus as AppointmentStatus) || AppointmentStatus.BOOKED;
    }

    get currentStepIndex(): number {
        const status = this.normalizedStatus;
        if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.CANCELLED_BY_PATIENT || status === AppointmentStatus.CANCELLED_BY_DOCTOR || status === AppointmentStatus.AUTO_CLOSED || status === AppointmentStatus.NO_SHOW_PATIENT || status === AppointmentStatus.NO_SHOW_DOCTOR) {
            return -1;
        }
        for (let i = 0; i < this.steps.length; i++) {
            if (this.steps[i].statuses.includes(status)) {
                return i;
            }
        }
        return 1;
    }

    get progressPercentage(): number {
        const idx = this.currentStepIndex;
        if (idx <= 0) return 0;
        return (idx / (this.steps.length - 1)) * 100;
    }

    isCompletedStep(index: number): boolean {
        const idx = this.currentStepIndex;
        return idx > index;
    }

    isCurrentStep(index: number): boolean {
        return this.currentStepIndex === index;
    }

    getStepClass(index: number): string {
        if (this.isCurrentStep(index)) {
            return 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/20';
        } else if (this.isCompletedStep(index)) {
            return 'bg-emerald-600 border-emerald-500 text-white';
        } else {
            return 'bg-gray-900 border-gray-700 text-gray-500';
        }
    }

    getStatusDescription(): string {
        const s = this.normalizedStatus;
        switch (s) {
            case AppointmentStatus.HELD:
                return 'Slot is temporarily held for 5 minutes while you complete booking.';
            case AppointmentStatus.BOOKED:
            case AppointmentStatus.SCHEDULED:
                return 'Appointment is booked! Please complete your pre-visit intake.';
            case AppointmentStatus.CONFIRMED:
                return 'Doctor has confirmed your appointment. Prepare for your visit.';
            case AppointmentStatus.INTAKE_COMPLETED:
                return 'Pre-visit intake submitted! AI summary generated for your doctor.';
            case AppointmentStatus.READY_FOR_VISIT:
                return 'You are in the waiting room. Doctor will admit you shortly.';
            case AppointmentStatus.IN_PROGRESS:
                return 'Live consultation in progress.';
            case AppointmentStatus.REPORT_DRAFTED:
                return 'Doctor is reviewing and finalizing your AI SOAP medical report.';
            case AppointmentStatus.READY_TO_COMPLETE:
                return 'Clinical documentation saved. Doctor is performing final review and e-signature.';
            case AppointmentStatus.COMPLETED:
                return 'Consultation completed! Your medical report and summary are available below.';
            case AppointmentStatus.CANCELLED:
            case AppointmentStatus.CANCELLED_BY_PATIENT:
            case AppointmentStatus.CANCELLED_BY_DOCTOR:
                return 'Appointment has been cancelled.';
            case AppointmentStatus.NO_SHOW_PATIENT:
            case AppointmentStatus.NO_SHOW_DOCTOR:
                return 'Marked as no-show by system scheduler.';
            case AppointmentStatus.AUTO_CLOSED:
                return 'Auto-closed after consult duration.';
            default:
                return 'Appointment status updated.';
        }
    }
}
