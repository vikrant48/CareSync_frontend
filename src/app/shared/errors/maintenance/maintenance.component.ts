import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div class="mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-4">System Maintenance</h1>
        <p class="text-gray-600 mb-6">
          We're currently performing scheduled maintenance on our system. 
          We apologize for any inconvenience and appreciate your patience.
        </p>
        <p class="text-gray-600 mb-6">
          Please check back later. Our team is working to complete the maintenance as quickly as possible.
        </p>
        <div class="mt-6">
          <a routerLink="/" class="text-blue-500 hover:text-blue-700 font-medium">
            Try again later
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MaintenanceComponent {
  constructor() { }
}