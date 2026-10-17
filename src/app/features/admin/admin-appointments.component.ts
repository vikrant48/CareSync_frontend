import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminAppointment } from '../../core/services/admin.service';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { AppointmentAuditTrailModalComponent } from './appointment-audit-trail-modal.component';

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'REJECTED',
  'NO_SHOW', 'NO_SHOW_PATIENT', 'NO_SHOW_DOCTOR', 'AUTO_CLOSED'];

/**
 * Look up any appointment by ID: who, when, status, payment; its status history; and the admin-only
 * fixes (force cancel, force complete, delete). Medical details in the response are not shown.
 */
@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AppointmentAuditTrailModalComponent],
  styleUrls: ['./admin-ui.css'],
  template: `
    <section class="adm-card p-4 sm:p-5 space-y-4">
      <div>
        <h2 class="adm-section-title">Find an appointment</h2>
        <p class="adm-section-subtitle">Enter the appointment number (shown as APT-1234 or #1234 in the app).</p>
      </div>

      <form class="flex gap-2 max-w-md" (ngSubmit)="lookup()">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--muted)]">#</span>
          <input name="appointmentId" class="adm-input !pl-7 font-mono" [(ngModel)]="query" inputmode="numeric"
            placeholder="e.g. 1024" aria-label="Appointment number" autocomplete="off" />
        </div>
        <button type="submit" class="adm-btn adm-btn--primary" style="height: 38px" [disabled]="loading || !parsedId">
          <i class="fa-solid" [ngClass]="loading ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'" aria-hidden="true"></i> Find
        </button>
      </form>

      <div *ngIf="notFound" class="adm-notice adm-notice--warning">
        <i class="fa-solid fa-circle-question mt-0.5" aria-hidden="true"></i>
        <span>No appointment #{{ notFound }} was found.</span>
      </div>
    </section>

    <section *ngIf="appointment as a" class="adm-card p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="adm-section-title font-mono">#{{ a.appointmentId }}</h2>
            <span class="adm-badge" [ngClass]="statusClass(a.status)">{{ statusLabel(a.status) }}</span>
          </div>
          <p class="adm-section-subtitle">
            {{ a.appointmentDate }} at {{ a.appointmentTime }}
            <span *ngIf="a.statusChangedBy"> · last changed by {{ a.statusChangedBy }}</span>
          </p>
        </div>
        <button type="button" class="adm-btn adm-btn--ghost self-start" (click)="historyOpen = true">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Status history
        </button>
      </div>

      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <dt class="text-[var(--muted)]">Patient</dt>
          <dd class="font-semibold text-sm mt-0.5">{{ a.patientName || 'Unknown' }}</dd>
          <dd class="text-[var(--muted)] font-mono">#{{ a.patientId }}</dd>
        </div>
        <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <dt class="text-[var(--muted)]">Doctor</dt>
          <dd class="font-semibold text-sm mt-0.5">Dr. {{ a.doctorName || 'Unknown' }}</dd>
          <dd class="text-[var(--muted)]">{{ a.doctorSpecialization || '—' }}</dd>
        </div>
        <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <dt class="text-[var(--muted)]">Fee</dt>
          <dd class="font-semibold text-sm mt-0.5">{{ a.consultationFees != null ? ('₹' + a.consultationFees) : '—' }}</dd>
          <dd class="text-[var(--muted)] font-mono truncate" [title]="a.transactionId || ''">{{ a.transactionId || 'No payment linked' }}</dd>
        </div>
        <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <dt class="text-[var(--muted)]">Booked</dt>
          <dd class="font-semibold text-sm mt-0.5">{{ a.createdAt ? (a.createdAt | date: 'MMM d, y') : '—' }}</dd>
          <dd class="text-[var(--muted)]">Updated {{ a.updatedAt ? (a.updatedAt | date: 'MMM d, h:mm a') : '—' }}</dd>
        </div>
      </dl>

      <div class="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
        <div>
          <h3 class="text-sm font-bold">Admin actions</h3>
          <p class="text-[11px] text-[var(--muted)]">Use these only to fix an appointment that is stuck. Every action is recorded in the audit log.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="adm-btn adm-btn--success" [disabled]="busy || isClosed(a.status)" (click)="force('FORCE_COMPLETE')">
            <i class="fa-solid fa-check-double" aria-hidden="true"></i> Mark completed
          </button>
          <button type="button" class="adm-btn adm-btn--warning" [disabled]="busy || isClosed(a.status)" (click)="force('FORCE_CANCEL')">
            <i class="fa-solid fa-ban" aria-hidden="true"></i> Cancel appointment
          </button>
          <button type="button" class="adm-btn adm-btn--danger" [disabled]="busy" (click)="remove()">
            <i class="fa-solid fa-trash" aria-hidden="true"></i> Delete
          </button>
        </div>
        <p *ngIf="isClosed(a.status)" class="text-[11px] text-[var(--muted)]">This appointment is already closed, so it can't be completed or cancelled.</p>
        <p class="text-[11px] text-[var(--muted)]">Delete only works for appointments without medical, payment or chat records. Cancel those instead.</p>
      </div>
    </section>

    <app-appointment-audit-trail-modal [isOpen]="historyOpen" [appointmentId]="appointment?.appointmentId || 0"
      (close)="historyOpen = false"></app-appointment-audit-trail-modal>
  `,
})
export class AdminAppointmentsComponent {
  private admin = inject(AdminService);
  private appointmentApi = inject(AppointmentApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  query = '';
  appointment: AdminAppointment | null = null;
  loading = false;
  busy = false;
  notFound: number | null = null;
  historyOpen = false;

  /** Accepts "1024", "#1024" or "APT-1024" */
  get parsedId(): number | null {
    const digits = this.query.trim().replace(/^(apt-?|#)/i, '');
    return /^\d{1,18}$/.test(digits) ? Number(digits) : null;
  }

  lookup() {
    const id = this.parsedId;
    if (!id) return;
    this.loading = true;
    this.notFound = null;
    this.admin.getAppointmentForAdmin(id).subscribe({
      next: (a) => {
        this.appointment = a;
        this.loading = false;
      },
      error: () => {
        this.appointment = null;
        this.notFound = id;
        this.loading = false;
      },
    });
  }

  async force(action: 'FORCE_COMPLETE' | 'FORCE_CANCEL') {
    const a = this.appointment;
    if (!a) return;
    const complete = action === 'FORCE_COMPLETE';
    const ok = await this.confirm.ask({
      title: complete ? 'Mark as completed' : 'Cancel appointment',
      message: complete
        ? `Mark appointment #${a.appointmentId} as completed? Use this only when the visit happened but the doctor could not close it.`
        : `Cancel appointment #${a.appointmentId}? The patient and doctor will see it as cancelled.`,
      confirmLabel: complete ? 'Mark completed' : 'Cancel appointment',
      cancelLabel: 'Back',
      danger: !complete,
    });
    if (!ok) return;
    this.busy = true;
    this.appointmentApi.executeAction(a.appointmentId, action).subscribe({
      next: (updated: AdminAppointment) => {
        this.busy = false;
        this.appointment = { ...a, ...updated };
        this.toast.showSuccess(complete ? 'Appointment marked as completed' : 'Appointment cancelled');
      },
      error: (err) => {
        this.busy = false;
        this.toast.showError(err?.error?.message || err?.error?.error || 'Could not update the appointment');
      },
    });
  }

  async remove() {
    const a = this.appointment;
    if (!a) return;
    const ok = await this.confirm.ask({
      title: 'Delete appointment',
      message: `Permanently delete appointment #${a.appointmentId}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Back',
      danger: true,
    });
    if (!ok) return;
    this.busy = true;
    this.admin.deleteAppointment(a.appointmentId).subscribe({
      next: (res) => {
        this.busy = false;
        this.appointment = null;
        this.query = '';
        this.toast.showSuccess(res?.message || 'Appointment deleted');
      },
      error: (err) => {
        this.busy = false;
        this.toast.showError(err?.error?.error || 'Could not delete the appointment');
      },
    });
  }

  isClosed(status: string): boolean {
    return CLOSED_STATUSES.includes(status);
  }

  statusLabel(status: string): string {
    const s = (status || '').replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusClass(status: string): string {
    if (status === 'COMPLETED') return 'adm-badge--success';
    if (this.isClosed(status)) return 'adm-badge--danger';
    if (status === 'IN_PROGRESS' || status === 'WAITING_ROOM' || status === 'READY_FOR_VISIT') return 'adm-badge--info';
    return 'adm-badge--warning';
  }
}
