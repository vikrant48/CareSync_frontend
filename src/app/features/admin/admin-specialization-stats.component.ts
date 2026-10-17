import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportsApiService } from '../../core/services/reports.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

interface SpecializationRow {
  name: string;
  doctors: number;
  appointments: number;
  perDoctor: number;
  rating: number;
}

type SortKey = 'gaps' | 'doctors' | 'appointments' | 'load';

/**
 * Doctors per specialization (GET /api/reports/specialization/analysis), plus specializations from master data
 * that have no doctor at all. Backend notes: doctor counts include inactive doctors; appointments (all time) and
 * ratings come from active doctors only; the same name in different letter case is one specialization here.
 */
@Component({
  selector: 'app-admin-specialization-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLoaderComponent],
  styleUrls: ['./admin-ui.css'],
  template: `
    <section class="adm-card p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 class="adm-section-title">Doctors per specialization</h2>
          <p class="adm-section-subtitle">
            {{ rows.length }} specializations · {{ gapCount }} without doctors · appointments are all time
          </p>
        </div>
        <button type="button" class="adm-btn adm-btn--ghost self-start sm:self-auto" (click)="load()" [disabled]="loading">
          <i class="fa-solid fa-rotate" [class.fa-spin]="loading" aria-hidden="true"></i> Refresh
        </button>
      </div>

      <app-page-loader *ngIf="loading && rows.length === 0" label="Loading specializations..."></app-page-loader>
      <div *ngIf="error && !loading" class="py-8 text-center text-sm text-[var(--muted)]">
        Could not load specializations.
        <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm ml-2" (click)="load()">Try again</button>
      </div>

      <ng-container *ngIf="rows.length > 0">
        <!-- Summary -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button type="button" class="p-3 rounded-xl border text-left transition"
            [ngClass]="gapCount > 0 ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10' : 'border-[var(--border)] bg-[var(--bg)]'"
            (click)="sort = 'gaps'; showGapsOnly = gapCount > 0">
            <div class="text-[11px] text-[var(--muted)]">No doctors yet</div>
            <div class="text-2xl font-bold" [class.text-amber-600]="gapCount > 0">{{ gapCount }}</div>
            <div class="text-[11px] text-[var(--muted)]">{{ gapCount > 0 ? 'Click to list them' : 'Every specialization is covered' }}</div>
          </button>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Only one doctor</div>
            <div class="text-2xl font-bold">{{ singleDoctorCount }}</div>
            <div class="text-[11px] text-[var(--muted)]">No cover if they are away</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Most doctors</div>
            <div class="text-base font-bold truncate" [title]="topByDoctors?.name || ''">{{ topByDoctors?.name || '—' }}</div>
            <div class="text-[11px] text-[var(--muted)]">{{ topByDoctors?.doctors || 0 }} doctors</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Busiest per doctor</div>
            <div class="text-base font-bold truncate" [title]="busiest?.name || ''">{{ busiest?.name || '—' }}</div>
            <div class="text-[11px] text-[var(--muted)]">{{ busiest ? (busiest.perDoctor | number: '1.0-1') + ' appointments per doctor' : 'No appointments yet' }}</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div class="relative sm:w-72">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]" aria-hidden="true"></i>
            <input class="adm-input !pl-8" [(ngModel)]="search" placeholder="Search specialization..." aria-label="Search specialization" />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-1.5 text-xs text-[var(--muted)] cursor-pointer select-none">
              <input type="checkbox" [(ngModel)]="showGapsOnly" class="w-3.5 h-3.5 accent-[var(--primary)]" /> Only without doctors
            </label>
            <select class="adm-input !h-8 !w-auto !text-xs" [(ngModel)]="sort" aria-label="Sort by">
              <option value="gaps">Fewest doctors first</option>
              <option value="doctors">Most doctors first</option>
              <option value="appointments">Most appointments first</option>
              <option value="load">Busiest per doctor first</option>
            </select>
          </div>
        </div>

        <div *ngIf="visibleRows.length === 0" class="py-8 text-center text-sm text-[var(--muted)]">No specializations match.</div>

        <!-- Table -->
        <div *ngIf="visibleRows.length > 0" class="adm-table-wrap max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Specialization</th>
                <th class="w-[34%]">Doctors</th>
                <th class="text-right">Appointments</th>
                <th class="text-right hidden md:table-cell">Per doctor</th>
                <th class="text-right hidden sm:table-cell">Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of visibleRows; trackBy: trackRow">
                <td>
                  <div class="font-semibold">{{ r.name }}</div>
                  <span *ngIf="r.doctors === 0" class="adm-badge adm-badge--warning mt-1">No doctors</span>
                  <span *ngIf="r.doctors === 1" class="adm-badge adm-badge--neutral mt-1">Single doctor</span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 rounded-full bg-[var(--bg)] overflow-hidden">
                      <div class="h-full rounded-full bg-[var(--primary)]" [style.width.%]="maxDoctors ? (r.doctors / maxDoctors) * 100 : 0"></div>
                    </div>
                    <span class="w-8 text-right font-semibold text-xs">{{ r.doctors }}</span>
                  </div>
                </td>
                <td class="text-right">{{ r.appointments }}</td>
                <td class="text-right hidden md:table-cell">{{ r.doctors ? (r.perDoctor | number: '1.0-1') : '—' }}</td>
                <td class="text-right hidden sm:table-cell whitespace-nowrap">
                  <ng-container *ngIf="r.rating > 0; else noRating">
                    {{ r.rating | number: '1.1-1' }} <i class="fa-solid fa-star text-amber-500 text-[10px]" aria-hidden="true"></i>
                  </ng-container>
                  <ng-template #noRating><span class="text-[var(--muted)]">—</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-[11px] text-[var(--muted)]">
          Doctor counts include inactive doctors. Appointments and ratings count active doctors only.
        </p>
      </ng-container>
    </section>
  `,
})
export class AdminSpecializationStatsComponent implements OnInit {
  private reports = inject(ReportsApiService);
  private master = inject(MasterDataService);

  rows: SpecializationRow[] = [];
  loading = false;
  error = false;
  search = '';
  sort: SortKey = 'gaps';
  showGapsOnly = false;

  get visibleRows(): SpecializationRow[] {
    const term = this.search.trim().toLowerCase();
    const list = this.rows.filter((r) => (!term || r.name.toLowerCase().includes(term)) && (!this.showGapsOnly || r.doctors === 0));
    const by: Record<SortKey, (a: SpecializationRow, b: SpecializationRow) => number> = {
      gaps: (a, b) => a.doctors - b.doctors || b.appointments - a.appointments,
      doctors: (a, b) => b.doctors - a.doctors,
      appointments: (a, b) => b.appointments - a.appointments,
      load: (a, b) => b.perDoctor - a.perDoctor,
    };
    return [...list].sort((a, b) => by[this.sort](a, b) || a.name.localeCompare(b.name));
  }

  get gapCount(): number {
    return this.rows.filter((r) => r.doctors === 0).length;
  }

  get singleDoctorCount(): number {
    return this.rows.filter((r) => r.doctors === 1).length;
  }

  get maxDoctors(): number {
    return Math.max(0, ...this.rows.map((r) => r.doctors));
  }

  get topByDoctors(): SpecializationRow | null {
    return this.rows.reduce<SpecializationRow | null>((top, r) => (!top || r.doctors > top.doctors ? r : top), null);
  }

  get busiest(): SpecializationRow | null {
    const withLoad = this.rows.filter((r) => r.doctors > 0 && r.appointments > 0);
    return withLoad.reduce<SpecializationRow | null>((top, r) => (!top || r.perDoctor > top.perDoctor ? r : top), null);
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = false;
    forkJoin({
      analysis: this.reports.getSpecializationAnalysis(),
      // The master list only adds the empty specializations; the table still works without it
      master: this.master.getSpecializations().pipe(catchError(() => of([] as string[]))),
    }).subscribe({
      next: ({ analysis, master }) => {
        this.rows = this.buildRows(analysis || {}, master || []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  /**
   * Merges names that differ only in letter case. Counts add up; appointments and ratings are the same value
   * on every spelling (the backend matches doctors ignoring case), so the largest is kept instead of adding.
   */
  private buildRows(analysis: Record<string, any>, master: string[]): SpecializationRow[] {
    const counts: Record<string, number> = analysis['specializationCount'] || {};
    const appointments: Record<string, number> = analysis['specializationAppointments'] || {};
    const ratings: Record<string, number> = analysis['specializationRatings'] || {};
    const merged = new Map<string, SpecializationRow>();

    const row = (name: string): SpecializationRow => {
      const key = name.trim().toLowerCase();
      let r = merged.get(key);
      if (!r) {
        r = { name: name.trim(), doctors: 0, appointments: 0, perDoctor: 0, rating: 0 };
        merged.set(key, r);
      }
      return r;
    };

    for (const [name, count] of Object.entries(counts)) {
      const r = row(name);
      r.doctors += Number(count) || 0;
      r.appointments = Math.max(r.appointments, Number(appointments[name]) || 0);
      r.rating = Math.max(r.rating, Number(ratings[name]) || 0);
    }
    for (const name of master) {
      if (name?.trim()) row(name);
    }
    for (const r of merged.values()) {
      r.perDoctor = r.doctors ? r.appointments / r.doctors : 0;
    }
    return [...merged.values()];
  }

  trackRow = (_: number, r: SpecializationRow) => r.name.toLowerCase();
}
