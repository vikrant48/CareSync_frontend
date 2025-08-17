import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
})

export class AppointmentDetailsComponent implements OnInit {
  appointmentId: number = 0;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.appointmentId = +params['id'];
      // In a real app, you would fetch the appointment details using this ID
    });
  }
  
  // Mock appointment data
  appointment = {
    id: 1,
    type: 'Cardiology Check-up',
    provider: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    status: 'Confirmed',
    date: 'June 15, 2023',
    time: '9:00 AM',
    duration: '45 minutes',
    location: 'CareSync Medical Center',
    room: 'Room 305',
    notes: 'Follow-up appointment to review recent test results and discuss treatment options.',
    preparationInstructions: [
      'Bring a list of all current medications',
      'Bring recent test results if not done at our facility',
      'Arrive 15 minutes before appointment time',
      'Fast for 8 hours before the appointment'
    ],
    providerPhone: '(555) 123-4567',
    providerEmail: 'sarah.johnson@caresync.example.com',
    insurance: {
      provider: 'HealthPlus Insurance',
      policyNumber: 'HP-12345678',
      groupNumber: 'GRP-987654',
      copay: 25
    }
  };
}