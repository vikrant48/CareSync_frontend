import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { LabTestService, LabTest } from '../../core/services/lab-test.service';
import { ToastService } from '../../core/services/toast.service';

interface CreateLabTestRequest {
  testName: string;
  price: number;
  description?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-lab-test-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DoctorLayoutComponent],
  templateUrl: './lab-test-management.component.html',
  styles: [`
    :host { display: block; }
    .pattern-dots {
      background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }
    :host-context(.dark) .pattern-dots {
      background-image: radial-gradient(#374151 1.5px, transparent 1.5px);
    }
  `]
})
export class LabTestManagementComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Signals for reactive state management
  labTests = signal<LabTest[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingTest = signal<LabTest | null>(null);
  showAddForm = false;
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

  onSubmit() {
    if (this.labTestForm.valid) {
      this.isSubmitting.set(true);
      const formData: CreateLabTestRequest = this.labTestForm.value;

      const request$ = this.editingTest()
        ? this.labTestService.updateLabTest(this.editingTest()!.id, formData)
        : this.labTestService.createLabTest(formData);

      request$.subscribe({
        next: (response) => {
          const message = this.editingTest()
            ? 'Lab test updated successfully!'
            : 'Lab test created successfully!';
          this.toast.showSuccess(message);
          this.labTestForm.reset({ isActive: true });
          this.editingTest.set(null);
          this.loadAllLabTests();
          this.isSubmitting.set(false);
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

  editTest(test: LabTest) {
    this.editingTest.set(test);
    this.labTestForm.patchValue({
      testName: test.testName,
      price: test.price,
      description: test.description || '',
      isActive: test.isActive
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingTest.set(null);
    this.labTestForm.reset({ isActive: true });
  }

  toggleTestStatus(test: LabTest) {
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

  clearMessages() {
    this.toast.clearAll();
  }

  trackByTestId(index: number, test: LabTest): number {
    return test.id;
  }
}