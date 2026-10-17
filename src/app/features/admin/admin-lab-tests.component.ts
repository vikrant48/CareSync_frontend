import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabTest, LabTestService } from '../../core/services/lab-test.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

interface LabTestForm {
  testName: string;
  price: number | null;
  description: string;
  isActive: boolean;
}

/**
 * The lab test catalog patients book from. Hidden tests stay in old bookings but can't be booked;
 * the backend's delete is a hide (isActive=false), so "Hide" uses it and "Show" re-activates via update.
 */
@Component({
  selector: 'app-admin-lab-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, PageLoaderComponent],
  styleUrls: ['./admin-ui.css'],
  template: `
    <section class="adm-card p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 class="adm-section-title">Lab test catalog</h2>
          <p class="adm-section-subtitle">{{ activeCount }} bookable · {{ tests.length - activeCount }} hidden</p>
        </div>
        <div class="flex gap-2 self-start sm:self-auto">
          <button type="button" class="adm-btn adm-btn--ghost" (click)="load()" [disabled]="loading">
            <i class="fa-solid fa-rotate" [class.fa-spin]="loading" aria-hidden="true"></i> Refresh
          </button>
          <button type="button" class="adm-btn adm-btn--primary" (click)="openForm()">
            <i class="fa-solid fa-plus" aria-hidden="true"></i> Add test
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]" aria-hidden="true"></i>
          <input class="adm-input !pl-8" [(ngModel)]="search" placeholder="Search tests..." aria-label="Search tests" />
        </div>
        <div class="inline-flex p-1 rounded-xl border border-[var(--border)] bg-[var(--bg)]" role="radiogroup" aria-label="Show">
          <button *ngFor="let f of filters" type="button" role="radio" [attr.aria-checked]="filter === f.value"
            class="adm-btn adm-btn--sm" [ngClass]="filter === f.value ? 'adm-btn--primary' : 'text-[var(--muted)]'"
            (click)="filter = f.value">{{ f.label }}</button>
        </div>
      </div>

      <app-page-loader *ngIf="loading && tests.length === 0" label="Loading lab tests..."></app-page-loader>
      <div *ngIf="!loading && filteredTests.length === 0" class="py-12 text-center text-sm text-[var(--muted)]">
        <i class="fa-solid fa-flask text-xl mb-2 block" aria-hidden="true"></i>
        {{ tests.length === 0 ? 'No lab tests yet. Add the first one.' : 'No tests match.' }}
      </div>

      <div *ngIf="filteredTests.length > 0" class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr><th>Test</th><th class="text-right">Price</th><th>Status</th><th class="text-right">Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filteredTests; trackBy: trackTest" [class.opacity-60]="!t.isActive">
              <td>
                <div class="font-semibold">{{ t.testName }}</div>
                <div *ngIf="t.description" class="text-[11px] text-[var(--muted)] line-clamp-1 max-w-[28rem]" [title]="t.description">{{ t.description }}</div>
              </td>
              <td class="text-right font-semibold whitespace-nowrap">{{ t.price | currency: 'INR' : 'symbol' : '1.0-2' }}</td>
              <td>
                <span class="adm-badge" [ngClass]="t.isActive ? 'adm-badge--success' : 'adm-badge--neutral'">
                  <span class="adm-badge__dot"></span>{{ t.isActive ? 'Bookable' : 'Hidden' }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1.5">
                  <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="openForm(t)">
                    <i class="fa-solid fa-pen" aria-hidden="true"></i><span class="hidden sm:inline">Edit</span>
                  </button>
                  <button *ngIf="t.isActive" type="button" class="adm-btn adm-btn--sm adm-btn--danger w-[78px]" [disabled]="busyId === t.id" (click)="hide(t)">
                    {{ busyId === t.id ? '...' : 'Hide' }}
                  </button>
                  <button *ngIf="!t.isActive" type="button" class="adm-btn adm-btn--sm adm-btn--success w-[78px]" [disabled]="busyId === t.id" (click)="show(t)">
                    {{ busyId === t.id ? '...' : 'Show' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <app-modal-shell [open]="formOpen" [title]="editing ? 'Edit lab test' : 'Add lab test'" icon="fa-solid fa-flask"
      iconWrapClass="bg-[var(--primary-soft)] text-[var(--primary)]" maxWidthClass="max-w-md" bodyClass="p-4 sm:p-6"
      [fullScreenMobile]="false" [hasFooter]="true" footerClass="px-4 sm:px-6 py-3 flex justify-end gap-2" (close)="closeForm()">
      <form id="admin-lab-test-form" class="space-y-3" (ngSubmit)="save()">
        <div>
          <label class="adm-label" for="lt-name">Test name</label>
          <input id="lt-name" name="testName" class="adm-input" [(ngModel)]="form.testName" maxlength="120" placeholder="e.g. Complete Blood Count" />
          <p *ngIf="nameTaken" class="mt-1 text-[11px] text-amber-700 dark:text-amber-400">A test with this name already exists.</p>
        </div>
        <div>
          <label class="adm-label" for="lt-price">Price (₹)</label>
          <input id="lt-price" name="price" type="number" min="0" step="1" class="adm-input" [(ngModel)]="form.price" placeholder="e.g. 450" />
        </div>
        <div>
          <label class="adm-label" for="lt-desc">Description <span class="font-normal">(optional)</span></label>
          <textarea id="lt-desc" name="description" rows="3" class="adm-input !h-auto py-2" [(ngModel)]="form.description" maxlength="500"
            placeholder="What it checks, preparation needed..."></textarea>
        </div>
        <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" name="isActive" [(ngModel)]="form.isActive" class="w-4 h-4 accent-[var(--primary)]" />
          Patients can book this test
        </label>
      </form>
      <div modalFooter class="contents">
        <button type="button" class="adm-btn adm-btn--ghost" (click)="closeForm()">Cancel</button>
        <button type="submit" form="admin-lab-test-form" class="adm-btn adm-btn--primary" [disabled]="saving || !formValid">
          {{ saving ? 'Saving...' : (editing ? 'Save changes' : 'Add test') }}
        </button>
      </div>
    </app-modal-shell>
  `,
})
export class AdminLabTestsComponent implements OnInit {
  private labTests = inject(LabTestService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  tests: LabTest[] = [];
  loading = false;
  search = '';
  filter: 'ALL' | 'ACTIVE' | 'HIDDEN' = 'ALL';
  readonly filters = [
    { label: 'All', value: 'ALL' as const },
    { label: 'Bookable', value: 'ACTIVE' as const },
    { label: 'Hidden', value: 'HIDDEN' as const },
  ];
  busyId: number | null = null;

  formOpen = false;
  editing: LabTest | null = null;
  form: LabTestForm = this.emptyForm();
  saving = false;

  get activeCount(): number {
    return this.tests.filter((t) => t.isActive).length;
  }

  get filteredTests(): LabTest[] {
    const term = this.search.trim().toLowerCase();
    return this.tests.filter((t) => {
      if (this.filter === 'ACTIVE' && !t.isActive) return false;
      if (this.filter === 'HIDDEN' && t.isActive) return false;
      return !term || t.testName.toLowerCase().includes(term) || (t.description || '').toLowerCase().includes(term);
    });
  }

  get nameTaken(): boolean {
    const name = this.form.testName.trim().toLowerCase();
    return !!name && this.tests.some((t) => t.id !== this.editing?.id && t.testName.trim().toLowerCase() === name);
  }

  get formValid(): boolean {
    return !!this.form.testName.trim() && this.form.price !== null && this.form.price >= 0 && !this.nameTaken;
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.labTests.getAllLabTestsIncludingInactive().subscribe({
      next: (list) => {
        this.tests = [...(list || [])].sort((a, b) => a.testName.localeCompare(b.testName));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Could not load lab tests');
      },
    });
  }

  openForm(test?: LabTest) {
    this.editing = test || null;
    this.form = test
      ? { testName: test.testName, price: test.price, description: test.description || '', isActive: test.isActive }
      : this.emptyForm();
    this.formOpen = true;
  }

  closeForm() {
    this.formOpen = false;
    this.editing = null;
  }

  save() {
    if (!this.formValid || this.form.price === null) return;
    const request = {
      testName: this.form.testName.trim(),
      price: Number(this.form.price),
      description: this.form.description.trim(),
      isActive: this.form.isActive,
    };
    this.saving = true;
    const call = this.editing ? this.labTests.updateLabTest(this.editing.id, request) : this.labTests.createLabTest(request);
    call.subscribe({
      next: () => {
        this.saving = false;
        this.toast.showSuccess(this.editing ? 'Lab test updated' : 'Lab test added');
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast.showError(err?.error?.error || err?.error?.message || 'Could not save the lab test');
      },
    });
  }

  async hide(t: LabTest) {
    const ok = await this.confirm.ask({
      title: 'Hide lab test',
      message: `Hide "${t.testName}"? Patients can no longer book it. Existing bookings keep it.`,
      confirmLabel: 'Hide',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    this.busyId = t.id;
    this.labTests.deleteLabTest(t.id).subscribe({
      next: () => {
        this.busyId = null;
        t.isActive = false;
        this.toast.showSuccess(`"${t.testName}" is hidden`);
      },
      error: (err) => {
        this.busyId = null;
        this.toast.showError(err?.error?.error || 'Could not hide the lab test');
      },
    });
  }

  show(t: LabTest) {
    this.busyId = t.id;
    this.labTests.updateLabTest(t.id, { testName: t.testName, price: t.price, description: t.description || '', isActive: true }).subscribe({
      next: () => {
        this.busyId = null;
        t.isActive = true;
        this.toast.showSuccess(`"${t.testName}" can be booked again`);
      },
      error: (err) => {
        this.busyId = null;
        this.toast.showError(err?.error?.error || 'Could not show the lab test');
      },
    });
  }

  private emptyForm(): LabTestForm {
    return { testName: '', price: null, description: '', isActive: true };
  }

  trackTest = (_: number, t: LabTest) => t.id;
}
