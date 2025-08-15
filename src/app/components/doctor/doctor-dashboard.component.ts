import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit {
  todayAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  AppointmentStatus = AppointmentStatus; // Expose enum to template

  constructor(
    private doctorService: DoctorService,
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
      this.appointmentService.getDoctorTodayAppointments(currentUser.id).subscribe({
        next: (appointments) => {
          this.todayAppointments = appointments;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load today\'s appointments';
          this.loading = false;
        }
      });

      this.appointmentService.getDoctorUpcomingAppointments(currentUser.id).subscribe({
        next: (appointments) => {
          this.upcomingAppointments = appointments;
        },
        error: (error) => {
          console.error('Failed to load upcoming appointments:', error);
        }
      });
    }
  }

  confirmAppointment(appointmentId: number): void {
    this.appointmentService.updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED).subscribe({
      next: () => {
        this.loadAppointments(); // Reload to update status
      },
      error: (error) => {
        this.errorMessage = 'Failed to confirm appointment';
      }
    });
  }

  completeAppointment(appointmentId: number): void {
    this.appointmentService.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED).subscribe({
      next: () => {
        this.loadAppointments(); // Reload to update status
      },
      error: (error) => {
        this.errorMessage = 'Failed to complete appointment';
      }
    });
  }

  cancelAppointment(appointmentId: number): void {
    this.appointmentService.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED).subscribe({
      next: () => {
        this.loadAppointments(); // Reload to update status
      },
      error: (error) => {
        this.errorMessage = 'Failed to cancel appointment';
      }
    });
  }

  getTotalPatients(): number {
    return this.todayAppointments.length + this.upcomingAppointments.length;
  }
}
