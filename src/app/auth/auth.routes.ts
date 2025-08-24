import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    title: 'Login - CareSync'
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    title: 'Register - CareSync'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Forgot Password - CareSync'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Reset Password - CareSync'
  },
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent),
    title: 'Change Password - CareSync',
    canActivate: [authGuard]
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./email-verification/email-verification.component').then(m => m.EmailVerificationComponent),
    title: 'Email Verification - CareSync'
  },
];
