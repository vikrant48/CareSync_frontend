import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Icon -->
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <mat-icon class="text-red-600 text-4xl">error_outline</mat-icon>
          </div>
          <h1 class="text-6xl font-bold text-red-600 mb-4">500</h1>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Server Error</h2>
          <p class="text-gray-600">
            Something went wrong on our end. Please try again later.
          </p>
        </div>

        <!-- Action Buttons -->
        <mat-card class="shadow-lg p-6">
          <div class="space-y-4">
            <button 
              mat-raised-button 
              color="primary" 
              (click)="retry()"
              class="w-full h-12 text-lg"
            >
              <mat-icon>refresh</mat-icon>
              Try Again
            </button>
            
            <button 
              mat-outlined-button 
              routerLink="/dashboard"
              class="w-full h-12 text-lg"
            >
              <mat-icon>home</mat-icon>
              Go to Dashboard
            </button>
            
            <button 
              mat-button 
              routerLink="/auth/login"
              class="w-full h-12 text-lg"
            >
              <mat-icon>login</mat-icon>
              Back to Login
            </button>
          </div>
        </mat-card>

        <!-- Help Section -->
        <div class="mt-8 text-sm text-gray-500">
          <p>If the problem persists, please contact our support team.</p>
          <div class="mt-2 space-x-4">
            <a href="/support" class="text-red-600 hover:text-red-800">Support</a>
            <a href="/contact" class="text-red-600 hover:text-red-800">Contact Us</a>
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
export class ServerErrorComponent {
  constructor(private router: Router) {}

  retry(): void {
    window.location.reload();
  }
}
