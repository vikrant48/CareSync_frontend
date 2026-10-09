import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { AllowedActionDto } from '../../../core/models/appointment.models';

export interface ActionItem {
    key: string;
    label: string;
    icon: string;
    isPrimary?: boolean;
}

export interface ProcessStageRow {
    name: string;
    state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'CANCELLED';
    description: string;
}

@Component({
    selector: 'app-appointment-process-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './appointment-process-tab.component.html',
    styleUrl: './appointment-process-tab.component.css'
})
export class AppointmentProcessTabComponent implements OnChanges {
    @Input() appointment: any;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';
    @Output() actionSelected = new EventEmitter<string>();

    private appointmentApiService = inject(AppointmentApiService);

    openDropdownIndex: number | null = null;
    availableActions: ActionItem[] = [];
    primaryAction: ActionItem | null = null;

    processStages: ProcessStageRow[] = [
        { name: 'Booked', state: 'UPCOMING', description: 'Appointment scheduled by patient' },
        { name: 'Confirmed', state: 'UPCOMING', description: 'Appointment confirmed with doctor' },
        { name: 'Intake', state: 'UPCOMING', description: 'Patient pre-visit intake form' },
        { name: 'Waiting Room', state: 'UPCOMING', description: 'Patient in virtual waiting room' },
        { name: 'In Progress', state: 'UPCOMING', description: 'Live video/chat consultation active' },
        { name: 'Medical Record', state: 'UPCOMING', description: 'Clinical documentation & draft review' },
        { name: 'Completed', state: 'UPCOMING', description: 'Consultation completed & record locked' }
    ];

    @HostListener('document:click')
    onDocumentClick(): void {
        this.openDropdownIndex = null;
    }

    toggleDropdown(index: number): void {
        this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
    }

    triggerAction(actionKey: string): void {
        this.actionSelected.emit(actionKey);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['appointment'] || changes['viewerRole']) {
            this.updateStagesAndActions();
        }
    }

    private updateStagesAndActions(): void {
        const status = this.appointment?.status || 'BOOKED';
        const isCancelled = status.startsWith('CANCELLED') || status.startsWith('REJECTED') || status.startsWith('NO_SHOW') || status === 'AUTO_CLOSED';

        if (isCancelled) {
            this.processStages.forEach(s => s.state = 'CANCELLED');
            this.availableActions = [];
            this.primaryAction = null;
            return;
        }

        const stageOrder: { [key: string]: number } = {
            'HELD': 0, 'BOOKED': 0,
            'CONFIRMED': 1, 'SCHEDULED': 1,
            'INTAKE': 2, 'INTAKE_COMPLETED': 2,
            'WAITING_ROOM': 3, 'READY_FOR_VISIT': 3,
            'IN_PROGRESS': 4,
            'MEDICAL_RECORD': 5, 'REPORT_DRAFTED': 5,
            'READY_TO_COMPLETE': 6,
            'COMPLETED': 6
        };

        const currentIndex = stageOrder[status] !== undefined ? stageOrder[status] : 0;

        if (status === 'COMPLETED') {
            this.processStages.forEach(s => s.state = 'COMPLETED');
            this.availableActions = [];
            this.primaryAction = null;
            return;
        }

        this.processStages.forEach((stage, idx) => {
            if (idx < currentIndex) {
                stage.state = 'COMPLETED';
            } else if (idx === currentIndex) {
                stage.state = 'CURRENT';
            } else {
                stage.state = 'UPCOMING';
            }
        });

        // Try loading allowed actions from API if appointment.id is present
        const id = this.appointment?.id || this.appointment?.appointmentId;
        if (id) {
            this.appointmentApiService.getAllowedActions(id).subscribe({
                next: (actions: AllowedActionDto[]) => {
                    this.availableActions = actions.map(a => ({
                        key: a.actionKey,
                        label: a.label,
                        icon: a.icon,
                        isPrimary: a.isPrimary
                    }));
                    this.primaryAction = this.availableActions.find(a => a.isPrimary) || (this.availableActions.length > 0 ? this.availableActions[0] : null);
                },
                error: () => {
                    this.availableActions = this.getAllowedActionsFallback(status, this.viewerRole);
                    this.primaryAction = this.availableActions.find(a => a.isPrimary) || (this.availableActions.length > 0 ? this.availableActions[0] : null);
                }
            });
        } else {
            this.availableActions = this.getAllowedActionsFallback(status, this.viewerRole);
            this.primaryAction = this.availableActions.find(a => a.isPrimary) || (this.availableActions.length > 0 ? this.availableActions[0] : null);
        }
    }

    private getAllowedActionsFallback(status: string, role: 'PATIENT' | 'DOCTOR'): ActionItem[] {
        const actions: ActionItem[] = [];

        if (role === 'PATIENT') {
            if (status === 'BOOKED') {
                actions.push({ key: 'CONFIRM', label: 'Confirm Booking', icon: 'fa-solid fa-check', isPrimary: true });
                actions.push({ key: 'RESCHEDULE', label: 'Reschedule Appointment', icon: 'fa-solid fa-calendar-days' });
                actions.push({ key: 'CANCEL', label: 'Cancel Appointment', icon: 'fa-solid fa-ban' });
            } else if (status === 'CONFIRMED' || status === 'SCHEDULED') {
                actions.push({ key: 'CANCEL', label: 'Cancel Appointment', icon: 'fa-solid fa-ban' });
            } else if (status === 'INTAKE' || status === 'INTAKE_COMPLETED') {
                actions.push({ key: 'SUBMIT_INTAKE', label: 'Fill Pre-Intake Form Now', icon: 'fa-solid fa-notes-medical', isPrimary: true });
                actions.push({ key: 'FILL_WITH_DOCTOR', label: 'Fill Intake with Doctor', icon: 'fa-solid fa-user-doctor' });
            } else if (status === 'WAITING_ROOM' || status === 'READY_FOR_VISIT') {
                actions.push({ key: 'CONFIRM_INTAKE', label: 'Confirm Intake with Doctor', icon: 'fa-solid fa-file-signature', isPrimary: true });
                actions.push({ key: 'DEVICE_TEST', label: 'Check Camera & Mic', icon: 'fa-solid fa-video' });
                actions.push({ key: 'JOIN_VIDEO', label: 'Join Waiting Room', icon: 'fa-solid fa-door-open' });
                actions.push({ key: 'CHAT', label: 'Chat with Doctor', icon: 'fa-solid fa-comments' });
            } else if (status === 'IN_PROGRESS') {
                actions.push({ key: 'JOIN_VIDEO', label: 'Join Video Consultation', icon: 'fa-solid fa-video', isPrimary: true });
                actions.push({ key: 'CHAT', label: 'Chat with Doctor', icon: 'fa-solid fa-comments' });
            } else if (status === 'READY_TO_COMPLETE') {
                actions.push({ key: 'CHAT', label: 'Chat with Doctor', icon: 'fa-solid fa-comments' });
            } else if (status === 'COMPLETED') {
                // Completed appointments have no actions on the process pipeline
            }
        } else {
            // DOCTOR
            if (status === 'BOOKED') {
                actions.push({ key: 'CANCEL', label: 'Cancel Booking', icon: 'fa-solid fa-ban' });
            } else if (status === 'CONFIRMED' || status === 'SCHEDULED') {
                actions.push({ key: 'ACCEPT', label: 'Accept Appointment', icon: 'fa-solid fa-check-circle', isPrimary: true });
                actions.push({ key: 'REJECT', label: 'Reject Appointment', icon: 'fa-solid fa-xmark' });
            } else if (status === 'INTAKE' || status === 'INTAKE_COMPLETED') {
                actions.push({ key: 'VIEW_INTAKE', label: 'View Pre-Intake Summary', icon: 'fa-solid fa-clipboard-user', isPrimary: true });
            } else if (status === 'WAITING_ROOM' || status === 'READY_FOR_VISIT') {
                actions.push({ key: 'START_PROGRESS', label: 'Start Consultation', icon: 'fa-solid fa-stethoscope', isPrimary: true });
                actions.push({ key: 'OVERRIDE_START_PROGRESS', label: 'Override & Start Consultation', icon: 'fa-solid fa-shield-halved' });
                actions.push({ key: 'EDIT_INTAKE', label: 'Edit Intake with Patient', icon: 'fa-solid fa-pen-to-square' });
                actions.push({ key: 'OPEN_INTAKE', label: 'Preview Patient Intake', icon: 'fa-solid fa-notes-medical' });
                actions.push({ key: 'CHAT', label: 'Chat with Patient', icon: 'fa-solid fa-comments' });
            } else if (status === 'IN_PROGRESS') {
                actions.push({ key: 'JOIN_VIDEO', label: 'Join Video', icon: 'fa-solid fa-video', isPrimary: true });
                actions.push({ key: 'CHAT', label: 'Chat with Patient', icon: 'fa-solid fa-comments' });
                actions.push({ key: 'ADD_MEDICAL_RECORD', label: 'Proceed to Medical Record Stage', icon: 'fa-solid fa-file-medical-step' });
            } else if (status === 'MEDICAL_RECORD' || status === 'REPORT_DRAFTED') {
                actions.push({ key: 'AI_SOAP', label: 'Ambient AI Scribe Assistant', icon: 'fa-solid fa-wand-magic-sparkles' });
                actions.push({ key: 'EDIT_RECORD', label: 'Add / Edit Medical Record', icon: 'fa-solid fa-pen-to-square' });
                actions.push({ key: 'MOVE_TO_COMPLETE', label: 'Move to Complete & Review', icon: 'fa-solid fa-arrow-right', isPrimary: true });
            } else if (status === 'READY_TO_COMPLETE') {
                actions.push({ key: 'PREVIEW_AND_COMPLETE', label: 'Preview & E-Sign Visit', icon: 'fa-solid fa-file-signature', isPrimary: true });
                actions.push({ key: 'BACK_TO_MEDICAL_RECORD', label: 'Back to Medical Record', icon: 'fa-solid fa-arrow-left' });
            } else if (status === 'COMPLETED') {
                // Completed appointments have no actions on the process pipeline
            }
        }

        return actions;
    }
}
