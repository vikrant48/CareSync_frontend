import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationDropdownComponent } from '../../shared/notification-dropdown.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-doctor-notification',
  standalone: true,
  imports: [CommonModule, NotificationDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-notification.component.html',
  styleUrl: './doctor-notification.component.css'
})
export class DoctorNotificationComponent {
  private auth = inject(AuthService);
  doctorId: number | null = this.auth.userId() ? Number(this.auth.userId()) : null;
}