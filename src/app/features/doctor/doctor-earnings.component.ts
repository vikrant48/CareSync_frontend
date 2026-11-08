import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, DoctorEarnings, FinanceBucket } from '../../core/services/payment.service';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { PillComponent } from '../../shared/ui/pill.component';
import { RevenueBarsComponent, RevenueBar } from '../../shared/ui/revenue-bars.component';

@Component({
  selector: 'app-doctor-earnings',
  standalone: true,
  imports: [CommonModule, PageContainerComponent, PageHeaderComponent, PageLoaderComponent, EmptyStateComponent,
    StatCardComponent, PillComponent, RevenueBarsComponent],
  template: `
    <app-page-container>
      <app-page-header variant="hero" icon="fa-solid fa-indian-rupee-sign" title="Earnings"
        subtitle="What your paid visits brought in, after refunds. For your information only: payouts are handled by CareSync."></app-page-header>

      <app-page-loader *ngIf="loading()" accent="doctor" label="Loading earnings..."></app-page-loader>
      <app-empty-state *ngIf="!loading() && error()" variant="error" title="Could not load earnings"
        message="Please try again." (retry)="load()"></app-empty-state>

      <ng-container *ngIf="!loading() && data() as d">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <app-stat-card label="This month (net)" [value]="money(d.thisMonth.net, d.currency)" icon="fa-solid fa-calendar" tone="primary"
            [hint]="d.thisMonth.successful + ' paid visit(s)'"></app-stat-card>
          <app-stat-card label="All time (net)" [value]="money(d.totals.net, d.currency)" icon="fa-solid fa-scale-balanced" tone="success"></app-stat-card>
          <app-stat-card label="Paid visits" [value]="d.totals.successful" icon="fa-solid fa-user-check" tone="info"
            [hint]="'Avg ' + money(d.totals.averagePayment, d.currency)"></app-stat-card>
          <app-stat-card label="Refunded" [value]="money(d.totals.refunds, d.currency)" icon="fa-solid fa-rotate-left" tone="warning"
            [hint]="d.totals.refunded + ' visit(s)'"></app-stat-card>
        </div>

        <div class="surface p-4 sm:p-5">
          <app-revenue-bars title="Net earnings per month (last 12 months)" [bars]="bars(d.monthly, d.currency)"
            [currency]="d.currency" [labelEvery]="2"></app-revenue-bars>
        </div>

        <div class="surface p-4 sm:p-5 overflow-x-auto">
          <h2 class="text-sm font-bold text-[var(--text)] mb-3">Recent paid visits</h2>
          <app-empty-state *ngIf="d.recent.length === 0" [compact]="true" icon="fa-indian-rupee-sign"
            title="No paid visits yet" message="Visits patients pay for will appear here."></app-empty-state>
          <table *ngIf="d.recent.length > 0" class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                <th scope="col" class="py-2 pr-3">Visit</th>
                <th scope="col" class="py-2 pr-3">Patient</th>
                <th scope="col" class="py-2 pr-3 text-right">Paid</th>
                <th scope="col" class="py-2 pr-3 text-right">Refunded</th>
                <th scope="col" class="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of d.recent" class="border-b border-[var(--border)] last:border-0">
                <td class="py-2 pr-3 whitespace-nowrap">{{ r.visitDate | date:'d MMM y, h:mm a' }}</td>
                <td class="py-2 pr-3">
                  {{ r.patientName || 'Patient' }}
                  <app-pill *ngIf="r.demo" size="sm" tone="warning">Demo</app-pill>
                </td>
                <td class="py-2 pr-3 text-right">{{ money(r.paid, d.currency) }}</td>
                <td class="py-2 pr-3 text-right">{{ r.refunded > 0 ? money(r.refunded, d.currency) : '—' }}</td>
                <td class="py-2 text-right font-semibold">{{ money(r.net, d.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </app-page-container>
  `,
})
export class DoctorEarningsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  data = signal<DoctorEarnings | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.paymentService.getMyEarnings().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  bars(buckets: FinanceBucket[], currency: string): RevenueBar[] {
    return buckets.map((b) => ({
      label: b.period,
      value: Number(b.net) || 0,
      detail: `${b.successful} paid visit(s) · refunds ${this.money(b.refunds, currency)}`,
    }));
  }

  money(value: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
}
