import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-medical-history',
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
        <h1 class="text-3xl font-bold text-gray-900">Edit Medical Record</h1>
        <p class="text-gray-600 mt-2">Edit medical record ID: {{recordId}}</p>
      </div>

      <mat-card class="p-6">
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">edit</mat-icon>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Edit Medical Record</h2>
          <p class="text-gray-500 mb-6">This feature is coming soon. You'll be able to edit medical records here.</p>
          <div class="space-y-4">
            <button mat-outlined-button [routerLink]="['/doctor/medical-history', recordId]">
              <mat-icon>visibility</mat-icon>
              View Record
            </button>
            <br>
            <button mat-outlined-button routerLink="/doctor/medical-history">
              <mat-icon>arrow_back</mat-icon>
              Back to Medical Records
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
export class EditMedicalHistoryComponent implements OnInit {
  recordId: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.recordId = this.route.snapshot.paramMap.get('id');
    console.log('Edit Medical History component loaded for record:', this.recordId);
  }

}