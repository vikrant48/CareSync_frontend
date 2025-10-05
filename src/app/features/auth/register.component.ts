import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest, Role } from '../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="panel max-w-2xl mx-auto p-6">
      <h2 class="text-xl font-semibold mb-6">Create Account</h2>
      <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-6">
        <!-- Role selection -->
        <div>
          <label class="block mb-1">Role</label>
          <select class="input" name="role" [(ngModel)]="model.role" required>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>

        <!-- Common details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block mb-1">First Name</label>
            <input class="input" name="firstName" [(ngModel)]="model.firstName" required />
          </div>
          <div>
            <label class="block mb-1">Last Name</label>
            <input class="input" name="lastName" [(ngModel)]="model.lastName" required />
          </div>
          <div>
            <label class="block mb-1">Email</label>
            <input class="input" type="email" name="email" [(ngModel)]="model.email" required />
          </div>
          <div>
            <label class="block mb-1">Phone</label>
            <input class="input" name="contactInfo" [(ngModel)]="model.contactInfo" />
          </div>
          <div>
            <label class="block mb-1">Date of Birth</label>
            <input class="input" type="date" name="dateOfBirth" [(ngModel)]="dob" />
          </div>
        </div>

        <!-- Credentials -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block mb-1">Username</label>
            <input class="input" name="username" [(ngModel)]="model.username" required />
          </div>
          <div>
            <label class="block mb-1">Password</label>
            <input class="input" type="password" name="password" [(ngModel)]="model.password" required />
          </div>
        </div>

        <!-- Doctor-specific -->
        <div *ngIf="model.role === 'DOCTOR'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block mb-1">Specialization</label>
            <input class="input" name="specialization" [(ngModel)]="model.specialization" />
          </div>
          <div>
            <label class="block mb-1">Years of Experience (UI only)</label>
            <input class="input" type="number" name="years" [(ngModel)]="yearsOfExperience" />
          </div>
        </div>

        <!-- Patient-specific -->
        <div *ngIf="model.role === 'PATIENT'">
          <label class="block mb-1">Illness Details</label>
          <textarea class="input" rows="3" name="illnessDetails" [(ngModel)]="model.illnessDetails"></textarea>
        </div>

        <button class="btn-primary w-full" [disabled]="loading">Register</button>
        <p *ngIf="error" class="text-red-400 mt-2">{{ error }}</p>
        <p class="text-sm text-gray-400">Already have an account? <a routerLink="/login" class="text-emerald-400">Login</a></p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  loading = false;
  error = '';

  dob: string | undefined;
  yearsOfExperience: number | undefined; // UI only

  model: RegisterRequest = {
    role: 'PATIENT',
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    contactInfo: '',
  };

  onSubmit() {
    this.loading = true;
    this.error = '';
    // Map UI date to ISO string if provided
    if (this.dob) {
      this.model.dateOfBirth = this.dob;
    }
    this.auth.register(this.model).subscribe({
      next: (resp) => {
        // Auto-login after registration
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