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
  template: `
    <app-patient-layout>
    <div class="page-wrap p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Pending Feedback</h2>
        <button class="btn-secondary" (click)="goBack()">Back to Dashboard</button>
      </div>
      <section *ngIf="loading" class="mt-2">
        <div class="flex items-center justify-center min-h-[180px] text-gray-500">
          <i class="fa-solid fa-spinner fa-spin text-3xl mr-3"></i>
          <span>Loading pending feedback...</span>
        </div>
      </section>
      <div *ngIf="!loading && items.length === 0" class="text-gray-400">No pending feedback.</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!loading && items.length > 0">
        <div class="rating-card p-6 text-gray-100" *ngFor="let a of items">
          <div class="text-center">
            <h3 class="text-2xl font-bold">Rate your experience</h3>
            <p class="text-base text-gray-300">Dr. {{ a.doctorName }} • {{ a.doctorSpecialization || 'General' }}</p>
          </div>

          <div class="mt-5 flex items-center justify-center gap-1" role="radiogroup" aria-label="Star rating">
            <button
              type="button"
              class="star-btn"
              *ngFor="let r of [1,2,3,4,5]"
              [attr.aria-checked]="form[a.appointmentId].rating === r"
              (click)="setRating(a.appointmentId, r)"
              (keydown.enter)="setRating(a.appointmentId, r)"
            >
              <span class="star" [class.active]="isStarActive(a.appointmentId, r)">★</span>
            </button>
          </div>

          <div class="mt-5">
            <textarea
              class="input w-full"
              rows="3"
              [(ngModel)]="form[a.appointmentId].comment"
              [attr.maxLength]="maxCommentLength"
              placeholder="Tell us about your experience!"
            ></textarea>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <label class="flex items-center gap-2 text-xs text-gray-500">
              <input type="checkbox" [(ngModel)]="form[a.appointmentId].anonymous" />
              Submit anonymously
            </label>
            <div class="flex items-center gap-2">
              <button class="send-btn" [disabled]="!form[a.appointmentId].rating" (click)="submit(a)">Send</button>
              <button class="btn-secondary" (click)="skip(a)">Skip</button>
            </div>
          </div>

          <div class="mt-3 text-[11px] text-gray-300 text-right">
            <span>Appt #{{ a.appointmentId }} • {{ a.appointmentDate }} {{ a.appointmentTime }}</span>
          </div>

          <div *ngIf="errors[a.appointmentId]" class="text-red-600 text-sm mt-2">{{ errors[a.appointmentId] }}</div>
        </div>
      </div>

      <!-- Given Feedback Toggle and List -->
      <div class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Your Given Feedback</h2>
          <button class="btn-primary" (click)="toggleGiven()">{{ givenVisible ? 'Hide' : 'See your given feedback' }}</button>
        </div>
        <div *ngIf="givenVisible" class="mt-4">
          <section *ngIf="loadingGiven" class="mt-2">
            <div class="flex items-center justify-center min-h-[140px] text-gray-500">
              <i class="fa-solid fa-spinner fa-spin text-2xl mr-3"></i>
              <span>Loading your feedback...</span>
            </div>
          </section>
          <div *ngIf="!loadingGiven && givenError" class="text-red-500">{{ givenError }}</div>
          <div *ngIf="!loadingGiven && givenFeedback.length === 0" class="text-gray-400">No feedback submitted yet.</div>
          <div *ngIf="!loadingGiven && givenFeedback.length > 0" class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left border-b border-gray-700">
                  <th class="px-3 py-2">Appointment ID</th>
                  <th class="px-3 py-2">Date</th>
                  <th class="px-3 py-2">Doctor</th>
                  <th class="px-3 py-2">Rating</th>
                  <th class="px-3 py-2">Comment</th>
                  <th class="px-3 py-2">Anonymous</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of givenFeedback" class="border-b border-gray-800">
                  <td class="px-3 py-2">{{ f.appointmentId || '—' }}</td>
                  <td class="px-3 py-2">{{ f.submittedAt || '-' }}</td>
                  <td class="px-3 py-2">{{ f.doctorName || '—' }}</td>
                  <td class="px-3 py-2">
                    <span *ngFor="let r of [1,2,3,4,5]" class="inline-block mr-0.5" [class.text-yellow-400]="r <= (f.rating || 0)" [class.text-gray-600]="r > (f.rating || 0)">★</span>
                  </td>
                  <td class="px-3 py-2 break-words max-w-[360px]">{{ f.comment || '—' }}</td>
                  <td class="px-3 py-2">{{ f.anonymous ? 'Yes' : 'No' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </app-patient-layout>
  `,
  styles: [
    `
    .page-wrap { background: linear-gradient(180deg, #0A0F1E 0%, #0B1220 100%); min-height: 100%; }
    .rating-card { background: #111827; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
    .star-btn { cursor: pointer; background: transparent; border: none; padding: 4px; line-height: 1; }
    .star { font-size: 32px; color: #9CA3AF; }
    .star.active { color: #FBBF24; }
    .star-btn:focus { outline: 2px solid #FBBF2433; border-radius: 6px; }
    .send-btn { background: #F2C94C; color: #111827; border: none; padding: 8px 18px; border-radius: 9999px; font-weight: 600; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
    .send-btn:hover { background: #E6B73A; }
    .send-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    `,
  ],
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
    this.doctorApi.getAllForPatients().subscribe({
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