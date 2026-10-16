import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { DoctorLayoutComponent } from './doctor-layout.component';
import { PatientLayoutComponent } from './patient-layout.component';

/**
 * Route-level shell for pages shared by both roles (settings, lab tests).
 * Renders the doctor or patient layout (each hosts the <router-outlet>), or a plain container
 * for other roles such as admin.
 */
@Component({
  selector: 'app-role-layout',
  standalone: true,
  host: { class: 'block h-full w-full' },
  imports: [CommonModule, RouterOutlet, DoctorLayoutComponent, PatientLayoutComponent],
  template: `
    <app-doctor-layout *ngIf="auth.role() === 'DOCTOR'; else notDoctor"></app-doctor-layout>
    <ng-template #notDoctor>
      <app-patient-layout *ngIf="auth.role() === 'PATIENT'; else noLayout"></app-patient-layout>
    </ng-template>
    <ng-template #noLayout>
      <div class="min-h-[calc(100dvh-3.5rem)] bg-[var(--bg)] text-[var(--text)] p-4 sm:p-6">
        <router-outlet></router-outlet>
      </div>
    </ng-template>
  `,
})
export class RoleLayoutComponent {
  protected auth = inject(AuthService);
}
