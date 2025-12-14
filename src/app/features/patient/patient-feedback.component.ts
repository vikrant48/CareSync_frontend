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
      <div class="min-h-screen bg-[#0B1120] text-gray-100 p-4 md:p-8">
        <div class="max-w-7xl mx-auto space-y-10">
          
          <!-- Header Section -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Feedback Center
              </h1>
              <p class="text-gray-400 mt-2 text-sm md:text-base">
                Your insights help us improve care for everyone.
              </p>
            </div>
            <button 
              (click)="goBack()" 
              class="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all duration-300 border border-gray-700 font-medium text-sm flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto">
              <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
            </button>
          </div>

          <!-- Pending Feedback Section -->
          <section>
            <h2 class="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
              <i class="fa-regular fa-clock"></i> Pending Reviews
            </h2>

            <!-- Loading State -->
            <div *ngIf="loading" class="flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800/50">
              <i class="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4 h-10 w-10 flex items-center justify-center"></i>
              <p class="text-gray-400 animate-pulse">Loading appointments...</p>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && items.length === 0" class="text-center py-16 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
              <div class="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid fa-check text-2xl text-green-500"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-300">All caught up!</h3>
              <p class="text-gray-500 mt-1 max-w-sm mx-auto">You have no pending feedback requests at the moment.</p>
            </div>

            <!-- Cards Grid -->
            <div *ngIf="!loading && items.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div 
                *ngFor="let a of items" 
                class="group bg-gray-900/60 backdrop-blur-xl border border-gray-800 hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col relative overflow-hidden"
              >
                <!-- Decorative gradient blob -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>

                <!-- Doctor Header -->
                <div class="flex items-start justify-between mb-4 relative z-10">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg">
                      {{ (a.doctorName?.charAt(0) || 'D') | uppercase }}
                    </div>
                    <div>
                      <h3 class="font-bold text-lg text-gray-100 leading-tight">{{ a.doctorName }}</h3>
                      <p class="text-xs text-blue-400 font-medium uppercase tracking-wide mt-0.5">
                        {{ a.doctorSpecialization || 'Specialist' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Appointment Info -->
                <div class="bg-gray-950/50 rounded-lg p-3 mb-6 border border-gray-800/50 flex items-center justify-between text-xs text-gray-400">
                  <span class="flex items-center gap-1.5"><i class="fa-regular fa-calendar"></i> {{ a.appointmentDate }}</span>
                  <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> {{ a.appointmentTime }}</span>
                  <span class="bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-500">#{{ a.appointmentId }}</span>
                </div>

                <!-- Rating Area -->
                <div class="flex-1 flex flex-col items-center justify-center space-y-3 mb-6">
                  <p class="text-sm text-gray-400 font-medium">How was your visit?</p>
                  <div class="flex items-center gap-1.5">
                    <button
                      *ngFor="let r of [1,2,3,4,5]"
                      (click)="setRating(a.appointmentId, r)"
                      class="text-3xl transition-all duration-200 focus:outline-none hover:scale-110 p-1"
                      [class.text-yellow-400]="isStarActive(a.appointmentId, r)"
                      [class.text-gray-700]="!isStarActive(a.appointmentId, r)"
                      [class.hover:text-yellow-300]="!isStarActive(a.appointmentId, r)"
                    >
                      ★
                    </button>
                  </div>
                </div>

                <!-- Comment Input -->
                <div class="mb-4 relative group/input">
                  <textarea
                    [(ngModel)]="form[a.appointmentId].comment"
                    [attr.maxLength]="maxCommentLength"
                    rows="3"
                    class="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none outline-none"
                    placeholder="Share your experience (optional)..."
                  ></textarea>
                  <div class="absolute bottom-2 right-2 text-[10px] text-gray-600 bg-gray-950/80 px-1 rounded">
                    {{ (form[a.appointmentId].comment?.length || 0) }}/{{ maxCommentLength }}
                  </div>
                </div>

                <!-- Error Message -->
                <div *ngIf="errors[a.appointmentId]" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  {{ errors[a.appointmentId] }}
                </div>

                <!-- Action Footer -->
                <div class="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between">
                  <label class="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 cursor-pointer select-none">
                    <div class="relative flex items-center">
                      <input type="checkbox" [(ngModel)]="form[a.appointmentId].anonymous" class="peer h-4 w-4 opacity-0 absolute" />
                      <div class="w-4 h-4 bg-gray-800 border border-gray-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-all">
                        <i class="fa-solid fa-check text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                      </div>
                    </div>
                    Publish Anonymously
                  </label>

                  <div class="flex items-center gap-2">
                    <button 
                      (click)="skip(a)" 
                      class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider"
                    >
                      Skip
                    </button>
                    <button 
                      (click)="submit(a)" 
                      [disabled]="!form[a.appointmentId].rating"
                      class="px-5 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold text-xs shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform active:scale-95"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- History Section -->
          <section class="mt-12 pt-8 border-t border-gray-800/50">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-xl font-semibold flex items-center gap-2 text-gray-300">
                <i class="fa-solid fa-clock-rotate-left"></i> History
              </h2>
              <button 
                (click)="toggleGiven()" 
                class="px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-blue-400 hover:text-blue-300 border border-gray-700/50 hover:border-blue-500/30 transition-all text-sm font-medium"
              >
                {{ givenVisible ? 'Hide History' : 'View Past Feedback' }}
              </button>
            </div>

            <div *ngIf="givenVisible" class="animate-in fade-in slide-in-from-top-4 duration-300">
              
              <!-- Loading -->
              <div *ngIf="loadingGiven" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                <span class="text-sm">Retrieving history...</span>
              </div>

              <!-- Error -->
              <div *ngIf="!loadingGiven && givenError" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {{ givenError }}
              </div>

              <!-- Empty -->
              <div *ngIf="!loadingGiven && !givenError && givenFeedback.length === 0" class="text-center py-12 text-gray-500 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
                No feedback history found.
              </div>

              <!-- Table -->
              <div *ngIf="!loadingGiven && givenFeedback.length > 0" class="bg-gray-900/40 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                    <thead class="bg-gray-950/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th class="px-6 py-4">Date</th>
                        <th class="px-6 py-4">Doctor</th>
                        <th class="px-6 py-4">Rating</th>
                        <th class="px-6 py-4">Comment</th>
                        <th class="px-6 py-4 text-center">Anonymous</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                      <tr *ngFor="let f of givenFeedback" class="hover:bg-white/5 transition-colors group">
                        <td class="px-6 py-4 whitespace-nowrap text-gray-400">
                          {{ f.submittedAt || '-' }}
                          <div class="text-[10px] text-gray-600 mt-0.5" *ngIf="f.appointmentId">Appt #{{f.appointmentId}}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-200">
                          <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-400">
                                {{ (f.doctorName?.charAt(0) || 'D') | uppercase }}
                             </div>
                             {{ f.doctorName || 'Unknown Doctor' }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex text-yellow-500 text-xs gap-0.5">
                            <span *ngFor="let r of [1,2,3,4,5]" [class.text-gray-700]="r > (f.rating || 0)">★</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-gray-300 max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 transition-all">
                          {{ f.comment || 'No comment provided' }}
                        </td>
                        <td class="px-6 py-4 text-center">
                          <span *ngIf="f.anonymous" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400">Yes</span>
                          <span *ngIf="!f.anonymous" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/30 text-blue-400">No</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </app-patient-layout>
  `,
  styles: []
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