import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { DoctorDashboardComponent } from './features/doctor/doctor-dashboard.component';
import { PatientDashboardComponent } from './features/patient/patient-dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { DoctorProfileComponent } from './features/doctor/doctor-profile.component';
import { PatientProfileComponent } from './features/patient/patient-profile.component';
import { DoctorPublicProfileComponent } from './features/patient/doctor-public-profile.component';
import { PatientBookAppointmentComponent } from './features/patient/patient-book-appointment.component';
import { MyAppointmentsComponent } from './features/patient/my-appointments.component';
import { PatientFeedbackComponent } from './features/patient/patient-feedback.component';
import { DoctorAppointmentsComponent } from './features/doctor/doctor-appointments.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'doctor',
    component: DoctorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/appointments',
    component: DoctorAppointmentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor/profile',
    component: DoctorProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'patient',
    component: PatientDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/profile',
    component: PatientProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/book-appointment',
    component: PatientBookAppointmentComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/appointments',
    component: MyAppointmentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/feedback',
    component: PatientFeedbackComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/doctor/:username',
    component: DoctorPublicProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  { path: '**', redirectTo: 'login' }
];
