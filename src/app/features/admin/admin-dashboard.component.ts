import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, UserSummary, BlockedIP, AdminDoctorListItem } from '../../core/services/admin.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { AdminChromeComponent, AdminSection } from './admin-chrome.component';
import { AdminSessionsModalComponent } from './admin-sessions-modal.component';
import { AdminReencryptionCardComponent } from './admin-reencryption-card.component';
import { AdminAppointmentsComponent } from './admin-appointments.component';
import { AdminLabTestsComponent } from './admin-lab-tests.component';
import { AdminPlatformStatsComponent } from './admin-platform-stats.component';
import { AdminSpecializationStatsComponent } from './admin-specialization-stats.component';
import { ConfirmService } from '../../core/services/confirm.service';

type DashboardSection = Exclude<AdminSection, 'analytics'>;

interface MasterType {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, PageLoaderComponent, PaginatorComponent, StatCardComponent,
    FilterBarComponent, AdminChromeComponent, AdminSessionsModalComponent,
    AdminReencryptionCardComponent, AdminAppointmentsComponent, AdminLabTestsComponent,
    AdminPlatformStatsComponent, AdminSpecializationStatsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-ui.css'],
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  masterService = inject(MasterDataService);
  toastService = inject(ToastService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private readonly sections: DashboardSection[] = ['overview', 'specializations', 'users', 'doctors', 'appointments', 'labtests',
    'master', 'security'];
  activeTab: DashboardSection = 'overview';

  // ---------------------------------------------------------------- users
  users: UserSummary[] = [];
  userSearch = '';
  selectedRoleFilter = 'ALL';
  selectedStatusFilter = 'ALL';
  togglingUsername: string | null = null;
  userPage = 0;
  readonly userPageSize = 20;
  loadingUsers = true;
  sessionsForUsername: string | null = null;

  readonly userFilterConfigs: FilterConfig[] = [
    {
      type: 'search',
      key: 'userSearch',
      label: 'Search',
      placeholder: 'Username or user ID...',
      defaultValue: ''
    },
    {
      type: 'select',
      key: 'role',
      label: 'Role',
      defaultValue: 'ALL',
      width: 'w-full sm:w-44',
      options: [
        { label: 'All roles', value: 'ALL' },
        { label: 'Doctors', value: 'DOCTOR' },
        { label: 'Patients', value: 'PATIENT' },
        { label: 'Admins', value: 'ADMIN' }
      ]
    },
    {
      type: 'select',
      key: 'status',
      label: 'Status',
      defaultValue: 'ALL',
      width: 'w-full sm:w-44',
      options: [
        { label: 'Any status', value: 'ALL' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ]
    }
  ];

  userFilterValues: Record<string, string> = {
    userSearch: '',
    role: 'ALL',
    status: 'ALL'
  };

  // ---------------------------------------------------------------- doctors
  doctors: AdminDoctorListItem[] = [];
  doctorSearch = '';
  selectedDoctorVerificationFilter: 'ALL' | 'VERIFIED' | 'UNVERIFIED' = 'ALL';
  doctorPage = 0;
  readonly doctorSize = 20;
  doctorTotalElements = 0;
  totalVerifiedDoctorsCount = 0;
  totalPendingDoctorsCount = 0;
  loadingDoctors = true;
  verifyingDoctorId: number | null = null;

  doctorFilterConfigs: FilterConfig[] = [
    {
      type: 'search',
      key: 'doctorSearch',
      label: 'Search',
      placeholder: 'Doctor name or specialization...',
      defaultValue: ''
    },
    {
      type: 'radio',
      key: 'verification',
      label: 'Verification',
      defaultValue: 'ALL',
      width: 'w-full sm:w-auto',
      options: [
        { label: 'All', value: 'ALL' },
        { label: 'Waiting', value: 'UNVERIFIED' },
        { label: 'Verified', value: 'VERIFIED' }
      ]
    }
  ];

  doctorFilterValues: Record<string, string> = {
    doctorSearch: '',
    verification: 'ALL'
  };

  // Doctor detail modal
  selectedDoctor: any = null;
  selectedDoctorProfile: any = null;
  selectedDoctorExperiences: any[] = [];
  selectedDoctorEducations: any[] = [];
  selectedDoctorCertificates: any[] = [];
  certificateReviews: Record<number, import('../../core/models/appointment.models').CertificateReview> = {};
  reviewingCertificateId: number | null = null;
  loadingDoctorDetails = false;

  // ---------------------------------------------------------------- master data
  readonly masterTypes: MasterType[] = [
    { key: 'specializations', label: 'Specializations', icon: 'fa-solid fa-stethoscope' },
    { key: 'hospitals', label: 'Hospitals', icon: 'fa-solid fa-hospital' },
    { key: 'degrees', label: 'Degrees', icon: 'fa-solid fa-graduation-cap' },
    { key: 'institutions', label: 'Institutions', icon: 'fa-solid fa-building-columns' },
    { key: 'positions', label: 'Positions', icon: 'fa-solid fa-briefcase' },
    { key: 'languages', label: 'Languages', icon: 'fa-solid fa-language' },
    { key: 'blood-groups', label: 'Blood groups', icon: 'fa-solid fa-droplet' },
    { key: 'genders', label: 'Genders', icon: 'fa-solid fa-venus-mars' },
    { key: 'statuses', label: 'Statuses', icon: 'fa-solid fa-tag' },
  ];
  selectedMasterType = 'specializations';
  newMasterValue = '';
  masterSearch = '';
  masterItems: string[] = [];
  loadingMaster = false;
  isSubmittingMaster = false;
  itemToDelete: string | null = null;
  isDeletingMaster = false;

  // ---------------------------------------------------------------- security
  blockedIPs: BlockedIP[] = [];
  loadingBlockedIPs = true;
  unblockingIp: string | null = null;
  blockIpAddress = '';
  blockReason = '';
  blockHours = 24;
  isBlockingIp = false;
  readonly blockDurations = [
    { label: '1 hour', value: 1 },
    { label: '24 hours', value: 24 },
    { label: '7 days', value: 168 },
    { label: '30 days', value: 720 },
  ];

  // ---------------------------------------------------------------- password reset modal
  selectedUserForPasswordReset: UserSummary | null = null;
  newPasswordInput = '';
  confirmPasswordInput = '';
  showNewPasswordText = false;
  showConfirmPasswordText = false;
  isSubmittingPasswordReset = false;

  ngOnInit() {
    let firstParams = true;
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as DashboardSection | null;
      this.activeTab = tab && this.sections.includes(tab) ? tab : 'overview';
      const verification = params.get('verification');
      if (this.activeTab === 'doctors' && (verification === 'VERIFIED' || verification === 'UNVERIFIED')
        && verification !== this.selectedDoctorVerificationFilter) {
        // The first time, loadDoctors() below picks the filter up
        this.setDoctorVerificationFilter(verification, !firstParams);
      }
      firstParams = false;
    });
    this.loadUsers();
    this.loadDoctors();
    this.loadBlockedIPs();
    this.loadCurrentMasterItems();
  }

  /** Overview shortcuts; doctors can open pre-filtered */
  openSection(tab: DashboardSection, verification?: 'VERIFIED' | 'UNVERIFIED') {
    const queryParams: Record<string, string> = { tab };
    if (verification) queryParams['verification'] = verification;
    this.router.navigate(['/admin'], { queryParams });
  }

  // ---------------------------------------------------------------- users
  loadUsers() {
    this.loadingUsers = true;
    this.adminService.getAllUsersSummary().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
        this.toastService.showError('Failed to load users list');
      }
    });
  }

  onUserFilterChange(values: Record<string, string>) {
    this.userSearch = (values['userSearch'] || '').trim();
    this.selectedRoleFilter = values['role'] || 'ALL';
    this.selectedStatusFilter = values['status'] || 'ALL';
    this.userPage = 0;
  }

  get filteredUsers(): UserSummary[] {
    const term = this.userSearch.toLowerCase().replace(/^#/, '');
    return this.users.filter((u) => {
      const matchesSearch = !term || u.username.toLowerCase().includes(term) || String(u.userId).includes(term);
      const matchesRole = this.selectedRoleFilter === 'ALL' || u.role === this.selectedRoleFilter;
      const matchesStatus = this.selectedStatusFilter === 'ALL'
        || (this.selectedStatusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get pagedUsers(): UserSummary[] {
    const start = this.userPage * this.userPageSize;
    return this.filteredUsers.slice(start, start + this.userPageSize);
  }

  countUsers(role: string): number {
    return this.users.filter((u) => u.role === role).length;
  }

  get inactiveUsersCount(): number {
    return this.users.filter((u) => !u.isActive).length;
  }

  async toggleUserStatus(u: UserSummary) {
    if (u.isActive) {
      const ok = await this.confirm.ask({ title: 'Deactivate user', message: `Deactivate ${u.username}? They will no longer be able to sign in.`, confirmLabel: 'Deactivate', cancelLabel: 'Cancel', danger: true });
      if (!ok) return;
    }
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

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'DOCTOR': return 'adm-badge--primary';
      case 'PATIENT': return 'adm-badge--info';
      case 'ADMIN': return 'adm-badge--violet';
      default: return 'adm-badge--neutral';
    }
  }

  roleLabel(role: string): string {
    return role ? role.charAt(0) + role.slice(1).toLowerCase() : '';
  }

  openSessions(u: UserSummary) {
    this.sessionsForUsername = u.username;
  }

  // ---------------------------------------------------------------- doctors
  loadDoctors() {
    this.loadingDoctors = true;
    let isVerFilter: boolean | undefined = undefined;
    if (this.selectedDoctorVerificationFilter === 'VERIFIED') isVerFilter = true;
    if (this.selectedDoctorVerificationFilter === 'UNVERIFIED') isVerFilter = false;

    this.adminService.getAdminDoctors(this.doctorPage, this.doctorSize, this.doctorSearch, isVerFilter).subscribe({
      next: (res) => {
        this.doctors = res.content || [];
        this.doctorTotalElements = res.totalElements || 0;
        this.totalVerifiedDoctorsCount = res.totalVerifiedCount ?? 0;
        this.totalPendingDoctorsCount = res.totalPendingCount ?? 0;
        this.loadingDoctors = false;
      },
      error: () => {
        this.loadingDoctors = false;
        this.toastService.showError('Failed to load doctors');
      }
    });
  }

  private setDoctorVerificationFilter(verification: 'ALL' | 'VERIFIED' | 'UNVERIFIED', reload = true) {
    this.selectedDoctorVerificationFilter = verification;
    this.doctorFilterValues = { doctorSearch: this.doctorSearch, verification };
    this.doctorPage = 0;
    if (reload) this.loadDoctors();
  }

  onDoctorFilterChange(values: Record<string, string>) {
    const search = (values['doctorSearch'] || '').trim();
    const raw = values['verification'] || 'ALL';
    const verification = raw === 'VERIFIED' || raw === 'UNVERIFIED' ? raw : 'ALL';
    if (search === this.doctorSearch && verification === this.selectedDoctorVerificationFilter) return;
    this.doctorSearch = search;
    this.selectedDoctorVerificationFilter = verification;
    this.doctorPage = 0;
    this.loadDoctors();
  }

  goToDoctorPage(page: number) {
    this.doctorPage = page;
    this.loadDoctors();
  }

  doctorName(doc: { name?: string; firstName?: string; lastName?: string; username?: string }): string {
    const full = doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
    return full || doc.username || 'Doctor';
  }

  async toggleDoctorVerification(doc: AdminDoctorListItem, verify: boolean) {
    if (!verify) {
      const ok = await this.confirm.ask({
        title: 'Remove verification',
        message: `Remove the verified badge from Dr. ${this.doctorName(doc)}? Patients will see them as not verified.`,
        confirmLabel: 'Remove verification',
        cancelLabel: 'Cancel',
        danger: true
      });
      if (!ok) return;
    }
    const prevVerified = doc.isVerified;
    this.verifyingDoctorId = doc.id;
    this.adminService.verifyDoctor(doc.id, verify).subscribe({
      next: (res) => {
        // Update the row and, when open, the detail dialog (they are different objects)
        const row = this.doctors.find((d) => d.id === doc.id);
        if (row) row.isVerified = verify;
        if (this.selectedDoctor?.id === doc.id) this.selectedDoctor.isVerified = verify;
        if (verify && !prevVerified) {
          this.totalVerifiedDoctorsCount++;
          this.totalPendingDoctorsCount = Math.max(0, this.totalPendingDoctorsCount - 1);
        } else if (!verify && prevVerified) {
          this.totalVerifiedDoctorsCount = Math.max(0, this.totalVerifiedDoctorsCount - 1);
          this.totalPendingDoctorsCount++;
        }
        this.verifyingDoctorId = null;
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.verifyingDoctorId = null;
        this.toastService.showError(err.error?.error || 'Failed to update doctor verification');
      }
    });
  }

  openDoctorModal(doc: AdminDoctorListItem) {
    this.selectedDoctor = { ...doc };
    this.selectedDoctorProfile = doc;
    this.selectedDoctorExperiences = [];
    this.selectedDoctorEducations = [];
    this.selectedDoctorCertificates = [];
    this.certificateReviews = {};
    this.reviewingCertificateId = null;
    this.loadingDoctorDetails = true;

    this.adminService.getDoctorDetails(doc.id).subscribe({
      next: (fullDoc: any) => {
        this.selectedDoctor = fullDoc;
        this.selectedDoctorProfile = fullDoc;
        this.selectedDoctorExperiences = fullDoc.experiences || [];
        this.selectedDoctorEducations = fullDoc.educations || [];
        this.selectedDoctorCertificates = fullDoc.certificates || [];
        this.loadingDoctorDetails = false;
      },
      error: () => {
        this.loadingDoctorDetails = false;
        this.toastService.showError('Failed to load doctor profile details');
      }
    });
  }

  formatLanguages(value: unknown): string {
    const items = Array.isArray(value) ? value : String(value ?? '').split(',');
    const text = items.map(item => String(item).trim()).filter(Boolean).join(', ');
    return text || 'Not provided';
  }

  closeDoctorModal() {
    this.selectedDoctor = null;
    this.selectedDoctorProfile = null;
    this.selectedDoctorExperiences = [];
    this.selectedDoctorEducations = [];
    this.selectedDoctorCertificates = [];
    this.certificateReviews = {};
    this.reviewingCertificateId = null;
    this.loadingDoctorDetails = false;
  }

  reviewCertificate(cert: any) {
    if (!this.selectedDoctor?.id || !cert?.id) return;
    this.reviewingCertificateId = cert.id;
    this.adminService.reviewCertificate(this.selectedDoctor.id, cert.id).subscribe({
      next: review => {
        this.certificateReviews = { ...this.certificateReviews, [cert.id]: review };
        this.reviewingCertificateId = null;
      },
      error: err => {
        this.reviewingCertificateId = null;
        this.toastService.showError(err?.error?.error || 'Could not review this certificate');
      }
    });
  }

  // ---------------------------------------------------------------- master data
  get selectedMasterLabel(): string {
    return this.masterTypes.find((t) => t.key === this.selectedMasterType)?.label || this.selectedMasterType;
  }

  /** Placeholder hint for the add field */
  get masterExample(): string {
    const examples: Record<string, string> = {
      'specializations': 'Cardiology', 'hospitals': 'City Hospital', 'degrees': 'MBBS', 'institutions': 'AIIMS Delhi',
      'positions': 'Senior Consultant', 'languages': 'Hindi', 'blood-groups': 'O+', 'genders': 'Female', 'statuses': 'Active',
    };
    return examples[this.selectedMasterType] || '...';
  }

  get filteredMasterItems(): string[] {
    const term = this.masterSearch.trim().toLowerCase();
    return term ? this.masterItems.filter((i) => i.toLowerCase().includes(term)) : this.masterItems;
  }

  /** Same value already in the list (case-insensitive), so the admin sees it before saving */
  get masterValueExists(): boolean {
    const value = this.newMasterValue.trim().toLowerCase();
    return !!value && this.masterItems.some((i) => i.toLowerCase() === value);
  }

  selectMasterType(key: string) {
    if (key === this.selectedMasterType) return;
    this.selectedMasterType = key;
    this.masterSearch = '';
    this.newMasterValue = '';
    this.loadCurrentMasterItems();
  }

  loadCurrentMasterItems() {
    const loaders: Record<string, () => ReturnType<MasterDataService['getSpecializations']>> = {
      'specializations': () => this.masterService.getSpecializations(),
      'hospitals': () => this.masterService.getHospitals(),
      'degrees': () => this.masterService.getDegrees(),
      'institutions': () => this.masterService.getInstitutions(),
      'positions': () => this.masterService.getPositions(),
      'languages': () => this.masterService.getLanguages(),
      'blood-groups': () => this.masterService.getBloodGroups(),
      'genders': () => this.masterService.getGenders(),
      'statuses': () => this.masterService.getStatuses(),
    };
    const load = loaders[this.selectedMasterType];
    if (!load) return;
    const type = this.selectedMasterType;
    this.loadingMaster = true;
    load().subscribe({
      next: (data) => {
        if (type !== this.selectedMasterType) return;
        this.masterItems = [...(data || [])].sort((a, b) => a.localeCompare(b));
        this.loadingMaster = false;
      },
      error: () => {
        this.loadingMaster = false;
        this.toastService.showError('Failed to load master data');
      }
    });
  }

  submitMasterData() {
    const value = this.newMasterValue.trim();
    if (!value || this.masterValueExists) return;
    this.isSubmittingMaster = true;
    this.adminService.addMasterData(this.selectedMasterType, value).subscribe({
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

  openDeleteConfirmation(value: string) {
    this.itemToDelete = value;
  }

  confirmDeleteMasterItem() {
    if (!this.itemToDelete) return;
    const value = this.itemToDelete;
    this.isDeletingMaster = true;

    this.masterService.deleteMasterData(this.selectedMasterType, value).subscribe({
      next: (res) => {
        this.isDeletingMaster = false;
        this.itemToDelete = null;
        this.toastService.showSuccess(res.message || `Deleted '${value}'`);
        this.loadCurrentMasterItems();
      },
      error: (err) => {
        this.isDeletingMaster = false;
        this.toastService.showError(err.error?.error || 'Failed to delete master data item');
      }
    });
  }

  // ---------------------------------------------------------------- security
  loadBlockedIPs() {
    this.loadingBlockedIPs = true;
    this.adminService.getBlockedIPs().subscribe({
      next: (data) => {
        this.blockedIPs = data || [];
        this.loadingBlockedIPs = false;
      },
      error: () => {
        this.blockedIPs = [];
        this.loadingBlockedIPs = false;
      }
    });
  }

  unblockSingleIP(ip: string) {
    this.unblockingIp = ip;
    this.adminService.unblockIP(ip).subscribe({
      next: (res) => {
        this.unblockingIp = null;
        this.toastService.showSuccess(res.message);
        this.loadBlockedIPs();
      },
      error: () => {
        this.unblockingIp = null;
        this.toastService.showError('Failed to unblock IP');
      }
    });
  }

  async unblockAllIPs() {
    const ok = await this.confirm.ask({ title: 'Unblock all IPs', message: `Remove all ${this.blockedIPs.length} IP addresses from the block list?`, confirmLabel: 'Unblock all', cancelLabel: 'Cancel', danger: true });
    if (!ok) return;
    this.adminService.unblockAllIPs().subscribe({
      next: (res) => {
        this.toastService.showSuccess(res.message);
        this.loadBlockedIPs();
      },
      error: () => this.toastService.showError('Failed to unblock all IPs')
    });
  }

  /** IPv4 (each part 0-255) or IPv6 (hex groups with colons) */
  get blockIpValid(): boolean {
    const ip = this.blockIpAddress.trim();
    const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    const v6 = /^[0-9a-fA-F:]+$/;
    return v4.test(ip) || (ip.includes(':') && v6.test(ip) && ip.length <= 39);
  }

  async submitBlockIp() {
    const ip = this.blockIpAddress.trim();
    if (!this.blockIpValid) {
      this.toastService.showError('Enter a valid IP address, e.g. 203.0.113.7');
      return;
    }
    const duration = this.blockDurations.find((d) => d.value === this.blockHours)?.label || `${this.blockHours} hours`;
    const ok = await this.confirm.ask({ title: 'Block IP address', message: `Block ${ip} for ${duration}? Nobody can sign in from it during that time.`, confirmLabel: 'Block', cancelLabel: 'Cancel', danger: true });
    if (!ok) return;
    this.isBlockingIp = true;
    this.adminService.blockIP(ip, this.blockReason.trim() || 'Manually blocked by admin', this.blockHours).subscribe({
      next: (res) => {
        this.isBlockingIp = false;
        this.blockIpAddress = '';
        this.blockReason = '';
        this.toastService.showSuccess(res.message);
        this.loadBlockedIPs();
      },
      error: (err) => {
        this.isBlockingIp = false;
        this.toastService.showError(err.error?.error || 'Failed to block IP address');
      }
    });
  }

  // ---------------------------------------------------------------- password reset
  openPasswordResetModal(user: UserSummary) {
    this.selectedUserForPasswordReset = user;
    this.newPasswordInput = '';
    this.confirmPasswordInput = '';
    this.showNewPasswordText = false;
    this.showConfirmPasswordText = false;
  }

  closePasswordResetModal() {
    this.selectedUserForPasswordReset = null;
    this.newPasswordInput = '';
    this.confirmPasswordInput = '';
    this.isSubmittingPasswordReset = false;
  }

  /** Live checklist shown under the new password field (same rule the backend enforces) */
  get passwordChecks(): { label: string; ok: boolean }[] {
    const p = this.newPasswordInput;
    return [
      { label: 'At least 8 characters', ok: p.length >= 8 },
      { label: 'An uppercase letter', ok: /[A-Z]/.test(p) },
      { label: 'A lowercase letter', ok: /[a-z]/.test(p) },
      { label: 'A number', ok: /[0-9]/.test(p) },
      { label: 'A special character (@#$%^&+=!)', ok: /[@#$%^&+=!]/.test(p) },
    ];
  }

  get passwordsMatch(): boolean {
    return !!this.confirmPasswordInput && this.newPasswordInput === this.confirmPasswordInput;
  }

  submitPasswordReset() {
    if (!this.selectedUserForPasswordReset) return;

    if (!this.newPasswordInput || !this.confirmPasswordInput) {
      this.toastService.showError('Please enter and confirm the new password');
      return;
    }

    if (this.newPasswordInput !== this.confirmPasswordInput) {
      this.toastService.showError('New password and confirm password do not match');
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
    if (!passwordRegex.test(this.newPasswordInput)) {
      this.toastService.showError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special char');
      return;
    }

    this.isSubmittingPasswordReset = true;
    this.adminService.changeUserPassword(
      this.selectedUserForPasswordReset.userId,
      this.newPasswordInput,
      this.confirmPasswordInput
    ).subscribe({
      next: (res) => {
        this.isSubmittingPasswordReset = false;
        this.toastService.showSuccess(res.message || 'Password changed successfully!');
        this.closePasswordResetModal();
      },
      error: (err) => {
        this.isSubmittingPasswordReset = false;
        this.toastService.showError(err.error?.error || 'Failed to change password');
      }
    });
  }

  // ---------------------------------------------------------------- overview
  get totalUsersCount(): number {
    return this.users.length;
  }
}
