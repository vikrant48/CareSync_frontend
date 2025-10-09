import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';

@Component({
  selector: 'app-doctor-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, DoctorLayoutComponent, ChangePasswordFormComponent],
  template: `
    <app-doctor-layout>
      <app-change-password-form />
    </app-doctor-layout>
  `,
})
export class DoctorChangePasswordComponent {}