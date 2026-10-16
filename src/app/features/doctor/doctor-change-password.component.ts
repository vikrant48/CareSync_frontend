import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-doctor-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ChangePasswordFormComponent, PageHeaderComponent],
  templateUrl: './doctor-change-password.component.html',
  styleUrl: './doctor-change-password.component.css'
})
export class DoctorChangePasswordComponent { }