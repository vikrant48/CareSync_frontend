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
      <div class="max-w-7xl mx-auto p-4 sm:p-6">
        <app-change-password-form />
      </div>
    </app-doctor-layout>
  `,
})
export class DoctorChangePasswordComponent { }