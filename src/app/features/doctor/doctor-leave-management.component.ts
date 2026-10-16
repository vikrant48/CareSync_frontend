import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { toLocalDateKey } from '../../shared/utils/format.util';

@Component({
  selector: 'app-doctor-leave-management',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, PageContainerComponent, CommonModule, FormsModule, DatePickerComponent, SelectDropdownComponent, EmptyStateComponent, PageLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-leave-management.component.html',
  styleUrl: './doctor-leave-management.component.css'
})
export class DoctorLeaveManagementComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private cdr = inject(ChangeDetectorRef);

  leaves: DoctorLeave[] = [];
  loading = true;
  submitting = false;
  deletingId: number | null = null;
  minDate = toLocalDateKey();

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load leave history');
        this.cdr.markForCheck();
      }
    });
  }

  isFormValid() {
    return ['startDate', 'endDate', 'range', 'leaveType', 'reason'].every((k) => !this.validateField(k));
  }

  // ================= Inline validation =================
  private touched = new Set<string>();
  submitAttempted = false;

  markTouched(key: string) {
    this.touched.add(key);
  }

  /** Message for a field, shown once it was touched or Apply was pressed. */
  fieldError(key: string): string {
    const relevant = key === 'range' ? (this.touched.has('startDate') && this.touched.has('endDate')) : this.touched.has(key);
    if (!this.submitAttempted && !relevant) return '';
    return this.validateField(key);
  }

  private validateField(key: string): string {
    const { startDate, endDate, leaveType, reason } = this.form;
    const today = toLocalDateKey();
    switch (key) {
      case 'startDate':
        if (!startDate) return 'Choose a start date.';
        return startDate < today ? "Start date can't be in the past." : '';
      case 'endDate':
        if (!endDate) return 'Choose an end date.';
        return startDate && endDate < startDate ? "End date can't be before the start date." : '';
      case 'range': {
        if (!startDate || !endDate || endDate < startDate) return '';
        const clash = this.leaves.find((l) => this.isUpcoming(l) && l.startDate <= endDate && l.endDate >= startDate);
        return clash ? `These dates overlap an existing leave (${clash.startDate} to ${clash.endDate}).` : '';
      }
      case 'leaveType':
        return leaveType ? '' : 'Choose a leave type.';
      case 'reason': {
        const text = (reason || '').trim();
        if (!text) return 'Add a reason for the leave.';
        return text.length > 300 ? 'Keep the reason under 300 characters.' : '';
      }
      default:
        return '';
    }
  }

  clearForm() {
    this.touched.clear();
    this.submitAttempted = false;
    this.form = {
      startDate: '',
      endDate: '',
      leaveType: 'Personal Leave',
      reason: ''
    };
  }

  applyLeave() {
    this.submitAttempted = true;
    if (!this.isFormValid()) {
      this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.submitting = false;
        const msg = typeof e?.error?.error === 'string' ? e.error.error : 'Failed to apply leave';
        this.toast.showError(msg);
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    this.leaveService.deleteLeave(leave.id).subscribe({
      next: () => {
        this.toast.showSuccess('Leave cancelled successfully');
        this.deletingId = null;
        this.refresh();
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.showError('Failed to cancel leave');
        this.deletingId = null;
        this.cdr.markForCheck();
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

  getUpcomingCount(): number {
    return this.leaves.filter((l) => this.isUpcoming(l)).length;
  }

  getUpcomingPercentage(): number {
    const total = this.getTotalLeavesCount();
    return total === 0 ? 0 : Math.round((this.getUpcomingCount() / total) * 100);
  }

  getPastCount(): number {
    return this.getTotalLeavesCount() - this.getUpcomingCount();
  }

  getPastPercentage(): number {
    const total = this.getTotalLeavesCount();
    return total === 0 ? 0 : Math.round((this.getPastCount() / total) * 100);
  }

  trackByLeaveId(_index: number, leave: DoctorLeave): number | undefined {
    return leave.id;
  }
}
