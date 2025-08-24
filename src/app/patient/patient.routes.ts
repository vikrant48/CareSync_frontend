import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
    title: 'Patient Dashboard - CareSync'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/patient-profile.component').then(m => m.PatientProfileComponent),
    title: 'Patient Profile - CareSync'
  },
  {
    path: 'appointments',
    children: [
      {
        path: '',
        loadComponent: () => import('./appointments/patient-appointments.component').then(m => m.PatientAppointmentsComponent),
        title: 'My Appointments - CareSync'
      },
      {
        path: 'book',
        loadComponent: () => import('./appointments/book-appointment/book-appointment.component').then(m => m.BookAppointmentComponent),
        title: 'Book Appointment - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./appointments/appointment-details/appointment-details.component').then(m => m.AppointmentDetailsComponent),
        title: 'Appointment Details - CareSync'
      },
      {
        path: ':id/reschedule',
        loadComponent: () => import('./appointments/reschedule-appointment/reschedule-appointment.component').then(m => m.RescheduleAppointmentComponent),
        title: 'Reschedule Appointment - CareSync'
      },
      {
        path: ':id/cancel',
        loadComponent: () => import('./appointments/cancel-appointment/cancel-appointment.component').then(m => m.CancelAppointmentComponent),
        title: 'Cancel Appointment - CareSync'
      }
    ]
  },
  {
    path: 'medical-history',
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-history/patient-medical-history.component').then(m => m.PatientMedicalHistoryComponent),
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
    path: 'doctors',
    children: [
      {
        path: '',
        loadComponent: () => import('./doctors/patient-doctors.component').then(m => m.PatientDoctorsComponent),
        title: 'Find Doctors - CareSync'
      },
      {
        path: ':id',
        loadComponent: () => import('./doctors/doctor-details/doctor-details.component').then(m => m.DoctorDetailsComponent),
        title: 'Doctor Details - CareSync'
      }
    ]
  },
  {
    path: 'feedback',
    children: [
      {
        path: '',
        loadComponent: () => import('./feedback/patient-feedback-list.component').then(m => m.PatientFeedbackListComponent),
        title: 'My Feedback - CareSync'
      },
      {
        path: 'submit/:appointmentId',
        loadComponent: () => import('./feedback/patient-feedback-form.component').then(m => m.PatientFeedbackFormComponent),
        title: 'Submit Feedback - CareSync'
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('../shared/settings/shared-settings.component').then(m => m.SharedSettingsComponent),
    title: 'Settings - CareSync'
  }
  // {
  //   path: 'files',
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () => import('./files/patient-files.component').then(m => m.PatientFilesComponent),
  //       title: 'My Files - CareSync'
  //     },
  //     {
  //       path: 'upload',
  //       loadComponent: () => import('./files/upload-files/upload-files.component').then(m => m.UploadFilesComponent),
  //       title: 'Upload Files - CareSync'
  //     }
  //   ]
  // }
];
