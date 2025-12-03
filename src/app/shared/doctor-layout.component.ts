import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="h-full w-full md:grid md:grid-cols-[16rem_1fr] md:h-[calc(100dvh-3.5rem)] md:min-h-0 md:items-stretch bg-[var(--bg)] text-[var(--text)]">
      <aside class="hidden md:block md:h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 space-y-3 overflow-hidden">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">D</div>
          <div>
            <div class="font-semibold">Doctor Panel</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">CareSync</div>
          </div>
        </div>
        <nav class="space-y-1">
          <a class="nav-item" routerLink="/doctor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <i class="fa-solid fa-gauge mr-2"></i>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/doctor/appointments" routerLinkActive="active">
            <i class="fa-solid fa-calendar-check mr-2"></i>
            <span>Appointments</span>
          </a>
          <a class="nav-item" routerLink="/doctor/documents" routerLinkActive="active">
            <i class="fa-solid fa-folder-open mr-2"></i>
            <span>My Documents</span>
          </a>
          <a class="nav-item" routerLink="/doctor/reports" routerLinkActive="active">
            <i class="fa-solid fa-chart-line mr-2"></i>
            <span>Reports</span>
          </a>
          <a class="nav-item" routerLink="/lab-tests" routerLinkActive="active">
            <i class="fa-solid fa-flask mr-2"></i>
            <span>Lab Tests</span>
          </a>
          <a class="nav-item" routerLink="/doctor/lab-test-management" routerLinkActive="active">
            <i class="fa-solid fa-flask-vial mr-2"></i>
            <span>Manage Lab Tests</span>
          </a>
          <a class="nav-item" routerLink="/doctor/profile" routerLinkActive="active">
            <i class="fa-solid fa-user-doctor mr-2"></i>
            <span>Profile</span>
          </a>
          <a class="nav-item" routerLink="/settings" routerLinkActive="active">
            <i class="fa-solid fa-gear mr-2"></i>
            <span>Settings</span>
          </a>
          <button class="nav-item w-full text-left" (click)="onLogout()">
            <i class="fa-solid fa-right-from-bracket mr-2"></i>
            <span>Logout</span>
          </button>
          <a class="nav-item" routerLink="/doctor/change-password" routerLinkActive="active">
            <i class="fa-solid fa-key mr-2"></i>
            <span>Change Password</span>
          </a>
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">© 2025 CareSync. All rights reserved.</div>
        </nav>
      </aside>
      <main class="relative min-h-0 md:h-full h-[calc(100dvh-3.5rem-4rem)] overflow-y-auto overflow-x-hidden min-w-0 p-4 sm:p-6 pb-[env(safe-area-inset-bottom)]">
        <ng-content></ng-content>
        <app-toast-container></app-toast-container>
      </main>
      <!-- Bottom Nav (mobile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-16">
        <div class="grid grid-cols-3 items-center text-sm h-full">
          <a routerLink="/doctor" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-home"></i>
            <span class="text-xs mt-1">Home</span>
          </a>
          <button type="button" (click)="menuOpen = !menuOpen" aria-label="Open Menu" class="flex flex-col items-center justify-center h-full">
            <i class="fas" [class.fa-bars]="!menuOpen" [class.fa-times]="menuOpen"></i>
            <span class="text-xs mt-1">Menu</span>
          </button>
          <a routerLink="/doctor/profile" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-user-doctor"></i>
            <span class="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>

      <!-- Mobile Menu Sheet -->
      <div *ngIf="menuOpen" class="md:hidden fixed inset-x-0 top-0 bottom-16 z-40">
        <div class="absolute inset-x-0 top-0 bottom-0 bg-black/50" (click)="menuOpen = false"></div>
        <div class="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-xl shadow-xl p-3 space-y-1">
          <div class="grid grid-cols-1 gap-1">
            <a routerLink="/doctor" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
            <a routerLink="/doctor/appointments" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-calendar-check"></i>
              <span>Appointments</span>
            </a>
            <a routerLink="/doctor/reports" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-chart-line"></i>
              <span>Reports</span>
            </a>
            <a routerLink="/lab-tests" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-flask"></i>
              <span>Lab Tests</span>
            </a>
            <a routerLink="/doctor/lab-test-management" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-flask-vial"></i>
              <span>Manage Lab Tests</span>
            </a>
            <a routerLink="/doctor/documents" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-folder-open"></i>
              <span>My Documents</span>
            </a>
            <a routerLink="/settings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-gear"></i>
              <span>Settings</span>
            </a>
            <a routerLink="/doctor/change-password" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-key"></i>
              <span>Change Password</span>
            </a>
            <button type="button" (click)="onLogout(); menuOpen=false" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .nav-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; color: var(--text); }
    .nav-item:hover { background: rgba(31,41,55,0.08); }
    .active { background: rgba(37,99,235,0.12); color: #2563eb; }
    `,
  ],
})
export class DoctorLayoutComponent {
  private auth = inject(AuthService);
  menuOpen = false;
  onLogout() {
    this.auth.logout();
  }
}
