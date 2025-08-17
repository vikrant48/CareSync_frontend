import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-shared-medical-history',
  template: `
    <div class="medical-history-container p-4">
      <h2 class="text-2xl font-bold mb-6">Medical History</h2>
      
      <div class="flex justify-between mb-6">
        <div class="flex space-x-2">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i> Add Record
          </button>
          <button class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            <i class="fas fa-filter mr-2"></i> Filter
          </button>
        </div>
        <div class="relative">
          <input type="text" placeholder="Search records..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64">
          <div class="absolute left-3 top-2.5 text-gray-400">
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>
      
      <!-- Category Tabs -->
      <div class="flex mb-6 border-b">
        <button class="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">All Records</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Conditions</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Medications</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Allergies</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Procedures</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Immunizations</button>
      </div>
      
      <!-- Medical Records List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let record of medicalRecords">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ record.date }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                      [ngClass]="{
                        'bg-blue-100 text-blue-800': record.category === 'Condition',
                        'bg-green-100 text-green-800': record.category === 'Medication',
                        'bg-red-100 text-red-800': record.category === 'Allergy',
                        'bg-purple-100 text-purple-800': record.category === 'Procedure',
                        'bg-yellow-100 text-yellow-800': record.category === 'Immunization'
                      }">
                  {{ record.category }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ record.description }}</div>
                <div *ngIf="record.details" class="text-sm text-gray-500">{{ record.details }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ record.provider }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a [routerLink]="['/shared/medical-history', record.id]" class="text-blue-600 hover:text-blue-900 mr-3">View</a>
                <a href="#" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                <a href="#" class="text-red-600 hover:text-red-900">Delete</a>
              </td>
            </tr>
            
            <!-- Empty state -->
            <tr *ngIf="medicalRecords.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <p>No medical records found</p>
                <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add New Record</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-700">
          Showing <span class="font-medium">1</span> to <span class="font-medium">10</span> of <span class="font-medium">{{ medicalRecords.length }}</span> records
        </div>
        <div class="flex space-x-2">
          <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50" [disabled]="currentPage === 1">
            Previous
          </button>
          <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50" [disabled]="currentPage === totalPages">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SharedMedicalHistoryComponent {
  currentPage = 1;
  totalPages = 3;
  
  medicalRecords = [
    {
      id: 1,
      date: 'May 15, 2023',
      category: 'Condition',
      description: 'Hypertension',
      details: 'Stage 1 hypertension, prescribed medication',
      provider: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      date: 'Apr 22, 2023',
      category: 'Medication',
      description: 'Lisinopril 10mg',
      details: 'Once daily for blood pressure',
      provider: 'Dr. Sarah Johnson'
    },
    {
      id: 3,
      date: 'Mar 10, 2023',
      category: 'Procedure',
      description: 'Echocardiogram',
      details: 'Routine heart function assessment',
      provider: 'Dr. Michael Chen'
    },
    {
      id: 4,
      date: 'Feb 5, 2023',
      category: 'Allergy',
      description: 'Penicillin',
      details: 'Moderate reaction - rash and hives',
      provider: 'Dr. Emily Rodriguez'
    },
    {
      id: 5,
      date: 'Jan 20, 2023',
      category: 'Immunization',
      description: 'Influenza Vaccine',
      details: 'Annual flu shot',
      provider: 'Dr. James Wilson'
    },
    {
      id: 6,
      date: 'Dec 12, 2022',
      category: 'Condition',
      description: 'Type 2 Diabetes',
      details: 'Initial diagnosis, diet and exercise recommended',
      provider: 'Dr. Lisa Thompson'
    },
    {
      id: 7,
      date: 'Nov 30, 2022',
      category: 'Medication',
      description: 'Metformin 500mg',
      details: 'Twice daily with meals for diabetes management',
      provider: 'Dr. Lisa Thompson'
    }
  ];
}