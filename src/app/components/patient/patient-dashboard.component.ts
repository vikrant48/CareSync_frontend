import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit {
  upcomingAppointments: Appointment[] = [];
  pastAppointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  AppointmentStatus = AppointmentStatus; // Expose enum to template

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      this.appointmentService.getPatientUpcomingAppointments().subscribe({
        next: (appointments) => {
          this.upcomingAppointments = appointments;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load upcoming appointments';
          this.loading = false;
        }
      });

      // Get past appointments using filter
      const filter = { status: AppointmentStatus.COMPLETED };
      this.appointmentService.getPatientAppointments(filter).subscribe({
        next: (appointments) => {
          this.pastAppointments = appointments;
        },
        error: (error) => {
          console.error('Failed to load past appointments:', error);
        }
      });
    }
  }

  cancelAppointment(appointmentId: number): void {
    this.appointmentService.cancelPatientAppointment(appointmentId).subscribe({
      next: () => {
        this.loadAppointments(); // Reload to update status
      },
      error: (error) => {
        this.errorMessage = 'Failed to cancel appointment';
      }
    });
  }

  getCompletedAppointmentsCount(): number {
    return this.pastAppointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length;
  }

  getHealthStatus(): string {
    const completedCount = this.getCompletedAppointmentsCount();
    if (completedCount === 0) return 'New Patient';
    if (completedCount < 3) return 'Regular Patient';
    return 'Established Patient';
  }
}
