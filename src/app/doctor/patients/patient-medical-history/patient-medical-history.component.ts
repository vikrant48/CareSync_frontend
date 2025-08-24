import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Patient Medical History</h1>
        <p class="text-gray-600 mt-2">View medical history for patient ID: {{patientId}}</p>
      </div>

      <mat-card class="p-6">
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">history</mat-icon>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Medical History</h2>
          <p class="text-gray-500 mb-6">This feature is coming soon. You'll be able to view patient medical history here.</p>
          <div class="space-y-4">
            <button mat-outlined-button routerLink="/doctor/patients">
              <mat-icon>arrow_back</mat-icon>
              Back to Patients
            </button>
            <br>
            <button mat-outlined-button routerLink="/doctor/dashboard">
              <mat-icon>home</mat-icon>
              Back to Dashboard
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
  `]
})
export class PatientMedicalHistoryComponent implements OnInit {
  patientId: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    console.log('Patient Medical History component loaded for patient:', this.patientId);
  }

}