import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-doctor-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, DatePickerComponent, SelectDropdownComponent, EmptyStateComponent],
  templateUrl: './doctor-leave-management.component.html',
  styleUrl: './doctor-leave-management.component.css'
})
export class DoctorLeaveManagementComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  leaves: DoctorLeave[] = [];
  loading = true;
  submitting = false;
  deletingId: number | null = null;
  minDate = new Date().toISOString().split('T')[0];

  form = {
    startDate: '',
    endDate: '',
    leaveType: 'Personal Leave',
    reason: ''
  };

  readonly leaveTypeOptions: SelectOption[] = [
    { value: 'Personal Leave', label: 'Personal Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Casual Leave', label: 'Casual Leave' },
    { value: 'Maternity/Paternity Leave', label: 'Maternity/Paternity Leave' },
    { value: 'Other', label: 'Other' }
  ];

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

  clearForm() {
    this.form = {
      startDate: '',
      endDate: '',
      leaveType: 'Personal Leave',
      reason: ''
    };
  }

  applyLeave() {
    if (!this.isFormValid()) return;

    if (this.form.endDate < this.form.startDate) {
      this.toast.showError('End date cannot be before start date');
      return;
    }

    this.submitting = true;
    // Format reason to include leaveType if specified
    const fullReason = this.form.leaveType ? `[${this.form.leaveType}] ${this.form.reason}` : this.form.reason;

    this.leaveService.addLeave(this.form.startDate, this.form.endDate, fullReason).subscribe({
      next: () => {
        this.toast.showSuccess('Leave applied successfully');
        this.submitting = false;
        this.clearForm();
        this.refresh();
      },
      error: (e) => {
        this.submitting = false;
        const msg = typeof e?.error?.error === 'string' ? e.error.error : 'Failed to apply leave';
        this.toast.showError(msg);
      }
    });
  }

  async deleteLeave(leave: DoctorLeave) {
    if (!leave.id) return;
    const ok = await this.confirm.ask({
      title: 'Cancel leave',
      message: 'Are you sure you want to cancel this leave request?',
      confirmLabel: 'Cancel leave',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;

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

  getDaysDuration(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 1;
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }

  getLeaveType(leave: DoctorLeave): string {
    const reason = leave.reason || '';
    if (reason.startsWith('[') && reason.includes(']')) {
      return reason.substring(1, reason.indexOf(']'));
    }
    return 'Personal Leave';
  }

  getCleanReason(leave: DoctorLeave): string {
    const reason = leave.reason || '';
    if (reason.startsWith('[') && reason.includes(']')) {
      return reason.substring(reason.indexOf(']') + 1).trim();
    }
    return reason || 'No reason provided';
  }

  // KPI Calculations
  getTotalLeavesCount(): number {
    return this.leaves.length;
  }

  getApprovedCount(): number {
    const now = new Date().setHours(0, 0, 0, 0);
    return this.leaves.filter(l => new Date(l.startDate).getTime() < now).length;
  }

  getApprovedPercentage(): number {
    const total = this.getTotalLeavesCount();
    if (total === 0) return 0;
    return Math.round((this.getApprovedCount() / total) * 100);
  }

  getPendingCount(): number {
    const now = new Date().setHours(0, 0, 0, 0);
    return this.leaves.filter(l => new Date(l.startDate).getTime() >= now).length;
  }

  getPendingPercentage(): number {
    const total = this.getTotalLeavesCount();
    if (total === 0) return 0;
    return Math.round((this.getPendingCount() / total) * 100);
  }

  getRejectedCount(): number {
    return 0; // standard backend doesn't store rejected, set to 0 or derived
  }

  getRejectedPercentage(): number {
    return 0;
  }

  trackByLeaveId(_index: number, leave: DoctorLeave): number | undefined {
    return leave.id;
  }
}
