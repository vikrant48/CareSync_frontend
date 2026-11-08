import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentStatusResponse } from '../../core/services/payment.service';
import { PdfService } from '../../core/services/pdf.service';
import { ToastService } from '../../core/services/toast.service';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { PillComponent } from '../../shared/ui/pill.component';
import { UiTone } from '../../shared/ui/tone';

@Component({
  selector: 'app-patient-payments',
  standalone: true,
  imports: [CommonModule, PageContainerComponent, PageHeaderComponent, PageLoaderComponent, EmptyStateComponent,
    PaginatorComponent, PillComponent],
  template: `
    <app-page-container>
      <app-page-header variant="hero" icon="fa-solid fa-receipt" title="Payments"
        subtitle="Every payment you made, with refunds and receipts."></app-page-header>

      <app-page-loader *ngIf="loading()" label="Loading payments..."></app-page-loader>

      <app-empty-state *ngIf="!loading() && error()" variant="error" title="Could not load payments"
        message="Please try again." (retry)="load(page())"></app-empty-state>

      <app-empty-state *ngIf="!loading() && !error() && payments().length === 0" icon="fa-receipt"
        title="No payments yet" message="Payments for appointments and lab tests will appear here."></app-empty-state>

      <ul *ngIf="!loading() && payments().length > 0" class="space-y-3" aria-label="Payment history">
        <li *ngFor="let p of payments()" class="surface p-4 sm:p-5">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-[var(--text)]">{{ title(p) }}</span>
                <app-pill size="sm" [tone]="statusTone(p)">{{ statusLabel(p) }}</app-pill>
                <app-pill *ngIf="p.demoMode" size="sm" tone="warning">Demo</app-pill>
              </div>
              <div class="text-xs text-[var(--muted)]">
                {{ (p.paymentCompletedAt || p.createdAt) | date:'d MMM y, h:mm a' }}
                <span *ngIf="p.paymentMethod"> · {{ methodLabel(p.paymentMethod) }}</span>
                <span *ngIf="p.appointmentDate"> · Visit {{ p.appointmentDate | date:'d MMM y' }}{{ p.appointmentTime ? ' at ' + p.appointmentTime : '' }}</span>
              </div>
              <div class="text-xs text-[var(--muted)] font-mono break-all">ID: {{ p.gatewayPaymentId || p.transactionId }}</div>
              <div *ngIf="(p.refundAmount || 0) > 0" class="text-xs text-emerald-700 dark:text-emerald-400">
                <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
                Refunded {{ p.refundAmount | currency:(p.currency || 'INR'):'symbol':'1.2-2' }}
                <span *ngIf="p.refundedAt"> on {{ p.refundedAt | date:'d MMM y' }}</span>
                <span *ngIf="p.refundReason" class="text-[var(--muted)]"> · {{ p.refundReason }}</span>
              </div>
              <div *ngIf="p.refundStatus === 'REFUND_FAILED'" class="text-xs text-rose-700 dark:text-rose-400">
                Refund needs manual handling. Our team will contact you.
              </div>
              <div *ngIf="p.paymentStatus === 'FAILED' && p.failureReason" class="text-xs text-rose-700 dark:text-rose-400">
                {{ p.failureReason }}
              </div>
            </div>
            <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <div class="text-lg font-extrabold text-[var(--text)]">{{ p.amount | currency:(p.currency || 'INR'):'symbol':'1.2-2' }}</div>
              <button *ngIf="canDownload(p)" type="button" (click)="downloadReceipt(p)"
                class="btn-size-sm inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-xs font-semibold text-[var(--text)] hover:border-[var(--primary)] cursor-pointer">
                <i class="fa-solid fa-download text-[10px]" aria-hidden="true"></i> Receipt
              </button>
            </div>
          </div>
        </li>
      </ul>

      <app-paginator *ngIf="!loading() && total() > pageSize" [page]="page()" [pageSize]="pageSize" [total]="total()"
        (pageChange)="load($event)"></app-paginator>
    </app-page-container>
  `,
})
export class PatientPaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private pdfService = inject(PdfService);
  private toast = inject(ToastService);

  readonly pageSize = 10;
  payments = signal<PaymentStatusResponse[]>([]);
  page = signal(0);
  total = signal(0);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.load(0);
  }

  load(page: number) {
    this.loading.set(true);
    this.error.set(false);
    this.paymentService.getMyPayments(page, this.pageSize).subscribe({
      next: (res) => {
        this.payments.set(res?.content || []);
        this.total.set(res?.totalElements || 0);
        this.page.set(res?.number ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  title(p: PaymentStatusResponse): string {
    if (p.appointmentId) return p.doctorName ? `Appointment with Dr. ${p.doctorName.replace(/^Dr\.?\s*/i, '')}` : 'Doctor appointment';
    if (p.bookingId) return 'Lab tests';
    return p.description || 'Payment';
  }

  statusLabel(p: PaymentStatusResponse): string {
    switch (p.paymentStatus) {
      case 'SUCCESS': return 'Paid';
      case 'REFUNDED': return 'Refunded';
      case 'PARTIAL_REFUND': return 'Partly refunded';
      case 'FAILED': return 'Failed';
      case 'PENDING': return 'Pending';
      default: return p.paymentStatus || p.status || '';
    }
  }

  statusTone(p: PaymentStatusResponse): UiTone {
    switch (p.paymentStatus) {
      case 'SUCCESS': return 'success';
      case 'REFUNDED':
      case 'PARTIAL_REFUND': return 'info';
      case 'FAILED': return 'danger';
      case 'PENDING': return 'warning';
      default: return 'neutral';
    }
  }

  methodLabel(method: string): string {
    const labels: Record<string, string> = { UPI: 'UPI', CARD: 'Card', NET_BANKING: 'Netbanking', WALLET: 'Wallet', QR_CODE: 'UPI QR' };
    return labels[method] || method;
  }

  canDownload(p: PaymentStatusResponse): boolean {
    return ['SUCCESS', 'REFUNDED', 'PARTIAL_REFUND'].includes(p.paymentStatus || '') && !!(p.appointmentId || p.bookingId);
  }

  downloadReceipt(p: PaymentStatusResponse) {
    if (p.appointmentId) {
      this.pdfService.generateAppointmentReceiptByBookingId(p.appointmentId);
    } else if (p.bookingId) {
      this.pdfService.generateReceiptByBookingId(p.bookingId);
    }
    this.toast.showSuccess('Receipt download started');
  }
}
