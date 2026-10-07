import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent } from '../user-avatar.component';
import { StatusBadgeComponent } from '../../ui/status-badge.component';

@Component({
    selector: 'app-appointment-header',
    standalone: true,
    imports: [CommonModule, UserAvatarComponent, StatusBadgeComponent],
    templateUrl: './appointment-header.component.html',
    styleUrl: './appointment-header.component.css'
})
export class AppointmentHeaderComponent {
    @Input() appointment: any;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    get otherPersonName(): string {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorName || 'Dr. Assigned';
        }
        return this.appointment?.patientName || 'Patient';
    }

    get otherPersonSubtext(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorSpecialization || 'Healthcare Specialist';
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
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorMobile;
        }
        return this.appointment?.patientMobile;
    }

    get otherPersonAvatar(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorProfileImageUrl;
        }
        return this.appointment?.patientProfileImageUrl;
    }
}
