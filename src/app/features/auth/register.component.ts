import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div class="panel max-w-3xl w-full mx-auto p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        <h2 class="text-2xl font-semibold">Create Account</h2>

        <!-- Progress Stepper -->
        <div class="flex items-center gap-3 select-none">
          <!-- Step 1 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 [ngClass]="currentStep >= 1 ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-gray-700 text-gray-300'">1</div>
            <div class="text-sm" [class.text-emerald-400]="currentStep === 1">Basic Details</div>
          </div>
          <div class="flex-1 h-px bg-gray-700"></div>
          <!-- Step 2 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 [ngClass]="currentStep >= 2 ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-gray-700 text-gray-300'">2</div>
            <div class="text-sm" [class.text-emerald-400]="currentStep === 2">Role Selection</div>
          </div>
          <div class="flex-1 h-px bg-gray-700"></div>
          <!-- Step 3 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 [ngClass]="currentStep >= 3 ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-gray-700 text-gray-300'">3</div>
            <div class="text-sm" [class.text-emerald-400]="currentStep === 3">Additional Details</div>
          </div>
        </div>

        <!-- Stage 1: Basic Details -->
        <section *ngIf="currentStep === 1" [formGroup]="basicForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-id-card text-gray-400"></i> <span>First Name</span></label>
              <input class="input" formControlName="firstName" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-id-card text-gray-400"></i> <span>Last Name</span></label>
              <input class="input" formControlName="lastName" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-envelope text-gray-400"></i> <span>Email</span></label>
              <input class="input" type="email" formControlName="email" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-phone text-gray-400"></i> <span>Phone</span></label>
              <input class="input" formControlName="contactInfo" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-calendar-day text-gray-400"></i> <span>Date of Birth</span></label>
              <input class="input" type="date" formControlName="dateOfBirth" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-user text-gray-400"></i> <span>Username</span></label>
              <input class="input" formControlName="username" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-lock text-gray-400"></i> <span>Password</span></label>
              <div class="relative">
                <input class="input pr-10" [type]="showPassword ? 'text' : 'password'" formControlName="password" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="togglePassword()" aria-label="Toggle password visibility">
                  <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button class="btn-primary" (click)="next()" [disabled]="!basicForm.valid">Next</button>
          </div>
        </section>

        <!-- Stage 2: Role Selection -->
        <section *ngIf="currentStep === 2" [formGroup]="roleForm" class="space-y-4">
          <label class="block mb-1 flex items-center gap-2"><i class="fa-solid fa-user-tag text-gray-400"></i> <span>Select Role</span></label>
          <div class="grid grid-cols-2 gap-4">
            <label class="panel p-4 flex items-center gap-3 cursor-pointer">
              <input type="radio" class="accent-emerald-500" formControlName="role" value="DOCTOR" />
              <i class="fa-solid fa-user-doctor"></i>
              <span>Doctor</span>
            </label>
            <label class="panel p-4 flex items-center gap-3 cursor-pointer">
              <input type="radio" class="accent-emerald-500" formControlName="role" value="PATIENT" />
              <i class="fa-solid fa-user"></i>
              <span>Patient</span>
            </label>
          </div>

          <div class="flex items-center justify-between gap-3">
            <button class="btn-secondary" (click)="prev()">Back</button>
            <button class="btn-primary" (click)="next()" [disabled]="!roleForm.valid">Next</button>
          </div>
        </section>

        <!-- Stage 3: Additional Details -->
        <section *ngIf="currentStep === 3" class="space-y-6">
          <!-- Doctor fields -->
          <div *ngIf="roleForm.value.role === 'DOCTOR'" [formGroup]="doctorForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1">Specialization</label>
              <input class="input" formControlName="specialization" />
            </div>
            <div>
              <label class="block mb-1">Experience (years)</label>
              <input class="input" type="number" formControlName="experience" />
            </div>
            <div class="md:col-span-2">
              <label class="block mb-1">Gender</label>
              <select class="input" formControlName="gender">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <!-- Patient fields -->
          <div *ngIf="roleForm.value.role === 'PATIENT'" [formGroup]="patientForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1">Gender</label>
              <select class="input" formControlName="gender">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label class="block mb-1">Blood Group</label>
              <select class="input" formControlName="bloodGroup">
                <option value="">Select</option>
                <option *ngFor="let bg of bloodGroups" [value]="bg">{{ bg }}</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <button class="btn-secondary" (click)="prev()">Back</button>
            <button class="btn-primary" (click)="complete()" [disabled]="!stage3Valid() || loading">Complete Registration</button>
          </div>
          <p *ngIf="error" class="text-red-400">{{ error }}</p>
        </section>

        <p class="text-sm text-gray-400">Already have an account? <a routerLink="/login" class="text-emerald-400">Login</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  constructor(private fb: FormBuilder) {
    // Initialize reactive forms inside constructor to avoid using 'fb' before assignment
    this.basicForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactInfo: [''],
      dateOfBirth: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.roleForm = this.fb.group({
      role: ['PATIENT', Validators.required],
    });

    this.doctorForm = this.fb.group({
      specialization: ['', Validators.required],
      experience: [null, [Validators.min(0)]],
      gender: ['', Validators.required],
    });

    this.patientForm = this.fb.group({
      gender: ['', Validators.required],
      bloodGroup: [''],
    });
  }

  // Wizard state
  currentStep = 1;
  loading = false;
  error = '';
  showPassword = false;

  // Reactive forms
  basicForm!: FormGroup;
  roleForm!: FormGroup;
  doctorForm!: FormGroup;
  patientForm!: FormGroup;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Navigation
  next() {
    if (this.currentStep === 1 && this.basicForm.valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.roleForm.valid) {
      this.currentStep = 3;
    }
  }

  prev() {
    if (this.currentStep > 1) this.currentStep -= 1;
  }

  stage3Valid(): boolean {
    if (this.roleForm.value.role === 'DOCTOR') {
      return this.doctorForm.valid;
    }
    return this.patientForm.valid;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  complete() {
    if (!this.basicForm.valid || !this.roleForm.valid || !this.stage3Valid()) return;
    this.loading = true;
    this.error = '';

    const base = this.basicForm.value;
    const role = this.roleForm.value.role!;

    const payload: any = {
      role,
      username: base.username!,
      password: base.password!,
      email: base.email!,
      firstName: base.firstName!,
      lastName: base.lastName!,
      contactInfo: base.contactInfo || undefined,
      dateOfBirth: base.dateOfBirth || undefined,
    } as RegisterRequest & any;

    if (role === 'DOCTOR') {
      const d = this.doctorForm.value;
      payload.specialization = d.specialization || undefined;
      // 'gender' and 'experience' are not part of backend RegisterRequest
      // so we do not include them here to avoid JSON parse errors
    } else {
      const p = this.patientForm.value;
      // 'gender' and 'bloodGroup' are not part of backend RegisterRequest
      // so we do not include them here to avoid JSON parse errors
    }

    this.auth.register(payload).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.auth.redirectToDashboard(resp.role);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Registration failed';
        this.loading = false;
      },
    });
  }
}