import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { DatePickerComponent } from '../../shared/date-picker.component';

@Component({
  selector: 'app-doctor-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, DatePickerComponent],
  template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <h2 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Leave Management</h2>
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Manage your availability and time off</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          
          <!-- Apply Leave Form -->
          <div class="lg:col-span-1 space-y-4 sm:space-y-6">
            <div class="panel p-3.5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 class="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-4 flex items-center gap-2">
                <i class="fa-solid fa-calendar-plus text-blue-600 dark:text-blue-400 text-xs sm:text-base"></i> Apply for Leave
              </h3>
              
              <form (ngSubmit)="applyLeave()" class="space-y-2.5 sm:space-y-4">
                <app-date-picker
                  [(ngModel)]="form.startDate"
                  name="startDate"
                  label="From Date"
                  [minDate]="'today'"
                  placeholder="Select Date">
                </app-date-picker>
                
                <app-date-picker
                  [(ngModel)]="form.endDate"
                  name="endDate"
                  label="To Date"
                  [minDate]="form.startDate || 'today'"
                  placeholder="Select Date">
                </app-date-picker>
                
                <div class="space-y-1">
                   <label class="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</label>
                   <textarea rows="2" class="input-modern w-full resize-none text-xs sm:text-sm py-2 px-3 rounded-lg sm:rounded-xl" [(ngModel)]="form.reason" name="reason" placeholder="Testing, Personal work..." required></textarea>
                </div>

                <button type="submit" class="w-full btn-primary py-2 sm:py-3 text-xs sm:text-base font-bold shadow-lg shadow-blue-600/20 rounded-lg sm:rounded-xl active:scale-95 transition-transform" [disabled]="submitting || !isFormValid()">
                  <i class="fa-solid fa-paper-plane mr-1.5 sm:mr-2 text-xs sm:text-sm" *ngIf="!submitting"></i>
                  <i class="fa-solid fa-circle-notch fa-spin mr-1.5 sm:mr-2 text-xs sm:text-sm" *ngIf="submitting"></i>
                  {{ submitting ? 'Applying...' : 'Apply Leave' }}
                </button>
              </form>
            </div>
            
            <!-- Quick Stats -->
            <div class="bg-blue-50 dark:bg-blue-900/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-blue-100 dark:border-blue-900/30">
               <h4 class="font-bold text-xs sm:text-base text-blue-800 dark:text-blue-300 mb-1 sm:mb-2">Did you know?</h4>
               <p class="text-xs sm:text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                 You can cancel upcoming leaves anytime clearly marked in the list. Past leaves are kept for your history records.
               </p>
            </div>
          </div>

          <!-- Leave History List -->
          <div class="lg:col-span-2 space-y-4 sm:space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
               <div class="p-3 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                 <h3 class="font-bold text-xs sm:text-base text-gray-900 dark:text-white">Leave History</h3>
                 <span class="text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                   {{ leaves.length }} Records
                 </span>
               </div>
               
               <div *ngIf="loading" class="p-6 sm:p-10 flex flex-col items-center justify-center text-gray-400">
                  <i class="fa-solid fa-circle-notch fa-spin text-2xl sm:text-3xl mb-2 sm:mb-3 text-blue-500"></i>
                  <p class="text-xs sm:text-sm">Loading your leaves...</p>
               </div>

               <div *ngIf="!loading && leaves.length === 0" class="p-6 sm:p-10 flex flex-col items-center justify-center text-center">
                  <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-2 sm:mb-3">
                    <i class="fa-solid fa-umbrella-beach text-xl sm:text-2xl"></i>
                  </div>
                  <p class="text-xs sm:text-base text-gray-500 dark:text-gray-400 font-medium">No leave records found.</p>
                  <p class="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500">Apply for a leave to get started.</p>
               </div>
               
               <div *ngIf="!loading && leaves.length > 0" class="divide-y divide-gray-100 dark:divide-gray-700">
                 <div *ngFor="let leave of leaves" class="p-3 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                   <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                     <div class="flex items-start gap-2.5 sm:gap-4">
                       <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shrink-0 border"
                            [ngClass]="isUpcoming(leave) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'">
                          <span class="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-[-2px]">{{ leave.startDate | date:'MMM' }}</span>
                          <span class="text-sm sm:text-lg font-bold leading-none">{{ leave.startDate | date:'dd' }}</span>
                       </div>
                       
                       <div>
                         <div class="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <span class="font-bold text-xs sm:text-base text-gray-900 dark:text-white">
                              {{ leave.startDate | date:'mediumDate' }} 
                              <i class="fa-solid fa-arrow-right text-gray-300 mx-0.5 sm:mx-1 text-[10px] sm:text-xs"></i> 
                              {{ leave.endDate | date:'mediumDate' }}
                            </span>
                            <span *ngIf="isUpcoming(leave)" class="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
                              Upcoming
                            </span>
                            <span *ngIf="!isUpcoming(leave)" class="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                              Past
                            </span>
                         </div>
                         <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 italic">"{{ leave.reason || 'No reason provided' }}"</p>
                       </div>
                     </div>

                     <div class="flex items-center gap-2 self-end sm:self-center" *ngIf="isUpcoming(leave)">
                       <button (click)="deleteLeave(leave)" [disabled]="deletingId === leave.id" 
                               class="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2">
                          <i class="fa-solid fa-trash-can text-[10px] sm:text-xs" *ngIf="deletingId !== leave.id"></i>
                          <i class="fa-solid fa-circle-notch fa-spin text-[10px] sm:text-xs" *ngIf="deletingId === leave.id"></i>
                          <span>Cancel</span>
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </app-doctor-layout>
  `,
  styles: [`
    .input-modern {
      @apply block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-sm py-2.5 px-3;
    }
  `]
})
export class DoctorLeaveManagementComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private toast = inject(ToastService);

  leaves: DoctorLeave[] = [];
  loading = true;
  submitting = false;
  deletingId: number | null = null;
  minDate = new Date().toISOString().split('T')[0];

  form = {
    startDate: '',
    endDate: '',
    reason: ''
  };

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.leaveService.getMyLeaves().subscribe({
      next: (data) => {
        this.leaves = data || [];
        // Sort: Upcoming (ASC), then Past (DESC)
        const now = new Date().setHours(0, 0, 0, 0);
        const upcoming = this.leaves.filter(l => new Date(l.startDate).getTime() >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const past = this.leaves.filter(l => new Date(l.startDate).getTime() < now).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        this.leaves = [...upcoming, ...past];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load leave history');
      }
    });
  }

  isFormValid() {
    return this.form.startDate && this.form.endDate && this.form.reason;
  }

  applyLeave() {
    if (!this.isFormValid()) return;

    // Simple validation
    if (this.form.endDate < this.form.startDate) {
      this.toast.showError('End date cannot be before start date');
      return;
    }

    this.submitting = true;
    this.leaveService.addLeave(this.form.startDate, this.form.endDate, this.form.reason).subscribe({
      next: () => {
        this.toast.showSuccess('Leave applied successfully');
        this.submitting = false;
        this.form = { startDate: '', endDate: '', reason: '' };
        this.refresh();
      },
      error: (e) => {
        this.submitting = false;
        const msg = typeof e?.error?.error === 'string' ? e.error.error : 'Failed to apply leave';
        this.toast.showError(msg);
      }
    });
  }

  deleteLeave(leave: DoctorLeave) {
    if (!leave.id) return;
    if (!confirm('Are you sure you want to cancel this leave request?')) return;

    this.deletingId = leave.id;
    this.leaveService.deleteLeave(leave.id).subscribe({
      next: () => {
        this.toast.showSuccess('Leave cancelled successfully');
        this.deletingId = null;
        this.refresh();
      },
      error: () => {
        this.toast.showError('Failed to cancel leave');
        this.deletingId = null;
      }
    });
  }

  isUpcoming(leave: DoctorLeave) {
    return new Date(leave.startDate).getTime() >= new Date().setHours(0, 0, 0, 0);
  }
}
