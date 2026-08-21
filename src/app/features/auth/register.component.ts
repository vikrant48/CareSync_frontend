import { Component, inject, OnInit, AfterViewInit, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/toast-container.component';
import { SelectDropdownComponent } from '../../shared/select-dropdown.component';
import { SpecializationService } from '../../core/services/specialization.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { DatePickerComponent } from '../../shared/date-picker.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ToastContainerComponent, SelectDropdownComponent, DatePickerComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-gray-950 grid lg:grid-cols-2 overflow-hidden transition-all duration-500">
      
      <!-- Left Side: Branding & Info Panel (Hidden on Mobile) -->
      <div class="hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white relative overflow-hidden">
        <!-- Animated Background Elements -->
        <div class="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-1/4 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div class="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30 shadow-xl shadow-black/10">
              <i class="fa-solid fa-heart-pulse text-xl"></i>
            </div>
            <span class="text-xl font-black tracking-tight uppercase">CareSync</span>
          </div>

          <div class="space-y-4 max-w-lg">
            <h1 class="text-4xl font-black leading-[1.1] tracking-tighter animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
              Your Health, <br/>
              <span class="text-emerald-300">Synchronized</span>.
            </h1>
            <p class="text-base text-emerald-50/70 leading-relaxed font-light animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
              Join the elite network of healthcare providers and patients leveraging AI-driven medical precision.
            </p>
            
            <div class="pt-6 grid grid-cols-2 gap-x-4 gap-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <div class="group">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1.5 group-hover:bg-emerald-400 group-hover:text-emerald-900 transition-all duration-300">
                  <i class="fa-solid fa-shield-halved text-base"></i>
                </div>
                <h4 class="font-bold text-sm">Security</h4>
                <p class="text-[10px] text-emerald-100/50 leading-tight">HIPAA compliant, end-to-end encrypted vaults.</p>
              </div>
              <div class="group">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1.5 group-hover:bg-emerald-400 group-hover:text-emerald-900 transition-all duration-300">
                  <i class="fa-solid fa-brain text-base"></i>
                </div>
                <h4 class="font-bold text-sm">AI Ready</h4>
                <p class="text-[10px] text-emerald-100/50 leading-tight">Smart diagnostic & medical summarization.</p>
              </div>
              <div class="group">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1.5 group-hover:bg-emerald-400 group-hover:text-emerald-900 transition-all duration-300">
                  <i class="fa-solid fa-video text-base"></i>
                </div>
                <h4 class="font-bold text-sm">Video Consulting</h4>
                <p class="text-[10px] text-emerald-100/50 leading-tight">HD tele-health bridging home & clinic.</p>
              </div>
              <div class="group">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1.5 group-hover:bg-emerald-400 group-hover:text-emerald-900 transition-all duration-300">
                  <i class="fa-solid fa-file-waveform text-base"></i>
                </div>
                <h4 class="font-bold text-sm">Unified Health</h4>
                <p class="text-[10px] text-emerald-100/50 leading-tight">Secure access to all your medical records.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative z-10 mt-auto opacity-50">
           <p class="text-[10px] font-black uppercase tracking-widest text-emerald-100/50">© 2026 CareSync Digital Health</p>
        </div>
      </div>

      <!-- Right Side: Interaction Panel -->
      <div class="relative flex flex-col h-screen overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
        
        <!-- Mobile Header -->
        <div class="lg:hidden px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs">
              <i class="fa-solid fa-heart-pulse"></i>
            </div>
            <span class="text-sm font-black uppercase tracking-tight dark:text-white">CareSync</span>
          </div>
          <a routerLink="/login" class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sign In</a>
        </div>

        <div class="flex-1 flex flex-col justify-center px-6 py-6 lg:px-12 xl:px-20 max-w-[54rem] mx-auto w-full transition-all duration-500">
          
          <!-- Page Header -->
          <div class="mb-4">
            <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-0.5 leading-none">Create Account</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Join our healthcare network</p>
          </div>

          <!-- Progress Indicator -->
          <div class="relative flex items-center justify-between mb-8 px-1">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1.5px] bg-gray-100 dark:bg-gray-800 z-0"></div>
            <div class="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-500 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_12px_rgba(16,185,129,0.5)] z-0" 
                 [style.width.%]="(currentStep - 1) * 33.33"></div>
            
            <ng-container *ngFor="let step of [1, 2, 3, 4]; let i = index">
              <div class="relative z-10 flex flex-col items-center group" 
                   [class.cursor-pointer]="i + 1 < currentStep" 
                   (click)="i + 1 < currentStep ? navigateToStep(i + 1) : null">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[10px] sm:text-[11px] font-black transition-all duration-500 ring-[4px] ring-white dark:ring-gray-950"
                     [ngClass]="getStepClasses(step)">
                  <i class="fa-solid fa-check text-[9px]" *ngIf="step < currentStep"></i>
                  <span *ngIf="step >= currentStep">{{ step }}</span>
                </div>
                <!-- Label Tooltip -->
                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-[0.1em] font-black transition-all duration-300"
                     [ngClass]="step <= currentStep ? 'text-emerald-500 opacity-100' : 'text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100'">
                  {{ getStepLabel(step) }}
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Form Content -->
          <div class="min-h-[300px] lg:min-h-[340px] px-1 pt-4">
            
            <!-- Step 1: Personal (Dense 2-column) -->
            <section *ngIf="currentStep === 1" [formGroup]="basicForm" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div class="space-y-1">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">First Name</label>
                  <input class="input-modern py-2 text-sm pl-4" formControlName="firstName" placeholder="John" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Last Name</label>
                  <input class="input-modern py-2 text-sm pl-4" formControlName="lastName" placeholder="Doe" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Email Address</label>
                  <input class="input-modern py-2 text-sm pl-4" type="email" formControlName="email" placeholder="john.doe@medical.id" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Mobile Number</label>
                  <input class="input-modern py-2 text-sm pl-4" formControlName="contactInfo" (input)="onPhoneInput($event)" placeholder="+91 9876543210" />
                </div>
                <app-date-picker 
                  formControlName="dateOfBirth" 
                  label="Birth Date" 
                  placeholder="DD-MM-YYYY"
                  class="relative z-20">
                </app-date-picker>
                <app-select-dropdown 
                   label="Gender" 
                   [options]="genders" 
                   placeholder="Select gender"
                   formControlName="gender"
                   class="relative z-30">
                </app-select-dropdown>
                <div class="space-y-1 relative z-10">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Username</label>
                  <input class="input-modern py-2 text-sm pl-4" formControlName="username" placeholder="johndoe_md" />
                </div>
                <div class="space-y-1 relative z-10">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Password</label>
                  <div class="relative group">
                    <input class="input-modern pr-11 py-2 text-sm pl-4" [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
                    <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-500 transition-colors" (click)="togglePassword()">
                      <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye' + ' text-sm'"></i>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Step 2: Verification -->
            <section *ngIf="currentStep === 2" [formGroup]="verificationForm" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-2">
              <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mx-auto flex items-center justify-center mb-2 ring-4 ring-emerald-500/5">
                <i class="fa-solid fa-paper-plane text-xl text-emerald-500 animate-bounce"></i>
              </div>
              <div>
                <h3 class="text-lg font-black text-gray-900 dark:text-white mb-0.5">Check inbox</h3>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium italic">Sent code to verify your identity.</p>
              </div>
              
              <div class="max-w-xs mx-auto space-y-3">
                <div class="space-y-2">
                   <input class="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-2 text-center text-xl font-black tracking-[0.4em] focus:border-emerald-500 outline-none"
                          formControlName="otp" placeholder="000000" maxlength="6" />
                   <button (click)="sendVerificationCode()" class="text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500" [disabled]="loading">
                      Resend Code
                   </button>
                </div>
                <button (click)="verifyEmail()" [disabled]="loading" class="btn-modern-primary w-full py-3 text-sm">
                  <span *ngIf="!loading">Verify & Proceed</span>
                  <span *ngIf="loading"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
                </button>
              </div>
            </section>

            <!-- Step 3: Role Selection -->
            <section *ngIf="currentStep === 3" [formGroup]="roleForm" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="relative group cursor-pointer">
                  <input type="radio" class="sr-only peer" formControlName="role" value="DOCTOR" />
                  <div class="h-full p-5 rounded-[1.2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/20 dark:peer-checked:bg-emerald-950/20 peer-checked:ring-2 peer-checked:ring-emerald-500/10">
                    <div class="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                      <i class="fa-solid fa-user-doctor text-lg"></i>
                    </div>
                    <h4 class="text-base font-black text-gray-900 dark:text-white mb-0.5">Doctor</h4>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Manage clinical workflows and prescriptions.</p>
                  </div>
                </label>

                <label class="relative group cursor-pointer">
                  <input type="radio" class="sr-only peer" formControlName="role" value="PATIENT" />
                  <div class="h-full p-5 rounded-[1.2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/20 dark:peer-checked:bg-emerald-950/20 peer-checked:ring-2 peer-checked:ring-emerald-500/10">
                    <div class="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                      <i class="fa-solid fa-user text-lg"></i>
                    </div>
                    <h4 class="text-base font-black text-gray-900 dark:text-white mb-0.5">Patient</h4>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Book appointments and track active medical journey.</p>
                  </div>
                </label>
              </div>
            </section>

            <!-- Step 4: Final Details -->
            <section *ngIf="currentStep === 4" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h3 class="text-lg font-black text-gray-900 dark:text-white mb-0.5">Specifications</h3>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 italic">Help us personalize your active experience.</p>
               </div>

               <!-- Doctor fields -->
               <div *ngIf="roleForm.value.role === 'DOCTOR'" [formGroup]="doctorForm" class="grid grid-cols-1 gap-3">
                 <app-select-dropdown 
                    label="Specialization" 
                    [options]="specializations" 
                    placeholder="Select specialization"
                    [autoCapitalize]="false"
                    formControlName="specialization">
                 </app-select-dropdown>
                 <div class="space-y-1">
                   <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Experience (Years)</label>
                   <div class="flex items-center gap-1.5">
                     <button type="button" 
                             (click)="decrementExperience()"
                             class="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center active:scale-90">
                       <i class="fa-solid fa-minus text-xs"></i>
                     </button>
                     
                     <div class="relative flex-1">
                       <input class="input-modern py-2 text-sm pl-4 pr-10 text-center font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              type="number" 
                              formControlName="experience" 
                              placeholder="0" />
                       <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-400 tracking-tighter pointer-events-none">Yrs</span>
                     </div>
                     
                     <button type="button" 
                             (click)="incrementExperience()"
                             class="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center active:scale-90">
                       <i class="fa-solid fa-plus text-xs"></i>
                     </button>
                   </div>
                 </div>
               </div>

               <!-- Patient fields -->
               <div *ngIf="roleForm.value.role === 'PATIENT'" [formGroup]="patientForm" class="grid grid-cols-1 gap-3">
                 <div class="space-y-2">
                   <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Blood Group</label>
                   <div class="grid grid-cols-4 gap-2">
                      <label *ngFor="let bg of ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']" class="relative group cursor-pointer">
                        <input type="radio" class="sr-only peer" formControlName="bloodGroup" [value]="bg" />
                        <div class="py-2 text-center rounded-xl border-2 border-gray-100 dark:border-gray-800 font-black text-xs peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white transition-all scale-90">
                          {{bg}}
                        </div>
                      </label>
                   </div>
                 </div>
               </div>
            </section>
          </div>

          <!-- Bottom Navigation -->
          <div class="mt-4 flex items-center justify-between gap-4 transition-all">
             <button *ngIf="currentStep > 1" (click)="prev()" 
                     class="group px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                <i class="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1"></i> Back
             </button>
             <div class="flex-1"></div>
             
             <button *ngIf="currentStep === 1 || currentStep === 3" (click)="next()" [disabled]="loading" 
                     class="btn-modern-primary px-6 py-2.5 text-xs min-w-[110px]">
                <span *ngIf="!loading" class="flex items-center gap-2">Continue <i class="fa-solid fa-arrow-right text-[10px]"></i></span>
                <span *ngIf="loading"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
             </button>

             <button *ngIf="currentStep === 4" (click)="complete()" [disabled]="loading" 
                     class="btn-modern-primary px-6 py-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 border-none min-w-[140px] shadow-lg shadow-emerald-500/20">
                <span *ngIf="!loading" class="flex items-center gap-2">Finish <i class="fa-solid fa-check text-[10px]"></i></span>
                <span *ngIf="loading"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
             </button>
          </div>

          <!-- Footer -->
          <div class="mt-4 text-center hidden sm:block">
            <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
              Existing Participant? 
              <a routerLink="/login" class="text-emerald-600 font-black hover:text-emerald-500 transition-colors ml-1 uppercase underline underline-offset-2">Sign In</a>
            </p>
          </div>
        </div>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private specializationService = inject(SpecializationService);
  private masterDataService = inject(MasterDataService);
  private platformId = inject(PLATFORM_ID);

  specializations: string[] = [];

  constructor(private fb: FormBuilder) {
    // Initialize reactive forms inside constructor to avoid using 'fb' before assignment
    this.basicForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactInfo: ['+91 '],
      dateOfBirth: [''],
      gender: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.verificationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.roleForm = this.fb.group({
      role: ['PATIENT', Validators.required],
    });

    this.doctorForm = this.fb.group({
      specialization: ['', Validators.required],
      experience: [null, [Validators.min(0)]],
    });

    this.patientForm = this.fb.group({
      bloodGroup: [''],
    });
  }

  ngOnInit() {
    this.specializationService.getAllSpecializations().subscribe({
      next: (specs) => this.specializations = specs || [],
      error: (err) => console.error('Failed to load specializations', err)
    });

    this.masterDataService.getAllMasterData().subscribe({
      next: (data) => {
        if (data.genders?.length) this.genders = data.genders;
        if (data.bloodGroups?.length) this.bloodGroups = data.bloodGroups;
      },
      error: (err) => console.error('Failed to load master data', err)
    });
  }



  // Wizard state
  currentStep = 1;
  loading = false;
  error = '';
  showPassword = false;
  isEmailVerified = false;
  verificationMessage = '';
  verificationError = '';

  // Reactive forms
  basicForm!: FormGroup;
  verificationForm!: FormGroup;
  roleForm!: FormGroup;
  doctorForm!: FormGroup;
  patientForm!: FormGroup;

  genders = ['MALE', 'FEMALE', 'OTHER'];
  bloodGroups: string[] = [];

  incrementExperience() {
    const current = this.doctorForm.get('experience')?.value || 0;
    this.doctorForm.patchValue({ experience: current + 1 });
  }

  decrementExperience() {
    const current = this.doctorForm.get('experience')?.value || 0;
    if (current > 0) {
      this.doctorForm.patchValue({ experience: current - 1 });
    }
  }

  // Helper method to check if a field is invalid and should show error
  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.showValidationErrors));
  }

  // Flag to show validation errors when user tries to navigate
  showValidationErrors = false;

  navigateToStep(step: number) {
    // Allow navigation to previous steps only
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  getStepClasses(step: number): string {
    if (step < this.currentStep) {
      return 'bg-emerald-500 text-white border-emerald-500';
    } else if (step === this.currentStep) {
      return 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 scale-110';
    } else {
      return 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 border-2';
    }
  }

  getStepLabel(step: number): string {
    switch (step) {
      case 1: return 'Basic Details';
      case 2: return 'Verify Email';
      case 3: return 'Choose Role';
      case 4: return 'Finish';
      default: return '';
    }
  }

  // Navigation
  next() {
    if (this.currentStep === 1) {
      if (this.basicForm.valid) {
        this.loading = true;
        const { username, email } = this.basicForm.value;

        this.auth.checkAvailability(username, email).subscribe({
          next: (res) => {
            this.loading = false;
            let hasError = false;

            if (!res.usernameAvailable) {
              this.basicForm.get('username')?.setErrors({ taken: true });
              this.toast.showError('Username is already taken');
              hasError = true;
            }

            if (!res.emailAvailable) {
              this.basicForm.get('email')?.setErrors({ taken: true });
              this.toast.showError('Email is already registered');
              hasError = true;
            }

            if (!hasError) {
              this.currentStep = 2;
              this.showValidationErrors = false;
              // Keep verification email in sync with basic form
              this.verificationForm.patchValue({ email: this.basicForm.value.email || '' });
              // Initiate email verification and send OTP
              this.sendVerificationCode();
            }
          },
          error: (err) => {
            this.loading = false;
            this.toast.showError('Failed to check availability');
            console.error(err);
          }
        });
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.basicForm);
      }
    } else if (this.currentStep === 2) {
      // Only proceed if email verified
      if (this.isEmailVerified) {
        // Sync the possibly edited email back to basic form
        const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
        if (verifiedEmail) {
          this.basicForm.patchValue({ email: verifiedEmail });
        }
        this.currentStep = 3;
        this.showValidationErrors = false;
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.verificationForm);
        this.toast.showError('Please verify your email before continuing.');
      }
    } else if (this.currentStep === 3) {
      if (this.roleForm.valid) {
        this.currentStep = 4;
        this.showValidationErrors = false;
      } else {
        this.showValidationErrors = true;
        this.markFormGroupTouched(this.roleForm);
      }
    }
  }

  prev() {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
      this.showValidationErrors = false;
      if (this.currentStep === 1) {
        // DOB picker is now handled by shared component
      }
    }
  }

  // Helper method to mark all fields in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  stage4Valid(): boolean {
    if (this.roleForm.value.role === 'DOCTOR') {
      return this.doctorForm.valid;
    }
    return this.patientForm.valid;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onPhoneInput(event: any) {
    let value = event.target.value;

    // Remove all non-digit characters except +
    value = value.replace(/[^\d+]/g, '');

    // Ensure it starts with +91
    if (!value.startsWith('+91')) {
      if (value.startsWith('91')) {
        value = '+' + value;
      } else if (value.startsWith('+')) {
        value = '+91' + value.substring(1);
      } else {
        value = '+91' + value;
      }
    }

    // Format as +91 followed by space and digits
    if (value.length > 3) {
      value = value.substring(0, 3) + ' ' + value.substring(3);
    }

    // Update the form control
    this.basicForm.get('contactInfo')?.setValue(value);
  }

  complete() {
    // Validate all forms before proceeding
    const currentForm = this.roleForm.value.role === 'DOCTOR' ? this.doctorForm : this.patientForm;

    if (!this.basicForm.valid || !this.isEmailVerified || !this.roleForm.valid || !this.stage4Valid()) {
      this.showValidationErrors = true;
      this.markFormGroupTouched(this.basicForm);
      this.markFormGroupTouched(this.verificationForm);
      this.markFormGroupTouched(this.roleForm);
      this.markFormGroupTouched(currentForm);
      return;
    }

    this.loading = true;
    this.error = '';

    const base = this.basicForm.value;
    const role = this.roleForm.value.role!;

    const payload: any = {
      role,
      username: base.username!,
      password: base.password!,
      email: base.email!,
      firstName: base.firstName!,
      lastName: base.lastName!,
      gender: base.gender || undefined,
      contactInfo: base.contactInfo && base.contactInfo.trim() !== '+91 ' ? base.contactInfo : undefined,
      dateOfBirth: base.dateOfBirth || undefined,
    } as RegisterRequest & any;

    if (role === 'DOCTOR') {
      const d = this.doctorForm.value;
      payload.specialization = d.specialization || undefined;
      // 'experience' is not part of backend RegisterRequest
      // so we do not include it here to avoid JSON parse errors
    } else {
      payload.bloodGroup = this.patientForm.value.bloodGroup || undefined;
    }

    this.auth.register(payload).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Registration successful. Redirecting...');
        this.auth.redirectToDashboard(resp.role);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Registration failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  sendVerificationCode() {
    const base = this.basicForm.value;
    const name = `${base.firstName ?? ''} ${base.lastName ?? ''}`.trim();
    const email = this.verificationForm.value.email || base.email;
    this.loading = true;
    this.verificationMessage = '';
    this.verificationError = '';
    this.isEmailVerified = false;
    this.auth.startEmailVerification({
      name,
      email: email!,
      mobileNumber: base.contactInfo && base.contactInfo.trim() !== '+91 ' ? base.contactInfo : undefined,
    }).subscribe({
      next: (resp) => {
        this.verificationMessage = resp?.message || 'Verification code sent.';
        this.toast.showSuccess(this.verificationMessage);
        this.loading = false;
      },
      error: (err) => {
        this.verificationError = err?.error?.error || 'Failed to send verification code';
        this.toast.showError(this.verificationError);
        this.loading = false;
      },
    });
  }

  verifyEmail() {
    if (!this.verificationForm.valid) {
      this.showValidationErrors = true;
      this.markFormGroupTouched(this.verificationForm);
      return;
    }

    const base = this.basicForm.value;
    const email = this.verificationForm.value.email || base.email!;
    const otp = this.verificationForm.value.otp!;
    this.loading = true;
    this.verificationError = '';
    this.auth.verifyEmailOtp({ email, otp }).subscribe({
      next: (resp) => {
        if (resp?.verified !== false) {
          this.isEmailVerified = true;
          this.verificationMessage = 'Email verified.';
          this.toast.showSuccess(this.verificationMessage);

          this.showValidationErrors = false;

          // Auto-advance to Role Selection
          const verifiedEmail = this.verificationForm.value.email || this.basicForm.value.email;
          if (verifiedEmail) {
            this.basicForm.patchValue({ email: verifiedEmail });
          }
          setTimeout(() => {
            this.currentStep = 3;
          }, 800);
        } else {
          this.verificationError = resp?.message || 'Verification failed';
          this.toast.showError(this.verificationError);
        }
        this.loading = false;
      },
      error: (err) => {
        this.verificationError = err?.error?.error || 'Invalid or expired OTP';
        this.toast.showError(this.verificationError);
        this.loading = false;
      },
    });
  }

  // Reset verification when email changes
  resetVerificationState() {
    this.isEmailVerified = false;
    this.verificationForm.get('otp')?.setValue('');
  }

  // Reset only the verified flag when OTP changes
  resetVerificationFlag() {
    this.isEmailVerified = false;
  }
}