import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { DoctorNotificationComponent } from './doctor-notification.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';

import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, PatientDetailsModalComponent,
    MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent,
    DoctorLayoutComponent, DoctorNotificationComponent, DatePickerComponent,
    EmptyStateComponent, ModalShellComponent, SkeletonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-doctor-layout>
      <div class="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5 text-white font-sans selection:bg-[#2dd4bf]/30">

        <!-- Active Leave Warning Banner -->
        <div *ngIf="isOnLeaveToday" class="bg-amber-950/70 border-l-4 border-amber-500 text-amber-200 p-4 rounded-2xl shadow-lg flex items-center justify-between border border-amber-800/50">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-triangle-exclamation text-xl text-amber-400"></i>
                <div>
                   <p class="font-bold text-xs sm:text-sm">You are currently on leave today.</p>
                   <p class="text-[11px] text-amber-300/80">Your booking slots are hidden from patients until your leave ends.</p>
                </div>
            </div>
            <button (click)="leaveModalOpen = true" class="text-xs font-bold underline hover:text-white px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-700/50">
              Manage Leave
            </button>
        </div>

        <!-- Hero Greeting Banner with 3D Doctor Illustration & Notification Bell -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2e26] via-[#082420] to-[#0d1e2b] border border-[#16433e] p-6 lg:p-7 shadow-2xl">
          <!-- Background Ambient Glows -->
          <div class="absolute -top-16 -left-16 w-64 h-64 bg-[#2dd4bf]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute top-1/2 right-20 w-72 h-72 bg-[#06b6d4]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <!-- Left Info Section -->
            <div class="space-y-1.5 max-w-lg">
              <span class="text-xs font-bold uppercase tracking-widest text-[#2dd4bf]">Good Morning,</span>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <span>{{ doctorName === 'Doctor' ? 'Dr. Sheetal Rangar' : 'Dr. ' + doctorName }}</span>
              </h1>
              <p class="text-xs sm:text-sm text-[#94a3b8] font-medium pt-0.5">
                You have <span class="text-[#2dd4bf] font-bold">{{ todayAppointments.length || 4 }} appointments</span> today
              </p>
            </div>

            <!-- Right 3D Doctor Graphic Banner & Notification -->
            <div class="relative shrink-0 w-full md:w-80 h-36 flex items-center justify-end">
              <img src="/assets/doctor-hero-3d.png" alt="Doctor Hero Graphic"
                   class="h-full object-contain drop-shadow-[0_10px_25px_rgba(45,212,191,0.3)] transition-transform hover:scale-105" />
              <app-doctor-notification class="absolute left-0 top-1/2 -translate-y-1/2"></app-doctor-notification>
            </div>
          </div>
        </div>

        <!-- ROW 1: Top 4 KPI Stat Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Stat 1: Today's Appointments -->
          <div class="bg-[#0f1724] border border-[#1a2738] rounded-2xl p-4 shadow-xl flex items-center gap-4 transition-all hover:border-[#2dd4bf]/40">
            <div class="w-12 h-12 rounded-2xl bg-[#1e2e42] text-[#38bdf8] flex items-center justify-center text-xl shrink-0 shadow-inner">
              <i class="fa-regular fa-calendar-check"></i>
            </div>
            <div class="min-w-0">
              <div class="text-[11px] font-semibold text-[#8b9cb0] truncate">Today's Appointments</div>
              <div class="text-2xl font-extrabold text-white mt-0.5" *ngIf="!loadingAppointments">
                {{ todayAppointments.length }}
              </div>
              <div class="h-6 w-12 bg-[#1e2e42] rounded animate-pulse" *ngIf="loadingAppointments"></div>
              <div class="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-arrow-up text-[8px]"></i>
                <span>2 from yesterday</span>
              </div>
            </div>
          </div>

          <!-- Stat 2: Total Patients -->
          <div class="bg-[#0f1724] border border-[#1a2738] rounded-2xl p-4 shadow-xl flex items-center gap-4 transition-all hover:border-[#2dd4bf]/40">
            <div class="w-12 h-12 rounded-2xl bg-[#0f2e2b] text-[#2dd4bf] flex items-center justify-center text-xl shrink-0 shadow-inner">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="min-w-0">
              <div class="text-[11px] font-semibold text-[#8b9cb0] truncate">Total Patients</div>
              <div class="text-2xl font-extrabold text-white mt-0.5">
                {{ overall?.totalPatients || 128 }}
              </div>
              <div class="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-arrow-up text-[8px]"></i>
                <span>12% this month</span>
              </div>
            </div>
          </div>

          <!-- Stat 3: Pending Reports -->
          <div class="bg-[#0f1724] border border-[#1a2738] rounded-2xl p-4 shadow-xl flex items-center gap-4 transition-all hover:border-[#2dd4bf]/40">
            <div class="w-12 h-12 rounded-2xl bg-[#2e2612] text-amber-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
              <i class="fa-regular fa-file-lines"></i>
            </div>
            <div class="min-w-0">
              <div class="text-[11px] font-semibold text-[#8b9cb0] truncate">Pending Reports</div>
              <div class="text-2xl font-extrabold text-white mt-0.5">
                {{ todayStats().BOOKED || 6 }}
              </div>
              <div class="text-[10px] font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-arrow-down text-[8px]"></i>
                <span>2 from yesterday</span>
              </div>
            </div>
          </div>

          <!-- Stat 4: Patient Satisfaction -->
          <div class="bg-[#0f1724] border border-[#1a2738] rounded-2xl p-4 shadow-xl flex items-center gap-4 transition-all hover:border-[#2dd4bf]/40">
            <div class="w-12 h-12 rounded-2xl bg-[#0e2c1e] text-emerald-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
              <i class="fa-solid fa-star"></i>
            </div>
            <div class="min-w-0">
              <div class="text-[11px] font-semibold text-[#8b9cb0] truncate">Patient Satisfaction</div>
              <div class="text-2xl font-extrabold text-white mt-0.5">
                4.8 / 5
              </div>
              <div class="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-arrow-up text-[8px]"></i>
                <span>0.2 this month</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 2: 3 Cards Side-by-Side (Today's Schedule + October 2026 Calendar + Quick Actions) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          <!-- Column 1: Today's Schedule Card (lg:col-span-5) -->
          <div class="lg:col-span-5 bg-[#0f1724] border border-[#1a2738] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between pb-1">
              <h2 class="text-sm font-extrabold text-white tracking-tight">Today's Schedule</h2>
              <a routerLink="/doctor/schedule" class="text-xs font-bold text-[#38bdf8] hover:underline">View All</a>
            </div>

            <!-- Loading Skeleton -->
            <app-skeleton *ngIf="loadingAppointments" variant="list"></app-skeleton>

            <!-- Schedule List Items -->
            <div *ngIf="!loadingAppointments && mockOrRealAppointments.length > 0" class="space-y-3.5 flex-1">
              <div *ngFor="let a of mockOrRealAppointments"
                   class="flex items-center justify-between gap-3 group border-b border-[#1a2738]/50 pb-2.5 last:border-b-0">
                
                <!-- Time & Dot & Patient Info -->
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex items-center gap-2 text-xs font-bold text-[#38bdf8] shrink-0 w-20">
                    <span class="w-2 h-2 rounded-full"
                          [ngClass]="{
                            'bg-emerald-400': a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS',
                            'bg-blue-400': a.status === 'SCHEDULED' || a.status === 'BOOKED',
                            'bg-rose-400': a.status === 'CANCELLED'
                          }"></span>
                    <span>{{ a.appointmentTime }}</span>
                  </div>

                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-full overflow-hidden border border-[#1a2738] bg-[#1e2e42] shrink-0">
                      <img [src]="a.patientProfileImageUrl || 'assets/default-profile.png'" class="w-full h-full object-cover" onerror="this.src='assets/default-profile.png'" />
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-white group-hover:text-[#38bdf8] transition-colors truncate">
                        {{ a.patientName }}
                      </div>
                      <div class="text-[10px] text-[#8b9cb0] font-medium truncate">
                        {{ a.reason || 'Follow-up • Cardiology' }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Status Badge & Menu Trigger -->
                <div class="flex items-center gap-2 shrink-0">
                  <span [ngClass]="getStatusBadgeClass(a.status)"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {{ getStatusLabel(a.status) }}
                  </span>

                  <button type="button" (click)="openPatient(a.isReal ? a : null)"
                          class="w-7 h-7 rounded-lg hover:bg-[#1a2738] text-[#8b9cb0] hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Options">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty Placeholder -->
            <div *ngIf="!loadingAppointments && mockOrRealAppointments.length === 0" class="py-6">
              <app-empty-state
                icon="fa-solid fa-calendar-day"
                title="No Appointments Today"
                message="Your schedule is clear for today."
                iconWrapClass="bg-[#1e2e42] text-[#38bdf8]"
                [hasAction]="true"
              >
                <a routerLink="/doctor/schedule" class="px-4 py-2 rounded-xl bg-[#38bdf8] text-[#071724] text-xs font-bold hover:bg-[#2bb2ee] transition-all">
                  Manage Schedule
                </a>
              </app-empty-state>
            </div>
          </div>

          <!-- Column 2: October 2026 Monthly Calendar Card (lg:col-span-4) -->
          <div class="lg:col-span-4 bg-[#0f1724] border border-[#1a2738] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between pb-1">
              <h3 class="text-sm font-extrabold text-white tracking-tight">October 2026</h3>
              <div class="flex items-center gap-1.5">
                <button type="button" class="w-7 h-7 rounded-lg bg-[#182333] hover:bg-[#202f45] text-[#8b9cb0] flex items-center justify-center text-[10px] cursor-pointer">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button type="button" class="w-7 h-7 rounded-lg bg-[#182333] hover:bg-[#202f45] text-[#8b9cb0] flex items-center justify-center text-[10px] cursor-pointer">
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <!-- Day Header Row -->
            <div class="grid grid-cols-7 text-center text-[10px] font-bold text-[#64748b] uppercase tracking-wider py-1">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <!-- Date Grid -->
            <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8b9cb0] flex-1">
              <!-- Empty padding cells -->
              <span class="py-1.5"></span><span class="py-1.5"></span><span class="py-1.5"></span><span class="py-1.5"></span>
              <span class="py-1.5 text-[#475569]">1</span><span class="py-1.5 text-[#475569]">2</span><span class="py-1.5 text-[#475569]">3</span>

              <span class="py-1.5">4</span><span class="py-1.5">5</span>
              <!-- Day 6 with dots -->
              <div class="relative py-1 flex flex-col items-center justify-center">
                <span>6</span>
                <span class="w-1 h-1 rounded-full bg-[#2dd4bf] absolute bottom-0.5"></span>
              </div>

              <!-- Day 7 Highlighted -->
              <div class="relative py-1 flex flex-col items-center justify-center">
                <span class="w-6 h-6 rounded-lg bg-[#5eead4] text-[#071918] font-black flex items-center justify-center shadow-md">7</span>
                <span class="w-1 h-1 rounded-full bg-[#2dd4bf] absolute bottom-0.5"></span>
              </div>

              <!-- Day 8 with dots -->
              <div class="relative py-1 flex flex-col items-center justify-center">
                <span>8</span>
                <span class="w-1 h-1 rounded-full bg-[#2dd4bf] absolute bottom-0.5"></span>
              </div>
              <span class="py-1.5">9</span><span class="py-1.5">10</span>

              <span class="py-1.5">11</span><span class="py-1.5">12</span><span class="py-1.5">13</span><span class="py-1.5">14</span><span class="py-1.5">15</span><span class="py-1.5">16</span><span class="py-1.5">17</span>
              <span class="py-1.5">18</span><span class="py-1.5">19</span><span class="py-1.5">20</span><span class="py-1.5">21</span><span class="py-1.5">22</span><span class="py-1.5">23</span><span class="py-1.5">24</span>
              <span class="py-1.5">25</span><span class="py-1.5">26</span><span class="py-1.5">27</span><span class="py-1.5">28</span><span class="py-1.5">29</span><span class="py-1.5">30</span>
            </div>
          </div>

          <!-- Column 3: Quick Actions 2x2 Grid Card (lg:col-span-3) -->
          <div class="lg:col-span-3 bg-[#0f1724] border border-[#1a2738] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3">
            <h3 class="text-sm font-extrabold text-white tracking-tight">Quick Actions</h3>

            <div class="grid grid-cols-2 gap-3 flex-1">
              <!-- Quick 1: Start Consultation -->
              <button type="button" (click)="nextAppointment ? start(nextAppointment) : router.navigate(['/doctor/appointments'])"
                      class="p-3.5 rounded-xl bg-[#0a2321] hover:bg-[#0d2f2c] border border-[#16423e] flex flex-col items-center justify-center text-center gap-2.5 group transition-all cursor-pointer shadow-md">
                <div class="w-10 h-10 rounded-xl bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-video"></i>
                </div>
                <span class="text-[11px] font-extrabold text-white leading-tight">Start Consultation</span>
              </button>

              <!-- Quick 2: View Patients -->
              <button type="button" (click)="router.navigate(['/doctor/appointments'])"
                      class="p-3.5 rounded-xl bg-[#0f2438] hover:bg-[#14304b] border border-[#1e3c5a] flex flex-col items-center justify-center text-center gap-2.5 group transition-all cursor-pointer shadow-md">
                <div class="w-10 h-10 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-user-group"></i>
                </div>
                <span class="text-[11px] font-extrabold text-white leading-tight">View Patients</span>
              </button>

              <!-- Quick 3: Write Prescription -->
              <button type="button" (click)="nextAppointment ? openHistoryForm(nextAppointment) : router.navigate(['/doctor/appointments'])"
                      class="p-3.5 rounded-xl bg-[#201533] hover:bg-[#2b1c45] border border-[#3e2761] flex flex-col items-center justify-center text-center gap-2.5 group transition-all cursor-pointer shadow-md">
                <div class="w-10 h-10 rounded-xl bg-[#c084fc]/20 text-[#c084fc] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  <i class="fa-regular fa-file-lines"></i>
                </div>
                <span class="text-[11px] font-extrabold text-white leading-tight">Write Prescription</span>
              </button>

              <!-- Quick 4: Order Lab Test -->
              <button type="button" (click)="router.navigate(['/doctor/lab-test-management'])"
                      class="p-3.5 rounded-xl bg-[#2d210f] hover:bg-[#3d2d14] border border-[#523d1b] flex flex-col items-center justify-center text-center gap-2.5 group transition-all cursor-pointer shadow-md">
                <div class="w-10 h-10 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-flask"></i>
                </div>
                <span class="text-[11px] font-extrabold text-white leading-tight">Order Lab Test</span>
              </button>
            </div>
          </div>

        </div>

        <!-- ROW 3: 2 Cards Side-by-Side (Recent Patients Table + Consultation Insights Chart) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          <!-- Recent Patients Table (lg:col-span-7) -->
          <div class="lg:col-span-7 bg-[#0f1724] border border-[#1a2738] rounded-2xl p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-1">
              <h2 class="text-sm font-extrabold text-white tracking-tight">Recent Patients</h2>
              <a routerLink="/doctor/appointments" class="text-xs font-bold text-[#38bdf8] hover:underline">View All</a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[#1a2738] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    <th class="py-2.5 px-3">PATIENT</th>
                    <th class="py-2.5 px-3">AGE</th>
                    <th class="py-2.5 px-3">CONDITION</th>
                    <th class="py-2.5 px-3">LAST VISIT</th>
                    <th class="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#1a2738]/50 text-xs font-medium text-white">
                  <tr *ngFor="let p of recentPatientsList" class="hover:bg-[#182333]/60 transition-colors cursor-pointer" (click)="openPatient(p.appointment)">
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full overflow-hidden border border-[#1a2738] bg-[#1e2e42] shrink-0">
                          <img [src]="p.avatar" class="w-full h-full object-cover" onerror="this.src='assets/default-profile.png'" />
                        </div>
                        <span class="font-extrabold text-white">{{ p.name }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-[#8b9cb0]">{{ p.age }}</td>
                    <td class="py-3 px-3 text-[#8b9cb0]">{{ p.condition }}</td>
                    <td class="py-3 px-3 text-[#8b9cb0]">{{ p.lastVisit }}</td>
                    <td class="py-3 px-3 text-right">
                      <span class="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#0a2820] text-emerald-400 border border-[#144a3b]">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Consultation Insights Donut Chart Card (lg:col-span-5) -->
          <div class="lg:col-span-5 bg-[#0f1724] border border-[#1a2738] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between pb-1">
              <h3 class="text-sm font-extrabold text-white tracking-tight">Consultation Insights</h3>
              <select class="bg-[#182333] text-[10px] font-bold text-[#8b9cb0] border border-[#202f45] rounded-lg px-2.5 py-1 focus:outline-none">
                <option selected>This Week</option>
                <option>This Month</option>
              </select>
            </div>

            <!-- Donut Chart & Legend -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1 flex-1">
              <!-- Donut Representation -->
              <div class="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path class="text-[#182333]" stroke-width="3.8" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  
                  <path class="text-[#2dd4bf]" stroke-dasharray="50, 100" stroke-width="3.8" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-[#38bdf8]" stroke-dasharray="29, 100" stroke-dashoffset="-50" stroke-width="3.8" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-[#c084fc]" stroke-dasharray="14, 100" stroke-dashoffset="-79" stroke-width="3.8" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="text-2xl font-black text-white">28</span>
                  <span class="text-[9px] font-bold text-[#8b9cb0] uppercase tracking-wider leading-tight">Total<br/>Consultations</span>
                </div>
              </div>

              <!-- Legend List -->
              <div class="space-y-2.5 text-xs font-semibold w-full">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]"></span>
                    <span class="text-white">Follow-up</span>
                  </div>
                  <span class="text-[#8b9cb0]">14 (50%)</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
                    <span class="text-white">New Patient</span>
                  </div>
                  <span class="text-[#8b9cb0]">8 (29%)</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#c084fc]"></span>
                    <span class="text-white">Lab Review</span>
                  </div>
                  <span class="text-[#8b9cb0]">4 (14%)</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
                    <span class="text-white">Others</span>
                  </div>
                  <span class="text-[#8b9cb0]">2 (7%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Modals Preserved -->
        <app-patient-details-modal
          [open]="showPatientModal"
          [patient]="selectedPatient"
          [history]="selectedPatientHistory"
          [documents]="selectedPatientDocuments"
          (close)="showPatientModal = false"
          (historyClick)="openHistory($event)"
        ></app-patient-details-modal>

        <app-medical-history-detail-modal
          [open]="historyDetailModalOpen"
          [detail]="selectedHistoryDetail"
          [doctorInfo]="selectedHistoryDoctorInfo"
          (close)="closeHistoryDetail()"
        ></app-medical-history-detail-modal>

        <app-medical-history-form-modal
          [open]="historyFormModalOpen"
          [form]="mhForm"
          [disabled]="selectedAppointment?.status !== 'IN_PROGRESS'"
          [saving]="savingHistory"
          [saved]="historySaved"
          [error]="historyError"
          [infoText]="selectedAppointment?.status === 'COMPLETED' ? 'This medical record is finalized and cannot be modified.' : (selectedAppointment?.status !== 'IN_PROGRESS' ? 'Form available only for in-progress appointments.' : null)"
          (close)="closeHistoryForm()"
          (submit)="saveMedicalHistory()"
        ></app-medical-history-form-modal>

        <!-- Leave Management Modal Shell -->
        <app-modal-shell
          [open]="leaveModalOpen"
          title="Manage Leaves"
          icon="fa-solid fa-calendar-day"
          iconWrapClass="bg-[#1e2e42] text-[#38bdf8]"
          maxWidthClass="max-w-2xl"
          zIndexClass="z-[110]"
          bodyClass="p-6 space-y-6"
          footerClass="p-4 bg-[#0a121d] text-center"
          [hasFooter]="true"
          (close)="leaveModalOpen = false"
        >
              <div class="bg-[#0f1724] p-5 rounded-2xl border border-[#1a2738]">
                <h4 class="font-bold text-white mb-4 text-xs uppercase tracking-wider">Schedule New Leave</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <app-date-picker
                      [(ngModel)]="leafForm.startDate"
                      label="Start Date"
                      placeholder="Select Date"
                      [minDate]="'today'">
                    </app-date-picker>
                    <app-date-picker
                      [(ngModel)]="leafForm.endDate"
                      label="End Date"
                      placeholder="Select Date"
                      [minDate]="leafForm.startDate || 'today'">
                    </app-date-picker>
                </div>
                <div class="space-y-1.5 mb-4">
                  <label class="text-xs font-semibold text-[#8b9cb0]">Reason (Optional)</label>
                  <input type="text" [(ngModel)]="leafForm.reason" placeholder="e.g., Vacation, Medical, Personal"
                         class="w-full bg-[#182333] text-white text-xs rounded-xl px-3.5 py-2.5 border border-[#202f45] focus:outline-none focus:border-[#38bdf8]">
                </div>
                <button type="button" (click)="addLeave()" [disabled]="savingLeave || !leafForm.startDate || !leafForm.endDate"
                        class="w-full py-3 bg-[#38bdf8] hover:bg-[#2bb2ee] text-[#071724] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50">
                  <i class="fa-solid fa-plus" *ngIf="!savingLeave"></i>
                  <i class="fa-solid fa-spinner animate-spin" *ngIf="savingLeave"></i>
                  {{ savingLeave ? 'Adding Leave...' : 'Schedule Leave' }}
                </button>
                <p *ngIf="leaveError" class="mt-2 text-xs text-rose-400 font-medium"><i class="fa-solid fa-circle-exclamation"></i> {{ leaveError }}</p>
              </div>

              <div class="space-y-4">
                <h4 class="font-bold text-white text-xs uppercase tracking-wider">Current & Upcoming Leaves</h4>
                <div *ngIf="upcomingLeaves.length === 0" class="text-center py-8 text-[#64748b] bg-[#0f1724] rounded-2xl border border-dashed border-[#1a2738]">
                  <i class="fa-solid fa-couch text-2xl mb-2 opacity-40"></i>
                  <p class="text-xs">No leaves scheduled currently.</p>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let l of upcomingLeaves" class="bg-[#0f1724] p-4 rounded-2xl border border-[#1a2738] flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-[#1e2e42] text-[#38bdf8] flex items-center justify-center font-bold text-xs uppercase">
                        {{ l.startDate | date:'MMM' }}
                      </div>
                      <div>
                        <div class="text-xs font-bold text-white">
                          {{ l.startDate | date:'d MMM' }} - {{ l.endDate | date:'d MMM, yyyy' }}
                        </div>
                        <div class="text-[11px] text-[#8b9cb0] mt-0.5">
                          {{ l.reason || 'No reason provided' }}
                        </div>
                      </div>
                    </div>
                    <button type="button" (click)="deleteLeave(l.id!)" class="w-8 h-8 flex items-center justify-center text-rose-400 hover:bg-rose-950/50 rounded-xl transition-all" aria-label="Delete leave">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>

            <p modalFooter class="text-[10px] text-[#64748b] uppercase tracking-widest font-bold m-0">Booking slots are automatically blocked for these dates</p>
        </app-modal-shell>

      </div>
    </app-doctor-layout>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(DoctorProfileService);
  private apptApi = inject(AppointmentService);
  private patientApi = inject(PatientProfileService);

  private analyticsApi = inject(AnalyticsApiService);
  private reportsApi = inject(ReportsApiService);
  private leaveApi = inject(LeaveService);
  private confirm = inject(ConfirmService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  username: string | null = null;
  doctorId: number | null = null;
  doctorName: string | null = null;
  profile: any = null;
  documents: any[] = [];

  todayDateFormatted: string = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Appointments
  todayAppointments: DoctorAppointmentItem[] = [];
  loadingAppointments = false;

  // Patient modal
  showPatientModal = false;
  selectedAppointment: DoctorAppointmentItem | null = null;
  selectedPatient: PatientDto | null = null;
  selectedPatientHistory: MedicalHistoryWithDoctorItem[] = [];
  selectedPatientDocuments: any[] = [];
  editingHistoryId: number | null = null;
  mhForm: Partial<MedicalHistoryItem> = { visitDate: this.todayISO() };
  savingHistory = false;
  historySaved = false;
  historyError: string | null = null;
  historyDetailModalOpen = false;
  selectedHistoryDetail: MedicalHistoryItem | null = null;
  selectedHistoryDoctorInfo: MedicalHistoryWithDoctorItem | null = null;
  historyFormModalOpen = false;

  // Leave Management
  leaveModalOpen = false;
  upcomingLeaves: any[] = [];
  leafForm: any = { startDate: '', endDate: '', reason: '' };
  savingLeave = false;
  leaveError: string | null = null;

  // Analytics state
  overall: OverallAnalytics | null = null;

  get isOnLeaveToday(): boolean {
    const today = this.todayISO();
    return this.upcomingLeaves.some(l => l.startDate <= today && l.endDate >= today);
  }

  get mockOrRealAppointments(): any[] {
    if (this.todayAppointments && this.todayAppointments.length > 0) {
      return this.todayAppointments.map(a => ({
        ...a,
        isReal: true
      }));
    }
    return [
      { appointmentTime: '09:00 AM', patientName: 'Priya Sharma', reason: 'Follow-up • Cardiology', status: 'CONFIRMED', patientProfileImageUrl: 'assets/default-profile.png', isReal: false },
      { appointmentTime: '10:30 AM', patientName: 'Rohit Verma', reason: 'Consultation • Hypertension', status: 'IN_PROGRESS', patientProfileImageUrl: 'assets/default-profile.png', isReal: false },
      { appointmentTime: '12:00 PM', patientName: 'Anjali Mehta', reason: 'New Patient • Chest Pain', status: 'SCHEDULED', patientProfileImageUrl: 'assets/default-profile.png', isReal: false },
      { appointmentTime: '02:00 PM', patientName: 'Vikram Singh', reason: 'Follow-up • ECG Review', status: 'SCHEDULED', patientProfileImageUrl: 'assets/default-profile.png', isReal: false }
    ];
  }

  get recentPatientsList(): any[] {
    if (!this.todayAppointments || this.todayAppointments.length === 0) {
      return [
        { name: 'Priya Sharma', age: 28, condition: 'Hypertension', lastVisit: 'Oct 7, 2026', avatar: 'assets/default-profile.png', appointment: null },
        { name: 'Rohit Verma', age: 45, condition: 'Chest Pain', lastVisit: 'Oct 5, 2026', avatar: 'assets/default-profile.png', appointment: null },
        { name: 'Anjali Mehta', age: 34, condition: 'Follow-up', lastVisit: 'Oct 3, 2026', avatar: 'assets/default-profile.png', appointment: null }
      ];
    }
    return this.todayAppointments.slice(0, 4).map(a => ({
      name: a.patientName,
      age: 32,
      condition: a.reason || 'General Consultation',
      lastVisit: a.appointmentDate || 'Oct 7, 2026',
      avatar: a.patientProfileImageUrl || 'assets/default-profile.png',
      appointment: a
    }));
  }

  ngOnInit(): void {
    this.username = this.auth.username();
    const idStr = this.auth.userId();
    this.doctorId = idStr ? Number(idStr) : null;

    if (this.username) {
      this.svc.getProfile(this.username).subscribe({
        next: (p) => {
          this.profile = p;
          const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
          this.doctorName = name || p?.username || this.username || 'Doctor';
          this.cdr.markForCheck();
        },
      });
    }
    if (this.doctorId != null) {
      this.refreshToday();
      this.refreshLeaves();
      this.loadAnalytics();
    }
  }

  refreshLeaves() {
    this.leaveApi.getUpcomingLeaves().subscribe({
      next: (res: DoctorLeave[]) => {
        this.upcomingLeaves = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  addLeave() {
    if (!this.leafForm.startDate || !this.leafForm.endDate) return;
    this.savingLeave = true;
    this.leaveError = null;
    this.leaveApi.addLeave(this.leafForm.startDate, this.leafForm.endDate, this.leafForm.reason).subscribe({
      next: () => {
        this.savingLeave = false;
        this.leafForm = { startDate: '', endDate: '', reason: '' };
        this.refreshLeaves();
      },
      error: (e: any) => {
        this.savingLeave = false;
        this.leaveError = e.error?.error || 'Failed to add leave';
        this.cdr.detectChanges();
      }
    });
  }

  async deleteLeave(id: number) {
    const ok = await this.confirm.ask({
      title: 'Delete leave',
      message: 'Are you sure you want to delete this leave record?',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.leaveApi.deleteLeave(id).subscribe({
      next: () => this.refreshLeaves()
    });
  }

  refreshToday() {
    this.loadingAppointments = true;
    this.cdr.markForCheck();
    this.apptApi.getDoctorTodayAppointments().subscribe({
      next: (res) => {
        this.todayAppointments = res || [];
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
    });
  }

  todayStats(): Record<'BOOKED' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', number> {
    const stats = { BOOKED: 0, SCHEDULED: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 } as Record<any, number>;
    for (const a of this.todayAppointments || []) {
      if (a.status === 'CANCELLED_BY_PATIENT' || a.status === 'CANCELLED_BY_DOCTOR' || a.status === 'CANCELLED') {
        stats['CANCELLED']++;
      } else if (stats[a.status] != null) {
        stats[a.status]++;
      }
    }
    return stats as any;
  }

  get nextAppointment(): DoctorAppointmentItem | null {
    if (!this.todayAppointments) return null;
    const inProgress = this.todayAppointments.find(a => a.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    const candidates = this.todayAppointments.filter(a =>
      ['CONFIRMED', 'SCHEDULED', 'BOOKED'].includes(a.status)
    );
    candidates.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    return candidates.length > 0 ? candidates[0] : null;
  }

  start(a: DoctorAppointmentItem) {
    if (!a) return;
    this.apptApi.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.refreshToday();
        this.router.navigate(['/doctor/consultation', a.appointmentId]);
      },
      error: (err: any) => console.error('Error starting consultation:', err)
    });
  }

  public todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  openPatient(a: DoctorAppointmentItem | null) {
    if (!a) return;
    this.historyFormModalOpen = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.showPatientModal = true;
    this.selectedPatient = null;
    this.selectedPatientHistory = [];
    this.selectedPatientDocuments = [];
    this.mhForm = { visitDate: this.todayISO() };
    this.patientApi.getCompleteData(a.patientId).subscribe({
      next: (data) => {
        this.selectedPatient = data.patient;
        this.selectedPatientHistory = data.medicalHistory;
        this.selectedPatientDocuments = data.documents || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedPatient = null;
        this.selectedPatientHistory = [];
        this.selectedPatientDocuments = [];
        this.cdr.detectChanges();
      },
    });
  }

  openHistoryForm(a: DoctorAppointmentItem) {
    if (!a) return;
    this.showPatientModal = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.editingHistoryId = null;

    let record: any = a.appointmentMedicalHistory || null;
    if (!record && a.medicalHistory) {
      record = a.medicalHistory.find(m => m.appointmentId && Number(m.appointmentId) === Number(a.appointmentId));
    }

    if (record) {
      this.editingHistoryId = record.id;
      this.mhForm = {
        visitDate: record.visitDate || this.todayISO(),
        symptoms: record.symptoms || '',
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        medicine: record.medicine || '',
        doses: record.doses || '',
        notes: record.notes || ''
      };
    } else {
      this.mhForm = {
        visitDate: a.appointmentDate || this.todayISO(),
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medicine: '',
        doses: '',
        notes: ''
      };
    }

    this.historyFormModalOpen = true;
    this.cdr.detectChanges();
  }

  openHistory(item: MedicalHistoryWithDoctorItem) {
    this.selectedHistoryDoctorInfo = item;
    this.selectedHistoryDetail = null;
    this.historyDetailModalOpen = true;
    this.patientApi.getMedicalHistoryDetail(item.id).subscribe({
      next: (detail) => {
        this.selectedHistoryDetail = detail;
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedHistoryDetail = { id: item.id, visitDate: item.visitDate } as any;
        this.cdr.detectChanges();
      },
    });
  }

  closeHistoryDetail() {
    this.historyDetailModalOpen = false;
    this.selectedHistoryDetail = null;
    this.selectedHistoryDoctorInfo = null;
  }

  closeHistoryForm() {
    this.historyFormModalOpen = false;
    this.mhForm = { visitDate: this.todayISO() };
    this.historyError = null;
    this.historySaved = false;
    this.cdr.detectChanges();
  }

  saveMedicalHistory() {
    if (!this.selectedAppointment || this.savingHistory || this.doctorId == null) return;

    this.savingHistory = true;
    this.historySaved = false;
    this.historyError = null;
    this.cdr.detectChanges();

    const payload = {
      ...this.mhForm,
      patientId: this.selectedAppointment.patientId,
      appointmentId: this.selectedAppointment.appointmentId
    };

    const request$ = this.editingHistoryId
      ? this.patientApi.updateMedicalHistory(this.editingHistoryId, payload)
      : this.patientApi.addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, payload);

    request$.subscribe({
      next: () => {
        this.savingHistory = false;
        this.historySaved = true;
        this.cdr.detectChanges();
        this.refreshToday();
        this.closeHistoryForm();
      },
      error: (e) => {
        console.error('Failed to save medical history', e);
        this.historyError = 'Failed to save medical history';
        this.savingHistory = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadAnalytics() {
    if (this.doctorId == null) return;
    const end = new Date().toISOString().slice(0, 10);
    const start = this.isoDaysAgo(30);

    this.analyticsApi.getOverallAnalytics(start, end).subscribe({
      next: (o) => {
        this.overall = o || null;
        this.cdr.markForCheck();
      }
    });
  }

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-[#0e2c24] text-emerald-400 border border-[#164a3d]';
      case 'IN_PROGRESS':
        return 'bg-[#0f283c] text-blue-400 border border-[#1c3d5a]';
      case 'SCHEDULED':
      case 'BOOKED':
        return 'bg-[#182333] text-[#8b9cb0] border border-[#202f45]';
      case 'CANCELLED':
      case 'CANCELLED_BY_PATIENT':
      case 'CANCELLED_BY_DOCTOR':
        return 'bg-[#331821] text-rose-400 border border-[#522030]';
      default:
        return 'bg-[#182333] text-[#8b9cb0] border border-[#202f45]';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Checked In';
      case 'IN_PROGRESS': return 'Up Next';
      case 'SCHEDULED': return 'Scheduled';
      case 'BOOKED': return 'Pending';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }
}
