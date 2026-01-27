import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';

@Component({
  selector: 'app-patient-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, PatientLayoutComponent, ChangePasswordFormComponent],
  template: `
    <app-patient-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6">
        <app-change-password-form />
      </div>
    </app-patient-layout>
  `,
})
export class PatientChangePasswordComponent { }