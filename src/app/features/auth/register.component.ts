import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';
import { SpecializationService } from '../../core/services/specialization.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SpecializationAutocompleteComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse-slow"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 translate-x-1/2"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">
        
        <!-- Header -->
        <div class="text-center mb-6">
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create your account</h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Join CareSync to manage your health journey</p>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 sm:rounded-3xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm overflow-hidden flex flex-col max-h-[80vh]">
          
          <!-- Progress Bar -->
          <div class="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between relative">
               <!-- Line behind circles -->
               <div class="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-600 -z-0"></div>
               <div class="absolute left-0 top-1/2 h-0.5 bg-emerald-500 transition-all duration-500 ease-in-out -z-0" [style.width.%]="(currentStep - 1) * 33.33"></div>

               <!-- Steps -->
               <ng-container *ngFor="let step of [1, 2, 3, 4]; let i = index">
                  <div class="relative z-10 flex flex-col items-center group cursor-default" [class.cursor-pointer]="i + 1 < currentStep" (click)="i + 1 < currentStep ? navigateToStep(i + 1) : null">
                     <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ring-4 ring-white dark:ring-gray-800"
                          [ngClass]="getStepClasses(step)">
                        <i class="fa-solid fa-check" *ngIf="step < currentStep"></i>
                        <span *ngIf="step >= currentStep">{{ step }}</span>
                     </div>
                     <span class="absolute -bottom-6 text-xs font-medium whitespace-nowrap hidden sm:block transition-colors duration-300"
                           [ngClass]="step <= currentStep ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
                        {{ getStepLabel(step) }}
                     </span>
                  </div>
               </ng-container>
            </div>
          </div>

          <!-- Form Content Area -->
          <div class="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
            
            <!-- Stage 1: Basic Details -->
            <section *ngIf="currentStep === 1" [formGroup]="basicForm" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- First Name -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name <span class="text-red-500">*</span></label>
                  <input class="input-modern" formControlName="firstName" [class.error]="isFieldInvalid('firstName', basicForm)" placeholder="John" />
                  <p *ngIf="isFieldInvalid('firstName', basicForm)" class="error-msg">First Name is required</p>
                </div>

                <!-- Last Name -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name <span class="text-red-500">*</span></label>
                  <input class="input-modern" formControlName="lastName" [class.error]="isFieldInvalid('lastName', basicForm)" placeholder="Doe" />
                  <p *ngIf="isFieldInvalid('lastName', basicForm)" class="error-msg">Last Name is required</p>
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span class="text-red-500">*</span></label>
                  <div class="relative">
                     <input class="input-modern" type="email" formControlName="email" [class.error]="isFieldInvalid('email', basicForm)" placeholder="john@example.com" />
                  </div>
                  <p *ngIf="isFieldInvalid('email', basicForm)" class="error-msg">
                    <span *ngIf="basicForm.get('email')?.errors?.['required']">Email is required</span>
                    <span *ngIf="basicForm.get('email')?.errors?.['email']">Invalid email address</span>
                  </p>
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <div class="relative">
                     <input class="input-modern" formControlName="contactInfo" (input)="onPhoneInput($event)" placeholder="+91 9876543210" />
                  </div>
                </div>

                <!-- DOB -->
                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                   <input class="input-modern" type="date" formControlName="dateOfBirth" />
                </div>

                <!-- Gender -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender <span class="text-red-500">*</span></label>
                  <select class="input-modern" formControlName="gender" [class.error]="isFieldInvalid('gender', basicForm)">
                      <option value="" disabled>Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                  </select>
                  <p *ngIf="isFieldInvalid('gender', basicForm)" class="error-msg">Gender is required</p>
                </div>
              </div>

              <div class="h-px bg-gray-100 dark:bg-gray-700 my-4"></div>

              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Credentials</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <!-- Username -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span class="text-red-500">*</span></label>
                  <div class="relative">
                     <input class="input-modern" formControlName="username" [class.error]="isFieldInvalid('username', basicForm)" placeholder="johndoe123" />
                  </div>
                  <p *ngIf="isFieldInvalid('username', basicForm)" class="error-msg">Username is required</p>
                </div>

                <!-- Password -->
                <div class="form-group">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password <span class="text-red-500">*</span></label>
                  <div class="relative">
                     <input class="input-modern pr-10" [type]="showPassword ? 'text' : 'password'" formControlName="password" [class.error]="isFieldInvalid('password', basicForm)" placeholder="••••••••" />
                     <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" (click)="togglePassword()">
                        <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                     </button>
                  </div>
                  <p *ngIf="isFieldInvalid('password', basicForm)" class="error-msg">
                     <span *ngIf="basicForm.get('password')?.errors?.['required']">Password is required</span>
                     <span *ngIf="basicForm.get('password')?.errors?.['minlength']">Min 6 characters required</span>
                  </p>
                </div>
              </div>
            </section>

            <!-- Stage 2: Email Verification -->
            <section *ngIf="currentStep === 2" [formGroup]="verificationForm" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto text-center">
               <div class="bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <i class="fa-solid fa-envelope-circle-check text-4xl text-blue-500"></i>
               </div>
               <h3 class="text-xl font-bold text-gray-900 dark:text-white">Verify Your Email</h3>
               <p class="text-gray-600 dark:text-gray-400 text-sm">We need to verify your email address to secure your account. Enter the code sent to your email.</p>
               
               <div class="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 text-left space-y-4">
                  <!-- Email Input for Verification -->
                  <div class="form-group">
                     <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                     <div class="flex gap-2">
                        <input class="input-modern flex-1" type="email" formControlName="email" [class.error]="isFieldInvalid('email', verificationForm)" (input)="resetVerificationState()" />
                        <button class="btn-secondary whitespace-nowrap px-4 py-2 text-sm" (click)="sendVerificationCode()" [disabled]="loading || isFieldInvalid('email', verificationForm)">
                          <i class="fa-regular fa-paper-plane mr-2"></i>Send Code
                        </button>
                     </div>
                     <p *ngIf="isFieldInvalid('email', verificationForm)" class="error-msg">Invalid email address</p>
                  </div>

                  <!-- OTP Input -->
                  <div class="form-group">
                     <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Verification Code</label>
                     <input class="input-modern text-center text-2xl tracking-[0.5em] py-3 font-mono" formControlName="otp" placeholder="••••••" maxlength="6" (input)="resetVerificationFlag()" />
                     <p *ngIf="isFieldInvalid('otp', verificationForm)" class="error-msg mt-2 text-center">Enter valid 6-digit code</p>
                  </div>

                  <button class="btn-primary w-full py-3 rounded-xl shadow-lg shadow-emerald-500/20" (click)="verifyEmail()" [disabled]="loading">
                     <i class="fa-solid fa-circle-check mr-2"></i> Verify & Continue
                  </button>
               </div>
            </section>

            <!-- Stage 3: Role Selection -->
            <section *ngIf="currentStep === 3" [formGroup]="roleForm" class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div class="text-center max-w-lg mx-auto">
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose your intent</h3>
                  <p class="text-gray-600 dark:text-gray-400">Are you a doctor looking to manage patients, or a patient looking for care?</p>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <!-- Doctor Option -->
                  <label class="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-xl"
                         [ngClass]="roleForm.get('role')?.value === 'DOCTOR' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                     <input type="radio" class="sr-only" formControlName="role" value="DOCTOR" />
                     <div class="absolute top-4 right-4 text-emerald-500 opacity-0 transform scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" [class.opacity-100]="roleForm.get('role')?.value === 'DOCTOR'" [class.scale-100]="roleForm.get('role')?.value === 'DOCTOR'">
                        <i class="fa-solid fa-circle-check text-2xl"></i>
                     </div>
                     <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <i class="fa-solid fa-user-doctor text-3xl"></i>
                     </div>
                     <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">I am a Doctor</h4>
                     <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Create a profile, manage appointments, and provide care.</p>
                  </label>

                  <!-- Patient Option -->
                  <label class="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-xl"
                         [ngClass]="roleForm.get('role')?.value === 'PATIENT' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                     <input type="radio" class="sr-only" formControlName="role" value="PATIENT" />
                     <div class="absolute top-4 right-4 text-emerald-500 opacity-0 transform scale-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" [class.opacity-100]="roleForm.get('role')?.value === 'PATIENT'" [class.scale-100]="roleForm.get('role')?.value === 'PATIENT'">
                        <i class="fa-solid fa-circle-check text-2xl"></i>
                     </div>
                     <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <i class="fa-solid fa-user text-3xl"></i>
                     </div>
                     <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">I am a Patient</h4>
                     <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Book appointments, view reports, and find the best doctors.</p>
                  </label>
               </div>
            </section>

            <!-- Stage 4: Additional Details -->
            <!-- Stage 4: Additional Details -->
            <section *ngIf="currentStep === 4" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {{ roleForm.value.role === 'DOCTOR' ? 'Professional Details' : 'Medical Details' }}
               </h3>

               <!-- Doctor fields -->
               <div *ngIf="roleForm.value.role === 'DOCTOR'" [formGroup]="doctorForm" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization <span class="text-red-500">*</span></label>
                   <select class="input-modern" formControlName="specialization" [class.error]="isFieldInvalid('specialization', doctorForm)">
                      <option value="" disabled>Select specialization</option>
                      <option *ngFor="let spec of specializations" [value]="spec">{{ spec }}</option>
                   </select>
                   <p *ngIf="isFieldInvalid('specialization', doctorForm)" class="error-msg">Specialization is required</p>
                 </div>
                 <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (Years)</label>
                   <input class="input-modern" type="number" formControlName="experience" [class.error]="isFieldInvalid('experience', doctorForm)" placeholder="e.g. 5" />
                   <p *ngIf="isFieldInvalid('experience', doctorForm)" class="error-msg">Enter valid experience</p>
                 </div>
               </div>

               <!-- Patient fields -->
               <div *ngIf="roleForm.value.role === 'PATIENT'" [formGroup]="patientForm" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                   <select class="input-modern" formControlName="bloodGroup">
                      <option value="" disabled>Select blood group</option>
                      <option *ngFor="let bg of bloodGroups" [value]="bg">{{ bg }}</option>
                   </select>
                 </div>
               </div>
               
               <p *ngIf="error" class="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm flex items-center">
                  <i class="fa-solid fa-circle-exclamation mr-2"></i> {{ error }}
               </p>
            </section>

          </div>

          <!-- Bottom Navigation Bar -->
          <div class="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
             <button *ngIf="currentStep > 1" (click)="prev()" class="btn-secondary px-6">
                Back
             </button>
             <div class="flex-1"></div> <!-- Spacer -->
             
             <!-- Next Buttons -->
             <button *ngIf="currentStep === 1" (click)="next()" class="btn-primary px-8">
                Next <i class="fa-solid fa-arrow-right ml-2"></i>
             </button>
             
             <!-- Step 2 Next handled inside the section for verification flow -->
             <span *ngIf="currentStep === 2" class="text-xs text-gray-400 italic">Verify email to proceed</span>

             <button *ngIf="currentStep === 3" (click)="next()" class="btn-primary px-8">
                Next <i class="fa-solid fa-arrow-right ml-2"></i>
             </button>

             <button *ngIf="currentStep === 4" (click)="complete()" [disabled]="loading" class="btn-primary px-8 bg-gradient-to-r from-emerald-500 to-teal-600">
                <span *ngIf="!loading">Complete Registration <i class="fa-solid fa-check ml-2"></i></span>
                <span *ngIf="loading"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Creating...</span>
             </button>
          </div>
        </div>

        <div class="text-center mt-6">
           <p class="text-sm text-gray-600 dark:text-gray-400">
              Already have an account? <a routerLink="/login" class="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors">Sign in</a>
           </p>
        </div>

      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .input-modern {
      @apply block w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-gray-400;
    }
    .input-modern.error {
      @apply border-red-500 focus:ring-red-500 focus:border-red-500;
    }
    .error-msg {
      @apply text-red-500 text-xs mt-1 ml-1;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      @apply bg-transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      @apply bg-gray-300 dark:bg-gray-600 rounded-full;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private specializationService = inject(SpecializationService);

  specializations: string[] = [];

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

  ngOnInit() {
    this.specializationService.getAllSpecializations().subscribe({
      next: (specs) => this.specializations = specs || [],
      error: (err) => console.error('Failed to load specializations', err)
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

  navigateToStep(step: number) {
    // Allow navigation to previous steps only
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  getStepClasses(step: number): string {
    if (step < this.currentStep) {
      return 'bg-emerald-500 text-white border-emerald-500';
    } else if (step === this.currentStep) {
      return 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 scale-110';
    } else {
      return 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 border-2';
    }
  }

  getStepLabel(step: number): string {
    switch (step) {
      case 1: return 'Basic Details';
      case 2: return 'Verify Email';
      case 3: return 'Choose Role';
      case 4: return 'Finish';
      default: return '';
    }
  }

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

          this.showValidationErrors = false;

          // Auto-advance to Role Selection
          const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
          if (verifiedEmail) {
            this.basicForm.patchValue({ email: verifiedEmail });
          }
          setTimeout(() => {
            this.currentStep = 3;
          }, 800);
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