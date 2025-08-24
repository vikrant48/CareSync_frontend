import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-doctor-medical-history',
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
        <h1 class="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p class="text-gray-600 mt-2">Manage patient medical records and history</p>
      </div>

      <mat-card class="p-6">
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">medical_services</mat-icon>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Medical Records Management</h2>
          <p class="text-gray-500 mb-6">This feature is coming soon. You'll be able to create and manage medical records here.</p>
          <div class="space-y-4">
            <button mat-raised-button color="primary" routerLink="/doctor/medical-history/create">
              <mat-icon>add</mat-icon>
              Create Medical Record
            </button>
            <br>
            <button mat-outlined-button routerLink="/doctor/dashboard">
              <mat-icon>arrow_back</mat-icon>
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
export class DoctorMedicalHistoryComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Doctor Medical History component loaded');
  }

}