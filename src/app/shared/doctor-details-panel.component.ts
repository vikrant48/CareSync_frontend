import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor } from '../core/services/doctor.service';
import { ToastService } from '../core/services/toast.service';
import { doctorDisplayName, doctorInitial as getDoctorInitial } from './utils/doctor-name.util';

@Component({
  selector: 'doctor-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-in fade-in duration-500 space-y-6" *ngIf="doctor; else loadingTpl">
      
      <!-- Back Button Row -->
      <div class="mb-4">
        <button type="button" (click)="goBack()"
                class="btn-size-md bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs sm:text-sm font-bold px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm w-fit">
          <i class="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
          <span>Back</span>
        </button>
      </div>

      <!-- Top Doctor Summary Header Card -->
      <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <!-- Left Side: Avatar & Information -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full lg:w-auto">
          <div class="relative shrink-0">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[var(--bg)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text)] text-3xl font-bold shadow-xl">
              <img *ngIf="doctor.profileImageUrl" [src]="doctor.profileImageUrl" class="w-full h-full object-cover" (error)="doctor.profileImageUrl = ''" />
              <span *ngIf="!doctor.profileImageUrl">{{ doctorInitial() }}</span>
            </div>
            <!-- Active Status Green Dot -->
            <span *ngIf="doctor.isActive !== false"
                  class="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[var(--panel)] shadow-sm"
                  title="Active"></span>
            <span *ngIf="doctor.isActive === false"
                  class="absolute bottom-1 right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-[var(--panel)] shadow-sm"
                  title="Inactive"></span>
          </div>

          <div class="space-y-2 min-w-0">
            <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 class="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">{{ formatDoctorName() }}</h2>
              <!-- Circular Blue Verified Tick Badge -->
              <span *ngIf="doctor.isVerified" 
                    class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shrink-0 shadow-sm" 
                    title="Verified Doctor">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <span *ngIf="doctor.isActive === false"
                    class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border bg-rose-500/10 text-rose-600 border-rose-500/20">
                Inactive
              </span>
            </div>

            <div class="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold flex-wrap">
              <span class="text-[var(--primary)] font-bold">{{ displayValue(doctor.specialization) }}</span>
              <span class="text-[var(--border)]" *ngIf="hospitalName">•</span>
              <span class="text-[var(--muted)] flex items-center gap-1.5" *ngIf="hospitalName">
                <i class="fa-solid fa-building-columns text-xs text-[var(--primary)]" aria-hidden="true"></i> {{ hospitalName }}
              </span>
            </div>

            <!-- Ratings, Fee, Languages Pills -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">
                <i class="fa-solid fa-star text-amber-700 dark:text-amber-400 text-xs" aria-hidden="true"></i>
                <span>{{ (avgRating ?? doctor.averageRating || 0).toFixed(1) }}</span>
                <span class="text-[var(--muted)] text-[11px]">({{ doctor.reviewCount ?? 0 }} reviews)</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">
                <i class="fa-solid fa-money-bill-wave text-emerald-700 dark:text-emerald-400 text-xs" aria-hidden="true"></i>
                <span>₹{{ doctor.consultationFees }}</span>
                <span class="text-[var(--muted)] text-[11px]">Consultation Fee</span>
              </div>

              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">
                <i class="fa-solid fa-language text-[var(--primary)] text-xs" aria-hidden="true"></i>
                <span>{{ languagesText() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 items-stretch sm:items-center lg:items-end">
          <button *ngIf="enableBooking" type="button" (click)="openBooking.emit()" [disabled]="doctor.isActive === false"
                  class="btn-size-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs sm:text-sm px-6 rounded-xl shadow-lg shadow-[var(--primary)]/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fa-regular fa-calendar-check text-xs" aria-hidden="true"></i>
            <span>{{ doctor.isActive === false ? 'Doctor Inactive' : 'Book Appointment' }}</span>
          </button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button type="button" (click)="toggleSave()"
                    class="btn-size-md flex-1 sm:flex-initial bg-[var(--bg)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <i class="fa-regular fa-heart" [class.fa-solid]="saved" [class.text-rose-500]="saved" aria-hidden="true"></i>
              <span>{{ saved ? 'Saved' : 'Save' }}</span>
            </button>

            <button type="button" (click)="shareDoctor()"
                    class="btn-size-md flex-1 sm:flex-initial bg-[var(--bg)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contact Info Section (3 cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Email Card -->
        <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
            <i class="fa-regular fa-envelope" aria-hidden="true"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Email</div>
            <div class="text-xs sm:text-sm font-bold text-[var(--text)] truncate" [title]="doctor.email">{{ doctor.email || 'N/A' }}</div>
          </div>
        </div>

        <!-- Contact Card -->
        <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-phone" aria-hidden="true"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Contact Number</div>
            <div class="text-xs sm:text-sm font-bold text-[var(--text)] truncate">{{ doctor.contactInfo || 'N/A' }}</div>
          </div>
        </div>

        <!-- Address Card -->
        <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Address</div>
            <div class="text-xs sm:text-sm font-bold text-[var(--text)] truncate" [title]="doctor.address">{{ formattedAddress }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Navigation Tabs Bar -->
      <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl px-3 py-2 flex items-center gap-2 overflow-x-auto shadow-md scrollbar-none">
        <button type="button" (click)="activeTab = 'overview'"
                [ngClass]="activeTab === 'overview' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-b-2 border-[var(--primary)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
                class="btn-size-sm px-4 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-solid fa-user-doctor text-xs" aria-hidden="true"></i>
          <span>Overview</span>
        </button>

        <button type="button" (click)="activeTab = 'availability'"
                [ngClass]="activeTab === 'availability' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-b-2 border-[var(--primary)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
                class="btn-size-sm px-4 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-regular fa-calendar-days text-xs" aria-hidden="true"></i>
          <span>Availability</span>
        </button>

        <button type="button" (click)="activeTab = 'reviews'"
                [ngClass]="activeTab === 'reviews' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-b-2 border-[var(--primary)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
                class="btn-size-sm px-4 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-regular fa-star text-xs" aria-hidden="true"></i>
          <span>Reviews</span>
        </button>

        <button type="button" (click)="activeTab = 'clinic'"
                [ngClass]="activeTab === 'clinic' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-b-2 border-[var(--primary)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
                class="btn-size-sm px-4 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-solid fa-hospital-user text-xs" aria-hidden="true"></i>
          <span>Clinic Info</span>
        </button>
      </div>

      <!-- Main Grid Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        <!-- LEFT COLUMN -->
        <div class="space-y-6">
          <!-- Education Card -->
          <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div class="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
              </div>
              <h3 class="text-base font-bold text-[var(--text)]">Education</h3>
            </div>

            <div *ngIf="educations.length === 0" class="text-[var(--muted)] text-xs italic p-4 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)] border-dashed text-center">
              No education records added.
            </div>

            <div class="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]" *ngIf="educations.length > 0">
              <div class="relative pl-4" *ngFor="let ed of educations">
                <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[var(--primary)] ring-4 ring-[var(--panel)]"></div>
                <div class="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl space-y-1.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-[var(--text)] text-sm sm:text-base">{{ ed.degree }}</h4>
                    <span *ngIf="isGoldMedalist(ed)" class="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <i class="fa-solid fa-trophy text-[10px]" aria-hidden="true"></i> Gold Medalist
                    </span>
                  </div>
                  <div class="text-[var(--primary)] text-xs sm:text-sm font-semibold">{{ ed.institution }}</div>
                  <div class="text-xs text-[var(--muted)] flex items-center justify-between pt-1">
                    <span>Year: {{ ed.yearOfCompletion || 'NA' }}</span>
                    <span *ngIf="ed.details && !isGoldMedalist(ed)" class="italic text-[11px]">{{ ed.details }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Certificates Card -->
          <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-award" aria-hidden="true"></i>
              </div>
              <h3 class="text-base font-bold text-[var(--text)]">Certificates</h3>
            </div>

            <div *ngIf="certificates.length === 0" class="text-[var(--muted)] text-xs italic p-4 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)] border-dashed text-center">
              No certificates added.
            </div>

            <div class="space-y-3" *ngIf="certificates.length > 0">
              <div class="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-between gap-4" *ngFor="let c of certificates">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center font-black text-xs shrink-0">
                    PDF
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-[var(--text)] text-xs sm:text-sm truncate" [title]="c.name">{{ c.name || 'Not provided' }}</h4>
                    <div class="text-[11px] text-[var(--muted)] flex items-center gap-2">
                      <span>{{ c.issuingOrganization || 'Not provided' }}</span>
                      <span *ngIf="c.issueDate">• Issued: {{ c.issueDate }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <a *ngIf="c.credentialUrl || c.url" [href]="c.credentialUrl || c.url" target="_blank"
                     class="btn-size-md bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5 transition-all" rel="noopener noreferrer">
                    <i class="fa-regular fa-eye text-xs" aria-hidden="true"></i>
                    <span>View</span>
                  </a>
                  <a *ngIf="c.credentialUrl || c.url" [href]="c.credentialUrl || c.url" download
                     class="bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold p-1.5 rounded-lg transition-all" title="Download">
                    <i class="fa-solid fa-download text-xs" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="space-y-6">
          <!-- Experience Card -->
          <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
              </div>
              <h3 class="text-base font-bold text-[var(--text)]">Experience</h3>
            </div>

            <div *ngIf="experiences.length === 0" class="text-[var(--muted)] text-xs italic p-4 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)] border-dashed text-center">
              No experience records added.
            </div>

            <div class="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]" *ngIf="experiences.length > 0">
              <div class="relative pl-4" *ngFor="let ex of experiences">
                <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[var(--primary)] ring-4 ring-[var(--panel)]"></div>
                <div class="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl space-y-1 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-[var(--text)] text-sm sm:text-base">{{ ex.position }}</h4>
                    <span class="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                      {{ ex.yearsOfService || 'NA' }} yrs
                    </span>
                  </div>
                  <div class="text-[var(--primary)] text-xs sm:text-sm font-semibold">{{ ex.hospitalName }}</div>
                  <div class="text-xs text-[var(--muted)] pt-1" *ngIf="ex.details">{{ ex.details }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Specialties Card -->
          <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div class="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-user-doctor" aria-hidden="true"></i>
              </div>
              <h3 class="text-base font-bold text-[var(--text)]">Specialties</h3>
            </div>

            <div class="flex flex-wrap gap-2 pt-1" *ngIf="specialtiesList.length; else specialtiesMissing">
              <span *ngFor="let s of specialtiesList"
                    class="bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-gray-600 dark:text-gray-300 px-3.5 py-2 rounded-xl hover:border-[var(--primary)] transition-colors">
                {{ s }}
              </span>
            </div>
            <ng-template #specialtiesMissing>
              <p class="text-xs sm:text-sm text-[var(--muted)]">Not provided</p>
            </ng-template>
          </div>

          <!-- About Card -->
          <div class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div class="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-notes-medical" aria-hidden="true"></i>
              </div>
              <h3 class="text-base font-bold text-[var(--text)]">About</h3>
            </div>

            <p class="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              {{ aboutBio }}
            </p>
          </div>

        </div>

      </div>

    </div>

    <!-- Loading Template -->
    <ng-template #loadingTpl>
      <div class="p-12 text-center text-[var(--muted)] flex flex-col items-center justify-center min-h-[400px]">
         <div class="animate-spin h-10 w-10 border-4 border-[var(--primary)] border-t-transparent rounded-full mb-4"></div>
         <span class="animate-pulse text-xs font-semibold">Loading doctor profile...</span>
      </div>
    </ng-template>
  `,
  styles: []
})
export class DoctorDetailsPanelComponent {
  private location = inject(Location);
  private toast = inject(ToastService);

  @Input() doctor: Doctor | null = null;
  @Input() avgRating: number | null = null;
  @Input() age: number | null = null;

  @Input() educations: any[] = [];
  @Input() experiences: any[] = [];
  @Input() certificates: any[] = [];

  @Input() enableBooking = false;

  @Input() selectedDate = '';
  @Output() selectedDateChange = new EventEmitter<string>();

  @Input() slots: string[] = [];
  @Input() selectedSlot: string | null = null;
  @Output() selectSlot = new EventEmitter<string>();

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Input() loadingSlots = false;
  @Output() loadSlots = new EventEmitter<void>();

  @Input() booking = false;
  @Input() bookSuccess = false;
  @Input() bookError: string | null = null;
  @Output() book = new EventEmitter<void>();

  @Output() openBooking = new EventEmitter<void>();

  activeTab: 'overview' | 'availability' | 'reviews' | 'clinic' = 'overview';
  saved = false;

  goBack() {
    this.location.back();
  }

  toggleSave() {
    this.saved = !this.saved;
    if (this.saved) {
      this.toast.showSuccess('Doctor saved to your favorites.');
    } else {
      this.toast.showInfo('Doctor removed from favorites.');
    }
  }

  shareDoctor() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.toast.showSuccess('Doctor profile link copied to clipboard!');
    } else {
      this.toast.showInfo('Copy link: ' + window.location.href);
    }
  }

  doctorInitial(): string {
    return getDoctorInitial(this.doctor);
  }

  formatDoctorName(): string {
    return doctorDisplayName(this.doctor);
  }

  displayValue(value: unknown): string {
    if (value == null) return 'Not provided';
    const text = String(value).trim();
    return text || 'Not provided';
  }

  languagesText(): string {
    const languages = this.languageList();
    return languages.length ? languages.join(', ') : 'Not provided';
  }

  get hospitalName(): string {
    return this.experiences?.[0]?.hospitalName;
  }

  get formattedAddress(): string {
    const raw = this.doctor?.address || '';
    if (!raw) return 'NA';
    return raw;
  }

  isGoldMedalist(ed: any): boolean {
    const str = `${ed?.details || ''} ${ed?.degree || ''}`.toLowerCase();
    return str.includes('gold') || str.includes('medalist');
  }

  get specialtiesList(): string[] {
    const specialization = this.doctor?.specialization?.trim();
    return specialization ? [specialization] : [];
  }

  get aboutBio(): string {
    return this.displayValue(this.doctor?.bio);
  }

  private languageList(): string[] {
    const languages = this.doctor?.languages;
    const values = Array.isArray(languages) ? languages : String(languages || '').split(',');
    return values.map(language => language.trim()).filter(Boolean);
  }
}