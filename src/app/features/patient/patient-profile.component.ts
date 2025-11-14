import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PatientProfilePageComponent, AppointmentCounts } from '../../shared/patient-profile-page.component';
import { PatientProfileService, PatientDto, MedicalHistoryItem } from '../../core/services/patient-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, PatientLayoutComponent, PatientProfilePageComponent],
  template: `
    <app-patient-layout>
      <app-patient-profile-page
        [patient]="profile()"
        [medicalHistory]="history()"
        [appointmentCounts]="counts()"
      ></app-patient-profile-page>
    </app-patient-layout>
  `,
})
export class PatientProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileApi = inject(PatientProfileService);
  private apptApi = inject(AppointmentService);

  profile = signal<PatientDto | null>(null);
  history = signal<MedicalHistoryItem[]>([]);
  counts = signal<AppointmentCounts>({ total: 0, completed: 0, cancelled: 0, upcoming: 0 });


  ngOnInit() {
    const uname = this.auth.username();
    if (!uname) return;
    this.profileApi.getProfile(uname).subscribe({
      next: (p) => {
        this.profile.set(p);
        if (p?.id != null) this.loadHistory(p.id);
      },
    });
    this.loadCounts();
  }

  loadHistory(id: number) {
    this.profileApi.getMedicalHistory(id).subscribe({
      next: (list) => this.history.set(list || []),
    });
  }

  loadCounts() {
    this.apptApi.getMyAppointments().subscribe({
      next: (all) => {
        const total = (all || []).length;
        const completed = (all || []).filter((a) => a.status === 'COMPLETED').length;
        const cancelled = (all || []).filter((a) => a.status === 'CANCELLED').length;
        this.counts.update((c) => ({ ...c, total, completed, cancelled }));
      },
    });
    this.apptApi.getMyUpcomingAppointments().subscribe({
      next: (up) => {
        this.counts.update((c) => ({ ...c, upcoming: (up || []).length }));
      },
    });
  }

  
}