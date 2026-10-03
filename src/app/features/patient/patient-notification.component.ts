import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationDropdownComponent } from '../../shared/notification-dropdown.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-patient-notification',
  standalone: true,
  imports: [CommonModule, NotificationDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-notification.component.html',
  styleUrl: './patient-notification.component.css'
})
export class PatientNotificationComponent {
  private auth = inject(AuthService);
  patientId: number | null = this.auth.userId() ? Number(this.auth.userId()) : null;
}