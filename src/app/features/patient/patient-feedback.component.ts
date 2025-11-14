import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeedbackService, CreateFeedbackRequest } from '../../core/services/feedback.service';
import { PatientAppointmentItem } from '../../core/services/appointment.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

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
      <div *ngIf="loading" class="text-gray-400">Loading pending feedback...</div>
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
            <span>{{ a.appointmentDate }} {{ a.appointmentTime }}</span>
          </div>

          <div *ngIf="errors[a.appointmentId]" class="text-red-600 text-sm mt-2">{{ errors[a.appointmentId] }}</div>
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

  constructor(private feedbackApi: FeedbackService, private router: Router) {
    this.load();
  }

  goBack() {
    this.router.navigate(['/patient/dashboard']);
  }

  load() {
    this.loading = true;
    this.feedbackApi.getPendingForPatient().subscribe({
      next: (res) => {
        const list = res || [];
        this.items = list;
        // init form state
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
      },
      error: (err) => {
        this.errors[a.appointmentId] = (err?.error?.error as string) || 'Failed to submit feedback';
      },
    });
  }

  skip(a: PatientAppointmentItem) {
    // simply remove from view; user can revisit later
    this.items = this.items.filter((x) => x.appointmentId !== a.appointmentId);
  }
}