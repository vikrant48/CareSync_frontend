import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Icon -->
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-4">
            <mat-icon class="text-yellow-600 text-4xl">lock</mat-icon>
          </div>
          <h1 class="text-6xl font-bold text-yellow-600 mb-4">401</h1>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h2>
          <p class="text-gray-600">
            Please log in to access this resource.
          </p>
        </div>

        <!-- Action Buttons -->
        <mat-card class="shadow-lg p-6">
          <div class="space-y-4">
            <button 
              mat-raised-button 
              color="primary" 
              routerLink="/auth/login"
              class="w-full h-12 text-lg"
            >
              <mat-icon>login</mat-icon>
              Login
            </button>
            
            <button 
              mat-outlined-button 
              routerLink="/auth/register"
              class="w-full h-12 text-lg"
            >
              <mat-icon>person_add</mat-icon>
              Create Account
            </button>
            
            <button 
              mat-button 
              (click)="goBack()"
              class="w-full"
            >
              <mat-icon>arrow_back</mat-icon>
              Go Back
            </button>
          </div>
        </mat-card>

        <!-- Help Section -->
        <div class="mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team.</p>
          <div class="mt-2 space-x-4">
            <a href="/support" class="text-yellow-600 hover:text-yellow-800">Support</a>
            <a href="/contact" class="text-yellow-600 hover:text-yellow-800">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    mat-card {
      border-radius: 16px;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}
