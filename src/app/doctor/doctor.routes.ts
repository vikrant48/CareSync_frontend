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
  }
  // TODO: Uncomment and implement these components as they are created
  /*
  {
    path: 'profile',
    loadComponent: () => import('./profile/doctor-profile.component').then(m => m.DoctorProfileComponent),
    title: 'Doctor Profile - CareSync'
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
    path: 'medical-history',
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-history/doctor-medical-history.component').then(m => m.DoctorMedicalHistoryComponent),
        title: 'Medical Records - CareSync'
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
    path: 'feedback',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/doctor-feedback.component').then(m => m.DoctorFeedbackComponent),
        title: 'Patient Feedback - CareSync'
      },
      {
        path: 'responses',
        loadComponent: () => import('./feedback/feedback-responses/feedback-responses.component').then(m => m.FeedbackResponsesComponent),
        title: 'Feedback Responses - CareSync'
      }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/doctor-notifications.component').then(m => m.DoctorNotificationsComponent),
    title: 'Notifications - CareSync'
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/doctor-settings.component').then(m => m.DoctorSettingsComponent),
    title: 'Settings - CareSync'
  },
  {
    path: 'files',
    children: [
      {
        path: '',
        loadComponent: () => import('./files/doctor-files.component').then(m => m.DoctorFilesComponent),
        title: 'My Files - CareSync'
      },
      {
        path: 'upload',
        loadComponent: () => import('./files/upload-files/upload-files.component').then(m => m.UploadFilesComponent),
        title: 'Upload Files - CareSync'
      },
      {
        path: 'certificates',
        loadComponent: () => import('./files/certificates/certificates.component').then(m => m.CertificatesComponent),
        title: 'Certificates - CareSync'
      }
    ]
  },
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
