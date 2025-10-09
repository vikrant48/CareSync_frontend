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
      <app-change-password-form />
    </app-patient-layout>
  `,
})
export class PatientChangePasswordComponent {}