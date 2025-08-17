import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-shared-appointments',
  template: `
    <div class="appointments-container p-4">
      <h2 class="text-2xl font-bold mb-6">Appointments</h2>
      
      <div class="flex justify-between mb-6">
        <div class="flex space-x-2">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i> New Appointment
          </button>
          <button class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            <i class="fas fa-filter mr-2"></i> Filter
          </button>
        </div>
        <div class="relative">
          <input type="text" placeholder="Search appointments..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64">
          <div class="absolute left-3 top-2.5 text-gray-400">
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>
      
      <!-- Calendar View Toggle -->
      <div class="flex mb-6 border-b">
        <button class="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">List View</button>
        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Calendar View</button>
      </div>
      
      <!-- Appointments List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let appointment of appointments">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ appointment.date }}</div>
                <div class="text-sm text-gray-500">{{ appointment.time }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ appointment.provider }}</div>
                <div class="text-sm text-gray-500">{{ appointment.specialty }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ appointment.type }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': appointment.status === 'Confirmed',
                        'bg-yellow-100 text-yellow-800': appointment.status === 'Pending',
                        'bg-red-100 text-red-800': appointment.status === 'Cancelled',
                        'bg-blue-100 text-blue-800': appointment.status === 'Completed'
                      }">
                  {{ appointment.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a routerLink="/shared/appointments/{{appointment.id}}" class="text-blue-600 hover:text-blue-900 mr-3">View</a>
                <a href="#" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                <a href="#" class="text-red-600 hover:text-red-900">Cancel</a>
              </td>
            </tr>
            
            <!-- Empty state -->
            <tr *ngIf="appointments.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <p>No appointments found</p>
                <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Schedule New Appointment</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-700">
          Showing <span class="font-medium">1</span> to <span class="font-medium">10</span> of <span class="font-medium">{{ appointments.length }}</span> appointments
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
export class SharedAppointmentsComponent {
  currentPage = 1;
  totalPages = 5;
  
  appointments = [
    {
      id: 1,
      date: 'Jun 15, 2023',
      time: '9:00 AM',
      provider: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      type: 'Check-up',
      status: 'Confirmed'
    },
    {
      id: 2,
      date: 'Jun 22, 2023',
      time: '2:30 PM',
      provider: 'Dr. Michael Chen',
      specialty: 'Dermatology',
      type: 'Consultation',
      status: 'Pending'
    },
    {
      id: 3,
      date: 'Jul 5, 2023',
      time: '11:15 AM',
      provider: 'Dr. Emily Rodriguez',
      specialty: 'Neurology',
      type: 'Follow-up',
      status: 'Confirmed'
    },
    {
      id: 4,
      date: 'Jul 10, 2023',
      time: '3:45 PM',
      provider: 'Dr. James Wilson',
      specialty: 'Orthopedics',
      type: 'Surgery Consultation',
      status: 'Confirmed'
    },
    {
      id: 5,
      date: 'Jun 8, 2023',
      time: '10:00 AM',
      provider: 'Dr. Lisa Thompson',
      specialty: 'General Practice',
      type: 'Annual Physical',
      status: 'Completed'
    }
  ];
}