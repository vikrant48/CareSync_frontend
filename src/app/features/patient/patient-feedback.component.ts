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
  selectedAppointmentId: number | null = null;
  form: Record<number, { rating: number | null; comment?: string; anonymous?: boolean }> = {};
  errors: Record<number, string | null> = {};
  maxCommentLength = 200;

  // History section & metrics state
  givenVisible = true;
  loadingGiven = false;
  givenError: string | null = null;
  givenFeedback: PatientFeedbackItem[] = [];
  historyFilter: string = 'ALL';
  selectedFeedbackForDetails: PatientFeedbackItem | null = null;

  // Doctor mapping to resolve names when only id is present
  doctors: Doctor[] = [];
  doctorNameById: Record<number, string> = {};

  constructor(
    private feedbackApi: FeedbackService,
    private router: Router,
    private toast: ToastService,
    private auth: AuthService,
    private doctorApi: DoctorService
  ) {
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
        this.loadGiven();
      },
      error: () => {
        this.doctors = [];
        this.doctorNameById = {};
        this.load();
        this.loadGiven();
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
        if (list.length > 0 && !this.selectedAppointmentId) {
          this.selectedAppointmentId = list[0].appointmentId;
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  get activeAppointment(): PatientAppointmentItem | null {
    if (!this.items || this.items.length === 0) return null;
    if (!this.selectedAppointmentId) return this.items[0];
    return this.items.find(item => item.appointmentId === Number(this.selectedAppointmentId)) || this.items[0];
  }

  selectAppointment(appointmentId: number | string) {
    this.selectedAppointmentId = Number(appointmentId);
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

  getRatingLabel(rating: number | null): string {
    if (!rating) return 'Rate your visit';
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Rate your visit';
    }
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
        this.items = this.items.filter((x) => x.appointmentId !== a.appointmentId);
        if (this.items.length > 0) {
          this.selectedAppointmentId = this.items[0].appointmentId;
        } else {
          this.selectedAppointmentId = null;
        }
        this.toast.showSuccess('Feedback submitted successfully');
        this.loadGiven();
      },
      error: (err) => {
        const msg = (err?.error?.error as string) || 'Failed to submit feedback';
        this.errors[a.appointmentId] = msg;
        this.toast.showError(msg);
      },
    });
  }

  skip(a: PatientAppointmentItem) {
    this.items = this.items.filter((x) => x.appointmentId !== a.appointmentId);
    if (this.items.length > 0) {
      this.selectedAppointmentId = this.items[0].appointmentId;
    } else {
      this.selectedAppointmentId = null;
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
      return;
    }
    this.feedbackApi.getGivenForPatient(pid).subscribe({
      next: (res) => {
        this.givenFeedback = (res || []).map((f: any) => {
          const appointmentId = f.appointmentId || f.appointmentID || f.appointment_id || (f.appointment ? f.appointment.id : null);
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
      },
    });
  }

  // Dynamic statistics computed directly from givenFeedback
  get totalFeedbacksCount(): number {
    return this.givenFeedback.length;
  }

  get averageRatingScore(): string {
    if (this.givenFeedback.length === 0) return '0.0';
    const sum = this.givenFeedback.reduce((acc, f) => acc + (f.rating || 0), 0);
    return (sum / this.givenFeedback.length).toFixed(1);
  }

  get ratingDistribution(): Record<number, { count: number; percent: number }> {
    const total = this.givenFeedback.length;
    const dist: Record<number, { count: number; percent: number }> = {
      5: { count: 0, percent: 0 },
      4: { count: 0, percent: 0 },
      3: { count: 0, percent: 0 },
      2: { count: 0, percent: 0 },
      1: { count: 0, percent: 0 }
    };
    if (total === 0) return dist;

    this.givenFeedback.forEach((f) => {
      const r = Math.min(5, Math.max(1, Math.round(f.rating || 0)));
      if (dist[r]) dist[r].count++;
    });

    for (let i = 1; i <= 5; i++) {
      dist[i].percent = Math.round((dist[i].count / total) * 100);
    }
    return dist;
  }

  // History filtering
  get filteredGivenFeedback(): PatientFeedbackItem[] {
    const list = [...this.givenFeedback];
    if (this.historyFilter === '5_STAR') {
      return list.filter(f => f.rating === 5);
    }
    if (this.historyFilter === 'PUBLISHED') {
      return list.filter(f => !f.anonymous);
    }
    if (this.historyFilter === 'ANONYMOUS') {
      return list.filter(f => f.anonymous);
    }
    return list;
  }

  openDetailsModal(feedback: PatientFeedbackItem) {
    this.selectedFeedbackForDetails = feedback;
  }

  closeDetailsModal() {
    this.selectedFeedbackForDetails = null;
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
