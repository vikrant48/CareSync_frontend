import { Component, inject, OnInit, AfterViewInit, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CONSENT_VERSION, RegisterRequest, Role, SignUpConsent } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { SelectDropdownComponent } from '../../shared/select-dropdown.component';
import { SpecializationService } from '../../core/services/specialization.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { FeatureCarouselComponent } from './feature-carousel.component';
import { environment } from '../../../../environments/environment';
import { AppValidators, validationMessage } from '../../shared/utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SelectDropdownComponent, DatePickerComponent, FeatureCarouselComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private specializationService = inject(SpecializationService);
  private masterDataService = inject(MasterDataService);
  private platformId = inject(PLATFORM_ID);

  specializations: string[] = [];

  /** Shown when the user arrived from a shared doctor link */
  get doctorLinkHint(): boolean {
    return (this.auth.pendingReturnUrl() || '').startsWith('/patient/doctor/');
  }

  /** Open the remembered page (e.g. a shared doctor) or the dashboard */
  private continueAfterAuth(role: Role | null) {
    if (this.auth.redirectAfterAuth(role)) {
      this.toast.showInfo('That link is for patients, so you were taken to your dashboard.');
    }
  }

  constructor(private fb: FormBuilder) {
    // Initialize reactive forms inside constructor to avoid using 'fb' before assignment
    this.basicForm = this.fb.group({
      firstName: ['', [AppValidators.requiredText(), Validators.maxLength(50)]],
      lastName: ['', [AppValidators.requiredText(), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      contactInfo: ['+91 ', [AppValidators.phone(10)]],
      dateOfBirth: ['', [AppValidators.notInFuture(), AppValidators.maxAge(120)]],
      gender: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), AppValidators.noWhitespace()]],
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
      experience: [null, [Validators.min(0), Validators.max(70)]],
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

    this.masterDataService.getAllMasterData().subscribe({
      next: (data) => {
        if (data.genders?.length) this.genders = data.genders;
        if (data.bloodGroups?.length) this.bloodGroups = data.bloodGroups;
      },
      error: (err) => console.error('Failed to load master data', err)
    });
  }



  // Wizard state
  currentStep = 1;
  loading = false;
  error = '';
  showPassword = false;
  isEmailVerified = false;
  isVerificationSkipped = false;
  private verifiedEmail = '';
  verificationMessage = '';
  verificationError = '';

  // Reactive forms
  basicForm!: FormGroup;
  verificationForm!: FormGroup;
  roleForm!: FormGroup;
  doctorForm!: FormGroup;
  patientForm!: FormGroup;

  genders = ['MALE', 'FEMALE', 'OTHER'];
  bloodGroups: string[] = [];

  incrementExperience() {
    const current = this.doctorForm.get('experience')?.value || 0;
    this.doctorForm.patchValue({ experience: Math.min(70, current + 1) });
  }

  decrementExperience() {
    const current = this.doctorForm.get('experience')?.value || 0;
    if (current > 0) {
      this.doctorForm.patchValue({ experience: current - 1 });
    }
  }

  // Helper method to check if a field is invalid and should show error
  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.showValidationErrors));
  }

  fieldError(fieldName: string, form: FormGroup): string {
    if (!this.isFieldInvalid(fieldName, form)) return '';
    const field = form.get(fieldName);
    if (!field) return '';
    if (field.hasError('taken')) {
      return fieldName === 'email' ? 'Email is already registered.' : 'Username is already taken.';
    }
    if (fieldName === 'otp' && field.hasError('pattern')) return 'Enter the 6-digit code.';
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      contactInfo: 'Mobile number',
      dateOfBirth: 'Birth date',
      gender: 'Gender',
      username: 'Username',
      password: 'Password',
      otp: 'Verification code',
      specialization: 'Specialization',
      experience: 'Experience',
      role: 'Role'
    };
    return validationMessage(field, labels[fieldName] || 'This field');
  }

  // Flag to show validation errors when user tries to navigate
  showValidationErrors = false;

  // Data-processing consent: required for both sign-up paths (form and Google)
  consentAccepted = false;
  showConsentError = false;

  setConsent(checked: boolean) {
    this.consentAccepted = checked;
    if (checked) this.showConsentError = false;
  }

  private get consent(): SignUpConsent {
    return { consentAccepted: this.consentAccepted, consentVersion: CONSENT_VERSION };
  }

  /** False (and shows the error under the checkbox) when consent is missing. */
  private requireConsent(): boolean {
    if (this.consentAccepted) return true;
    this.showConsentError = true;
    this.toast.showError('Please accept the consent to create your account.');
    return false;
  }

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
      return 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700 border-2';
    }
  }

  getStepLabel(step: number): string {
    switch (step) {
      case 1: return 'Details';
      case 2: return 'Role';
      case 3: return 'Verify';
      case 4: return 'Finish';
      default: return '';
    }
  }

  // Navigation
  next() {
    if (this.currentStep === 1) {
      if (this.basicForm.valid) {
        this.loading = true;
        const { username } = this.basicForm.value;

        this.auth.checkAvailability(username).subscribe({
          next: (res) => {
            this.loading = false;
            let hasError = false;

            if (!res.usernameAvailable) {
              const username = this.basicForm.get('username');
              username?.setErrors({ taken: true });
              username?.markAsTouched();
              this.toast.showError('Username is already taken');
              hasError = true;
            }

            if (!hasError) {
              this.currentStep = 2;
              this.showValidationErrors = false;
            }
          },
          error: (err) => {
            this.loading = false;
            this.toast.showError('Failed to check availability');
            console.error(err);
          }
        });
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.basicForm);
      }
    } else if (this.currentStep === 2) {
      if (!this.roleForm.valid) {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.roleForm);
        return;
      }
      if (this.isDoctor && this.isVerificationSkipped) {
        this.isEmailVerified = false;
        this.isVerificationSkipped = false;
      }
      this.currentStep = 3;
      this.showValidationErrors = false;
      const email = this.basicForm.value.email || '';
      this.verificationForm.patchValue({ email });
      // Send a code unless this exact email is already verified
      if (!this.isEmailVerified || this.verifiedEmail !== email) {
        this.isEmailVerified = false;
        this.isVerificationSkipped = false;
        this.sendVerificationCode();
      }
    } else if (this.currentStep === 3) {
      if (this.isEmailVerified) {
        const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
        if (verifiedEmail) {
          this.basicForm.patchValue({ email: verifiedEmail });
        }
        this.currentStep = 4;
        this.showValidationErrors = false;
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.verificationForm);
        this.toast.showError('Please verify your email before continuing.');
      }
    }
  }

  prev() {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
      this.showValidationErrors = false;
      if (this.currentStep === 1) {
        // DOB picker is now handled by shared component
      }
    }
  }

  // Helper method to mark all fields in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get isDoctor(): boolean {
    return this.roleForm?.value?.role === 'DOCTOR';
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
    if (!this.requireConsent()) return;

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
      skipEmailVerification: this.isVerificationSkipped || undefined,
      ...this.consent,
    } as RegisterRequest & any;

    if (role === 'DOCTOR') {
      const d = this.doctorForm.value;
      payload.specialization = d.specialization || undefined;
      // 'experience' is not part of backend RegisterRequest
      // so we do not include it here to avoid JSON parse errors
    } else {
      payload.bloodGroup = this.patientForm.value.bloodGroup || undefined;
    }

    this.auth.register(payload).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Registration successful. Redirecting...');
        this.continueAfterAuth(resp.role);
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

          // Auto-advance to the final details
          const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
          if (verifiedEmail) {
            this.basicForm.patchValue({ email: verifiedEmail });
            this.verifiedEmail = verifiedEmail;
          }
          this.isVerificationSkipped = false;
          setTimeout(() => {
            this.currentStep = 4;
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

  skipVerification() {
    if (this.isDoctor) {
      this.toast.showError('Doctors must verify their email to register.');
      return;
    }
    this.isEmailVerified = true;
    this.isVerificationSkipped = true;
    this.toast.showInfo('Email verification skipped.');
    this.currentStep = 4;
    this.showValidationErrors = false;
  }

  googleRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

  onGoogleSignUp() {
    if (!this.requireConsent()) return;
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => this.initGoogleAuth();
      document.head.appendChild(script);
    } else {
      this.initGoogleAuth();
    }
  }

  private initGoogleAuth() {
    const google = (window as any).google;
    if (!google) {
      this.toast.showError('Unable to load Google Identity Services');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleResponse(response),
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.toast.showInfo('Select your Google account to complete registration');
      }
    });
  }

  private handleGoogleResponse(response: any) {
    if (!response || !response.credential) {
      this.toast.showError('Google authentication cancelled or failed');
      return;
    }

    this.loading = true;
    // Use selected googleRole or role from roleForm
    const targetRole = this.googleRole || this.roleForm.value.role || 'PATIENT';

    this.auth.loginWithGoogle(response.credential, targetRole, this.consent).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess(`Google Sign Up successful as ${resp.role}!`);
        setTimeout(() => {
          this.continueAfterAuth(resp.role);
        }, 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Google registration failed';
        this.toast.showError(this.error);
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