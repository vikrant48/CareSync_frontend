import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feedback-container p-4">
      <h2 class="text-2xl font-bold mb-6">Feedback</h2>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Submit Your Feedback</h3>
        
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Feedback Type</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>General Feedback</option>
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Complaint</option>
              <option>Compliment</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Brief summary of your feedback">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="5" placeholder="Please provide detailed information about your feedback..."></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" class="sr-only">
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          
          <div class="pt-2">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit Feedback</button>
          </div>
        </form>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Your Previous Feedback</h3>
        
        <div class="space-y-4">
          <div *ngIf="previousFeedback.length === 0" class="text-center py-8 text-gray-500">
            <p>You haven't submitted any feedback yet.</p>
          </div>
          
          <div *ngFor="let feedback of previousFeedback" class="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">{{ feedback.subject }}</h4>
                <span class="inline-block px-2 py-1 text-xs rounded-full" 
                      [class]="{
                        'bg-blue-100 text-blue-800': feedback.type === 'General Feedback',
                        'bg-red-100 text-red-800': feedback.type === 'Bug Report',
                        'bg-green-100 text-green-800': feedback.type === 'Feature Request',
                        'bg-yellow-100 text-yellow-800': feedback.type === 'Complaint',
                        'bg-purple-100 text-purple-800': feedback.type === 'Compliment'
                      }">
                  {{ feedback.type }}
                </span>
                <p class="text-sm text-gray-600 mt-2">{{ feedback.description }}</p>
              </div>
              <span class="text-xs text-gray-500">{{ feedback.date }}</span>
            </div>
            
            <div *ngIf="feedback.response" class="mt-3 pl-4 border-l-2 border-gray-200">
              <p class="text-sm font-medium">Response:</p>
              <p class="text-sm text-gray-600">{{ feedback.response }}</p>
              <span class="text-xs text-gray-500">{{ feedback.responseDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SharedFeedbackComponent {
  previousFeedback = [
    {
      id: 1,
      type: 'Bug Report',
      subject: 'Calendar not syncing properly',
      description: 'The appointments I add to my calendar are not syncing with my mobile device.',
      date: '2023-05-15',
      response: 'Thank you for reporting this issue. We have identified the problem and deployed a fix. Please let us know if you continue to experience this issue.',
      responseDate: '2023-05-17'
    },
    {
      id: 2,
      type: 'Feature Request',
      subject: 'Add dark mode support',
      description: 'It would be great to have a dark mode option for the dashboard to reduce eye strain during night time use.',
      date: '2023-06-02',
      response: null,
      responseDate: null
    }
  ];
}