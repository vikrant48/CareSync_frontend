import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor } from '../core/services/doctor.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'doctor-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-in fade-in duration-500 space-y-6" *ngIf="doctor; else loadingTpl">
      
      <!-- Back Button Row -->
      <div class="mb-4">
        <button type="button" (click)="goBack()"
                class="bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm w-fit">
          <i class="fa-solid fa-arrow-left text-xs"></i>
          <span>Back</span>
        </button>
      </div>

      <!-- Top Doctor Summary Header Card -->
      <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <!-- Left Side: Avatar & Information -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full lg:w-auto">
          <div class="relative shrink-0">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#1b2333] border-2 border-[#2a3347] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
              <img *ngIf="doctor.profileImageUrl" [src]="doctor.profileImageUrl" class="w-full h-full object-cover" (error)="doctor.profileImageUrl = ''" />
              <span *ngIf="!doctor.profileImageUrl">{{ doctorInitial() }}</span>
            </div>
            <div *ngIf="doctor.isVerified !== false" class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#5b6cf0] text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md border border-blue-400/30 whitespace-nowrap">
              <i class="fa-solid fa-check text-[10px]"></i>
            </div>
          </div>

          <div class="space-y-2 min-w-0">
            <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{{ formatDoctorName() }}</h2>
              <i class="fa-solid fa-circle-check text-emerald-400 text-lg" title="Verified Doctor"></i>
            </div>

            <div class="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold flex-wrap">
              <span class="text-[#5b6cf0] font-bold">{{ doctor.specialization || 'Cardiology' }}</span>
              <span class="text-[#2a3347]" *ngIf="hospitalName">•</span>
              <span class="text-[#9aa3b8] flex items-center gap-1.5" *ngIf="hospitalName">
                <i class="fa-solid fa-building-columns text-xs text-[#5b6cf0]"></i> {{ hospitalName }}
              </span>
            </div>

            <!-- Ratings, Fee, Languages Pills -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b2333] border border-[#2a3347] text-xs font-semibold text-white">
                <i class="fa-solid fa-star text-amber-400 text-xs"></i>
                <span>{{ (avgRating ?? doctor.averageRating || 0).toFixed(1) }}</span>
                <span class="text-[#9aa3b8] text-[11px]">(to be added )</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b2333] border border-[#2a3347] text-xs font-semibold text-white">
                <i class="fa-solid fa-money-bill-wave text-emerald-400 text-xs"></i>
                <span>₹{{ doctor.consultationFees }}</span>
                <span class="text-[#9aa3b8] text-[11px]">Consultation Fee</span>
              </div>

              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b2333] border border-[#2a3347] text-xs font-semibold text-white">
                <i class="fa-solid fa-language text-[#5b6cf0] text-xs"></i>
                <span>{{ languagesText() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 items-stretch sm:items-center lg:items-end">
          <button *ngIf="enableBooking" type="button" (click)="openBooking.emit()"
                  class="bg-[#5b6cf0] hover:bg-[#4a5be0] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#5b6cf0]/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
            <i class="fa-regular fa-calendar-check text-xs"></i>
            <span>Book Appointment</span>
          </button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button type="button" (click)="toggleSave()"
                    class="flex-1 sm:flex-initial bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <i class="fa-regular fa-heart" [class.fa-solid]="saved" [class.text-rose-500]="saved"></i>
              <span>{{ saved ? 'Saved' : 'Save' }}</span>
            </button>

            <button type="button" (click)="shareDoctor()"
                    class="flex-1 sm:flex-initial bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <i class="fa-solid fa-share-nodes"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contact Info Section (3 cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Email Card -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
            <i class="fa-regular fa-envelope"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Email</div>
            <div class="text-xs sm:text-sm font-bold text-white truncate" [title]="doctor.email">{{ doctor.email || 'N/A' }}</div>
          </div>
        </div>

        <!-- Contact Card -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-phone"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Contact Number</div>
            <div class="text-xs sm:text-sm font-bold text-white truncate">{{ doctor.contactInfo || 'N/A' }}</div>
          </div>
        </div>

        <!-- Address Card -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div class="w-10 h-10 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-location-dot"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Address</div>
            <div class="text-xs sm:text-sm font-bold text-white truncate" [title]="doctor.address">{{ formattedAddress }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Navigation Tabs Bar -->
      <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl px-3 py-2 flex items-center gap-2 overflow-x-auto shadow-md scrollbar-none">
        <button type="button" (click)="activeTab = 'overview'"
                [ngClass]="activeTab === 'overview' ? 'bg-[#5b6cf0]/10 text-[#5b6cf0] border-b-2 border-[#5b6cf0] font-bold' : 'text-[#9aa3b8] hover:text-white font-semibold'"
                class="px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-solid fa-user-doctor text-xs"></i>
          <span>Overview</span>
        </button>

        <button type="button" (click)="activeTab = 'availability'"
                [ngClass]="activeTab === 'availability' ? 'bg-[#5b6cf0]/10 text-[#5b6cf0] border-b-2 border-[#5b6cf0] font-bold' : 'text-[#9aa3b8] hover:text-white font-semibold'"
                class="px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-regular fa-calendar-days text-xs"></i>
          <span>Availability</span>
        </button>

        <button type="button" (click)="activeTab = 'reviews'"
                [ngClass]="activeTab === 'reviews' ? 'bg-[#5b6cf0]/10 text-[#5b6cf0] border-b-2 border-[#5b6cf0] font-bold' : 'text-[#9aa3b8] hover:text-white font-semibold'"
                class="px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-regular fa-star text-xs"></i>
          <span>Reviews</span>
        </button>

        <button type="button" (click)="activeTab = 'clinic'"
                [ngClass]="activeTab === 'clinic' ? 'bg-[#5b6cf0]/10 text-[#5b6cf0] border-b-2 border-[#5b6cf0] font-bold' : 'text-[#9aa3b8] hover:text-white font-semibold'"
                class="px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap">
          <i class="fa-solid fa-hospital-user text-xs"></i>
          <span>Clinic Info</span>
        </button>
      </div>

      <!-- Main Grid Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        <!-- LEFT COLUMN -->
        <div class="space-y-6">
          <!-- Education Card -->
          <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 class="text-base font-bold text-white">Education</h3>
            </div>

            <div *ngIf="educations.length === 0" class="text-[#9aa3b8] text-xs italic p-4 bg-[#1b2333]/50 rounded-xl border border-[#2a3347] border-dashed text-center">
              No education records added.
            </div>

            <div class="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a3347]" *ngIf="educations.length > 0">
              <div class="relative pl-4" *ngFor="let ed of educations">
                <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#5b6cf0] ring-4 ring-[#151b2b]"></div>
                <div class="bg-[#1b2333] border border-[#2a3347] p-4 rounded-xl space-y-1.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-white text-sm sm:text-base">{{ ed.degree }}</h4>
                    <span *ngIf="isGoldMedalist(ed)" class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <i class="fa-solid fa-trophy text-[10px]"></i> Gold Medalist
                    </span>
                  </div>
                  <div class="text-[#5b6cf0] text-xs sm:text-sm font-semibold">{{ ed.institution }}</div>
                  <div class="text-xs text-[#9aa3b8] flex items-center justify-between pt-1">
                    <span>Year: {{ ed.yearOfCompletion || 'NA' }}</span>
                    <span *ngIf="ed.details && !isGoldMedalist(ed)" class="italic text-[11px]">{{ ed.details }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Certificates Card -->
          <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-award"></i>
              </div>
              <h3 class="text-base font-bold text-white">Certificates</h3>
            </div>

            <div *ngIf="certificates.length === 0" class="text-[#9aa3b8] text-xs italic p-4 bg-[#1b2333]/50 rounded-xl border border-[#2a3347] border-dashed text-center">
              No certificates added.
            </div>

            <div class="space-y-3" *ngIf="certificates.length > 0">
              <div class="bg-[#1b2333] border border-[#2a3347] p-4 rounded-xl flex items-center justify-between gap-4" *ngFor="let c of certificates">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center font-black text-xs shrink-0">
                    PDF
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-white text-xs sm:text-sm truncate" [title]="c.name">{{ c.name || 'Medical Degree Certificate' }}</h4>
                    <div class="text-[11px] text-[#9aa3b8] flex items-center gap-2">
                      <span>{{ c.issuingOrganization || 'Organization' }}</span>
                      <span *ngIf="c.issueDate">• Issued: {{ c.issueDate }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <a *ngIf="c.credentialUrl || c.url" [href]="c.credentialUrl || c.url" target="_blank"
                     class="bg-[#151b2b] hover:bg-[#253047] border border-[#2a3347] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                    <i class="fa-regular fa-eye text-xs"></i>
                    <span>View</span>
                  </a>
                  <a *ngIf="c.credentialUrl || c.url" [href]="c.credentialUrl || c.url" download
                     class="bg-[#151b2b] hover:bg-[#253047] border border-[#2a3347] text-white text-xs font-semibold p-1.5 rounded-lg transition-all" title="Download">
                    <i class="fa-solid fa-download text-xs"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="space-y-6">
          <!-- Experience Card -->
          <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-briefcase"></i>
              </div>
              <h3 class="text-base font-bold text-white">Experience</h3>
            </div>

            <div *ngIf="experiences.length === 0" class="text-[#9aa3b8] text-xs italic p-4 bg-[#1b2333]/50 rounded-xl border border-[#2a3347] border-dashed text-center">
              No experience records added.
            </div>

            <div class="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a3347]" *ngIf="experiences.length > 0">
              <div class="relative pl-4" *ngFor="let ex of experiences">
                <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#5b6cf0] ring-4 ring-[#151b2b]"></div>
                <div class="bg-[#1b2333] border border-[#2a3347] p-4 rounded-xl space-y-1 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-white text-sm sm:text-base">{{ ex.position }}</h4>
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                      {{ ex.yearsOfService || 'NA' }} yrs
                    </span>
                  </div>
                  <div class="text-[#5b6cf0] text-xs sm:text-sm font-semibold">{{ ex.hospitalName }}</div>
                  <div class="text-xs text-[#9aa3b8] pt-1" *ngIf="ex.details">{{ ex.details }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Specialties Card -->
          <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-user-doctor"></i>
              </div>
              <h3 class="text-base font-bold text-white">Specialties</h3>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
              <span *ngFor="let s of specialtiesList"
                    class="bg-[#1b2333] border border-[#2a3347] text-xs font-semibold text-gray-300 px-3.5 py-2 rounded-xl hover:border-[#5b6cf0] transition-colors">
                {{ s }}
              </span>
            </div>
          </div>

          <!-- About Card -->
          <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-notes-medical"></i>
              </div>
              <h3 class="text-base font-bold text-white">About</h3>
            </div>

            <p class="text-xs sm:text-sm text-[#9aa3b8] leading-relaxed">
              {{ aboutBio }}
            </p>
          </div>

        </div>

      </div>

    </div>

    <!-- Loading Template -->
    <ng-template #loadingTpl>
      <div class="p-12 text-center text-[#9aa3b8] flex flex-col items-center justify-center min-h-[400px]">
         <div class="animate-spin h-10 w-10 border-4 border-[#5b6cf0] border-t-transparent rounded-full mb-4"></div>
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
    const base = (this.doctor?.name || `${this.doctor?.firstName || ''} ${this.doctor?.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
  }

  formatDoctorName(): string {
    const base = (this.doctor?.name || `${this.doctor?.firstName || ''} ${this.doctor?.lastName || ''}`).trim();
    if (!base) return '';
    return /^dr\.?\s+/i.test(base) ? base : `Dr ${base}`;
  }

  languagesText(): string {
    const langs: any = (this.doctor as any)?.languages;
    if (!langs) return 'Hindi, Punjabi';
    if (Array.isArray(langs)) return langs.filter((x) => !!x).join(', ') || 'Hindi, Punjabi';
    return String(langs);
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
    const spec = this.doctor?.specialization || 'Cardiology';
    return [
      'Interventional Cardiology',
      'Heart Failure',
      'Echocardiography',
      'Preventive Cardiology'
    ];
  }

  get aboutBio(): string {
    const name = this.formatDoctorName();
    const spec = this.doctor?.specialization || 'NA';
    return `${name} is a dedicated ${spec} with expertise. Committed to providing evidence-based care with a patient-centric approach.`;
  }
}