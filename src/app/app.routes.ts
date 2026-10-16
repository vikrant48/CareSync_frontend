import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'auth/token-refresh', loadComponent: () => import('./features/auth/token-refresh.component').then((m) => m.TokenRefreshComponent) },
  { path: 'auth/session-expired', loadComponent: () => import('./features/auth/session-expired.component').then((m) => m.SessionExpiredComponent) },

  // ---- Admin ----
  {
    path: 'admin',
    pathMatch: 'full',
    loadComponent: () => import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/appointment-analytics',
    loadComponent: () => import('./features/admin/appointment-analytics-dashboard.component').then((m) => m.AppointmentAnalyticsDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },

  // ---- Full-screen pages (no layout): declared before the role trees so they match first ----
  {
    path: 'doctor/consultation/:id',
    loadComponent: () => import('./shared/video-consultation.component').then((m) => m.VideoConsultationComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'patient/consultation/:id',
    loadComponent: () => import('./shared/video-consultation.component').then((m) => m.VideoConsultationComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'patient/intake/:id',
    loadComponent: () => import('./features/patient/pre-visit-intake.component').then((m) => m.PreVisitIntakeComponent),
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { roles: ['PATIENT'] }
  },

  // ---- Doctor (routed layout) ----
  {
    path: 'doctor',
    loadComponent: () => import('./shared/doctor-layout.component').then((m) => m.DoctorLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/doctor/doctor-dashboard.component').then((m) => m.DoctorDashboardComponent) },
      { path: 'appointments', loadComponent: () => import('./features/doctor/doctor-appointments.component').then((m) => m.DoctorAppointmentsComponent) },
      { path: 'appointments/:id', loadComponent: () => import('./shared/components/appointment-details/appointment-details-page.component').then((m) => m.AppointmentDetailsPageComponent) },
      { path: 'profile', loadComponent: () => import('./features/doctor/doctor-profile.component').then((m) => m.DoctorProfileComponent), canDeactivate: [unsavedChangesGuard] },
      { path: 'change-password', loadComponent: () => import('./features/doctor/doctor-change-password.component').then((m) => m.DoctorChangePasswordComponent) },
      { path: 'reports', loadComponent: () => import('./features/doctor/doctor-reports.component').then((m) => m.DoctorReportsComponent) },
      { path: 'documents', loadComponent: () => import('./features/doctor/doctor-document.component').then((m) => m.DoctorDocumentsComponent) },
      { path: 'lab-test-management', loadComponent: () => import('./features/doctor/lab-test-management.component').then((m) => m.LabTestManagementComponent) },
      { path: 'leaves', loadComponent: () => import('./features/doctor/doctor-leave-management.component').then((m) => m.DoctorLeaveManagementComponent) },
      { path: 'schedule', loadComponent: () => import('./features/doctor/doctor-schedule.component').then((m) => m.DoctorScheduleComponent) },
    ]
  },

  // ---- Patient (routed layout) ----
  {
    path: 'patient',
    loadComponent: () => import('./shared/patient-layout.component').then((m) => m.PatientLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/patient/patient-dashboard.component').then((m) => m.PatientDashboardComponent) },
      { path: 'profile', loadComponent: () => import('./features/patient/patient-profile.component').then((m) => m.PatientProfileComponent) },
      { path: 'profile/edit', loadComponent: () => import('./shared/patient-edit-page.component').then((m) => m.PatientEditPageComponent), canDeactivate: [unsavedChangesGuard] },
      { path: 'change-password', loadComponent: () => import('./features/patient/patient-change-password.component').then((m) => m.PatientChangePasswordComponent) },
      { path: 'book-appointment', loadComponent: () => import('./features/patient/patient-book-appointment.component').then((m) => m.PatientBookAppointmentComponent) },
      { path: 'appointments', loadComponent: () => import('./features/patient/my-appointments.component').then((m) => m.MyAppointmentsComponent) },
      { path: 'appointments/:id', loadComponent: () => import('./shared/components/appointment-details/appointment-details-page.component').then((m) => m.AppointmentDetailsPageComponent) },
      { path: 'reports', loadComponent: () => import('./features/patient/patient-reports.component').then((m) => m.PatientReportsComponent) },
      { path: 'lab-bookings', loadComponent: () => import('./features/patient/patient-lab-bookings.component').then((m) => m.PatientLabBookingsComponent) },
      { path: 'feedback', loadComponent: () => import('./features/patient/patient-feedback.component').then((m) => m.PatientFeedbackComponent) },
      { path: 'doctor/:username', loadComponent: () => import('./features/patient/doctor-public-profile.component').then((m) => m.DoctorPublicProfileComponent) },
      { path: 'vitals', loadComponent: () => import('./features/patient/patient-vitals.component').then((m) => m.VitalsTrackingComponent) },
    ]
  },

  // ---- Pages shared by both roles: layout chosen by the user's role ----
  {
    path: '',
    loadComponent: () => import('./shared/role-layout.component').then((m) => m.RoleLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) },
      {
        path: 'lab-tests',
        loadComponent: () => import('./features/lab-tests/lab-tests.component').then((m) => m.LabTestsComponent),
        canActivate: [roleGuard],
        data: { roles: ['DOCTOR', 'PATIENT'] }
      },
    ]
  },

  { path: '**', loadComponent: () => import('./shared/not-found.component').then((m) => m.NotFoundComponent) }
];
