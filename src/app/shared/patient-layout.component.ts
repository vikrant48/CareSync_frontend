import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-screen w-screen overflow-hidden flex bg-gray-900 text-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col sticky top-0 h-screen overflow-hidden">
        <div class="px-4 py-4 border-b border-gray-700">
          <div class="text-lg font-semibold flex items-center gap-2">
            <i class="fas fa-user-injured"></i>
            <span>CareSync Patient</span>
          </div>
          <div class="mt-1 text-xs text-gray-400">Welcome</div>
        </div>
        <nav class="flex-1 px-3 py-3 space-y-1">
          <a routerLink="/patient" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/patient/book-appointment" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-calendar-plus"></i>
            <span>Book Appointment</span>
          </a>
          <a routerLink="/patient/appointments" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-calendar-check"></i>
            <span>My Appointments</span>
          </a>
          <a routerLink="/patient/reports" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-chart-line"></i>
            <span>Reports</span>
          </a>
          <a routerLink="/lab-tests" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-flask"></i>
            <span>Lab Tests</span>
          </a>
          <a routerLink="/patient/lab-bookings" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-vial"></i>
            <span>My Lab Bookings</span>
          </a>
          <a routerLink="/patient/feedback" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-star"></i>
            <span>Feedback</span>
          </a>
          <a routerLink="/patient/profile" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-id-badge"></i>
            <span>Profile</span>
          </a>
          <a routerLink="/settings" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </a>
          <button type="button" (click)="logout()" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
          <a routerLink="/patient/change-password" routerLinkActive="!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-key"></i>
            <span>Change Password</span>
          </a>
        </nav>
        <div class="px-4 py-3 border-t border-gray-700 text-xs text-gray-400">Dark mode enabled</div>
      </aside>

      <!-- Content Area -->
      <main class="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 pb-16">
        <div class="p-4">
          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `,
})
export class PatientLayoutComponent {
  constructor(private auth: AuthService) {}
  logout() {
    this.auth.logout();
  }
}