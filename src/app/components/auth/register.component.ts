import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  userRoles = Object.values(UserRole);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      role: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      address: ['', [Validators.required]],
      specialization: [''],
      dateOfBirth: [''],
      emergencyContact: ['']
    }, { validators: this.passwordMatchValidator });

    // Watch for role changes to show/hide conditional fields
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.updateFormValidation(role);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  updateFormValidation(role: string) {
    const specializationControl = this.registerForm.get('specialization');
    const dateOfBirthControl = this.registerForm.get('dateOfBirth');
    const emergencyContactControl = this.registerForm.get('emergencyContact');

    if (role === 'DOCTOR') {
      specializationControl?.setValidators([Validators.required]);
      dateOfBirthControl?.clearValidators();
      emergencyContactControl?.clearValidators();
    } else if (role === 'PATIENT') {
      specializationControl?.clearValidators();
      dateOfBirthControl?.setValidators([Validators.required]);
      emergencyContactControl?.setValidators([Validators.required]);
    } else {
      specializationControl?.clearValidators();
      dateOfBirthControl?.clearValidators();
      emergencyContactControl?.clearValidators();
    }

    specializationControl?.updateValueAndValidity();
    dateOfBirthControl?.updateValueAndValidity();
    emergencyContactControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      delete formData.confirmPassword;

      this.authService.register(formData).subscribe({
        next: (response) => {
          this.loading = false;
          // Redirect based on user role
          if (response.user.role === 'DOCTOR') {
            this.router.navigate(['/doctor/dashboard']);
          } else if (response.user.role === 'PATIENT') {
            this.router.navigate(['/patient/dashboard']);
          } else if (response.user.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}
