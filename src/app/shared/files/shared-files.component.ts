import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-files',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Files & Documents</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">My Files</h2>
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            Upload New File
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th class="py-3 px-6 text-left">File Name</th>
                <th class="py-3 px-6 text-left">Type</th>
                <th class="py-3 px-6 text-left">Date Uploaded</th>
                <th class="py-3 px-6 text-left">Size</th>
                <th class="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm">
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-6 text-left">Medical Report.pdf</td>
                <td class="py-3 px-6 text-left">PDF</td>
                <td class="py-3 px-6 text-left">2023-06-15</td>
                <td class="py-3 px-6 text-left">1.2 MB</td>
                <td class="py-3 px-6 text-center">
                  <div class="flex item-center justify-center space-x-2">
                    <button class="text-blue-500 hover:text-blue-700">View</button>
                    <button class="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-6 text-left">Lab Results.jpg</td>
                <td class="py-3 px-6 text-left">Image</td>
                <td class="py-3 px-6 text-left">2023-05-22</td>
                <td class="py-3 px-6 text-left">3.5 MB</td>
                <td class="py-3 px-6 text-center">
                  <div class="flex item-center justify-center space-x-2">
                    <button class="text-blue-500 hover:text-blue-700">View</button>
                    <button class="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-6 text-left">Prescription.docx</td>
                <td class="py-3 px-6 text-left">Document</td>
                <td class="py-3 px-6 text-left">2023-04-10</td>
                <td class="py-3 px-6 text-left">0.8 MB</td>
                <td class="py-3 px-6 text-center">
                  <div class="flex item-center justify-center space-x-2">
                    <button class="text-blue-500 hover:text-blue-700">View</button>
                    <button class="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
export class SharedFilesComponent {
  constructor() { }
}