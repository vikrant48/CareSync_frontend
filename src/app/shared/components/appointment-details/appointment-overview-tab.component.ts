import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../ui/status-badge.component';
import { AppointmentBookingSource, AppointmentDetails, DoctorEducationSummary } from '../../../core/models/appointment.models';

@Component({
    selector: 'app-appointment-overview-tab',
    standalone: true,
    imports: [CommonModule, StatusBadgeComponent],
    templateUrl: './appointment-overview-tab.component.html',
    styleUrl: './appointment-overview-tab.component.css'
})
export class AppointmentOverviewTabComponent {
    @Input() appointment: AppointmentDetails | null = null;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    otherPersonName(appointment: AppointmentDetails): string {
        const name = this.viewerRole === 'PATIENT' ? appointment.doctorName : appointment.patientName;
        return name?.trim() || 'Not provided';
    }

    experienceLabel(appointment: AppointmentDetails): string {
        const years = appointment.doctorExperienceYears;
        if (years == null || years <= 0) {
            return 'Not provided';
        }
        return years === 1 ? '1 year' : `${years} years`;
    }

    educationLines(appointment: AppointmentDetails): string[] {
        return (appointment.doctorEducation ?? [])
            .map(education => this.formatEducation(education))
            .filter((line): line is string => !!line);
    }

    languages(appointment: AppointmentDetails): string[] {
        return (appointment.doctorLanguages ?? []).map(language => language.trim()).filter(Boolean);
    }

    hasReviews(appointment: AppointmentDetails): boolean {
        return (appointment.doctorReviewCount ?? 0) > 0 && appointment.doctorAverageRating != null;
    }

    demographicsLabel(appointment: AppointmentDetails): string {
        const parts: string[] = [];
        if (appointment.patientAge != null) {
            parts.push(`${appointment.patientAge} Yrs`);
        }
        const gender = this.genderLabel(appointment.patientGender);
        if (gender) {
            parts.push(gender);
        }
        return parts.length ? parts.join(' / ') : 'Not provided';
    }

    bookingLabel(source?: AppointmentBookingSource): string {
        switch (source) {
            case 'AI_ASSISTED':
                return 'AI Assisted';
            case 'EMERGENCY':
                return 'Emergency';
            case 'MANUAL':
                return 'Manual';
            default:
                return 'Not provided';
        }
    }

    hasClinic(appointment: AppointmentDetails): boolean {
        return !!appointment.clinicName?.trim() || !!appointment.clinicAddress?.trim();
    }

    displayValue(value?: string | number | null): string {
        if (value == null) {
            return 'Not provided';
        }
        const text = String(value).trim();
        return text || 'Not provided';
    }

    private formatEducation(education: DoctorEducationSummary): string | null {
        const degree = education.degree?.trim();
        const institution = education.institution?.trim();
        if (!degree && !institution) {
            return null;
        }
        const title = [degree, institution].filter(Boolean).join(' — ');
        return education.yearOfCompletion ? `${title} (${education.yearOfCompletion})` : title;
    }

    private genderLabel(value?: string): string | null {
        const gender = value?.trim();
        if (!gender) {
            return null;
        }
        const normalized = gender.toLowerCase();
        if (normalized === 'male' || normalized === 'm') {
            return 'Male';
        }
        if (normalized === 'female' || normalized === 'f') {
            return 'Female';
        }
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }
}
