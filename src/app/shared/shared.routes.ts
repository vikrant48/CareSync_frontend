import { Routes } from '@angular/router';

export const SHARED_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/shared-dashboard.component').then(m => m.SharedDashboardComponent),
    title: 'Dashboard - CareSync'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/shared-profile.component').then(m => m.SharedProfileComponent),
    title: 'My Profile - CareSync'
  },
  {
    path: 'appointments',
    children: [
      {
        path: '',
        loadComponent: () => import('./appointments/shared-appointments.component').then(m => m.SharedAppointmentsComponent),
        title: 'Appointments - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./appointments/appointment-details/appointment-details.component').then(m => m.AppointmentDetailsComponent),
        title: 'Appointment Details - CareSync'
      }
    ]
  },
  {
    path: 'medical-history',
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-history/shared-medical-history.component').then(m => m.SharedMedicalHistoryComponent),
        title: 'Medical History - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./medical-history/medical-history-details/medical-history-details.component').then(m => m.MedicalHistoryDetailsComponent),
        title: 'Medical History Details - CareSync'
      }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/shared-notifications.component').then(m => m.SharedNotificationsComponent),
    title: 'Notifications - CareSync'
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/shared-settings.component').then(m => m.SharedSettingsComponent),
    title: 'Settings - CareSync'
  },
  {
    path: 'feedback',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/shared-feedback.component').then(m => m.SharedFeedbackComponent),
        title: 'Feedback - CareSync'
      },
      {
        path: 'submit',
        loadComponent: () => import('./feedback/submit-feedback/submit-feedback.component').then(m => m.SubmitFeedbackComponent),
        title: 'Submit Feedback - CareSync'
      }
    ]
  },
  {
    path: 'files',
    children: [
      {
        path: '',
        loadComponent: () => import('./files/shared-files.component').then(m => m.SharedFilesComponent),
        title: 'Files - CareSync'
      },
      {
        path: 'upload',
        loadComponent: () => import('./files/upload-files/upload-files.component').then(m => m.UploadFilesComponent),
        title: 'Upload Files - CareSync'
      }
    ]
  },
  {
    path: 'help',
    loadComponent: () => import('./help/shared-help.component').then(m => m.SharedHelpComponent),
    title: 'Help & Support - CareSync'
  }
];
