import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">My Profile</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center mb-6">
          <div class="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-semibold">John Doe</h2>
            <p class="text-gray-600">Patient ID: P12345</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-medium mb-3">Personal Information</h3>
            <div class="space-y-2">
              <div class="flex">
                <span class="font-medium w-32">Date of Birth:</span>
                <span>January 15, 1985</span>
              </div>
              <div class="flex">
                <span class="font-medium w-32">Gender:</span>
                <span>Male</span>
              </div>
              <div class="flex">
                <span class="font-medium w-32">Blood Type:</span>
                <span>O+</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-medium mb-3">Contact Information</h3>
            <div class="space-y-2">
              <div class="flex">
                <span class="font-medium w-32">Email:</span>
                <span>john.doe&#64;example.com</span>
              </div>
              <div class="flex">
                <span class="font-medium w-32">Phone:</span>
                <span>(555) 123-4567</span>
              </div>
              <div class="flex">
                <span class="font-medium w-32">Address:</span>
                <span>123 Main St, Anytown, CA 12345</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Edit Profile
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-medium mb-4">Medical Information</h3>
        
        <div class="mb-6">
          <h4 class="font-medium mb-2">Allergies</h4>
          <div class="flex flex-wrap gap-2">
            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Penicillin</span>
            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Peanuts</span>
          </div>
        </div>
        
        <div class="mb-6">
          <h4 class="font-medium mb-2">Current Medications</h4>
          <ul class="list-disc list-inside space-y-1 text-gray-700">
            <li>Lisinopril 10mg - Once daily</li>
            <li>Metformin 500mg - Twice daily</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-2">Medical Conditions</h4>
          <ul class="list-disc list-inside space-y-1 text-gray-700">
            <li>Hypertension</li>
            <li>Type 2 Diabetes</li>
          </ul>
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
export class SharedProfileComponent {
  constructor() { }
}