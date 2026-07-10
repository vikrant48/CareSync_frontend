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
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { DatePickerComponent } from '../../shared/date-picker.component';

import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { forkJoin } from 'rxjs';
// Removed NotificationService imports; logic moved to dedicated component

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent, DoctorLayoutComponent, DoctorNotificationComponent, DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <!-- Welcome Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative">
          <div class="absolute inset-0 bg-white/10 opacity-30 pattern-dots"></div>
          <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div class="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
              <div class="relative">
                <div class="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/30 shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl md:text-3xl font-bold">
                  <img *ngIf="profile?.profileImageUrl" [src]="profile?.profileImageUrl" class="w-full h-full object-cover" />
                  <span *ngIf="!profile?.profileImageUrl && doctorName">{{ (doctorName || 'D').charAt(0) }}</span>
                  <div *ngIf="!doctorName" class="w-full h-full bg-white/10 animate-pulse"></div>
                </div>
                <div *ngIf="profile?.isVerified" class="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full border-2 border-indigo-700 shadow-md flex items-center gap-1" title="Verified">
                  <i class="fa-solid fa-check"></i>
                  <span class="font-black uppercase tracking-widest text-[7px]">Verified</span>
                </div>
              </div>
              <div class="space-y-2">
                <h1 class="text-xl md:text-3xl font-black tracking-tight leading-tight animate-fade-in" *ngIf="doctorName">Welcome, {{ doctorName === 'Doctor' ? 'Doctor' : 'Dr. ' + doctorName }}!</h1>
                <div class="h-8 w-48 bg-white/20 rounded animate-pulse my-1" *ngIf="!doctorName"></div>
                <div class="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-blue-100/90 text-sm md:text-lg font-medium">
                  <span *ngIf="profile" class="px-3 py-0.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 animate-fade-in">{{ profile?.specialization || 'General Practitioner' }}</span>
                  <span *ngIf="!profile" class="h-6 w-36 bg-white/20 rounded animate-pulse"></span>
                  <span class="hidden md:block w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  <span class="opacity-80">{{ todayISO() | date:'fullDate' }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-3">
               <app-doctor-notification></app-doctor-notification>
               <a routerLink="/doctor/profile" class="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/40 px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-2">
                 <i class="fa-regular fa-user"></i> Profile
               </a>
               <button (click)="refreshToday()" class="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2">
                 <i class="fa-solid fa-arrows-rotate" [class.animate-spin]="loadingAppointments"></i>
               </button>
            </div>
          </div>
        </div>

        <!-- Active Leave Warning -->
        <div *ngIf="isOnLeaveToday" class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-r shadow-md animate-fade-in flex items-center justify-between">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
                <div>
                   <p class="font-bold">You are currently on leave.</p>
                   <p class="text-sm">Your booking slots are hidden from patients until your leave ends.</p>
                </div>
            </div>
            <button (click)="leaveModalOpen = true" class="text-sm underline font-bold hover:text-orange-900">Manage Leave</button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Today -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Appointments</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-white" *ngIf="!loadingAppointments">{{ (todayAppointments || []).length }}</div>
              <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>

          <!-- Confirmed Today -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-check-circle"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Confirmed Today</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-white" *ngIf="!loadingAppointments">{{ todayStats().CONFIRMED }}</div>
               <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>

          <!-- Pending (Scheduled) -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Requests</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white" *ngIf="!loadingAppointments">{{ todayStats().BOOKED }}</div>
               <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>

          <!-- Upcoming Leaves -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" (click)="leaveModalOpen = true">
            <div class="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-calendar-minus"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Doctor Leaves</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ upcomingLeaves.length }}</div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Today's Agenda (Left 2/3) -->
          <div class="lg:col-span-2 space-y-6">
          <!-- Up Next / Current Priority Card -->
          <div class="lg:col-span-2 space-y-6">
             <div class="rounded-3xl p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-xl" *ngIf="nextAppointment as next">
                <div class="bg-white dark:bg-gray-800 rounded-[1.3rem] p-6 sm:p-8">
                   <div class="flex items-center justify-between mb-6">
                      <div class="flex items-center gap-3">
                         <span class="relative flex h-4 w-4">
                           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                           <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                         </span>
                         <h2 class="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            {{ next.status === 'IN_PROGRESS' ? 'Currently in Session' : 'Up Next' }}
                         </h2>
                      </div>
                      <div class="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm">
                        {{ next.appointmentTime }}
                      </div>
                   </div>

                   <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div class="relative shrink-0">
                         <img [src]="next.patientProfileImageUrl || 'assets/default-profile.png'" class="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-gray-100 dark:border-gray-700" onerror="this.src='assets/default-profile.png'">
                         <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg text-sm">
                            <i class="fa-solid fa-video"></i>
                         </div>
                      </div>
                      
                      <div class="flex-1 space-y-2">
                         <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-tight">{{ next.patientName }}</h3>
                         <div class="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span *ngIf="next.patientContactInfo"><i class="fa-solid fa-phone mr-1.5 opacity-70"></i> {{ next.patientContactInfo }}</span>
                            <span *ngIf="next.reason"><i class="fa-solid fa-notes-medical mr-1.5 opacity-70"></i> {{ next.reason }}</span>
                         </div>
                      </div>

                      <div class="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                         <button (click)="start(next)" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                           <span>{{ next.status === 'IN_PROGRESS' ? 'Resume Consultation' : 'Start Consultation' }}</span>
                           <i class="fa-solid fa-arrow-right"></i>
                         </button>
                         <button (click)="openPatient(next)" class="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all">
                           View Patient Details
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Empty State (All Caught Up) -->
             <div class="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 text-center border border-green-100 dark:border-green-800/30" *ngIf="!nextAppointment && !loadingAppointments">
                <div class="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 shadow-md text-3xl">
                  <i class="fa-solid fa-mug-hot"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">You have no pending appointments right now. Enjoy your break or check your full schedule.</p>
                <a routerLink="/doctor/schedule" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 border border-green-200">
                  <i class="fa-solid fa-calendar-day"></i>
                  <span>View Full Schedule</span>
                </a>
             </div>
          </div>
          </div>

          <!-- Sidebar (Right 1/3) -->
          <div class="space-y-6">
            <!-- Profile Quick View -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
               <h3 class="font-bold text-gray-900 dark:text-white mb-4">Profile Details</h3>
               <div class="mb-4">
                 <div class="flex justify-between text-xs mb-1">
                   <span class="font-medium text-gray-600 dark:text-gray-300">Completion</span>
                   <span class="font-bold text-blue-600">{{ profile?.completionPercentage || 0 }}%</span>
                 </div>
                 <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                   <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" [style.width.%]="profile?.completionPercentage || 0"></div>
                 </div>
               </div>
               <div class="space-y-3">
                 <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-envelope"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.email || 'No email' }}</div>
                 </div>
                 <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center"><i class="fa-solid fa-phone"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.contactInfo || 'No phone' }}</div>
                 </div>
                  <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center"><i class="fa-solid fa-user-tag"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.isActive ? 'Active Status' : 'Inactive' }}</div>
                 </div>
               </div>
               <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <a routerLink="/doctor/profile" class="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 justify-center">Manage Profile <i class="fa-solid fa-arrow-right"></i></a>
               </div>
            </div>

             <!-- Quick Actions (Optional placeholder for future features) -->
            <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
              <div class="relative z-10">
                <h3 class="font-bold mb-2">Need Help?</h3>
                <p class="text-indigo-100 text-sm mb-4">Check out our guide for doctors to manage appointments effectively.</p>
                <button (click)="guideModalOpen = true" class="bg-white text-indigo-700 text-sm font-bold py-2 px-4 rounded-lg w-full hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-black/10">View Guide</button>
              </div>
              <i class="fa-solid fa-circle-info absolute -bottom-4 -right-4 text-8xl opacity-10 rotate-12"></i>
            </div>
          
          </div>
        </div>

        <!-- Modals -->
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

        <!-- Leave Management Modal -->
        <div *ngIf="leaveModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-calendar-day text-blue-500"></i> Manage Leaves
              </h3>
              <button (click)="leaveModalOpen = false" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <i class="fa-solid fa-xmark text-gray-500"></i>
              </button>
            </div>
            
            <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <!-- Add Leave Form -->
              <div class="bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/20">
                <h4 class="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Schedule New Leave</h4>
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
                  <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Reason (Optional)</label>
                  <input type="text" [(ngModel)]="leafForm.reason" placeholder="e.g., Vacation, Medical, Personal" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                </div>
                <button (click)="addLeave()" [disabled]="savingLeave || !leafForm.startDate || !leafForm.endDate" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center gap-2">
                  <i class="fa-solid fa-plus" *ngIf="!savingLeave"></i>
                  <i class="fa-solid fa-spinner animate-spin" *ngIf="savingLeave"></i>
                  {{ savingLeave ? 'Adding Leave...' : 'Schedule Leave' }}
                </button>
                <p *ngIf="leaveError" class="mt-2 text-xs text-red-500 font-medium"><i class="fa-solid fa-circle-exclamation"></i> {{ leaveError }}</p>
              </div>

              <!-- Upcoming Leaves List -->
              <div class="space-y-4">
                <h4 class="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Current & Upcoming Leaves</h4>
                <div *ngIf="upcomingLeaves.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <i class="fa-solid fa-couch text-2xl mb-2 opacity-20"></i>
                  <p class="text-sm">No leaves scheduled currently.</p>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let l of upcomingLeaves" class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                        {{ l.startDate | date:'MMM' }}
                      </div>
                      <div>
                        <div class="text-sm font-bold text-gray-900 dark:text-white">
                          {{ l.startDate | date:'d MMM' }} - {{ l.endDate | date:'d MMM, yyyy' }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {{ l.reason || 'No reason provided' }}
                        </div>
                      </div>
                    </div>
                    <button (click)="deleteLeave(l.id!)" class="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booking slots are automatically blocked for these dates</p>
            </div>
          </div>
        </div>

        <!-- Doctor Guide Modal -->
        <div *ngIf="guideModalOpen" class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div class="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300 border border-white/20">
            <!-- Modal Header -->
            <div class="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                  <i class="fa-solid fa-book-medical"></i>
                </div>
                <div>
                  <h3 class="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Success Guide</h3>
                  <p class="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium">Master your appointment flow</p>
                </div>
              </div>
              <button (click)="guideModalOpen = false" class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-90 shrink-0">
                <i class="fa-solid fa-xmark text-lg sm:text-xl"></i>
              </button>
            </div>
            
            <!-- Modal Content -->
            <div class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto no-scrollbar">
              
              <!-- Section 1: Handling New Requests -->
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">01</span>
                  <h4 class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-xs">Managing New Requests</h4>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 space-y-2 sm:space-y-3">
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Incoming appointments appear as <span class="font-bold text-yellow-600">BOOKED</span>. You can either:</p>
                  <ul class="space-y-1.5 sm:space-y-2">
                    <li class="flex gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <i class="fa-solid fa-check text-green-500 mt-1"></i>
                      <span><strong>Accept</strong>: Moves the status to <strong>SCHEDULED</strong>.</span>
                    </li>
                    <li class="flex gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <i class="fa-solid fa-xmark text-red-500 mt-1"></i>
                      <span><strong>Decline</strong>: Cancels the request if busy.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Section 2: Consultation Lifecycle -->
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">02</span>
                  <h4 class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-xs">Consultation Lifecycle</h4>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div class="flex flex-col gap-2 sm:gap-3">
                    <div class="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-xs font-bold text-gray-400">
                      <span>CONFIRM</span> <i class="fa-solid fa-arrow-right text-[8px]"></i> <span>START</span> <i class="fa-solid fa-arrow-right text-[8px]"></i> <span>COMPLETE</span>
                    </div>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Always click <strong>Start Consultation</strong> when beginning to enable <strong>Medical History</strong> updates.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Section 3: Medical Records -->
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">03</span>
                  <h4 class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-xs">Medical Records</h4>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800">
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Once in-progress, use the <span class="text-red-600 font-bold">Add Medical Record</span> button. Records are instantly shared with patients.
                  </p>
                </div>
              </div>

              <!-- Section 4: Leave Management -->
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">04</span>
                  <h4 class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-xs">Manage Your Presence</h4>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800">
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Use the <strong>Doctor Leaves</strong> card to block your calendar. Any leave scheduled will hide your slots from AI.
                  </p>
                </div>
              </div>

            </div>
            
            <!-- Modal Footer -->
            <div class="p-6 sm:p-8 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center sm:text-left">
                <i class="fa-solid fa-shield-halved text-blue-500"></i> CareSync Secure Portal
              </div>
              <button (click)="guideModalOpen = false" class="w-full sm:w-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95">
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-doctor-layout>
  `,
  styles: [`
    :host { display: block; }
    .pattern-dots {
      background-image: radial-gradient(white 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }
    .input-sm {
      @apply py-1.5 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow dark:bg-gray-900/50 dark:border-gray-700 dark:text-white;
    }
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  username: string | null = null;
  doctorId: number | null = null;
  doctorName: string | null = null;
  profile: any = null;
  documents: any[] = [];

  // Appointments
  todayAppointments: DoctorAppointmentItem[] = [];
  loadingAppointments = false;

  // Patient modal
  showPatientModal = false; // Renamed from patientModalOpen
  selectedAppointment: DoctorAppointmentItem | null = null;
  selectedPatient: PatientDto | null = null; // Changed type
  selectedPatientHistory: MedicalHistoryWithDoctorItem[] = []; // New field
  selectedPatientDocuments: any[] = []; // New field
  editingHistoryId: number | null = null;
  mhForm: Partial<MedicalHistoryItem> = { visitDate: this.todayISO() };
  savingHistory = false;
  historySaved = false;
  historyError: string | null = null;
  historyDetailModalOpen = false;
  selectedHistoryDetail: MedicalHistoryItem | null = null;
  selectedHistoryDoctorInfo: MedicalHistoryWithDoctorItem | null = null;
  historyFormModalOpen = false;
  currentYear: number = new Date().getFullYear();

  // Guide Popup
  guideModalOpen = false;

  // Leave Management
  leaveModalOpen = false;
  upcomingLeaves: any[] = [];
  leafForm: any = { startDate: '', endDate: '', reason: '' };
  savingLeave = false;
  leaveError: string | null = null;


  // Analytics state
  overall: OverallAnalytics | null = null;
  peakHours: any = null;
  dayOfWeek: any = null;
  retention: any = null;
  feedbackSentiment: any = null;
  performance: any = null;
  appointmentDuration: any = null;
  seasonalTrends: any = null;
  cancellationPatterns: any = null;
  patientDemographics: any = null;
  appointmentTrendsDaily: any = null;
  revenueAnalysis: any = null;
  analyticsRangeText: string | null = null;

  get isOnLeaveToday(): boolean {
    const today = this.todayISO();
    return this.upcomingLeaves.some(l => l.startDate <= today && l.endDate >= today);
  }

  // Chart data holders
  peakHoursLabels: string[] = [];
  peakHoursData: number[] = [];
  dayOfWeekLabels: string[] = [];
  dayOfWeekData: number[] = [];
  feedbackLabels: string[] = ['Positive', 'Neutral', 'Negative'];
  feedbackData: number[] = [];
  demographicsLabels: string[] = [];
  demographicsData: number[] = [];
  seasonalLabels: string[] = [];
  seasonalData: number[] = [];
  dailyTrendLabels: string[] = [];
  dailyTrendData: number[] = [];

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
      this.svc.getDocumentsByDoctor(this.doctorId).subscribe({
        next: (docs) => {
          this.documents = (docs || []).slice(0, 6);
          this.cdr.markForCheck();
        },
      });
      this.refreshToday();
      this.refreshLeaves();
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

  deleteLeave(id: number) {
    if (!confirm('Are you sure you want to delete this leave record?')) return;
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

  filteredTodayAppointments(): DoctorAppointmentItem[] {
    // Kept to avoid potential template reference errors during transition, but returns empty if valid check needed
    // Actually, I should remove it if I am sure.
    // User asked why warning exists. It exists because component is unused.
    // I am cleaning up.
    return [];
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

    // Priority 1: In Progress
    const inProgress = this.todayAppointments.find(a => a.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    // Priority 2: Upcoming (Confirmed/Scheduled/Booked)
    // Assuming appointments are sorted by time from backend, or we sort them here.
    // Let's filter and sort to be safe.
    const candidates = this.todayAppointments.filter(a =>
      ['CONFIRMED', 'SCHEDULED', 'BOOKED'].includes(a.status)
    );

    // Simple time sort (HH:mm:ss)
    candidates.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

    // Find first one that hasn't passed (or just the first one if we assume "Up Next" means next in list even if slightly late)
    // For "Up Next", usually the first one in the sorted list is the correct next action.
    return candidates.length > 0 ? candidates[0] : null;
  }

  start(a: DoctorAppointmentItem) {
    this.apptApi.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({
      next: (updated) => {
        this.refreshToday();
        this.joinConsultation(updated);
      },
      error: (err: any) => console.error('Error starting consultation:', err)
    });
  }

  joinConsultation(a: DoctorAppointmentItem) {
    this.router.navigate(['/doctor/consultation', a.appointmentId]);
  }

  // Make helper public or just use property
  public todayISO() {
    return new Date().toISOString().slice(0, 10);
  }


  // getEpochMs moved to shared doctor-appointment-utils

  // Notifications state and logic
  // Notification logic removed; handled by DoctorNotificationComponent

  // ngOnDestroy not needed for notifications; no local polling

  openPatient(a: DoctorAppointmentItem) {
    // Ensure other modals are closed
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
    // Ensure other modals are closed
    this.showPatientModal = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.mhForm = { visitDate: this.todayISO() };
    this.editingHistoryId = null;

    // Check if matching record exists in appointment's medical history list
    if (a.medicalHistory) {
      // Primary: Link by appointmentId
      let record = a.medicalHistory.find(m => m.appointmentId === a.appointmentId);

      // Fallback: Link by date (for legacy records)
      if (!record) {
        record = a.medicalHistory.find(m => m.visitDate === a.appointmentDate);
      }

      if (record) {
        this.editingHistoryId = record.id;
        // Map record fields to form
        this.mhForm = {
          visitDate: record.visitDate || this.todayISO(),
          symptoms: record.symptoms || '',
          diagnosis: record.diagnosis || '',
          treatment: record.treatment || '',
          medicine: record.medicine || '',
          doses: record.doses || '',
          notes: record.notes || ''
        };
      }
    }

    this.historyFormModalOpen = true;
    this.cdr.detectChanges();
  }

  closePatientModal() {
    this.showPatientModal = false;
    this.selectedAppointment = null;
    this.selectedPatient = null;
    this.selectedPatientHistory = [];
    this.selectedPatientDocuments = [];
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
    if (!this.selectedAppointment) return;

    if (this.savingHistory) {
      return;
    }

    this.savingHistory = true;
    this.historySaved = false;
    this.historyError = null;
    this.cdr.detectChanges();

    if (this.doctorId == null) {
      this.savingHistory = false;
      this.cdr.detectChanges();
      return;
    }

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

        // Refresh appointments to update the record in the card
        this.refreshToday();

        // Close form after successful save
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

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  loadAnalytics() {
    if (this.doctorId == null) return;
    const doctorId = this.doctorId; // Narrow for TS
    const end = new Date().toISOString().slice(0, 10);
    const start = this.isoDaysAgo(30);
    this.analyticsRangeText = `${start}  ${end}`;

    this.analyticsApi.getOverallAnalytics(start, end).subscribe({
      next: (o) => {
        this.overall = o || null;
        this.cdr.markForCheck();
      }
    });
    this.analyticsApi.getPeakHours(doctorId, start, end).subscribe({
      next: (res) => {
        this.peakHours = res || null;
        const dist = this.peakHours?.hourlyDistribution || {};
        const labels = Object.keys(dist).sort((a, b) => Number(a) - Number(b));
        this.peakHoursLabels = labels;
        this.peakHoursData = labels.map((k) => Number(dist[k] || 0));
        this.cdr.markForCheck();
      },
    });
    this.analyticsApi.getDayOfWeek(doctorId, start, end).subscribe({
      next: (res) => {
        this.dayOfWeek = res || null;
        const dist = this.dayOfWeek?.dayDistribution || {};
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const labels = order.filter((d) => dist.hasOwnProperty(d));
        this.dayOfWeekLabels = labels;
        this.dayOfWeekData = labels.map((k) => Number(dist[k] || 0));
        this.cdr.markForCheck();
      },
    });
    this.analyticsApi.getPatientRetention(doctorId).subscribe({
      next: (res) => {
        this.retention = res || null;
        this.cdr.markForCheck();
      }
    });
    this.analyticsApi.getFeedbackSentiment(doctorId).subscribe({
      next: (res) => {
        this.feedbackSentiment = res || null;
        const s = this.feedbackSentiment || {};
        this.feedbackData = [Number(s.positivePercentage || 0), Number(s.neutralPercentage || 0), Number(s.negativePercentage || 0)];
        this.cdr.markForCheck();
      },
    });
    this.analyticsApi.getAppointmentDuration(doctorId, start, end).subscribe({
      next: (res) => {
        this.appointmentDuration = res || null;
        this.cdr.markForCheck();
      }
    });
    this.analyticsApi.getSeasonalTrends(doctorId, new Date().getFullYear()).subscribe({
      next: (res) => {
        this.seasonalTrends = res || null;
        const dist = this.seasonalTrends?.monthlyDistribution || {};
        const order = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const labels = order.filter((m) => dist.hasOwnProperty(m));
        this.seasonalLabels = labels;
        this.seasonalData = labels.map((k) => Number(dist[k] || 0));
        this.cdr.markForCheck();
      }
    });
    this.analyticsApi.getCancellationPatterns(doctorId, start, end).subscribe({
      next: (res) => {
        this.cancellationPatterns = res || null;
        this.cdr.markForCheck();
      }
    });
    this.analyticsApi.getPatientDemographicsByDoctor(doctorId).subscribe({
      next: (res) => {
        this.patientDemographics = res || null;
        const dist = this.patientDemographics?.ageDistribution || {};
        const labels = Object.keys(dist);
        this.demographicsLabels = labels;
        this.demographicsData = labels.map((k) => Number(dist[k] || 0));
        this.cdr.markForCheck();
      },
    });
    this.reportsApi.getDoctorPerformance(doctorId, start, end).subscribe({
      next: (res) => {
        this.performance = res || null;
        this.cdr.markForCheck();
      }
    });
    this.reportsApi.getAppointmentTrends('daily', start, end).subscribe({
      next: (res) => {
        this.appointmentTrendsDaily = res || null;
        const dist = this.appointmentTrendsDaily?.daily || {};
        const labels = Object.keys(dist).sort((a, b) => a.localeCompare(b));
        this.dailyTrendLabels = labels;
        this.dailyTrendData = labels.map((k) => Number(dist[k] || 0));
        this.cdr.markForCheck();
      },
    });
    this.reportsApi.getRevenueAnalysis(start, end).subscribe({
      next: (res) => {
        this.revenueAnalysis = res || null;
        this.cdr.markForCheck();
      }
    });
  }
}
