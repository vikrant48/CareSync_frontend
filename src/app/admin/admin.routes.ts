import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'Admin Dashboard - CareSync'
  }
  // TODO: Uncomment and implement these components as they are created
  /*
  {
    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'User Management - CareSync'
      },
      {
        path: 'create',
        loadComponent: () => import('./users/create-user/create-user.component').then(m => m.CreateUserComponent),
        title: 'Create User - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./users/user-details/user-details.component').then(m => m.UserDetailsComponent),
        title: 'User Details - CareSync'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./users/edit-user/edit-user.component').then(m => m.EditUserComponent),
        title: 'Edit User - CareSync'
      }
    ]
  },
  {
    path: 'doctors',
    children: [
      {
        path: '',
        loadComponent: () => import('./doctors/admin-doctors.component').then(m => m.AdminDoctorsComponent),
        title: 'Doctor Management - CareSync'
      },
      {
        path: 'create',
        loadComponent: () => import('./doctors/create-doctor/create-doctor.component').then(m => m.CreateDoctorComponent),
        title: 'Create Doctor - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./doctors/doctor-details/doctor-details.component').then(m => m.DoctorDetailsComponent),
        title: 'Doctor Details - CareSync'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./doctors/edit-doctor/edit-doctor.component').then(m => m.EditDoctorComponent),
        title: 'Edit Doctor - CareSync'
      }
    ]
  },
  {
    path: 'patients',
    children: [
      {
        path: '',
        loadComponent: () => import('./patients/admin-patients.component').then(m => m.AdminPatientsComponent),
        title: 'Patient Management - CareSync'
      },
      {
        path: 'create',
        loadComponent: () => import('./patients/create-patient/create-patient.component').then(m => m.CreatePatientComponent),
        title: 'Create Patient - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./patients/patient-details/patient-details.component').then(m => m.PatientDetailsComponent),
        title: 'Patient Details - CareSync'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./patients/edit-patient/edit-patient.component').then(m => m.EditPatientComponent),
        title: 'Edit Patient - CareSync'
      }
    ]
  },
  {
    path: 'appointments',
    children: [
      {
        path: '',
        loadComponent: () => import('./appointments/admin-appointments.component').then(m => m.AdminAppointmentsComponent),
        title: 'Appointment Management - CareSync'
      },
      {
        path: 'create',
        loadComponent: () => import('./appointments/create-appointment/create-appointment.component').then(m => m.CreateAppointmentComponent),
        title: 'Create Appointment - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./appointments/appointment-details/appointment-details.component').then(m => m.AppointmentDetailsComponent),
        title: 'Appointment Details - CareSync'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./appointments/edit-appointment/edit-appointment.component').then(m => m.EditAppointmentComponent),
        title: 'Edit Appointment - CareSync'
      }
    ]
  },
  {
    path: 'analytics',
    children: [
      {
        path: '',
        loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent),
        title: 'Analytics - CareSync'
      },
      {
        path: 'system',
        loadComponent: () => import('./analytics/system-analytics/system-analytics.component').then(m => m.SystemAnalyticsComponent),
        title: 'System Analytics - CareSync'
      },
      {
        path: 'user',
        loadComponent: () => import('./analytics/user-analytics/user-analytics.component').then(m => m.UserAnalyticsComponent),
        title: 'User Analytics - CareSync'
      },
      {
        path: 'financial',
        loadComponent: () => import('./analytics/financial-analytics/financial-analytics.component').then(m => m.FinancialAnalyticsComponent),
        title: 'Financial Analytics - CareSync'
      }
    ]
  },
  {
    path: 'reports',
    children: [
      {
        path: '',
        loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent),
        title: 'Reports - CareSync'
      },
      {
        path: 'generate',
        loadComponent: () => import('./reports/generate-report/generate-report.component').then(m => m.GenerateReportComponent),
        title: 'Generate Report - CareSync'
      },
      {
        path: 'templates',
        loadComponent: () => import('./reports/report-templates/report-templates.component').then(m => m.ReportTemplatesComponent),
        title: 'Report Templates - CareSync'
      }
    ]
  },
  {
    path: 'settings',
    children: [
      {
        path: '',
        loadComponent: () => import('./settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        title: 'System Settings - CareSync'
      },
      {
        path: 'general',
        loadComponent: () => import('./settings/general-settings/general-settings.component').then(m => m.GeneralSettingsComponent),
        title: 'General Settings - CareSync'
      },
      {
        path: 'security',
        loadComponent: () => import('./settings/security-settings/security-settings.component').then(m => m.SecuritySettingsComponent),
        title: 'Security Settings - CareSync'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./settings/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
        title: 'Notification Settings - CareSync'
      }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent),
    title: 'System Notifications - CareSync'
  },
  {
    path: 'files',
    children: [
      {
        path: '',
        loadComponent: () => import('./files/admin-files.component').then(m => m.AdminFilesComponent),
        title: 'File Management - CareSync'
      },
      {
        path: 'upload',
        loadComponent: () => import('./files/upload-files/upload-files.component').then(m => m.UploadFilesComponent),
        title: 'Upload Files - CareSync'
      },
      {
        path: 'categories',
        loadComponent: () => import('./files/file-categories/file-categories.component').then(m => m.FileCategoriesComponent),
        title: 'File Categories - CareSync'
      }
    ]
  }
  */
];
