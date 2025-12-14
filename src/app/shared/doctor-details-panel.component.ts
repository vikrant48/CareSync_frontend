import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor } from '../core/services/doctor.service';

@Component({
  selector: 'doctor-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel p-0 overflow-hidden relative" *ngIf="doctor; else loadingTpl">
      
      <!-- Top Banner / Header -->
      <div class="relative bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8">
        <div class="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
        <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          
          <div class="relative group">
            <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white text-3xl border-4 shadow-xl" [ngClass]="{'border-blue-500': doctor.isVerified, 'border-gray-600': !doctor.isVerified}">
              <img *ngIf="doctor.profileImageUrl" [src]="doctor.profileImageUrl" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" (error)="doctor!.profileImageUrl = ''" />
              <span *ngIf="!doctor.profileImageUrl">{{ doctorInitial() }}</span>
            </div>
            <div *ngIf="doctor.isVerified" class="absolute -bottom-2 lg:bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-lg border border-blue-400/30">
              <i class="fa-solid fa-check text-[10px]"></i> Verified
            </div>
          </div>

          <div class="flex-1 text-center md:text-left space-y-2">
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex flex-col md:flex-row items-center md:items-end gap-2 justify-center md:justify-start">
              <span>{{ formatDoctorName() }}</span>
              <span class="text-xs font-normal text-gray-400 px-2 py-1 bg-gray-800/50 rounded-lg border border-gray-700/50 mb-1.5" *ngIf="age">{{ age }} yrs old</span>
            </h2>
            
            <div class="text-blue-400 text-lg font-medium">{{ doctor.specialization || 'General Practitioner' }}</div>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <div *ngIf="avgRating !== null" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-gray-700 backdrop-blur-sm">
                 <i class="fa-solid fa-star text-yellow-400 text-sm"></i>
                 <span class="text-gray-200 font-bold">{{ avgRating.toFixed(1) }}</span>
                 <span class="text-gray-500 text-xs">Rating</span>
              </div>
              
              <div *ngIf="doctor.consultationFees !== undefined && doctor.consultationFees !== null" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-gray-700 backdrop-blur-sm">
                 <i class="fa-solid fa-money-bill-wave text-green-400 text-sm"></i>
                 <span class="text-gray-200">₹{{ doctor.consultationFees }}</span>
                 <span class="text-gray-500 text-xs text-nowrap">Consultation Fee</span>
              </div>
              
               <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-gray-700 backdrop-blur-sm">
                 <i class="fa-solid fa-language text-purple-400 text-sm"></i>
                 <span class="text-gray-300 text-sm py-0.5">{{ languagesText() }}</span>
              </div>
            </div>
          </div>

          <div class="w-full md:w-auto mt-4 md:mt-0" *ngIf="enableBooking">
             <button class="btn-primary w-full md:w-auto shadow-lg shadow-blue-900/40 hover:shadow-blue-500/30 transition-all font-semibold py-3 px-6 text-lg" (click)="openBooking.emit()">
                <i class="fa-regular fa-calendar-check mr-2"></i> Book Appointment
             </button>
          </div>
        </div>
      </div>

      <div class="p-6 sm:p-8 space-y-8 bg-gray-900/30">
        
        <!-- Contact Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div class="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <i class="fa-solid fa-envelope"></i>
              </div>
              <div class="min-w-0">
                 <div class="text-xs text-gray-500 uppercase tracking-wider">Email</div>
                 <div class="text-gray-200 truncate" title="{{ doctor.email }}">{{ doctor.email || 'N/A' }}</div>
              </div>
           </div>
           
           <div class="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <i class="fa-solid fa-phone"></i>
              </div>
              <div class="min-w-0">
                 <div class="text-xs text-gray-500 uppercase tracking-wider">Contact</div>
                 <div class="text-gray-200 truncate">{{ doctor.contactInfo || 'N/A' }}</div>
              </div>
           </div>
           
           <div class="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 flex items-center gap-3 md:col-span-2 lg:col-span-1">
              <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <i class="fa-solid fa-map-location-dot"></i>
              </div>
              <div class="min-w-0">
                 <div class="text-xs text-gray-500 uppercase tracking-wider">Address</div>
                 <div class="text-gray-200 truncate" title="{{ doctor.address }}">{{ doctor.address || 'N/A' }}</div>
              </div>
           </div>
        </div>

        <div class="h-px bg-gray-800 w-full"></div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Education -->
          <section class="space-y-4">
             <h3 class="text-lg font-bold text-gray-100 flex items-center gap-2">
                <i class="fa-solid fa-graduation-cap text-blue-500"></i> Education
             </h3>
             <div *ngIf="educations.length === 0" class="text-gray-500 italic p-4 bg-gray-800/20 rounded-lg border border-gray-800 border-dashed text-center">No education details added.</div>
             <div class="space-y-3">
               <div class="group relative pl-6 border-l-2 border-gray-800 hover:border-blue-500/50 transition-colors" *ngFor="let ed of educations">
                 <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600 group-hover:border-blue-400 transition-colors"></div>
                 <div class="bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 hover:bg-gray-800/60 transition-colors">
                    <div class="font-bold text-gray-200">{{ ed.degree }}</div>
                    <div class="text-blue-400 text-sm font-medium">{{ ed.institution }}</div>
                    <div class="text-xs text-gray-500 mt-1 flex justify-between">
                       <span>Year: {{ ed.yearOfCompletion || '—' }}</span>
                       <span *ngIf="ed.details" class="italic">{{ ed.details }}</span>
                    </div>
                 </div>
               </div>
             </div>
          </section>

          <!-- Experience -->
          <section class="space-y-4">
             <h3 class="text-lg font-bold text-gray-100 flex items-center gap-2">
                <i class="fa-solid fa-briefcase text-emerald-500"></i> Experience
             </h3>
             <div *ngIf="experiences.length === 0" class="text-gray-500 italic p-4 bg-gray-800/20 rounded-lg border border-gray-800 border-dashed text-center">No experience records added.</div>
             <div class="space-y-3">
               <div class="group bg-gray-800/40 p-4 rounded-xl border border-gray-700/30 hover:border-emerald-500/30 transition-all hover:bg-gray-800/60" *ngFor="let ex of experiences">
                 <div class="flex items-start justify-between mb-1">
                    <h4 class="font-bold text-gray-200">{{ ex.position }}</h4>
                    <span class="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">{{ ex.yearsOfService }} yrs</span>
                 </div>
                 <div class="text-emerald-400/80 text-sm font-medium mb-2">{{ ex.hospitalName }}</div>
                 <p class="text-xs text-gray-400" *ngIf="ex.details">{{ ex.details }}</p>
               </div>
             </div>
          </section>

        </div>

        <div class="h-px bg-gray-800 w-full" *ngIf="certificates.length > 0"></div>

        <!-- Certificates -->
        <section class="space-y-4" *ngIf="certificates.length > 0">
           <h3 class="text-lg font-bold text-gray-100 flex items-center gap-2">
              <i class="fa-solid fa-certificate text-yellow-500"></i> Certificates
           </h3>
           <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/30 hover:border-yellow-500/30 transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group" *ngFor="let c of certificates">
               <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i class="fa-solid fa-award text-4xl text-yellow-500"></i>
               </div>
               
               <div class="relative z-10">
                  <h4 class="font-bold text-gray-200 mb-1 line-clamp-1" title="{{ c.name }}">{{ c.name }}</h4>
                  <div class="text-xs text-yellow-500/80 mb-3 tracking-wide uppercase">{{ c.issuingOrganization || 'Organization' }}</div>
                  
                  <div class="space-y-1 text-xs text-gray-400 mb-3">
                     <div *ngIf="c.issueDate">Issued: {{ c.issueDate }}</div>
                     <div *ngIf="c.expiryDate">Expires: {{ c.expiryDate }}</div>
                     <div *ngIf="c.credentialId" class="truncate" title="{{ c.credentialId }}">ID: {{ c.credentialId }}</div>
                  </div>
                  
                  <div class="flex gap-2 mt-auto">
                    <a *ngIf="c.credentialUrl" [href]="c.credentialUrl" target="_blank" class="flex-1 text-center py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-colors">
                       Verify
                    </a>
                    <a *ngIf="c.url" [href]="c.url" target="_blank" class="flex-1 text-center py-1.5 rounded bg-gray-700/50 text-gray-300 hover:bg-gray-700 text-xs font-medium transition-colors">
                       View
                    </a>
                  </div>
               </div>
             </div>
           </div>
        </section>

      </div>
    </div>
    <ng-template #loadingTpl>
      <div class="p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[400px]">
         <div class="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
         <span class="animate-pulse">Loading doctor profile...</span>
      </div>
    </ng-template>
  `,
})
export class DoctorDetailsPanelComponent {
  @Input() doctor: Doctor | null = null;
  @Input() avgRating: number | null = null;
  @Input() age: number | null = null;

  @Input() educations: any[] = [];
  @Input() experiences: any[] = [];
  @Input() certificates: any[] = [];

  @Input() enableBooking = false;

  // Booking-related inputs/outputs for reuse
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

  // New: emit open booking popup request so parent can open modal
  @Output() openBooking = new EventEmitter<void>();

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
    if (!langs) return 'N/A';
    if (Array.isArray(langs)) return langs.filter((x) => !!x).join(', ') || 'N/A';
    return String(langs);
  }
}