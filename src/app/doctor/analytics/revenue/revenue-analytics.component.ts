import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-revenue-analytics',
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
        <h1 class="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
        <p class="text-gray-600 mt-2">Track your earnings and financial performance</p>
      </div>

      <mat-card class="p-6">
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">monetization_on</mat-icon>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Revenue Tracking</h2>
          <p class="text-gray-500 mb-6">This feature is coming soon. You'll be able to view detailed revenue analytics here.</p>
          <div class="space-y-4">
            <button mat-outlined-button routerLink="/doctor/analytics">
              <mat-icon>arrow_back</mat-icon>
              Back to Analytics
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
export class RevenueAnalyticsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Revenue Analytics component loaded');
  }

}