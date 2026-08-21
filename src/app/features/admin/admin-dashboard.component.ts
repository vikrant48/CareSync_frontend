import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserSummary, BlockedIP } from '../../core/services/admin.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar bg-slate-900 text-slate-100 flex flex-col">
      <!-- Navbar / Header -->
      <header class="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40 flex-shrink-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-indigo-500/20">
              CS
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                CareSync Admin Console
              </h1>
              <p class="text-xs text-slate-400">System Management & Governance</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-xs px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
              Administrator: {{ authService.username() }}
            </span>
            <button
              (click)="logout()"
              class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-36">
        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-700/60 mb-6 overflow-x-auto">
          <button
            (click)="activeTab = 'users'"
            [class.text-indigo-400]="activeTab === 'users'"
            [class.border-indigo-500]="activeTab === 'users'"
            class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>👤 User Management</span>
            <span class="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">{{ users.length }}</span>
          </button>

          <button
            (click)="activeTab = 'doctors'"
            [class.text-indigo-400]="activeTab === 'doctors'"
            [class.border-indigo-500]="activeTab === 'doctors'"
            class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>👨‍⚕️ Doctor Verification</span>
            <span class="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">{{ doctors.length }}</span>
          </button>

          <button
            (click)="activeTab = 'master'"
            [class.text-indigo-400]="activeTab === 'master'"
            [class.border-indigo-500]="activeTab === 'master'"
            class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>⚙️ Master Data Entry</span>
          </button>

          <button
            (click)="activeTab = 'security'"
            [class.text-indigo-400]="activeTab === 'security'"
            [class.border-indigo-500]="activeTab === 'security'"
            class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span>🔒 Security & Blocked IPs</span>
            <span class="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">{{ blockedIPs.length }}</span>
          </button>
        </div>

        <!-- TAB 1: USER MANAGEMENT -->
        <div *ngIf="activeTab === 'users'" class="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 mb-16">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="text-lg font-bold text-white">System Users Directory</h2>
              <p class="text-xs text-slate-400">View and toggle user active / inactive status</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="text"
                [(ngModel)]="userSearch"
                placeholder="Search username..."
                class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                [(ngModel)]="selectedRoleFilter"
                class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="PATIENT">PATIENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar rounded-xl border border-slate-700/50">
            <table class="w-full text-left text-sm text-slate-300 border-collapse">
              <thead class="bg-slate-900 sticky top-0 z-10 text-xs uppercase text-slate-400 font-semibold border-b border-slate-700 shadow-sm">
                <tr>
                  <th class="py-3.5 px-4 bg-slate-900">User ID</th>
                  <th class="py-3.5 px-4 bg-slate-900">Username</th>
                  <th class="py-3.5 px-4 bg-slate-900">Role</th>
                  <th class="py-3.5 px-4 bg-slate-900">Status</th>
                  <th class="py-3.5 px-4 text-right bg-slate-900">Action (Toggle)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <tr *ngFor="let u of filteredUsers" class="hover:bg-slate-800/40 transition">
                  <td class="py-3.5 px-4 font-mono text-slate-400">#{{ u.userId }}</td>
                  <td class="py-3.5 px-4 font-semibold text-white">{{ u.username }}</td>
                  <td class="py-3.5 px-4">
                    <span
                      class="px-2.5 py-1 text-xs font-semibold rounded-md border"
                      [ngClass]="{
                        'bg-blue-500/20 border-blue-500/30 text-blue-300': u.role === 'DOCTOR',
                        'bg-emerald-500/20 border-emerald-500/30 text-emerald-300': u.role === 'PATIENT',
                        'bg-purple-500/20 border-purple-500/30 text-purple-300': u.role === 'ADMIN'
                      }"
                    >
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      [ngClass]="{
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400': u.isActive,
                        'bg-rose-500/10 border-rose-500/30 text-rose-400': !u.isActive
                      }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="u.isActive ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      (click)="toggleUserStatus(u)"
                      [disabled]="togglingUsername === u.username"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-sm"
                      [ngClass]="{
                        'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40': u.isActive,
                        'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40': !u.isActive
                      }"
                    >
                      {{ togglingUsername === u.username ? 'Updating...' : (u.isActive ? 'Set Inactive' : 'Set Active') }}
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-500">No users match your criteria.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 2: DOCTOR VERIFICATION -->
        <div *ngIf="activeTab === 'doctors'" class="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 mb-16">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="text-lg font-bold text-white">Doctor Credential Verification</h2>
              <p class="text-xs text-slate-400">Verify or unverfiy (diverify) registered medical practitioners</p>
            </div>
            <input
              type="text"
              [(ngModel)]="doctorSearch"
              placeholder="Search doctor name or spec..."
              class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar rounded-xl border border-slate-700/50">
            <table class="w-full text-left text-sm text-slate-300 border-collapse">
              <thead class="bg-slate-900 sticky top-0 z-10 text-xs uppercase text-slate-400 font-semibold border-b border-slate-700 shadow-sm">
                <tr>
                  <th class="py-3.5 px-4 bg-slate-900">Doctor ID</th>
                  <th class="py-3.5 px-4 bg-slate-900">Name</th>
                  <th class="py-3.5 px-4 bg-slate-900">Specialization</th>
                  <th class="py-3.5 px-4 bg-slate-900">Verification</th>
                  <th class="py-3.5 px-4 text-right bg-slate-900">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <tr *ngFor="let doc of filteredDoctors" class="hover:bg-slate-800/40 transition">
                  <td class="py-3.5 px-4 font-mono text-slate-400">#{{ doc.id }}</td>
                  <td class="py-3.5 px-4">
                    <div class="font-semibold text-white">Dr. {{ doc.firstName || '' }} {{ doc.lastName || '' }}</div>
                    <div class="text-xs text-slate-500">&#64;{{ doc.username }}</div>
                  </td>
                  <td class="py-3.5 px-4 text-slate-300">{{ doc.specialization || 'General Practitioner' }}</td>
                  <td class="py-3.5 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                      [ngClass]="{
                        'bg-cyan-500/10 border-cyan-500/30 text-cyan-300': doc.isVerified,
                        'bg-amber-500/10 border-amber-500/30 text-amber-300': !doc.isVerified
                      }"
                    >
                      <span>{{ doc.isVerified ? '✓ Verified' : '⏳ Pending / Unverified' }}</span>
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                    <button
                      (click)="openDoctorModal(doc)"
                      class="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1"
                    >
                      <span> View Profile</span>
                    </button>
                    <button
                      *ngIf="!doc.isVerified"
                      (click)="toggleDoctorVerification(doc, true)"
                      [disabled]="verifyingDoctorId === doc.id"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition"
                    >
                      Verify Doctor
                    </button>
                    <button
                      *ngIf="doc.isVerified"
                      (click)="toggleDoctorVerification(doc, false)"
                      [disabled]="verifyingDoctorId === doc.id"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
                    >
                      Diverify (Unverify)
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredDoctors.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-500">No doctors found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: MASTER DATA ENTRY -->
        <div *ngIf="activeTab === 'master'" class="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 mb-16">
          <div class="mb-6">
            <h2 class="text-lg font-bold text-white">Master Data Entry Management</h2>
            <p class="text-xs text-slate-400">Add new dropdown options to any master table across the system</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Form: Add Entry -->
            <div class="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5">
              <h3 class="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span>➕ Add Master Data Item</span>
              </h3>

              <form (ngSubmit)="submitMasterData()" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1">Master Data Type</label>
                  <select
                    [(ngModel)]="selectedMasterType"
                    name="masterType"
                    (change)="loadCurrentMasterItems()"
                    class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="specializations">Specializations</option>
                    <option value="hospitals">Hospitals</option>
                    <option value="degrees">Degrees</option>
                    <option value="institutions">Institutions</option>
                    <option value="positions">Positions</option>
                    <option value="languages">Languages</option>
                    <option value="blood-groups">Blood Groups</option>
                    <option value="genders">Genders</option>
                    <option value="statuses">Statuses</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1">New Item Value</label>
                  <input
                    type="text"
                    [(ngModel)]="newMasterValue"
                    name="masterValue"
                    placeholder="e.g. Cardiology, City Hospital..."
                    required
                    class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  [disabled]="isSubmittingMaster || !newMasterValue.trim()"
                  class="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition"
                >
                  {{ isSubmittingMaster ? 'Saving Entry...' : 'Add Master Entry' }}
                </button>
              </form>
            </div>

            <!-- Right Column: Current Master List -->
            <div class="lg:col-span-2 bg-slate-900/60 border border-slate-700/60 rounded-xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-200 capitalize">
                  Current {{ selectedMasterType }} Items ({{ masterItems.length }})
                </h3>
                <button
                  (click)="loadCurrentMasterItems()"
                  class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  🔄 Refresh List
                </button>
              </div>

              <div class="flex flex-wrap gap-2 max-h-80 overflow-y-auto p-1">
                <span
                  *ngFor="let item of masterItems"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2"
                >
                  <span>{{ item }}</span>
                </span>
                <div *ngIf="masterItems.length === 0" class="py-8 text-center text-slate-500 text-xs w-full">
                  No items configured for this master type yet.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: SECURITY & BLOCKED IPS -->
        <div *ngIf="activeTab === 'security'" class="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 mb-16">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="text-lg font-bold text-white">Blocked IP Addresses</h2>
              <p class="text-xs text-slate-400">View and remove IP blocks imposed by security rules</p>
            </div>

            <button
              *ngIf="blockedIPs.length > 0"
              (click)="unblockAllIPs()"
              class="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition"
            >
              Clear / Unblock All IPs
            </button>
          </div>

          <div class="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar rounded-xl border border-slate-700/50">
            <table class="w-full text-left text-sm text-slate-300 border-collapse">
              <thead class="bg-slate-900 sticky top-0 z-10 text-xs uppercase text-slate-400 font-semibold border-b border-slate-700 shadow-sm">
                <tr>
                  <th class="py-3.5 px-4 bg-slate-900">IP Address</th>
                  <th class="py-3.5 px-4 bg-slate-900">Block Reason</th>
                  <th class="py-3.5 px-4 bg-slate-900">Blocked At</th>
                  <th class="py-3.5 px-4 text-right bg-slate-900">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <tr *ngFor="let ip of blockedIPs" class="hover:bg-slate-800/40 transition">
                  <td class="py-3.5 px-4 font-mono font-bold text-rose-300">{{ ip.ipAddress }}</td>
                  <td class="py-3.5 px-4 text-slate-300">{{ ip.reason || 'Exceeded failed login attempt threshold' }}</td>
                  <td class="py-3.5 px-4 text-xs text-slate-400">{{ ip.blockedAt || 'Recent' }}</td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      (click)="unblockSingleIP(ip.ipAddress)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                    >
                      Unblock IP
                    </button>
                  </td>
                </tr>
                <tr *ngIf="blockedIPs.length === 0">
                  <td colspan="4" class="py-8 text-center text-slate-500">No IP addresses are currently blocked.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- DOCTOR DETAIL VIEW MODAL -->
      <div *ngIf="selectedDoctor" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between sticky top-0 z-20">
            <div class="flex items-center gap-3">
              <div class="relative w-12 h-12 rounded-xl bg-slate-700 overflow-hidden border border-slate-600 flex-shrink-0">
                <img
                  *ngIf="selectedDoctorProfile?.profileImageUrl"
                  [src]="selectedDoctorProfile.profileImageUrl"
                  alt="Doctor Photo"
                  class="w-full h-full object-cover"
                />
                <div *ngIf="!selectedDoctorProfile?.profileImageUrl" class="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                  {{ selectedDoctor.firstName?.charAt(0) || 'D' }}
                </div>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                  Dr. {{ selectedDoctorProfile?.firstName || selectedDoctor.firstName }} {{ selectedDoctorProfile?.lastName || selectedDoctor.lastName }}
                  <span
                    class="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                    [ngClass]="{
                      'bg-cyan-500/10 border-cyan-500/30 text-cyan-300': selectedDoctor.isVerified,
                      'bg-amber-500/10 border-amber-500/30 text-amber-300': !selectedDoctor.isVerified
                    }"
                  >
                    {{ selectedDoctor.isVerified ? '✓ Verified' : '⏳ Pending' }}
                  </span>
                </h3>
                <p class="text-xs text-slate-400">
                  Specialization: <span class="text-indigo-300 font-medium">{{ selectedDoctorProfile?.specialization || selectedDoctor.specialization || 'General Practitioner' }}</span>
                  | &#64;{{ selectedDoctor.username }}
                </p>
              </div>
            </div>
            <button
              (click)="closeDoctorModal()"
              class="w-8 h-8 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-600"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-slate-300">
            
            <div *ngIf="loadingDoctorDetails" class="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching full doctor credentials & background data...</span>
            </div>

            <ng-container *ngIf="!loadingDoctorDetails">
              <!-- Section 1: Personal & Contact Information -->
              <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  📋 Personal & Account Information
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-500 block">Full Name</span>
                    <span class="font-semibold text-slate-200">Dr. {{ selectedDoctorProfile?.firstName || selectedDoctor.firstName }} {{ selectedDoctorProfile?.lastName || selectedDoctor.lastName }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Email Address</span>
                    <span class="font-semibold text-slate-200">{{ selectedDoctorProfile?.email || selectedDoctor.email || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Contact Phone</span>
                    <span class="font-semibold text-slate-200">{{ selectedDoctorProfile?.contactInfo || selectedDoctor.contactInfo || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Gender & DOB</span>
                    <span class="font-semibold text-slate-200">{{ selectedDoctorProfile?.gender || selectedDoctor.gender || 'N/A' }} | {{ selectedDoctorProfile?.dateOfBirth || selectedDoctor.dateOfBirth || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Consultation Fees</span>
                    <span class="font-semibold text-emerald-400">₹{{ selectedDoctorProfile?.consultationFees || selectedDoctor.consultationFees || '0.00' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Languages Spoken</span>
                    <span class="font-semibold text-slate-200">{{ selectedDoctorProfile?.languages || 'English' }}</span>
                  </div>
                  <div class="sm:col-span-2">
                    <span class="text-slate-500 block">Clinic Address</span>
                    <span class="font-semibold text-slate-200">{{ selectedDoctorProfile?.address || selectedDoctor.address || 'Not Provided' }}</span>
                  </div>
                </div>
              </div>

              <!-- Section 2: Experience Records -->
              <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  🏥 Experience & Employment History ({{ selectedDoctorExperiences.length }})
                </h4>
                <div *ngIf="selectedDoctorExperiences.length === 0" class="text-xs text-slate-500 italic">
                  No experience records added yet.
                </div>
                <div *ngIf="selectedDoctorExperiences.length > 0" class="space-y-3">
                  <div *ngFor="let exp of selectedDoctorExperiences" class="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40">
                    <div class="flex justify-between items-start font-semibold text-slate-200">
                      <span>{{ exp.position }}</span>
                      <span class="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{{ exp.yearsOfService }} Years</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 font-medium">{{ exp.hospitalName }}</div>
                    <p *ngIf="exp.details" class="text-xs text-slate-500 mt-1.5">{{ exp.details }}</p>
                  </div>
                </div>
              </div>

              <!-- Section 3: Education & Academic Qualifications -->
              <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  🎓 Education & Degrees ({{ selectedDoctorEducations.length }})
                </h4>
                <div *ngIf="selectedDoctorEducations.length === 0" class="text-xs text-slate-500 italic">
                  No education records added yet.
                </div>
                <div *ngIf="selectedDoctorEducations.length > 0" class="space-y-3">
                  <div *ngFor="let edu of selectedDoctorEducations" class="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40">
                    <div class="flex justify-between items-start font-semibold text-slate-200">
                      <span>{{ edu.degree }}</span>
                      <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">Year: {{ edu.yearOfCompletion }}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 font-medium">{{ edu.institution }}</div>
                    <p *ngIf="edu.details" class="text-xs text-slate-500 mt-1.5">{{ edu.details }}</p>
                  </div>
                </div>
              </div>

              <!-- Section 4: Certificates & Documents -->
              <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  📜 Medical Licenses & Certificates ({{ selectedDoctorCertificates.length }})
                </h4>
                <div *ngIf="selectedDoctorCertificates.length === 0" class="text-xs text-slate-500 italic">
                  No certificates or medical licenses uploaded.
                </div>
                <div *ngIf="selectedDoctorCertificates.length > 0" class="space-y-3">
                  <div *ngFor="let cert of selectedDoctorCertificates" class="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex items-center justify-between gap-4">
                    <div>
                      <div class="font-semibold text-slate-200">{{ cert.name }}</div>
                      <div class="text-xs text-slate-400">{{ cert.issuingOrganization || 'Medical Board' }} | {{ cert.issueDate }}</div>
                    </div>
                    <a
                      *ngIf="cert.url"
                      [href]="cert.url"
                      target="_blank"
                      class="px-2.5 py-1 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg transition"
                    >
                      View Doc 🔗
                    </a>
                  </div>
                </div>
              </div>

            </ng-container>

          </div>

          <!-- Modal Footer / Verification Action Bar -->
          <div class="px-6 py-4 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between gap-4 sticky bottom-0 z-20">
            <button
              (click)="closeDoctorModal()"
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 transition"
            >
              Close
            </button>

            <div class="flex items-center gap-3">
              <button
                *ngIf="!selectedDoctor.isVerified"
                (click)="toggleDoctorVerification(selectedDoctor, true); closeDoctorModal()"
                [disabled]="verifyingDoctorId === selectedDoctor.id"
                class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
              >
                ✓ Verify & Approve Doctor
              </button>
              <button
                *ngIf="selectedDoctor.isVerified"
                (click)="toggleDoctorVerification(selectedDoctor, false); closeDoctorModal()"
                [disabled]="verifyingDoctorId === selectedDoctor.id"
                class="px-4 py-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition"
              >
                Diverify (Unverify Doctor)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  doctorService = inject(DoctorService);
  doctorProfileService = inject(DoctorProfileService);
  masterService = inject(MasterDataService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  activeTab: 'users' | 'doctors' | 'master' | 'security' = 'users';

  users: UserSummary[] = [];
  userSearch = '';
  selectedRoleFilter = 'ALL';
  togglingUsername: string | null = null;

  doctors: Doctor[] = [];
  doctorSearch = '';
  verifyingDoctorId: number | null = null;

  // Doctor Detail Modal State
  selectedDoctor: Doctor | null = null;
  selectedDoctorProfile: any = null;
  selectedDoctorExperiences: any[] = [];
  selectedDoctorEducations: any[] = [];
  selectedDoctorCertificates: any[] = [];
  loadingDoctorDetails = false;

  blockedIPs: BlockedIP[] = [];

  selectedMasterType = 'specializations';
  newMasterValue = '';
  masterItems: string[] = [];
  isSubmittingMaster = false;

  ngOnInit() {
    this.loadUsers();
    this.loadDoctors();
    this.loadBlockedIPs();
    this.loadCurrentMasterItems();
  }

  loadUsers() {
    this.adminService.getAllUsersSummary().subscribe({
      next: (data) => (this.users = data),
      error: (err) => this.toastService.showError('Failed to load users list')
    });
  }

  get filteredUsers(): UserSummary[] {
    return this.users.filter((u) => {
      const matchesSearch = !this.userSearch || u.username.toLowerCase().includes(this.userSearch.toLowerCase());
      const matchesRole = this.selectedRoleFilter === 'ALL' || u.role === this.selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }

  toggleUserStatus(u: UserSummary) {
    this.togglingUsername = u.username;
    this.adminService.toggleUserActiveStatus(u.username).subscribe({
      next: (res) => {
        u.isActive = res.isActive;
        this.togglingUsername = null;
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.togglingUsername = null;
        this.toastService.showError(err.error?.error || 'Failed to toggle user status');
      }
    });
  }

  loadDoctors() {
    this.adminService.getAllDoctors().subscribe({
      next: (data) => (this.doctors = data),
      error: (err) => this.toastService.showError('Failed to load doctors')
    });
  }

  get filteredDoctors(): Doctor[] {
    return this.doctors.filter((d) => {
      const q = this.doctorSearch.toLowerCase();
      const name = `${d.firstName || ''} ${d.lastName || ''} ${d.username || ''} ${d.specialization || ''}`.toLowerCase();
      return !q || name.includes(q);
    });
  }

  get verifiedDoctorCount(): number {
    return this.doctors.filter((d) => d.isVerified).length;
  }

  toggleDoctorVerification(doc: Doctor, verify: boolean) {
    this.verifyingDoctorId = doc.id;
    this.adminService.verifyDoctor(doc.id, verify).subscribe({
      next: (res) => {
        doc.isVerified = verify;
        this.verifyingDoctorId = null;
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.verifyingDoctorId = null;
        this.toastService.showError(err.error?.error || 'Failed to update doctor verification');
      }
    });
  }

  openDoctorModal(doc: Doctor) {
    this.selectedDoctor = doc;
    this.selectedDoctorProfile = doc;
    this.selectedDoctorExperiences = [];
    this.selectedDoctorEducations = [];
    this.selectedDoctorCertificates = [];
    this.loadingDoctorDetails = true;

    if (doc.username) {
      this.doctorProfileService.getProfile(doc.username).subscribe({
        next: (profile) => {
          this.selectedDoctorProfile = { ...doc, ...profile };
        },
        error: () => {
          this.selectedDoctorProfile = doc;
        }
      });

      this.doctorProfileService.getExperiences(doc.username).subscribe({
        next: (exp) => (this.selectedDoctorExperiences = exp || []),
        error: () => (this.selectedDoctorExperiences = [])
      });

      this.doctorProfileService.getEducations(doc.username).subscribe({
        next: (edu) => (this.selectedDoctorEducations = edu || []),
        error: () => (this.selectedDoctorEducations = [])
      });

      this.doctorProfileService.getCertificates(doc.username).subscribe({
        next: (cert) => {
          this.selectedDoctorCertificates = cert || [];
          this.loadingDoctorDetails = false;
        },
        error: () => {
          this.selectedDoctorCertificates = [];
          this.loadingDoctorDetails = false;
        }
      });
    } else {
      this.loadingDoctorDetails = false;
    }
  }

  closeDoctorModal() {
    this.selectedDoctor = null;
    this.selectedDoctorProfile = null;
    this.selectedDoctorExperiences = [];
    this.selectedDoctorEducations = [];
    this.selectedDoctorCertificates = [];
    this.loadingDoctorDetails = false;
  }

  loadCurrentMasterItems() {
    switch (this.selectedMasterType) {
      case 'specializations':
        this.masterService.getSpecializations().subscribe((data) => (this.masterItems = data));
        break;
      case 'hospitals':
        this.masterService.getHospitals().subscribe((data) => (this.masterItems = data));
        break;
      case 'degrees':
        this.masterService.getDegrees().subscribe((data) => (this.masterItems = data));
        break;
      case 'institutions':
        this.masterService.getInstitutions().subscribe((data) => (this.masterItems = data));
        break;
      case 'positions':
        this.masterService.getPositions().subscribe((data) => (this.masterItems = data));
        break;
      case 'languages':
        this.masterService.getLanguages().subscribe((data) => (this.masterItems = data));
        break;
      case 'blood-groups':
        this.masterService.getBloodGroups().subscribe((data) => (this.masterItems = data));
        break;
      case 'genders':
        this.masterService.getGenders().subscribe((data) => (this.masterItems = data));
        break;
      case 'statuses':
        this.masterService.getStatuses().subscribe((data) => (this.masterItems = data));
        break;
    }
  }

  submitMasterData() {
    if (!this.newMasterValue.trim()) return;
    this.isSubmittingMaster = true;
    this.adminService.addMasterData(this.selectedMasterType, this.newMasterValue.trim()).subscribe({
      next: (res) => {
        this.isSubmittingMaster = false;
        this.toastService.showSuccess(res.message);
        this.newMasterValue = '';
        this.loadCurrentMasterItems();
      },
      error: (err) => {
        this.isSubmittingMaster = false;
        this.toastService.showError(err.error?.error || 'Failed to add master data item');
      }
    });
  }

  loadBlockedIPs() {
    this.adminService.getBlockedIPs().subscribe({
      next: (data) => (this.blockedIPs = data),
      error: () => (this.blockedIPs = [])
    });
  }

  unblockSingleIP(ip: string) {
    this.adminService.unblockIP(ip).subscribe({
      next: (res) => {
        this.toastService.showSuccess(res.message);
        this.loadBlockedIPs();
      },
      error: (err) => this.toastService.showError('Failed to unblock IP')
    });
  }

  unblockAllIPs() {
    this.adminService.unblockAllIPs().subscribe({
      next: (res) => {
        this.toastService.showSuccess(res.message);
        this.loadBlockedIPs();
      },
      error: (err) => this.toastService.showError('Failed to unblock all IPs')
    });
  }

  logout() {
    this.authService.logout();
  }
}
