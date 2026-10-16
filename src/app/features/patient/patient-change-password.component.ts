import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageContainerComponent } from '../../shared/ui/page-container.component';

@Component({
  selector: 'app-patient-change-password',
  standalone: true,
  imports: [PageContainerComponent, CommonModule, RouterModule, ChangePasswordFormComponent, PageHeaderComponent],
  templateUrl: './patient-change-password.component.html',
  styleUrl: './patient-change-password.component.css'
})
export class PatientChangePasswordComponent { }