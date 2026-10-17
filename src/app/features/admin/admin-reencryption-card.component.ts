import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, ReencryptionReport } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

interface ColumnRow {
  column: string;
  alreadyCurrent: number;
  legacyEcb: number;
  plaintext: number;
  rewritten: number;
  failed: number;
}

/**
 * Re-encrypts patient-data columns into AES-256-GCM. Always checks first (dry run); the real run is
 * offered only after a check and asks for confirmation, because it rewrites stored patient data.
 */
@Component({
  selector: 'app-admin-reencryption-card',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./admin-ui.css'],
  template: `
    <section class="adm-card p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-lock" aria-hidden="true"></i>
          </div>
          <div>
            <h2 class="adm-section-title">Data encryption</h2>
            <p class="adm-section-subtitle">Upgrade older encrypted patient data to the current encryption. Check first, then run.</p>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button type="button" class="adm-btn adm-btn--ghost" (click)="check()" [disabled]="busy">
            <i class="fa-solid fa-magnifying-glass" [class.fa-beat-fade]="busy && mode === 'check'" aria-hidden="true"></i>
            {{ busy && mode === 'check' ? 'Checking...' : 'Check' }}
          </button>
          <button type="button" class="adm-btn adm-btn--warning" (click)="run()" [disabled]="busy || !canRun">
            <i class="fa-solid fa-play" aria-hidden="true"></i>
            {{ busy && mode === 'run' ? 'Running...' : 'Run upgrade' }}
          </button>
        </div>
      </div>

      <div class="adm-notice adm-notice--warning">
        <i class="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>
        <span>Before <b>Run upgrade</b>, back up the database (create a Neon branch). When a check shows nothing left to
          upgrade and no failures, set <span class="font-mono">FIELD_ENCRYPTION_ACCEPT_LEGACY=false</span> on the server.</span>
      </div>

      <div *ngIf="report" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">{{ report.dryRun ? 'Values to upgrade' : 'Values upgraded' }}</div>
            <div class="text-xl font-bold">{{ report.dryRun ? (report.valuesToRewrite ?? 0) : (report.valuesRewritten ?? 0) }}</div>
          </div>
          <div class="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <div class="text-[11px] text-[var(--muted)]">Failed</div>
            <div class="text-xl font-bold" [class.text-rose-600]="report.failed > 0">{{ report.failed }}</div>
          </div>
          <div class="p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold"
            [ngClass]="allDone ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]'">
            <i class="fa-solid" [ngClass]="allDone ? 'fa-circle-check' : 'fa-hourglass-half'" aria-hidden="true"></i>
            {{ allDone ? 'All data is up to date' : (report.dryRun ? 'Upgrade needed' : 'Run a check to confirm') }}
          </div>
        </div>

        <details class="text-xs">
          <summary class="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] font-semibold">Details per column</summary>
          <div class="adm-table-wrap mt-2">
            <table class="adm-table text-xs">
              <thead>
                <tr><th>Column</th><th>Up to date</th><th>Old format</th><th>Not encrypted</th><th>Upgraded</th><th>Failed</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of columns">
                  <td class="font-mono">{{ c.column }}</td>
                  <td>{{ c.alreadyCurrent }}</td>
                  <td>{{ c.legacyEcb }}</td>
                  <td>{{ c.plaintext }}</td>
                  <td>{{ c.rewritten }}</td>
                  <td [class.text-rose-600]="c.failed > 0">{{ c.failed }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  `,
})
export class AdminReencryptionCardComponent {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  report: ReencryptionReport | null = null;
  busy = false;
  mode: 'check' | 'run' = 'check';

  get columns(): ColumnRow[] {
    return Object.entries(this.report?.columns || {}).map(([column, r]) => ({ column, ...r }));
  }

  /** Real run only after a check that found something to upgrade */
  get canRun(): boolean {
    return !!this.report?.dryRun && (this.report.valuesToRewrite ?? 0) > 0;
  }

  get allDone(): boolean {
    return !!this.report?.dryRun && (this.report.valuesToRewrite ?? 0) === 0 && this.report.failed === 0;
  }

  check() {
    this.execute(true);
  }

  async run() {
    const ok = await this.confirm.ask({
      title: 'Run encryption upgrade',
      message: `This rewrites ${this.report?.valuesToRewrite ?? 0} stored patient values. Have you backed up the database?`,
      confirmLabel: 'Yes, run upgrade',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    this.execute(false);
  }

  private execute(dryRun: boolean) {
    this.busy = true;
    this.mode = dryRun ? 'check' : 'run';
    this.admin.reencryptFields(dryRun).subscribe({
      next: (report) => {
        this.report = report;
        this.busy = false;
        if (!dryRun) {
          this.toast.showSuccess(`Upgraded ${report.valuesRewritten ?? 0} values. Run a check to confirm.`);
        }
      },
      error: () => {
        this.busy = false;
        this.toast.showError(dryRun ? 'Encryption check failed' : 'Encryption upgrade failed. Check the server log before trying again.');
      },
    });
  }
}
