import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';

import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatStepperModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-2xl w-full">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <mat-icon class="text-white text-2xl">medical_services</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Join CareSync</h1>
          <p class="text-gray-600">Create your account to get started</p>
        </div>

        <!-- Registration Form -->
        <mat-card class="shadow-xl rounded-xl overflow-hidden">
          <mat-card-content class="p-8">
            <mat-stepper #stepper [linear]="true" class="w-full" [selectedIndex]="0">
              <!-- Step 1: Basic Information -->
              <mat-step [stepControl]="basicInfoForm" label="Basic Information">
                <form [formGroup]="basicInfoForm" class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>First Name</mat-label>
                      <input matInput formControlName="firstName" placeholder="Enter your first name">
                      <mat-icon matSuffix>person</mat-icon>
                      <mat-error *ngIf="basicInfoForm.get('firstName')?.hasError('required')">
                        First name is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Last Name</mat-label>
                      <input matInput formControlName="lastName" placeholder="Enter your last name">
                      <mat-icon matSuffix>person</mat-icon>
                      <mat-error *ngIf="basicInfoForm.get('lastName')?.hasError('required')">
                        Last name is required
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" placeholder="Enter your email">
                    <mat-icon matSuffix>email</mat-icon>
                    <mat-error *ngIf="basicInfoForm.get('email')?.hasError('required')">
                      Email is required
                    </mat-error>
                    <mat-error *ngIf="basicInfoForm.get('email')?.hasError('email')">
                      Please enter a valid email
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phoneNumber" placeholder="Enter your phone number">
                    <mat-icon matSuffix>phone</mat-icon>
                    <mat-error *ngIf="basicInfoForm.get('phoneNumber')?.hasError('required')">
                      Phone number is required
                    </mat-error>
                    <mat-error *ngIf="basicInfoForm.get('phoneNumber')?.hasError('pattern')">
                      Please enter a valid phone number
                    </mat-error>
                  </mat-form-field>

                  <div class="flex justify-between mt-6">
                    <button mat-button disabled class="opacity-0">
                      <mat-icon>arrow_back</mat-icon>
                      Back
                    </button>
                    <button mat-raised-button color="primary" (click)="nextStep()" [disabled]="basicInfoForm.invalid" class="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <span class="mr-2">Next</span>
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 2: Account Details -->
              <mat-step [stepControl]="accountForm" label="Account Details">
                <form [formGroup]="accountForm" class="space-y-6">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username" placeholder="Choose a username">
                    <mat-icon matSuffix>account_circle</mat-icon>
                    <mat-error *ngIf="accountForm.get('username')?.hasError('required')">
                      Username is required
                    </mat-error>
                    <mat-error *ngIf="accountForm.get('username')?.hasError('minlength')">
                      Username must be at least 3 characters
                    </mat-error>
                  </mat-form-field>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Password</mat-label>
                      <input 
                        matInput 
                        [type]="showPassword ? 'text' : 'password'" 
                        formControlName="password" 
                        placeholder="Create a password"
                      >
                      <button 
                        mat-icon-button 
                        matSuffix 
                        type="button"
                        (click)="togglePasswordVisibility()"
                      >
                        <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                      </button>
                      <mat-error *ngIf="accountForm.get('password')?.hasError('required')">
                        Password is required
                      </mat-error>
                      <mat-error *ngIf="accountForm.get('password')?.hasError('minlength')">
                        Password must be at least 8 characters
                      </mat-error>
                      <mat-error *ngIf="accountForm.get('password')?.hasError('pattern')">
                        Password must contain at least one uppercase letter, one lowercase letter, and one number
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Confirm Password</mat-label>
                      <input 
                        matInput 
                        [type]="showConfirmPassword ? 'text' : 'password'" 
                        formControlName="confirmPassword" 
                        placeholder="Confirm your password"
                      >
                      <button 
                        mat-icon-button 
                        matSuffix 
                        type="button"
                        (click)="toggleConfirmPasswordVisibility()"
                      >
                        <mat-icon>{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                      </button>
                      <mat-error *ngIf="accountForm.get('confirmPassword')?.hasError('required')">
                        Please confirm your password
                      </mat-error>
                      <mat-error *ngIf="accountForm.get('confirmPassword')?.hasError('passwordMismatch')">
                        Passwords do not match
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="flex justify-between mt-6">
                    <button mat-button (click)="previousStep()" class="px-6 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
                      <mat-icon class="mr-2">arrow_back</mat-icon>
                      <span>Back</span>
                    </button>
                    <button mat-raised-button color="primary" (click)="nextStep()" [disabled]="accountForm.invalid" class="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <span class="mr-2">Next</span>
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Role Selection -->
              <mat-step [stepControl]="roleForm" label="Role Selection">
                <form [formGroup]="roleForm" class="space-y-6">
                  <div class="text-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Choose Your Role</h3>
                    <p class="text-gray-600">Select the role that best describes you</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Patient Role -->
                    <div 
                      class="role-option p-6 border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-xl"
                      [class.border-blue-500]="roleForm.get('role')?.value === 'PATIENT'"
                      [class.bg-blue-50]="roleForm.get('role')?.value === 'PATIENT'"
                      [class.border-gray-200]="roleForm.get('role')?.value !== 'PATIENT'"
                      (click)="selectRole(UserRole.PATIENT)"
                    >
                      <div class="text-center">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-500 hover:rotate-12">
                          <mat-icon class="text-blue-600 text-3xl">person</mat-icon>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-lg">Patient</h4>
                        <p class="text-sm text-gray-600">I want to book appointments and manage my health</p>
                      </div>
                    </div>

                    <!-- Doctor Role -->
                    <div 
                      class="role-option p-6 border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-xl"
                      [class.border-green-500]="roleForm.get('role')?.value === 'DOCTOR'"
                      [class.bg-green-50]="roleForm.get('role')?.value === 'DOCTOR'"
                      [class.border-gray-200]="roleForm.get('role')?.value !== 'DOCTOR'"
                      (click)="selectRole(UserRole.DOCTOR)"
                    >
                      <div class="text-center">
                        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-500 hover:rotate-12">
                          <mat-icon class="text-green-600 text-3xl">medical_services</mat-icon>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-lg">Doctor</h4>
                        <p class="text-sm text-gray-600">I provide medical services and manage patients</p>
                      </div>
                    </div>

                    <!-- Admin Role -->
                    <div 
                      class="role-option p-6 border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-xl"
                      [class.border-purple-500]="roleForm.get('role')?.value === 'ADMIN'"
                      [class.bg-purple-50]="roleForm.get('role')?.value === 'ADMIN'"
                      [class.border-gray-200]="roleForm.get('role')?.value !== 'ADMIN'"
                      (click)="selectRole(UserRole.ADMIN)"
                    >
                      <div class="text-center">
                        <div class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-transform duration-500 hover:rotate-12">
                          <mat-icon class="text-purple-600 text-3xl">admin_panel_settings</mat-icon>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-lg">Admin</h4>
                        <p class="text-sm text-gray-600">I manage the system and user accounts</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between mt-6">
                    <button mat-button (click)="previousStep()" class="px-6 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
                      <mat-icon class="mr-2">arrow_back</mat-icon>
                      <span>Back</span>
                    </button>
                    <button mat-raised-button color="primary" (click)="nextStep()" [disabled]="roleForm.invalid" class="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <span class="mr-2">Next</span>
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 4: Additional Information -->
              <mat-step [stepControl]="additionalForm" label="Additional Information">
                <form [formGroup]="additionalForm" class="space-y-6">
                  <div *ngIf="roleForm.get('role')?.value === 'DOCTOR'" class="space-y-4">
                    <h4 class="font-medium text-gray-900">Doctor Information</h4>
                    
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Specialization</mat-label>
                      <input matInput formControlName="specialization" placeholder="e.g., Cardiology, Neurology">
                      <mat-icon matSuffix>work</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>License Number</mat-label>
                      <input matInput formControlName="licenseNumber" placeholder="Enter your medical license number">
                      <mat-icon matSuffix>verified</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Years of Experience</mat-label>
                      <input matInput type="number" formControlName="yearsOfExperience" placeholder="Number of years">
                      <mat-icon matSuffix>schedule</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Date of Birth</mat-label>
                      <input matInput type="date" formControlName="dateOfBirth">
                      <mat-icon matSuffix>cake</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Contact Information</mat-label>
                      <input matInput formControlName="contactInfo" placeholder="Alternative contact information">
                      <mat-icon matSuffix>contact_phone</mat-icon>
                    </mat-form-field>
                  </div>

                  <div *ngIf="roleForm.get('role')?.value === 'PATIENT'" class="space-y-4">
                    <h4 class="font-medium text-gray-900">Patient Information</h4>
                    
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Date of Birth</mat-label>
                      <input matInput type="date" formControlName="dateOfBirth">
                      <mat-icon matSuffix>cake</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Emergency Contact</mat-label>
                      <input matInput formControlName="emergencyContact" placeholder="Emergency contact name and number">
                      <mat-icon matSuffix>emergency</mat-icon>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Address</mat-label>
                    <textarea matInput formControlName="address" placeholder="Enter your address" rows="3"></textarea>
                    <mat-icon matSuffix>location_on</mat-icon>
                  </mat-form-field>

                  <div class="flex items-center space-x-2">
                    <mat-checkbox formControlName="termsAccepted" color="primary">
                      I agree to the 
                      <a href="#" class="text-blue-600 hover:text-blue-800">Terms of Service</a>
                      and 
                      <a href="#" class="text-blue-600 hover:text-blue-800">Privacy Policy</a>
                    </mat-checkbox>
                  </div>

                  <div class="flex justify-between mt-6">
                    <button mat-button (click)="previousStep()" class="px-6 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
                      <mat-icon class="mr-2">arrow_back</mat-icon>
                      <span>Back</span>
                    </button>
                    <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="additionalForm.invalid || isLoading" class="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <div class="flex items-center justify-center">
                        <mat-spinner *ngIf="isLoading" diameter="20" class="mr-2"></mat-spinner>
                        <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
                      </div>
                    </button>
                  </div>
                </form>
              </mat-step>
            </mat-stepper>
          </mat-card-content>
        </mat-card>

        <!-- Login Link -->
        <div class="text-center mt-8">
          <p class="text-gray-600">
            Already have an account? 
            <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    mat-card {
      border-radius: 16px;
    }
    
    .role-option:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
    
    .role-option {
      transition: all 0.3s ease;
      border-width: 2px;
    }
    
    mat-form-field {
      margin-bottom: 0;
    }
    
    .mat-mdc-form-field {
      width: 100%;
    }
    
    .mat-mdc-raised-button {
      border-radius: 8px;
    }

    ::ng-deep .mat-step-header {
      padding: 16px;
      border-radius: 8px;
      transition: background-color 0.3s ease;
    }

    ::ng-deep .mat-step-header:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    ::ng-deep .mat-step-header .mat-step-icon {
      transition: transform 0.3s ease;
    }

    ::ng-deep .mat-step-header:hover .mat-step-icon {
      transform: scale(1.1);
    }

    ::ng-deep .mat-horizontal-stepper-header-container {
      margin-bottom: 24px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  UserRole = UserRole;
  basicInfoForm!: FormGroup;
  accountForm!: FormGroup;
  roleForm!: FormGroup;
  additionalForm!: FormGroup;
  
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {}

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]]
    });

    this.accountForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.roleForm = this.fb.group({
      role: ['', Validators.required]
    });

    this.additionalForm = this.fb.group({
      specialization: [''],
      licenseNumber: [''],
      yearsOfExperience: [''],
      dateOfBirth: [''],
      contactInfo: [''],
      emergencyContact: [''],
      address: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  @ViewChild('stepper') stepper!: MatStepper;

  nextStep(): void {
    if (this.stepper) {
      this.stepper.next();
    }
  }

  previousStep(): void {
    if (this.stepper) {
      this.stepper.previous();
    }
  }

  selectRole(role: UserRole): void {
    this.roleForm.patchValue({ role });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isLoading = true;
      
      const registrationData = {
        ...this.basicInfoForm.value,
        ...this.accountForm.value,
        ...this.roleForm.value,
        ...this.additionalForm.value
      };

      this.authService.register(registrationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Registration successful! Please check your email to verify your account.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/auth/verify-email']);
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 409) {
            errorMessage = 'User already exists with this email or username.';
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private isFormValid(): boolean {
    return this.basicInfoForm.valid && 
           this.accountForm.valid && 
           this.roleForm.valid && 
           this.additionalForm.valid;
  }
}
