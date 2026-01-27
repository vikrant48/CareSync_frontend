import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-doctor-leave-management',
    standalone: true,
    imports: [CommonModule, FormsModule, DoctorLayoutComponent],
    template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Leave Management</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your availability and time off</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Apply Leave Form -->
          <div class="lg:col-span-1 space-y-6">
            <div class="panel p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-calendar-plus text-blue-600 dark:text-blue-400"></i> Apply for Leave
              </h3>
              
              <form (ngSubmit)="applyLeave()" class="space-y-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">From Date</label>
                  <input type="date" class="input-modern w-full" [(ngModel)]="form.startDate" name="startDate" required [min]="minDate" />
                </div>
                
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">To Date</label>
                  <input type="date" class="input-modern w-full" [(ngModel)]="form.endDate" name="endDate" required [min]="form.startDate || minDate" />
                </div>
                
                <div class="space-y-1.5">
                   <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</label>
                   <textarea rows="3" class="input-modern w-full resize-none" [(ngModel)]="form.reason" name="reason" placeholder="Testing, Personal work..." required></textarea>
                </div>

                <button type="submit" class="w-full btn-primary py-3 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-transform" [disabled]="submitting || !isFormValid()">
                  <i class="fa-solid fa-paper-plane mr-2" *ngIf="!submitting"></i>
                  <i class="fa-solid fa-circle-notch fa-spin mr-2" *ngIf="submitting"></i>
                  {{ submitting ? 'Applying...' : 'Apply Leave' }}
                </button>
              </form>
            </div>
            
            <!-- Quick Stats -->
            <div class="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
               <h4 class="font-bold text-blue-800 dark:text-blue-300 mb-2">Did you know?</h4>
               <p class="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                 You can cancel upcoming leaves anytime clearly marked in the list. Past leaves are kept for your history records.
               </p>
            </div>
          </div>

          <!-- Leave History List -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
               <div class="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                 <h3 class="font-bold text-gray-900 dark:text-white">Leave History</h3>
                 <span class="text-xs font-medium px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                   {{ leaves.length }} Records
                 </span>
               </div>
               
               <div *ngIf="loading" class="p-10 flex flex-col items-center justify-center text-gray-400">
                  <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-blue-500"></i>
                  <p>Loading your leaves...</p>
               </div>

               <div *ngIf="!loading && leaves.length === 0" class="p-10 flex flex-col items-center justify-center text-center">
                  <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3">
                    <i class="fa-solid fa-umbrella-beach text-2xl"></i>
                  </div>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">No leave records found.</p>
                  <p class="text-sm text-gray-400 dark:text-gray-500">Apply for a leave to get started.</p>
               </div>
               
               <div *ngIf="!loading && leaves.length > 0" class="divide-y divide-gray-100 dark:divide-gray-700">
                 <div *ngFor="let leave of leaves" class="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                   <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div class="flex items-start gap-4">
                       <div class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border"
                            [ngClass]="isUpcoming(leave) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'">
                          <span class="text-[10px] uppercase font-bold tracking-wider mb-[-2px]">{{ leave.startDate | date:'MMM' }}</span>
                          <span class="text-lg font-bold leading-none">{{ leave.startDate | date:'dd' }}</span>
                       </div>
                       
                       <div>
                         <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-gray-900 dark:text-white">
                              {{ leave.startDate | date:'mediumDate' }} 
                              <i class="fa-solid fa-arrow-right text-gray-300 mx-1 text-xs"></i> 
                              {{ leave.endDate | date:'mediumDate' }}
                            </span>
                            <span *ngIf="isUpcoming(leave)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
                              Upcoming
                            </span>
                            <span *ngIf="!isUpcoming(leave)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                              Past
                            </span>
                         </div>
                         <p class="text-sm text-gray-600 dark:text-gray-300 italic">"{{ leave.reason || 'No reason provided' }}"</p>
                       </div>
                     </div>

                     <div class="flex items-center gap-2 self-end sm:self-center" *ngIf="isUpcoming(leave)">
                       <button (click)="deleteLeave(leave)" [disabled]="deletingId === leave.id" 
                               class="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-medium transition-colors flex items-center gap-2">
                          <i class="fa-solid fa-trash-can" *ngIf="deletingId !== leave.id"></i>
                          <i class="fa-solid fa-circle-notch fa-spin" *ngIf="deletingId === leave.id"></i>
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
