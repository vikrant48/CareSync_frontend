import { Injectable, signal, computed, inject } from '@angular/core';
import { AppointmentStatus, ALLOWED_STATUS_TRANSITIONS } from '../models/appointment.models';
import { AuthService } from './auth.service';

export type ActionType =
    | 'HOLD_SLOT'
    | 'BOOK'
    | 'SUBMIT_INTAKE'
    | 'CONFIRM'
    | 'START_CONSULTATION'
    | 'GENERATE_SOAP'
    | 'SIGN_REPORT'
    | 'CANCEL'
    | 'RESCHEDULE'
    | 'JOIN_CALL';

@Injectable({ providedIn: 'root' })
export class AppointmentStateService {
    private auth = inject(AuthService);

    // Active appointment signal
    readonly activeAppointment = signal<any | null>(null);

    // Computed status
    readonly activeStatus = computed<AppointmentStatus | null>(() => {
        const appt = this.activeAppointment();
        if (!appt || !appt.status) return null;
        return appt.status as AppointmentStatus;
    });

    setActiveAppointment(appointment: any | null): void {
        this.activeAppointment.set(appointment);
    }

    updateStatusLocally(newStatus: AppointmentStatus | string, changedBy: string = 'SYSTEM'): void {
        const current = this.activeAppointment();
        if (current) {
            const updated = {
                ...current,
                status: newStatus,
                statusChangedBy: changedBy,
                statusChangedAt: new Date().toISOString()
            };
            this.activeAppointment.set(updated);
        }
    }

    canTransitionTo(targetStatus: AppointmentStatus): boolean {
        const current = this.activeStatus();
        if (!current) return false;

        const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
        return allowed.includes(targetStatus);
    }

    canDo(action: ActionType): boolean {
        const status = this.activeStatus();
        const role = this.auth.role();
        if (!status || !role) return false;

        switch (action) {
            case 'HOLD_SLOT':
                return role === 'PATIENT' && (status === AppointmentStatus.HELD || status === AppointmentStatus.BOOKED);

            case 'SUBMIT_INTAKE':
                return role === 'PATIENT' && (status === AppointmentStatus.BOOKED || status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.SCHEDULED);

            case 'CONFIRM':
                return role === 'DOCTOR' && (status === AppointmentStatus.BOOKED || status === AppointmentStatus.SCHEDULED);

            case 'START_CONSULTATION':
                return (status === AppointmentStatus.READY_FOR_VISIT || status === AppointmentStatus.INTAKE_COMPLETED || status === AppointmentStatus.CONFIRMED);

            case 'GENERATE_SOAP':
                return (role === 'DOCTOR' || role === 'ADMIN') && (status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.REPORT_DRAFTED);

            case 'SIGN_REPORT':
                return role === 'DOCTOR' && (status === AppointmentStatus.REPORT_DRAFTED || status === AppointmentStatus.IN_PROGRESS);

            case 'CANCEL':
                if (role === 'PATIENT') {
                    return status === AppointmentStatus.BOOKED || status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.INTAKE_COMPLETED;
                } else if (role === 'DOCTOR') {
                    return status === AppointmentStatus.BOOKED || status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.INTAKE_COMPLETED || status === AppointmentStatus.READY_FOR_VISIT;
                }
                return false;

            case 'RESCHEDULE':
                return role === 'PATIENT' && (status === AppointmentStatus.BOOKED || status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.SCHEDULED);

            case 'JOIN_CALL':
                return (status === AppointmentStatus.READY_FOR_VISIT || status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.INTAKE_COMPLETED || status === AppointmentStatus.CONFIRMED);

            default:
                return false;
        }
    }
}
