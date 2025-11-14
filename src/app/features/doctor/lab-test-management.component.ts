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
  template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto px-4">
        <div class="mb-8 text-center">
          <h1 class="text-4xl font-bold text-gray-100 mb-2 flex items-center justify-center">
            <i class="fas fa-flask mr-3"></i>
            Lab Test Management
          </h1>
          <p class="text-lg text-gray-400">Create and manage lab tests for all patients</p>
        </div>


        <!-- Add New Test Form -->
        <div class="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 class="text-2xl font-semibold text-gray-100 mb-6 flex items-center">
            <i class="fas fa-plus-circle mr-3 text-blue-400"></i>
            {{ editingTest() ? 'Edit Lab Test' : 'Add New Lab Test' }}
          </h2>
          
          <form [formGroup]="labTestForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Test Name -->
              <div>
                <label for="testName" class="block text-sm font-medium text-gray-300 mb-2">
                  Test Name <span class="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="testName"
                  formControlName="testName"
                  class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter test name"
                  [class.border-red-500]="labTestForm.get('testName')?.invalid && labTestForm.get('testName')?.touched">
                <div *ngIf="labTestForm.get('testName')?.invalid && labTestForm.get('testName')?.touched" class="mt-1 text-red-400 text-sm">
                  Test name is required and must be less than 100 characters
                </div>
              </div>

              <!-- Price -->
              <div>
                <label for="price" class="block text-sm font-medium text-gray-300 mb-2">
                  Price (₹) <span class="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  formControlName="price"
                  step="0.01"
                  min="0.01"
                  class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price"
                  [class.border-red-500]="labTestForm.get('price')?.invalid && labTestForm.get('price')?.touched">
                <div *ngIf="labTestForm.get('price')?.invalid && labTestForm.get('price')?.touched" class="mt-1 text-red-400 text-sm">
                  Price is required and must be greater than 0
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter test description (optional)"
                [class.border-red-500]="labTestForm.get('description')?.invalid && labTestForm.get('description')?.touched">
              </textarea>
              <div *ngIf="labTestForm.get('description')?.invalid && labTestForm.get('description')?.touched" class="mt-1 text-red-400 text-sm">
                Description must be less than 500 characters
              </div>
            </div>

            <!-- Active Status -->
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  formControlName="isActive"
                  class="sr-only">
                <div class="relative">
                  <div class="w-6 h-6 border-2 border-gray-600 rounded mr-3 transition-all duration-200"
                       [class.bg-blue-500]="labTestForm.get('isActive')?.value"
                       [class.border-blue-500]="labTestForm.get('isActive')?.value">
                    <i class="fas fa-check text-white text-sm absolute top-0.5 left-0.5" 
                       [class.opacity-100]="labTestForm.get('isActive')?.value"
                       [class.opacity-0]="!labTestForm.get('isActive')?.value"></i>
                  </div>
                </div>
                <span class="font-medium text-gray-300">
                  Active (visible to patients)
                </span>
              </label>
            </div>

            <!-- Form Actions -->
            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                [disabled]="labTestForm.invalid || isSubmitting()"
                class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-spinner fa-spin mr-2" *ngIf="isSubmitting()"></i>
                <i class="fas fa-save mr-2" *ngIf="!isSubmitting()"></i>
                {{ isSubmitting() ? 'Saving...' : (editingTest() ? 'Update Test' : 'Create Test') }}
              </button>
              
              <button
                type="button"
                (click)="cancelEdit()"
                *ngIf="editingTest()"
                class="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200">
                <i class="fas fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Existing Tests List -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 class="text-2xl font-semibold text-gray-100 mb-6 flex items-center">
            <i class="fas fa-list mr-3 text-green-400"></i>
            All Lab Tests ({{ labTests().length }})
          </h2>

          <!-- Loading State -->
          <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="text-blue-500 mb-4">
              <i class="fas fa-spinner fa-spin text-3xl"></i>
            </div>
            <p class="text-lg text-gray-400">Loading lab tests...</p>
          </div>

          <!-- Tests Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!isLoading() && labTests().length > 0">
            <div 
              *ngFor="let test of labTests(); trackBy: trackByTestId" 
              class="bg-gray-700 border border-gray-600 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-lg">
              
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-100 mb-2 leading-tight">{{ test.testName }}</h3>
                  <p class="text-sm text-gray-400 leading-relaxed" *ngIf="test.description">
                    {{ test.description }}
                  </p>
                </div>
                
                <div class="flex items-center gap-2 ml-4">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                        [class.bg-green-100]="test.isActive"
                        [class.text-green-800]="test.isActive"
                        [class.bg-red-100]="!test.isActive"
                        [class.text-red-800]="!test.isActive">
                    {{ test.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              
              <div class="flex justify-between items-center">
                <div class="text-right">
                  <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Price:</div>
                  <div class="text-2xl font-bold text-green-400">₹{{ test.price }}</div>
                </div>
                
                <div class="flex gap-2">
                  <button
                    (click)="editTest(test)"
                    class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    (click)="toggleTestStatus(test)"
                    class="p-2 rounded-lg transition-colors duration-200"
                    [class.bg-red-600]="test.isActive"
                    [class.hover:bg-red-700]="test.isActive"
                    [class.bg-green-600]="!test.isActive"
                    [class.hover:bg-green-700]="!test.isActive"
                    [class.text-white]="true">
                    <i class="fas" [class.fa-eye-slash]="test.isActive" [class.fa-eye]="!test.isActive"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && labTests().length === 0" class="text-center py-16 text-gray-400">
            <i class="fas fa-flask text-5xl mb-6 opacity-50"></i>
            <h3 class="text-2xl font-semibold mb-2 text-gray-300">No Lab Tests Found</h3>
            <p class="text-lg mb-8">Create your first lab test using the form above.</p>
          </div>
        </div>
      </div>
    </app-doctor-layout>
  `
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