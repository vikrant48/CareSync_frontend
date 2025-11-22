import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SpecializationAutocompleteComponent, ToastContainerComponent],
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
            <div class="text-sm" [class.text-emerald-400]="currentStep === 2">Email Verification</div>
          </div>
          <div class="flex-1 h-px bg-gray-700"></div>
          <!-- Step 3 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 [ngClass]="currentStep >= 3 ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-gray-700 text-gray-300'">3</div>
            <div class="text-sm" [class.text-emerald-400]="currentStep === 3">Role Selection</div>
          </div>
          <div class="flex-1 h-px bg-gray-700"></div>
          <!-- Step 4 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 [ngClass]="currentStep >= 4 ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-gray-700 text-gray-300'">4</div>
            <div class="text-sm" [class.text-emerald-400]="currentStep === 4">Additional Details</div>
          </div>
        </div>

        <!-- Stage 1: Basic Details -->
        <section *ngIf="currentStep === 1" [formGroup]="basicForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-id-card text-gray-400"></i> 
                <span>First Name <span class="text-red-400">*</span></span>
              </label>
              <input class="input" 
                     formControlName="firstName" 
                     [class.border-red-500]="isFieldInvalid('firstName', basicForm)" />
              <div *ngIf="isFieldInvalid('firstName', basicForm)" class="text-red-400 text-sm mt-1">
                First Name is required
              </div>
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-id-card text-gray-400"></i> 
                <span>Last Name <span class="text-red-400">*</span></span>
              </label>
              <input class="input" 
                     formControlName="lastName" 
                     [class.border-red-500]="isFieldInvalid('lastName', basicForm)" />
              <div *ngIf="isFieldInvalid('lastName', basicForm)" class="text-red-400 text-sm mt-1">
                Last Name is required
              </div>
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-envelope text-gray-400"></i> 
                <span>Email <span class="text-red-400">*</span></span>
              </label>
              <input class="input" 
                     type="email" 
                     formControlName="email" 
                     [class.border-red-500]="isFieldInvalid('email', basicForm)" />
              <div *ngIf="isFieldInvalid('email', basicForm)" class="text-red-400 text-sm mt-1">
                <span *ngIf="basicForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="basicForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
              </div>
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-phone text-gray-400"></i> 
                <span>Phone</span>
              </label>
              <input class="input" 
                     formControlName="contactInfo" 
                     (input)="onPhoneInput($event)" 
                     placeholder="+91 " />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-calendar-day text-gray-400"></i> 
                <span>Date of Birth</span>
              </label>
              <input class="input" type="date" formControlName="dateOfBirth" />
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-venus-mars text-gray-400"></i> 
                <span>Gender <span class="text-red-400">*</span></span>
              </label>
              <select class="input" 
                      formControlName="gender" 
                      [class.border-red-500]="isFieldInvalid('gender', basicForm)">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <div *ngIf="isFieldInvalid('gender', basicForm)" class="text-red-400 text-sm mt-1">
                Gender is required
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-user text-gray-400"></i> 
                <span>Username <span class="text-red-400">*</span></span>
              </label>
              <input class="input" 
                     formControlName="username" 
                     [class.border-red-500]="isFieldInvalid('username', basicForm)" />
              <div *ngIf="isFieldInvalid('username', basicForm)" class="text-red-400 text-sm mt-1">
                Username is required
              </div>
            </div>
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-lock text-gray-400"></i> 
                <span>Password <span class="text-red-400">*</span></span>
              </label>
              <div class="relative">
                <input class="input pr-10" 
                       [type]="showPassword ? 'text' : 'password'" 
                       formControlName="password" 
                       [class.border-red-500]="isFieldInvalid('password', basicForm)" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200" (click)="togglePassword()" aria-label="Toggle password visibility">
                  <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
              <div *ngIf="isFieldInvalid('password', basicForm)" class="text-red-400 text-sm mt-1">
                <span *ngIf="basicForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="basicForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters long</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button class="btn-primary" (click)="next()">Next</button>
          </div>
        </section>

        <!-- Stage 2: Email Verification -->
        <section *ngIf="currentStep === 2" [formGroup]="verificationForm" class="space-y-4">
          <div class="space-y-4">
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-envelope text-gray-400"></i>
                <span>Email to verify <span class="text-red-400">*</span></span>
              </label>
              <input class="input" type="email" formControlName="email" placeholder="you@example.com" [class.border-red-500]="isFieldInvalid('email', verificationForm)" (input)="resetVerificationState()" />
              <div *ngIf="isFieldInvalid('email', verificationForm)" class="text-red-400 text-sm mt-1">
                <span *ngIf="verificationForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="verificationForm.get('email')?.errors?.['email']">Enter a valid email address</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-secondary" (click)="sendVerificationCode()" [disabled]="loading || isFieldInvalid('email', verificationForm)">Send Code</button>
              <span class="text-xs text-gray-400">Change the email if needed, then send a new code.</span>
            </div>
          </div>
          <div>
            <label class="block mb-1 flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-gray-400"></i>
              <span>Enter OTP <span class="text-red-400">*</span></span>
            </label>
            <input class="input" formControlName="otp" placeholder="6-digit code" (input)="resetVerificationFlag()" />
            <div *ngIf="isFieldInvalid('otp', verificationForm)" class="text-red-400 text-sm mt-1">
              Please enter a valid 6-digit OTP
            </div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <button class="btn-secondary" (click)="prev()">Back</button>
            <div class="flex items-center gap-2">
              <button class="btn-primary" (click)="verifyEmail()" [disabled]="loading">Verify Email</button>
              <button class="btn-primary" (click)="next()" [disabled]="!isEmailVerified || loading">Next</button>
            </div>
          </div>
        </section>

        <!-- Stage 3: Role Selection -->
        <section *ngIf="currentStep === 3" [formGroup]="roleForm" class="space-y-4">
          <label class="block mb-1 flex items-center gap-2">
            <i class="fa-solid fa-user-tag text-gray-400"></i> 
            <span>Select Role <span class="text-red-400">*</span></span>
          </label>
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
          <div *ngIf="isFieldInvalid('role', roleForm)" class="text-red-400 text-sm mt-1">
            Please select a role
          </div>

          <div class="flex items-center justify-between gap-3">
            <button class="btn-secondary" (click)="prev()">Back</button>
            <button class="btn-primary" (click)="next()">Next</button>
          </div>
        </section>

        <!-- Stage 4: Additional Details -->
        <section *ngIf="currentStep === 4" class="space-y-6">
          <!-- Doctor fields -->
          <div *ngIf="roleForm.value.role === 'DOCTOR'" [formGroup]="doctorForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 flex items-center gap-2">
                <i class="fa-solid fa-stethoscope text-gray-400"></i>
                <span>Specialization <span class="text-red-400">*</span></span>
              </label>
              <app-specialization-autocomplete
                formControlName="specialization"
                placeholder="Enter or select specialization"
                inputClass="input"
                [class.border-red-500]="isFieldInvalid('specialization', doctorForm)"
                [allowAddNew]="true"
                [required]="true">
              </app-specialization-autocomplete>
              <div *ngIf="isFieldInvalid('specialization', doctorForm)" class="text-red-400 text-sm mt-1">
                Specialization is required
              </div>
            </div>
            <div>
              <label class="block mb-1">Experience (years)</label>
              <input class="input" 
                     type="number" 
                     formControlName="experience" 
                     [class.border-red-500]="isFieldInvalid('experience', doctorForm)" />
              <div *ngIf="isFieldInvalid('experience', doctorForm)" class="text-red-400 text-sm mt-1">
                Please enter a valid experience value
              </div>
            </div>
          </div>

          <!-- Patient fields -->
          <div *ngIf="roleForm.value.role === 'PATIENT'" [formGroup]="patientForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <button class="btn-primary" (click)="complete()" [disabled]="loading">Complete Registration</button>
          </div>
          <p *ngIf="error" class="text-red-400">{{ error }}</p>
        </section>

        <p class="text-sm text-gray-400">Already have an account? <a routerLink="/login" class="text-emerald-400">Login</a></p>
        <app-toast-container></app-toast-container>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  constructor(private fb: FormBuilder) {
    // Initialize reactive forms inside constructor to avoid using 'fb' before assignment
    this.basicForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactInfo: ['+91 '],
      dateOfBirth: [''],
      gender: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.verificationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.roleForm = this.fb.group({
      role: ['PATIENT', Validators.required],
    });

    this.doctorForm = this.fb.group({
      specialization: ['', Validators.required],
      experience: [null, [Validators.min(0)]],
    });

    this.patientForm = this.fb.group({
      bloodGroup: [''],
    });
  }

  // Wizard state
  currentStep = 1;
  loading = false;
  error = '';
  showPassword = false;
  isEmailVerified = false;
  verificationMessage = '';
  verificationError = '';

  // Reactive forms
  basicForm!: FormGroup;
  verificationForm!: FormGroup;
  roleForm!: FormGroup;
  doctorForm!: FormGroup;
  patientForm!: FormGroup;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Helper method to check if a field is invalid and should show error
  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.showValidationErrors));
  }

  // Flag to show validation errors when user tries to navigate
  showValidationErrors = false;

  // Navigation
  next() {
    if (this.currentStep === 1) {
      if (this.basicForm.valid) {
        this.currentStep = 2;
        this.showValidationErrors = false;
        // Keep verification email in sync with basic form
        this.verificationForm.patchValue({ email: this.basicForm.value.email || '' });
        // Initiate email verification and send OTP
        this.sendVerificationCode();
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.basicForm);
      }
    } else if (this.currentStep === 2) {
      // Only proceed if email verified
      if (this.isEmailVerified) {
        // Sync the possibly edited email back to basic form
        const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
        if (verifiedEmail) {
          this.basicForm.patchValue({ email: verifiedEmail });
        }
        this.currentStep = 3;
        this.showValidationErrors = false;
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.verificationForm);
        this.toast.showError('Please verify your email before continuing.');
      }
    } else if (this.currentStep === 3) {
      if (this.roleForm.valid) {
        this.currentStep = 4;
        this.showValidationErrors = false;
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.roleForm);
      }
    }
  }

  prev() {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
      this.showValidationErrors = false;
    }
  }

  // Helper method to mark all fields in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  stage4Valid(): boolean {
    if (this.roleForm.value.role === 'DOCTOR') {
      return this.doctorForm.valid;
    }
    return this.patientForm.valid;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onPhoneInput(event: any) {
    let value = event.target.value;
    
    // Remove all non-digit characters except +
    value = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!value.startsWith('+91')) {
      if (value.startsWith('91')) {
        value = '+' + value;
      } else if (value.startsWith('+')) {
        value = '+91' + value.substring(1);
      } else {
        value = '+91' + value;
      }
    }
    
    // Format as +91 followed by space and digits
    if (value.length > 3) {
      value = value.substring(0, 3) + ' ' + value.substring(3);
    }
    
    // Update the form control
    this.basicForm.get('contactInfo')?.setValue(value);
  }

  complete() {
    // Validate all forms before proceeding
    const currentForm = this.roleForm.value.role === 'DOCTOR' ? this.doctorForm : this.patientForm;
    
    if (!this.basicForm.valid || !this.isEmailVerified || !this.roleForm.valid || !this.stage4Valid()) {
      this.showValidationErrors = true;
      this.markFormGroupTouched(this.basicForm);
      this.markFormGroupTouched(this.verificationForm);
      this.markFormGroupTouched(this.roleForm);
      this.markFormGroupTouched(currentForm);
      return;
    }

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
      gender: base.gender || undefined,
      contactInfo: base.contactInfo && base.contactInfo.trim() !== '+91 ' ? base.contactInfo : undefined,
      dateOfBirth: base.dateOfBirth || undefined,
    } as RegisterRequest & any;

    if (role === 'DOCTOR') {
      const d = this.doctorForm.value;
      payload.specialization = d.specialization || undefined;
      // 'experience' is not part of backend RegisterRequest
      // so we do not include it here to avoid JSON parse errors
    } else {
      // 'bloodGroup' is not part of backend RegisterRequest
      // so we do not include it here to avoid JSON parse errors
    }

    this.auth.register(payload).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Registration successful. Redirecting...');
        this.auth.redirectToDashboard(resp.role);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Registration failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  sendVerificationCode() {
    const base = this.basicForm.value;
    const name = `${base.firstName ?? ''} ${base.lastName ?? ''}`.trim();
    const email = this.verificationForm.value.email || base.email;
    this.loading = true;
    this.verificationMessage = '';
    this.verificationError = '';
    this.isEmailVerified = false;
    this.auth.startEmailVerification({
      name,
      email: email!,
      mobileNumber: base.contactInfo && base.contactInfo.trim() !== '+91 ' ? base.contactInfo : undefined,
    }).subscribe({
      next: (resp) => {
        this.verificationMessage = resp?.message || 'Verification code sent.';
        this.toast.showSuccess(this.verificationMessage);
        this.loading = false;
      },
      error: (err) => {
        this.verificationError = err?.error?.error || 'Failed to send verification code';
        this.toast.showError(this.verificationError);
        this.loading = false;
      },
    });
  }

  verifyEmail() {
    if (!this.verificationForm.valid) {
      this.showValidationErrors = true;
      this.markFormGroupTouched(this.verificationForm);
      return;
    }

    const base = this.basicForm.value;
    const email = this.verificationForm.value.email || base.email!;
    const otp = this.verificationForm.value.otp!;
    this.loading = true;
    this.verificationError = '';
    this.auth.verifyEmailOtp({ email, otp }).subscribe({
      next: (resp) => {
        if (resp?.verified !== false) {
          this.isEmailVerified = true;
          this.verificationMessage = 'Email verified.';
          this.toast.showSuccess(this.verificationMessage);
          // Do not auto-advance; enable Next button instead
          this.showValidationErrors = false;
        } else {
          this.verificationError = resp?.message || 'Verification failed';
          this.toast.showError(this.verificationError);
        }
        this.loading = false;
      },
      error: (err) => {
        this.verificationError = err?.error?.error || 'Invalid or expired OTP';
        this.toast.showError(this.verificationError);
        this.loading = false;
      },
    });
  }

  // Reset verification when email changes
  resetVerificationState() {
    this.isEmailVerified = false;
    this.verificationForm.get('otp')?.setValue('');
  }

  // Reset only the verified flag when OTP changes
  resetVerificationFlag() {
    this.isEmailVerified = false;
  }
}