import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

interface Bar {
  label: string;
  value: number;
  percent: number;
}

/**
 * Platform numbers for the Overview: activity in a chosen period, plus patient age groups and conditions.
 * Counts only, no individual records. (The backend's "totalRevenue" is an estimate of 100 per appointment,
 * so it is not shown.)
 */
@Component({
  selector: 'app-admin-platform-stats',
  standalone: true,
  imports: [CommonModule, PageLoaderComponent],
  styleUrls: ['./admin-ui.css'],
  template: `
    <section class="adm-card p-4 sm:p-5 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 class="adm-section-title">Platform activity</h2>
          <p class="adm-section-subtitle">Appointments by visit date, {{ rangeStart | date: 'MMM d' }} – {{ rangeEnd | date: 'MMM d, y' }}.</p>
        </div>
        <div class="flex flex-wrap gap-2 self-start sm:self-auto">
          <div class="inline-flex p-1 rounded-xl border border-[var(--border)] bg-[var(--bg)]" role="radiogroup" aria-label="Past or upcoming">
            <button type="button" role="radio" [attr.aria-checked]="direction === 'past'" class="adm-btn adm-btn--sm"
              [ngClass]="direction === 'past' ? 'adm-btn--primary' : 'text-[var(--muted)]'" (click)="setDirection('past')">
              <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Past
            </button>
            <button type="button" role="radio" [attr.aria-checked]="direction === 'upcoming'" class="adm-btn adm-btn--sm"
              [ngClass]="direction === 'upcoming' ? 'adm-btn--primary' : 'text-[var(--muted)]'" (click)="setDirection('upcoming')">
              <i class="fa-solid fa-calendar-days" aria-hidden="true"></i> Upcoming
            </button>
          </div>
          <div class="inline-flex p-1 rounded-xl border border-[var(--border)] bg-[var(--bg)]" role="radiogroup" aria-label="Period">
            <button *ngFor="let p of periods" type="button" role="radio" [attr.aria-checked]="days === p"
              class="adm-btn adm-btn--sm" [ngClass]="days === p ? 'adm-btn--primary' : 'text-[var(--muted)]'" (click)="setPeriod(p)">
              {{ p }} days
            </button>
          </div>
        </div>
      </div>

      <app-page-loader *ngIf="loading && !stats" label="Loading platform activity..." [compact]="true"></app-page-loader>
      <div *ngIf="error && !loading" class="py-8 text-center text-sm text-[var(--muted)]">
        Could not load platform numbers. <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm ml-2" (click)="loadStats()">Try again</button>
      </div>

      <ng-container *ngIf="stats as s">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3" [class.opacity-60]="loading">
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Appointments</div>
            <div class="text-2xl font-bold">{{ s.totalAppointments ?? 0 }}</div>
            <div class="text-[11px] text-[var(--muted)]">{{ direction === 'past' ? 'in the last' : 'in the next' }} {{ days }} days</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">{{ direction === 'past' ? 'Doctors who saw patients' : 'Doctors with bookings' }}</div>
            <div class="text-2xl font-bold">{{ s.activeDoctors ?? 0 }}</div>
            <div class="text-[11px] text-[var(--muted)]">of {{ s.totalDoctors ?? 0 }} doctors</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">{{ direction === 'past' ? 'Patients with a visit' : 'Patients with a booking' }}</div>
            <div class="text-2xl font-bold">{{ s.activePatients ?? 0 }}</div>
            <div class="text-[11px] text-[var(--muted)]">of {{ s.totalPatients ?? 0 }} patients</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Average rating</div>
            <div class="text-2xl font-bold flex items-center gap-1.5">
              {{ s.avgRating ? (s.avgRating | number: '1.1-1') : '—' }}
              <i *ngIf="s.avgRating" class="fa-solid fa-star text-amber-500 text-base" aria-hidden="true"></i>
            </div>
            <div class="text-[11px] text-[var(--muted)]">all feedback, all time</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <h3 class="text-sm font-bold mb-3">Appointments per day</h3>
            <div *ngIf="dailyMax === 0" class="h-32 flex items-center justify-center text-xs text-[var(--muted)]">No appointments in this period.</div>
            <ng-container *ngIf="dailyMax > 0">
              <div class="flex gap-2">
                <div class="flex flex-col justify-between h-32 text-[10px] text-[var(--muted)] text-right w-5 shrink-0">
                  <span>{{ dailyMax }}</span><span>0</span>
                </div>
                <div class="flex-1 flex items-end h-32 border-b border-[var(--border)]" [ngClass]="days > 30 ? 'gap-px' : 'gap-[3px]'"
                  role="img" [attr.aria-label]="'Appointments per day, busiest day ' + dailyMax">
                  <div *ngFor="let d of dailyBars" class="flex-1 h-full flex items-end group" [title]="(d.label | date: 'EEE, MMM d') + ': ' + d.value">
                    <div class="w-full rounded-t-sm bg-[var(--primary)] opacity-80 group-hover:opacity-100 transition-opacity"
                      [style.height.%]="d.value > 0 ? (d.percent < 4 ? 4 : d.percent) : 0"></div>
                  </div>
                </div>
              </div>
              <div class="flex justify-between text-[10px] text-[var(--muted)] mt-1 pl-7">
                <span>{{ rangeStart | date: 'MMM d' }}</span><span>{{ rangeEnd | date: 'MMM d' }}</span>
              </div>
            </ng-container>
          </div>

          <div class="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <h3 class="text-sm font-bold mb-3">By status</h3>
            <div *ngIf="statusBars.length === 0" class="py-6 text-center text-xs text-[var(--muted)]">No appointments in this period.</div>
            <div class="space-y-2">
              <div *ngFor="let b of statusBars" class="text-xs">
                <div class="flex justify-between mb-0.5"><span>{{ b.label }}</span><span class="font-semibold">{{ b.value }}</span></div>
                <div class="h-1.5 rounded-full bg-[var(--panel)] overflow-hidden"><div class="h-full rounded-full bg-[var(--primary)]" [style.width.%]="b.percent"></div></div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" *ngIf="ageBars.length > 0 || conditionBars.length > 0">
        <div class="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <h3 class="text-sm font-bold">Patients by age</h3>
          <p class="text-[11px] text-[var(--muted)] mb-3">All {{ totalPatients }} patients</p>
          <div class="space-y-2">
            <div *ngFor="let b of ageBars" class="text-xs">
              <div class="flex justify-between mb-0.5"><span>{{ b.label }}</span><span class="font-semibold">{{ b.value }}</span></div>
              <div class="h-1.5 rounded-full bg-[var(--panel)] overflow-hidden"><div class="h-full rounded-full bg-sky-500" [style.width.%]="b.percent"></div></div>
            </div>
          </div>
        </div>
        <div class="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <h3 class="text-sm font-bold">Common conditions</h3>
          <p class="text-[11px] text-[var(--muted)] mb-3">Small groups are combined so no patient can be singled out</p>
          <div class="space-y-2">
            <div *ngFor="let b of conditionBars" class="text-xs">
              <div class="flex justify-between gap-2 mb-0.5"><span class="truncate">{{ b.label }}</span><span class="font-semibold">{{ b.value }}</span></div>
              <div class="h-1.5 rounded-full bg-[var(--panel)] overflow-hidden"><div class="h-full rounded-full bg-violet-500" [style.width.%]="b.percent"></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AdminPlatformStatsComponent implements OnInit {
  private analytics = inject(AnalyticsApiService);
  private reports = inject(ReportsApiService);

  readonly periods = [7, 30, 90];
  days = 30;
  direction: 'past' | 'upcoming' = 'past';
  stats: OverallAnalytics | null = null;
  loading = false;
  error = false;

  dailyBars: Bar[] = [];
  rangeStart = new Date();
  rangeEnd = new Date();
  dailyMax = 0;
  statusBars: Bar[] = [];
  ageBars: Bar[] = [];
  conditionBars: Bar[] = [];
  totalPatients = 0;

  ngOnInit(): void {
    this.loadStats();
    this.loadDemographics();
  }

  /** Past: the last N days up to today. Upcoming: today and the next N-1 days. */
  setDirection(direction: 'past' | 'upcoming') {
    if (direction === this.direction) return;
    this.direction = direction;
    this.loadStats();
  }

  setPeriod(days: number) {
    if (days === this.days) return;
    this.days = days;
    this.loadStats();
  }

  loadStats() {
    const start = new Date();
    const end = new Date();
    if (this.direction === 'past') {
      start.setDate(start.getDate() - (this.days - 1));
    } else {
      end.setDate(end.getDate() + (this.days - 1));
    }
    this.rangeStart = start;
    this.rangeEnd = end;
    this.loading = true;
    this.error = false;
    this.analytics.getOverallAnalytics(this.isoDate(start), this.isoDate(end)).subscribe({
      next: (s) => {
        this.stats = s;
        // The backend lists only days that have appointments; show every day of the period (empty days as 0)
        const counts = s.dailyAppointmentTrends || {};
        const days: { label: string; value: number }[] = [];
        for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = this.isoDate(d);
          days.push({ label: key, value: Number(counts[key] || 0) });
        }
        this.dailyMax = Math.max(0, ...days.map((d) => d.value));
        this.dailyBars = days.map((d) => ({ ...d, percent: this.dailyMax ? (d.value / this.dailyMax) * 100 : 0 }));
        this.statusBars = this.toBars(s.appointmentStatusDistribution || {}, (k) => this.titleCase(k));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  loadDemographics() {
    this.reports.getPatientDemographicsReport().subscribe({
      next: (r) => {
        this.totalPatients = Number(r?.['totalPatients'] || 0);
        this.ageBars = this.toBars(r?.['ageGroups'] || {}, (k) => k);
        this.conditionBars = this.toBars(r?.['illnessDistribution'] || {}, (k) => k).slice(0, 8);
      },
      // Optional panel: the activity numbers above still show without it
      error: () => {
        this.ageBars = [];
        this.conditionBars = [];
      },
    });
  }

  private toBars(counts: Record<string, number>, label: (key: string) => string): Bar[] {
    const entries = Object.entries(counts).filter(([, v]) => Number(v) > 0);
    const max = Math.max(0, ...entries.map(([, v]) => Number(v)));
    return entries
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .map(([k, v]) => ({ label: label(k), value: Number(v), percent: max ? (Number(v) / max) * 100 : 0 }));
  }

  private isoDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private titleCase(value: string): string {
    const s = (value || '').replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
