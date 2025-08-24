import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-doctor-analytics',
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
        <h1 class="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p class="text-gray-600 mt-2">View your performance metrics and insights</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <mat-card class="p-6">
          <div class="text-center">
            <mat-icon class="text-4xl text-blue-500 mb-4">insights</mat-icon>
            <h3 class="text-lg font-semibold mb-2">Performance Analytics</h3>
            <p class="text-gray-500 mb-4">View detailed performance metrics</p>
            <button mat-raised-button color="primary" routerLink="/doctor/analytics/performance">
              View Details
            </button>
          </div>
        </mat-card>

        <mat-card class="p-6">
          <div class="text-center">
            <mat-icon class="text-4xl text-green-500 mb-4">attach_money</mat-icon>
            <h3 class="text-lg font-semibold mb-2">Revenue Analytics</h3>
            <p class="text-gray-500 mb-4">Track your earnings and revenue</p>
            <button mat-raised-button color="primary" routerLink="/doctor/analytics/revenue">
              View Details
            </button>
          </div>
        </mat-card>

        <mat-card class="p-6">
          <div class="text-center">
            <mat-icon class="text-4xl text-purple-500 mb-4">trending_up</mat-icon>
            <h3 class="text-lg font-semibold mb-2">General Analytics</h3>
            <p class="text-gray-500 mb-4">Overall statistics and trends</p>
            <button mat-outlined-button disabled>
              Coming Soon
            </button>
          </div>
        </mat-card>
      </div>

      <div class="mt-8">
        <button mat-outlined-button routerLink="/doctor/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
  `]
})
export class DoctorAnalyticsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Doctor Analytics component loaded');
  }

}