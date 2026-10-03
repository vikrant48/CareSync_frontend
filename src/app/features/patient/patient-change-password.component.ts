import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';

@Component({
  selector: 'app-patient-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, PatientLayoutComponent, ChangePasswordFormComponent],
  templateUrl: './patient-change-password.component.html',
  styleUrl: './patient-change-password.component.css'
})
export class PatientChangePasswordComponent { }