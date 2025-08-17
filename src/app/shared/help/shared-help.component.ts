import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Help & Support</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium">How do I schedule an appointment?</h3>
            <p class="text-gray-600">You can schedule an appointment by navigating to the Appointments section and clicking on "Schedule New Appointment".</p>
          </div>
          <div>
            <h3 class="font-medium">How do I update my personal information?</h3>
            <p class="text-gray-600">You can update your personal information in the Profile section.</p>
          </div>
          <div>
            <h3 class="font-medium">How do I view my medical history?</h3>
            <p class="text-gray-600">Your medical history can be accessed in the Medical History section.</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Contact Support</h2>
        <p class="mb-4">If you need further assistance, please contact our support team:</p>
        <div class="space-y-2">
          <p><strong>Email:</strong> support&#64;caresync.com</p>
          <p><strong>Phone:</strong> (555) 123-4567</p>
          <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM</p>
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
export class SharedHelpComponent {
  constructor() { }
}