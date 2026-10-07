import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../ui/status-badge.component';

@Component({
    selector: 'app-appointment-overview-tab',
    standalone: true,
    imports: [CommonModule, StatusBadgeComponent],
    templateUrl: './appointment-overview-tab.component.html',
    styleUrl: './appointment-overview-tab.component.css'
})
export class AppointmentOverviewTabComponent {
    @Input() appointment: any;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    get otherPersonName(): string {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorName || 'Dr. Rajesh Verma';
        }
        return this.appointment?.patientName || 'Shruti Das';
    }
}
