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
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Pending Feedback</h2>
        <button class="btn-secondary" (click)="goBack()">Back to Dashboard</button>
      </div>
      <div *ngIf="loading" class="text-gray-400">Loading pending feedback...</div>
      <div *ngIf="!loading && items.length === 0" class="text-gray-400">No pending feedback.</div>

      <div class="space-y-4" *ngIf="!loading && items.length > 0">
        <div class="panel rounded-xl p-4" *ngFor="let a of items">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-sm text-gray-300">{{ a.appointmentDate }} at {{ a.appointmentTime }}</div>
              <div class="mt-1 font-semibold">{{ a.doctorName }}</div>
              <div class="text-sm text-gray-300">{{ a.doctorSpecialization || 'General' }}</div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <label class="block text-sm">Rating
              <select class="input w-full" [(ngModel)]="form[a.appointmentId].rating">
                <option [ngValue]="null">-- Select --</option>
                <option *ngFor="let r of [1,2,3,4,5]" [value]="r">{{ r }}</option>
              </select>
            </label>
            <label class="block text-sm md:col-span-2">Comments (optional)
              <textarea class="input w-full" rows="2" [(ngModel)]="form[a.appointmentId].comment" placeholder="Share your experience"></textarea>
            </label>
          </div>
          <label class="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" [(ngModel)]="form[a.appointmentId].anonymous" />
            Submit anonymously
          </label>
          <div class="mt-3 flex items-center gap-2">
            <button class="btn-primary" [disabled]="!form[a.appointmentId].rating" (click)="submit(a)">Submit</button>
            <button class="btn-secondary" (click)="skip(a)">Skip</button>
          </div>
          <div *ngIf="errors[a.appointmentId]" class="text-red-600 text-sm mt-2">{{ errors[a.appointmentId] }}</div>
        </div>
      </div>
    </div>
    </app-patient-layout>
  `,
})
export class PatientFeedbackComponent {
  loading = false;
  items: PatientAppointmentItem[] = [];
  form: Record<number, { rating: number | null; comment?: string; anonymous?: boolean }> = {};
  errors: Record<number, string | null> = {};

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