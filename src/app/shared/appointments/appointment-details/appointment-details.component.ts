import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
})

export class AppointmentDetailsComponent implements OnInit {
  appointmentId: number = 0;
  appointment: Appointment | null = null;
  isLoading: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.appointmentId = +params['id'];
      this.loadAppointment();
    });
  }

  private loadAppointment(): void {
    if (!this.appointmentId) return;
    
    this.isLoading = true;
    this.appointmentService.getAppointment(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.isLoading = false;
        // Fallback to mock data for demonstration
        this.appointment = this.getMockAppointment();
      }
    });
  }

  private getMockAppointment(): Appointment {
    return {
      id: this.appointmentId,
      patientId: 1,
      doctorId: 1,
      appointmentDateTime: '2024-06-15T09:00:00',
      reason: 'Cardiology Check-up - Follow-up appointment to review recent test results',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Patient should bring recent test results and current medication list.',
      createdAt: '2024-06-10T10:00:00Z',
      updatedAt: '2024-06-12T14:30:00Z',
      patient: {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phoneNumber: '+1 (555) 123-4567'
      },
      doctor: {
        id: 1,
        firstName: 'Sarah',
        lastName: 'Johnson',
        specialization: 'Cardiology',
        email: 'sarah.johnson@caresync.example.com',
        phoneNumber: '+1 (555) 987-6543'
      }
    };
  }
}