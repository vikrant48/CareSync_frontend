import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { LabTestService, LabTest } from '../../core/services/lab-test.service';
import { ToastService } from '../../core/services/toast.service';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { InrPipe } from '../../shared/utils/inr.pipe';
import { ConfirmService } from '../../core/services/confirm.service';

interface CreateLabTestRequest {
  testName: string;
  price: number;
  description?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-lab-test-management',
  standalone: true,
  imports: [InrPipe, PageContainerComponent, CommonModule, FormsModule, ReactiveFormsModule, ModalShellComponent, FilterBarComponent, PageLoaderComponent],
  // All view state is in signals and the reactive form, so OnPush needs no manual markForCheck
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lab-test-management.component.html',
  styleUrl: './lab-test-management.component.css'
})
export class LabTestManagementComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  // Signals for reactive state management
  labTests = signal<LabTest[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingTest = signal<LabTest | null>(null);
  drawerOpen = signal<boolean>(false);

  // Filters
  searchTerm = signal<string>('');
  statusFilter = signal<string>('ALL');
  categoryFilter = signal<string>('ALL');
  priceRangeFilter = signal<string>('ALL');

  readonly testFilterConfigs: FilterConfig[] = [
    {
      type: 'search',
      key: 'searchTerm',
      label: 'Search',
      placeholder: 'Search test name or description...',
      defaultValue: ''
    },
    {
      type: 'select',
      key: 'statusFilter',
      label: 'Status',
      placeholder: 'All Statuses',
      defaultValue: 'ALL',
      width: 'w-full sm:w-56',
      options: [
        { label: 'All Statuses', value: 'ALL' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ]
    }
  ];

  testFilterValues: Record<string, string> = {
    searchTerm: '',
    statusFilter: 'ALL'
  };

  onFilterBarChange(values: Record<string, string>) {
    this.searchTerm.set(values['searchTerm'] || '');
    this.statusFilter.set(values['statusFilter'] || 'ALL');
  }
  sortOrder = signal<string>('RECENTLY_ADDED');
  viewMode = signal<'GRID' | 'LIST'>('GRID');

  protected readonly window = window;

  // Form
  labTestForm: FormGroup;

  constructor() {
    this.labTestForm = this.fb.group({
      testName: ['', [Validators.required, Validators.maxLength(100)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadAllLabTests();
  }

  loadAllLabTests() {
    this.isLoading.set(true);
    this.labTestService.getAllLabTestsIncludingInactive().subscribe({
      next: (tests) => {
        this.labTests.set(tests);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading lab tests:', error);
        this.toast.showError('Failed to load lab tests. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  readonly filteredLabTests = computed((): LabTest[] => {
    let list = this.labTests();

    // Search term
    const search = this.searchTerm().trim().toLowerCase();
    if (search) {
      list = list.filter(t =>
        t.testName.toLowerCase().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search))
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status === 'ACTIVE') {
      list = list.filter(t => t.isActive);
    } else if (status === 'INACTIVE') {
      list = list.filter(t => !t.isActive);
    }

    return list;
  });

  openAddDrawer() {
    this.editingTest.set(null);
    this.labTestForm.reset({ isActive: true });
    this.drawerOpen.set(true);
  }

  openEditDrawer(test: LabTest) {
    this.editingTest.set(test);
    this.labTestForm.patchValue({
      testName: test.testName,
      price: test.price,
      description: test.description || '',
      isActive: test.isActive
    });
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    if (this.isSubmitting()) return;
    this.drawerOpen.set(false);
    this.editingTest.set(null);
    this.labTestForm.reset({ isActive: true });
  }

  onSubmit() {
    if (this.labTestForm.valid) {
      this.isSubmitting.set(true);
      const formData: CreateLabTestRequest = this.labTestForm.value;

      const request$ = this.editingTest()
        ? this.labTestService.updateLabTest(this.editingTest()!.id, formData)
        : this.labTestService.createLabTest(formData);

      request$.subscribe({
        next: () => {
          const message = this.editingTest()
            ? 'Lab test updated successfully!'
            : 'Lab test created successfully.';
          this.toast.showSuccess(message);
          this.isSubmitting.set(false);
          this.closeDrawer();
          this.loadAllLabTests();
        },
        error: (error) => {
          console.error('Error saving lab test:', error);
          const errorMsg = error.error?.error || 'Failed to save lab test. Please try again.';
          this.toast.showError(errorMsg);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  async toggleTestStatus(test: LabTest) {
    if (test.isActive) {
      const ok = await this.confirm.ask({ title: 'Deactivate lab test', message: `Deactivate "${test.testName}"? Patients won't be able to book it until it is activated again.`, confirmLabel: 'Deactivate', cancelLabel: 'Keep active', danger: true });
      if (!ok) return;
    }
    const updatedTest: CreateLabTestRequest = {
      testName: test.testName,
      price: test.price,
      description: test.description || '',
      isActive: !test.isActive
    };

    this.labTestService.updateLabTest(test.id, updatedTest).subscribe({
      next: () => {
        const status = updatedTest.isActive ? 'activated' : 'deactivated';
        this.toast.showSuccess(`Lab test ${status} successfully!`);
        this.loadAllLabTests();
      },
      error: (error) => {
        console.error('Error updating test status:', error);
        this.toast.showError('Failed to update test status. Please try again.');
      }
    });
  }

  clearFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.priceRangeFilter.set('ALL');
    this.testFilterValues = {
      searchTerm: '',
      statusFilter: 'ALL'
    };
  }

  trackByTestId(index: number, test: LabTest): number {
    return test.id;
  }
}