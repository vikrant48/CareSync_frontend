import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeedbackService, CreateFeedbackRequest, PatientFeedbackItem } from '../../core/services/feedback.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PatientAppointmentItem } from '../../core/services/appointment.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { DoctorService, Doctor } from '../../core/services/doctor.service';

@Component({
  selector: 'app-patient-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PatientLayoutComponent],
  templateUrl: './patient-feedback.component.html',
  styleUrl: './patient-feedback.component.css'
})
export class PatientFeedbackComponent {
  loading = false;
  items: PatientAppointmentItem[] = [];
  form: Record<number, { rating: number | null; comment?: string; anonymous?: boolean }> = {};
  errors: Record<number, string | null> = {};
  maxCommentLength = 200;

  // Given feedback state
  givenVisible = false;
  loadingGiven = false;
  givenError: string | null = null;
  givenFeedback: PatientFeedbackItem[] = [];

  // Doctor mapping to resolve names when only id is present
  doctors: Doctor[] = [];
  doctorNameById: Record<number, string> = {};

  constructor(private feedbackApi: FeedbackService, private router: Router, private toast: ToastService, private auth: AuthService, private doctorApi: DoctorService) {
    // Preload doctors so we can resolve names from ids in feedback
    this.doctorApi.getAllForPatients(0, 50).subscribe({
      next: (res) => {
        this.doctors = res || [];
        this.doctorNameById = {};
        this.doctors.forEach((d) => {
          const id = Number(d.id);
          const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
          const hasPrefix = /^dr\.?\s/i.test(base);
          const display = hasPrefix ? base : `Dr ${base}`;
          if (!Number.isNaN(id)) this.doctorNameById[id] = display || `Doctor ${id}`;
        });
        this.load();
      },
      error: () => {
        this.doctors = [];
        this.doctorNameById = {};
        this.load();
      },
    });
  }

  goBack() {
    this.router.navigate(['/patient/dashboard']);
  }

  load() {
    this.loading = true;
    this.feedbackApi.getPendingForPatient().subscribe({
      next: (res) => {
        const list = (res || []).map((a: any) => {
          // derive doctorId and appointmentId robustly
          const doctorId = a.doctorId || a.doctorID || a.doctor_id || (a.doctor ? a.doctor.id : null);
          const appointmentId = a.appointmentId || a.appointmentID || a.appointment_id || (a.appointment ? a.appointment.id : null);
          const doctorName = a.doctorName
            || [a.doctorFirstName, a.doctorLastName].filter(Boolean).join(' ').trim()
            || (a.doctor?.name || a.doctor?.username || null)
            || (doctorId ? this.doctorNameById[Number(doctorId)] : null);
          let appointmentDate = a.appointmentDate;
          let appointmentTime = a.appointmentTime;
          const dtAll = a.appointmentDateTime || a.dateTime || a.appointment?.dateTime;
          if ((!appointmentDate || !appointmentTime) && dtAll) {
            const d = new Date(dtAll);
            appointmentDate = appointmentDate || d.toISOString().slice(0, 10);
            appointmentTime = appointmentTime || d.toTimeString().slice(0, 5);
          }
          return { ...a, doctorId, appointmentId, doctorName, appointmentDate, appointmentTime } as PatientAppointmentItem;
        });
        this.items = list;
        list.forEach((a) => (this.form[a.appointmentId] = { rating: null, comment: '', anonymous: false }));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  setRating(appointmentId: number, rating: number) {
    const f = this.form[appointmentId] || { rating: null };
    f.rating = rating;
    this.form[appointmentId] = f;
  }

  isStarActive(appointmentId: number, starValue: number) {
    const rating = this.form[appointmentId]?.rating || 0;
    return starValue <= rating;
  }

  submit(a: PatientAppointmentItem) {
    const f = this.form[a.appointmentId];
    if (!f || !f.rating) return;
    const payload: CreateFeedbackRequest = {
      appointmentId: a.appointmentId,
      rating: f.rating,
      comment: f.comment || '',
      anonymous: !!f.anonymous,
    };
    this.errors[a.appointmentId] = null;
    this.feedbackApi.submitFeedback(payload).subscribe({
      next: () => {
        // remove item from list
        this.items = this.items.filter((x) => x.appointmentId !== a.appointmentId);
        // show success toast
        this.toast.showSuccess('Feedback submitted successfully');
      },
      error: (err) => {
        const msg = (err?.error?.error as string) || 'Failed to submit feedback';
        this.errors[a.appointmentId] = msg;
        this.toast.showError(msg);
      },
    });
  }

  skip(a: PatientAppointmentItem) {
    // simply remove from view; user can revisit later
    this.items = this.items.filter((x) => x.appointmentId !== a.appointmentId);
  }

  toggleGiven() {
    this.givenVisible = !this.givenVisible;
    if (this.givenVisible && this.givenFeedback.length === 0) {
      this.loadGiven();
    }
  }

  loadGiven() {
    this.loadingGiven = true;
    this.givenError = null;
    const idStr = this.auth.userId();
    const pid = idStr ? parseInt(idStr) : NaN;
    if (!pid || Number.isNaN(pid)) {
      this.loadingGiven = false;
      this.givenError = 'Unable to determine current patient. Please re-login.';
      this.toast.showError(this.givenError);
      return;
    }
    this.feedbackApi.getGivenForPatient(pid).subscribe({
      next: (res) => {
        this.givenFeedback = (res || []).map((f: any) => {
          // Robust mapping to ensure doctor name and appointment id are available
          const appointmentId = f.appointmentId
            || f.appointmentID
            || f.appointment_id
            || (f.appointment ? f.appointment.id : null);
          const doctorId = f.doctorId || f.doctorID || f.doctor_id || (f.doctor ? f.doctor.id : null);
          const doctorName = f.doctorName
            || [f.doctorFirstName, f.doctorLastName].filter(Boolean).join(' ').trim()
            || (f.doctor?.name || f.doctor?.username || null)
            || (doctorId ? this.doctorNameById[Number(doctorId)] : null);
          const submittedAt = f.submittedAt || f.createdAt || f.date || f.createdOn || null;
          return {
            ...f,
            appointmentId,
            doctorId,
            doctorName,
            submittedAt,
            rating: Number(f.rating || 0),
            anonymous: !!f.anonymous,
          } as PatientFeedbackItem;
        });
        this.loadingGiven = false;
      },
      error: () => {
        this.loadingGiven = false;
        this.givenError = 'Failed to load your feedback.';
        this.toast.showError(this.givenError);
      },
    });
  }

}