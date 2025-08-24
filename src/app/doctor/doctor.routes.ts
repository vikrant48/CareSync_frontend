import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    title: 'Doctor Dashboard - CareSync'
  },
  {
    path: 'appointments',
    children: [
      {
        path: '',
        loadComponent: () => import('./appointments/doctor-appointments.component').then(m => m.DoctorAppointmentsComponent),
        title: 'My Appointments - CareSync'
      },
      {
        path: 'upcoming',
        loadComponent: () => import('./appointments/upcoming-appointments/upcoming-appointments.component').then(m => m.UpcomingAppointmentsComponent),
        title: 'Upcoming Appointments - CareSync'
      },
      {
        path: 'past',
        loadComponent: () => import('./appointments/past-appointments/past-appointments.component').then(m => m.PastAppointmentsComponent),
        title: 'Past Appointments - CareSync'
      },
      {
        path: 'schedule',
        loadComponent: () => import('./appointments/schedule/doctor-schedule.component').then(m => m.DoctorScheduleComponent),
        title: 'My Schedule - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./appointments/appointment-details/appointment-details.component').then(m => m.AppointmentDetailsComponent),
        title: 'Appointment Details - CareSync'
      }
    ]
  },
  {
    path: 'schedule',
    loadComponent: () => import('./appointments/schedule/doctor-schedule.component').then(m => m.DoctorScheduleComponent),
    title: 'My Schedule - CareSync'
  },
  {
    path: 'patients',
    children: [
      {
        path: '',
        loadComponent: () => import('./patients/doctor-patients.component').then(m => m.DoctorPatientsComponent),
        title: 'My Patients - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./patients/patient-details/patient-details.component').then(m => m.PatientDetailsComponent),
        title: 'Patient Details - CareSync'
      },
      {
        path: ':id/medical-history',
        loadComponent: () => import('./patients/patient-medical-history/patient-medical-history.component').then(m => m.PatientMedicalHistoryComponent),
        title: 'Patient Medical History - CareSync'
      }
    ]
  },
  {
    path: 'medical-records',
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-records/doctor-medical-records.component').then(m => m.DoctorMedicalRecordsComponent),
        title: 'Medical Records - CareSync'
      },
      {
        path: 'view/:id',
        loadComponent: () => import('./medical-history/medical-history-details/medical-history-details.component').then(m => m.MedicalHistoryDetailsComponent),
        title: 'Medical Record Details - CareSync'
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./medical-history/edit-medical-history/edit-medical-history.component').then(m => m.EditMedicalHistoryComponent),
        title: 'Edit Medical Record - CareSync'
      }
    ]
  },
  {
    path: 'medical-history',
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-history/doctor-medical-history.component').then(m => m.DoctorMedicalHistoryComponent),
        title: 'Medical History - CareSync'
      },
      {
        path: 'create',
        loadComponent: () => import('./medical-history/create-medical-history/create-medical-history.component').then(m => m.CreateMedicalHistoryComponent),
        title: 'Create Medical Record - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./medical-history/medical-history-details/medical-history-details.component').then(m => m.MedicalHistoryDetailsComponent),
        title: 'Medical Record Details - CareSync'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./medical-history/edit-medical-history/edit-medical-history.component').then(m => m.EditMedicalHistoryComponent),
        title: 'Edit Medical Record - CareSync'
      }
    ]
  },
  {
    path: 'analytics',
    children: [
      {
        path: '',
        loadComponent: () => import('./analytics/doctor-analytics.component').then(m => m.DoctorAnalyticsComponent),
        title: 'Analytics - CareSync'
      },
      {
        path: 'performance',
        loadComponent: () => import('./analytics/performance/performance-analytics.component').then(m => m.PerformanceAnalyticsComponent),
        title: 'Performance Analytics - CareSync'
      },
      {
        path: 'revenue',
        loadComponent: () => import('./analytics/revenue/revenue-analytics.component').then(m => m.RevenueAnalyticsComponent),
        title: 'Revenue Analytics - CareSync'
      }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/doctor-notifications.component').then(m => m.DoctorNotificationsComponent),
    title: 'Notifications - CareSync'
  },
  {
    path: 'notifications/preferences',
    loadComponent: () => import('./notifications/notification-preferences.component').then(m => m.NotificationPreferencesComponent),
    title: 'Notification Preferences - CareSync'
  },
  {
    path: 'profile',
    children: [
      {
        path: '',
        loadComponent: () => import('./profile/doctor-profile.component').then(m => m.DoctorProfileComponent),
        title: 'My Profile - CareSync'
      },
      {
        path: ':username',
        loadComponent: () => import('./profile/doctor-profile.component').then(m => m.DoctorProfileComponent),
        title: 'Doctor Profile - CareSync'
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('../shared/settings/shared-settings.component').then(m => m.SharedSettingsComponent),
    title: 'Settings - CareSync'
  }
  // TODO: Uncomment additional routes as components are created
  /*
  {
    path: 'reports',
    children: [
      {
        path: '',
        loadComponent: () => import('./reports/doctor-reports.component').then(m => m.DoctorReportsComponent),
        title: 'Reports - CareSync'
      },
      {
        path: 'generate',
        loadComponent: () => import('./reports/generate-report/generate-report.component').then(m => m.GenerateReportComponent),
        title: 'Generate Report - CareSync'
      }
    ]
  }
  */
];
