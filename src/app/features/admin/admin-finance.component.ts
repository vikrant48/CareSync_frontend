import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, FinanceStatistics, FinanceBucket } from '../../core/services/payment.service';
import { AdminChromeComponent } from './admin-chrome.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { PillComponent } from '../../shared/ui/pill.component';
import { RevenueBarsComponent, RevenueBar } from '../../shared/ui/revenue-bars.component';

@Component({
  selector: 'app-admin-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminChromeComponent, PageLoaderComponent, EmptyStateComponent, StatCardComponent,
    PillComponent, RevenueBarsComponent],
  template: `
    <app-admin-chrome section="finance">
      <div class="max-w-7xl mx-auto p-3 sm:p-6 pb-24 space-y-4 sm:space-y-6">

        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs font-bold text-[var(--muted)]" for="finance-range">Period</label>
          <select id="finance-range" [(ngModel)]="days" (ngModelChange)="load()"
            class="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]">
            <option [ngValue]="7">Last 7 days</option>
            <option [ngValue]="30">Last 30 days</option>
            <option [ngValue]="90">Last 90 days</option>
          </select>
          <label class="inline-flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
            <input type="checkbox" [(ngModel)]="includeDemo" (ngModelChange)="load()" class="accent-[var(--primary)]" />
            Include demo payments
          </label>
          <span *ngIf="stats() as s" class="text-xs text-[var(--muted)]">{{ s.demoPayments }} demo payment(s) in the last 12 months</span>
        </div>

        <app-page-loader *ngIf="loading()" label="Loading finance..."></app-page-loader>
        <app-empty-state *ngIf="!loading() && error()" variant="error" title="Could not load finance data"
          message="Please try again." (retry)="load()"></app-empty-state>

        <ng-container *ngIf="!loading() && stats() as s">
          <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <app-stat-card label="Gross revenue" [value]="money(s.totals.gross, s.currency)" icon="fa-solid fa-sack-dollar" tone="primary"></app-stat-card>
            <app-stat-card label="Refunds" [value]="money(s.totals.refunds, s.currency)" icon="fa-solid fa-rotate-left" tone="info"
              [hint]="s.totals.refunded + ' refunded'"></app-stat-card>
            <app-stat-card label="Net revenue" [value]="money(s.totals.net, s.currency)" icon="fa-solid fa-scale-balanced" tone="success"></app-stat-card>
            <app-stat-card label="Paid" [value]="s.totals.successful" icon="fa-solid fa-circle-check" tone="success"
              [hint]="'Avg ' + money(s.totals.averagePayment, s.currency)"></app-stat-card>
            <app-stat-card label="Failed" [value]="s.totals.failed" icon="fa-solid fa-circle-xmark" tone="danger"></app-stat-card>
            <app-stat-card label="Abandoned checkouts" [value]="s.totals.cancelledCheckouts" icon="fa-solid fa-cart-arrow-down" tone="warning"
              [hint]="s.totals.pending + ' pending now'"></app-stat-card>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="surface p-4 sm:p-5">
              <app-revenue-bars [title]="'Net revenue per day (last ' + s.days + ' days)'" [bars]="bars(s.daily)"
                [currency]="s.currency" [labelEvery]="s.days > 31 ? 14 : (s.days > 7 ? 5 : 1)"></app-revenue-bars>
            </div>
            <div class="surface p-4 sm:p-5">
              <app-revenue-bars title="Net revenue per month (last 12 months)" [bars]="bars(s.monthly)"
                [currency]="s.currency" [labelEvery]="2"></app-revenue-bars>
            </div>
          </div>

          <div class="surface p-4 sm:p-5 overflow-x-auto">
            <h2 class="text-sm font-bold text-[var(--text)] mb-3">Monthly summary</h2>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th scope="col" class="py-2 pr-3">Month</th>
                  <th scope="col" class="py-2 pr-3 text-right">Gross</th>
                  <th scope="col" class="py-2 pr-3 text-right">Refunds</th>
                  <th scope="col" class="py-2 pr-3 text-right">Net</th>
                  <th scope="col" class="py-2 pr-3 text-right">Paid</th>
                  <th scope="col" class="py-2 text-right">Failed</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of reversed(s.monthly)" class="border-b border-[var(--border)] last:border-0">
                  <td class="py-2 pr-3 text-[var(--text)]">{{ monthName(m.period) }}</td>
                  <td class="py-2 pr-3 text-right">{{ money(m.gross, s.currency) }}</td>
                  <td class="py-2 pr-3 text-right">{{ money(m.refunds, s.currency) }}</td>
                  <td class="py-2 pr-3 text-right font-semibold">{{ money(m.net, s.currency) }}</td>
                  <td class="py-2 pr-3 text-right">{{ m.successful }}</td>
                  <td class="py-2 text-right">{{ m.failed }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="surface p-4 sm:p-5">
              <h2 class="text-sm font-bold text-[var(--text)] mb-3">Recent refunds</h2>
              <p *ngIf="s.recentRefunds.length === 0" class="text-sm text-[var(--muted)]">No refunds yet.</p>
              <ul class="divide-y divide-[var(--border)]">
                <li *ngFor="let r of s.recentRefunds" class="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div class="min-w-0">
                    <div class="font-semibold text-[var(--text)] truncate">{{ r.patientName || 'Patient' }}<span *ngIf="r.doctorName" class="text-[var(--muted)] font-normal"> · Dr. {{ r.doctorName }}</span></div>
                    <div class="text-xs text-[var(--muted)]">{{ r.at | date:'d MMM y, h:mm a' }} · {{ r.reason }}</div>
                    <div class="text-[11px] text-[var(--muted)] font-mono truncate">{{ r.gatewayPaymentId || r.transactionId }}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-bold text-[var(--text)]">{{ money(r.refundAmount, s.currency) }}</div>
                    <div class="text-[11px] text-[var(--muted)]">of {{ money(r.amount, s.currency) }}</div>
                    <app-pill *ngIf="r.demo" size="sm" tone="warning">Demo</app-pill>
                  </div>
                </li>
              </ul>
            </div>
            <div class="surface p-4 sm:p-5">
              <h2 class="text-sm font-bold text-[var(--text)] mb-3">Recent failed payments</h2>
              <p *ngIf="s.recentFailures.length === 0" class="text-sm text-[var(--muted)]">No failed payments.</p>
              <ul class="divide-y divide-[var(--border)]">
                <li *ngFor="let f of s.recentFailures" class="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div class="min-w-0">
                    <div class="font-semibold text-[var(--text)] truncate">{{ f.patientName || 'Patient' }}</div>
                    <div class="text-xs text-[var(--muted)]">{{ f.at | date:'d MMM y, h:mm a' }}<span *ngIf="f.method"> · {{ f.method }}</span></div>
                    <div *ngIf="f.reason" class="text-xs text-rose-700 dark:text-rose-400 truncate">{{ f.reason }}</div>
                  </div>
                  <div class="font-bold text-[var(--text)] shrink-0">{{ money(f.amount, s.currency) }}</div>
                </li>
              </ul>
            </div>
          </div>

          <p class="text-xs text-[var(--muted)]"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Refund policy: {{ s.refundPolicy }}</p>
        </ng-container>
      </div>
    </app-admin-chrome>
  `,
})
export class AdminFinanceComponent implements OnInit {
  private paymentService = inject(PaymentService);

  days = 30;
  includeDemo = true;
  stats = signal<FinanceStatistics | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.paymentService.getFinanceStatistics(this.days, this.includeDemo).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  bars(buckets: FinanceBucket[]): RevenueBar[] {
    return buckets.map((b) => ({
      label: b.period,
      value: Number(b.net) || 0,
      detail: `${b.successful} paid · ${b.failed} failed · refunds ${this.money(b.refunds, this.stats()?.currency)}`,
    }));
  }

  reversed(buckets: FinanceBucket[]): FinanceBucket[] {
    return [...buckets].reverse();
  }

  monthName(period: string): string {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }

  money(value: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
}
