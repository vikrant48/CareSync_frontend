import { Component } from '@angular/core';

@Component({
  selector: 'app-submit-feedback',
  template: `
    <div class="submit-feedback-container p-4">
      <h2 class="text-2xl font-bold mb-6">Submit Feedback</h2>
      
      <div class="bg-white rounded-lg shadow p-6">
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
          
          <div class="flex items-center">
            <input id="anonymous" name="anonymous" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="anonymous" class="ml-2 block text-sm text-gray-900">Submit anonymously</label>
          </div>
          
          <div class="pt-4 flex justify-between">
            <button type="button" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit Feedback</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class SubmitFeedbackComponent {
  // Component logic would go here
}