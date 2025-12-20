import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container.component';
import { AiAssistantWidgetComponent } from './ai-assistant-widget.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent, AiAssistantWidgetComponent],
  template: `
    <div class="h-full w-full md:grid md:grid-cols-[16rem_1fr] md:h-[calc(100dvh-3.5rem)] md:min-h-0 md:items-stretch bg-[var(--bg)] text-[var(--text)]">
      <!-- Sidebar (hidden on small screens) -->
      <aside class="hidden md:flex md:h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col overflow-hidden">
        <div class="px-4 py-4 border-b border-gray-700">
          <div class="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <i class="fas fa-user-injured"></i>
            <span>CareSync Patient</span>
          </div>
          <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Welcome</div>
        </div>
        <nav class="flex-1 px-3 py-3 space-y-1">
          <a routerLink="/patient" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/patient/book-appointment" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-calendar-plus"></i>
            <span>Book Appointment</span>
          </a>
          <a routerLink="/patient/appointments" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-calendar-check"></i>
            <span>My Appointments</span>
          </a>
          <a routerLink="/patient/reports" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-chart-line"></i>
            <span>Reports</span>
          </a>
          <a routerLink="/lab-tests" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-flask"></i>
            <span>Lab Tests</span>
          </a>
          <a routerLink="/patient/lab-bookings" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-vial"></i>
            <span>My Lab Bookings</span>
          </a>
          <a routerLink="/patient/feedback" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-star"></i>
            <span>Feedback</span>
          </a>
          <a routerLink="/patient/profile" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-id-badge"></i>
            <span>Profile</span>
          </a>
          <a routerLink="/settings" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </a>
          <button type="button" (click)="logout()" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
          <a routerLink="/patient/change-password" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-key"></i>
            <span>Change Password</span>
          </a>
        </nav>
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">© 2025 CareSync. All rights reserved.</div>
      </aside>

      <!-- Content Area -->
      <main class="relative min-h-0 md:h-full h-[calc(100dvh-3.5rem-4rem)] overflow-y-auto overflow-x-hidden min-w-0 md:pb-0 pb-[env(safe-area-inset-bottom)]">
        <div class="p-4 sm:p-6">
          <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
      </main>

      <!-- AI Health Assistant -->
      <app-ai-assistant-widget></app-ai-assistant-widget>

      <!-- Bottom Nav (mobile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-16">
        <div class="grid grid-cols-3 items-center text-sm h-full">
          <!-- Left: Home -->
          <a routerLink="/patient" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-home"></i>
            <span class="text-xs mt-1">Home</span>
          </a>
          <!-- Middle: Menu toggle -->
          <button type="button" (click)="menuOpen = !menuOpen" aria-label="Open Menu" class="flex flex-col items-center justify-center h-full">
            <i class="fas" [class.fa-bars]="!menuOpen" [class.fa-times]="menuOpen"></i>
            <span class="text-xs mt-1">Menu</span>
          </button>
          <!-- Right: Profile -->
          <a routerLink="/patient/profile" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-user"></i>
            <span class="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>

      <!-- Slide-up Menu Sheet -->
      <div *ngIf="menuOpen" class="md:hidden fixed inset-x-0 top-0 bottom-16 z-40">
        <!-- Overlay -->
        <div class="absolute inset-x-0 top-0 bottom-0 bg-black/50" (click)="menuOpen = false"></div>
        <!-- Sheet -->
        <div class="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-xl shadow-xl p-3 space-y-1 transform transition-transform duration-200">
          <div class="flex items-center justify-between px-2 py-1">
            <div class="text-sm font-semibold">Quick Actions</div>
            <button type="button" (click)="menuOpen = false" class="px-2 py-1 text-gray-400">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-1">
            <a routerLink="/patient" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
            <a routerLink="/patient/book-appointment" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-calendar-plus"></i>
              <span>Book Appointment</span>
            </a>
            <a routerLink="/patient/appointments" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-calendar-check"></i>
              <span>My Appointments</span>
            </a>
            <a routerLink="/patient/reports" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-chart-line"></i>
              <span>Reports</span>
            </a>
            <a routerLink="/lab-tests" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-flask"></i>
              <span>Lab Tests</span>
            </a>
            <a routerLink="/patient/lab-bookings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-vial"></i>
              <span>My Lab Bookings</span>
            </a>
            <a routerLink="/patient/feedback" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-star"></i>
              <span>Feedback</span>
            </a>
            <a routerLink="/settings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
            <a routerLink="/patient/change-password" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-key"></i>
              <span>Change Password</span>
            </a>
            <button type="button" (click)="logout(); menuOpen=false" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PatientLayoutComponent {
  menuOpen = false;
  constructor(private auth: AuthService) { }
  logout() {
    this.auth.logout();
  }
}
