import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-doctor-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, DatePickerComponent, EmptyStateComponent, PageHeaderComponent],
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
}
