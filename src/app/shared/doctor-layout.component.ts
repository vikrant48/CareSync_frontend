import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-screen w-screen overflow-hidden flex bg-gray-950 text-gray-100">
      <aside class="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-3 sticky top-0 h-screen overflow-hidden">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">D</div>
          <div>
            <div class="font-semibold">Doctor Panel</div>
            <div class="text-xs text-gray-400">CareSync</div>
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
          <a class="nav-item" routerLink="/doctor/profile" routerLinkActive="active">
            <i class="fa-solid fa-user-doctor mr-2"></i>
            <span>Profile</span>
          </a>
          <a class="nav-item" routerLink="/login">
            <i class="fa-solid fa-right-from-bracket mr-2"></i>
            <span>Logout</span>
          </a>
        </nav>
      </aside>
      <main class="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 p-6">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [
    `
    .nav-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; color: #e5e7eb; }
    .nav-item:hover { background: rgba(31,41,55,0.6); }
    .active { background: rgba(37,99,235,0.2); color: #93c5fd; }
    `,
  ],
})
export class DoctorLayoutComponent {}