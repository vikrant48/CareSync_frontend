import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent } from '../user-avatar.component';
import { StatusBadgeComponent } from '../../ui/status-badge.component';
import { AppointmentDetails } from '../../../core/models/appointment.models';

@Component({
    selector: 'app-appointment-header',
    standalone: true,
    imports: [CommonModule, UserAvatarComponent, StatusBadgeComponent],
    templateUrl: './appointment-header.component.html',
    styleUrl: './appointment-header.component.css'
})
export class AppointmentHeaderComponent {
    @Input() appointment: AppointmentDetails | null = null;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    get otherPersonName(): string {
        const name = this.viewerRole === 'PATIENT'
            ? this.appointment?.doctorName
            : this.appointment?.patientName;
        return name?.trim() || 'Not provided';
    }

    get otherPersonSubtext(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorSpecialization?.trim() || undefined;
        }
        return undefined;
    }

    get otherPersonEmail(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorEmail;
        }
        return this.appointment?.patientEmail;
    }

    get otherPersonMobile(): string | undefined {
        const contact = this.viewerRole === 'PATIENT'
            ? this.appointment?.doctorContactInfo
            : this.appointment?.patientContactInfo;
        return contact?.trim() || undefined;
    }

    get otherPersonAvatar(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorProfileImageUrl;
        }
        return this.appointment?.patientProfileImageUrl;
    }
}
