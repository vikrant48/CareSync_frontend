import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserSummary, BlockedIP, AdminDoctorListItem } from '../../core/services/admin.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SkeletonComponent, FilterBarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
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

  doctors: AdminDoctorListItem[] = [];
  doctorSearch = '';
  selectedDoctorVerificationFilter: 'ALL' | 'VERIFIED' | 'UNVERIFIED' = 'ALL';
  doctorPage = 0;
  doctorSize = 30;
  doctorTotalElements = 0;
  doctorTotalPages = 0;
  totalVerifiedDoctorsCount = 0;
  totalPendingDoctorsCount = 0;
  private doctorSearchTimeout: any = null;

  loadingUsers = true;
  loadingDoctors = true;
  verifyingDoctorId: number | null = null;

  // Doctor Detail Modal State
  selectedDoctor: any = null;
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

  // Master Data Delete Confirmation Modal State
  itemToDelete: string | null = null;
  isDeletingMaster = false;

  // Password Reset Modal State
  selectedUserForPasswordReset: UserSummary | null = null;
  newPasswordInput = '';
  confirmPasswordInput = '';
  showNewPasswordText = false;
  showConfirmPasswordText = false;
  isSubmittingPasswordReset = false;

  ngOnInit() {
    this.loadUsers();
    this.loadDoctors();
    this.loadBlockedIPs();
    this.loadCurrentMasterItems();
  }

  loadUsers() {
    this.loadingUsers = true;
    this.adminService.getAllUsersSummary().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: (err) => {
        this.loadingUsers = false;
        this.toastService.showError('Failed to load users list');
      }
    });
  }

  get userFilterActiveCount(): number {
    let count = 0;
    if (this.userSearch) count++;
    if (this.selectedRoleFilter !== 'ALL') count++;
    return count;
  }

  clearUserFilters() {
    this.userSearch = '';
    this.selectedRoleFilter = 'ALL';
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
    this.loadingDoctors = true;
    let isVerFilter: boolean | string | undefined = undefined;
    if (this.selectedDoctorVerificationFilter === 'VERIFIED') isVerFilter = true;
    if (this.selectedDoctorVerificationFilter === 'UNVERIFIED') isVerFilter = false;

    this.adminService.getAdminDoctors(this.doctorPage, this.doctorSize, this.doctorSearch, isVerFilter).subscribe({
      next: (res) => {
        this.doctors = res.content || [];
        this.doctorTotalElements = res.totalElements || 0;
        this.doctorTotalPages = res.totalPages || 0;
        this.totalVerifiedDoctorsCount = res.totalVerifiedCount ?? 0;
        this.totalPendingDoctorsCount = res.totalPendingCount ?? 0;
        this.loadingDoctors = false;
      },
      error: (err) => {
        this.loadingDoctors = false;
        this.toastService.showError('Failed to load doctors');
      }
    });
  }

  onDoctorSearchChange() {
    if (this.doctorSearchTimeout) {
      clearTimeout(this.doctorSearchTimeout);
    }
    this.doctorSearchTimeout = setTimeout(() => {
      this.doctorPage = 0;
      this.loadDoctors();
    }, 300);
  }

  onDoctorVerificationFilterChange() {
    this.doctorPage = 0;
    this.loadDoctors();
  }

  goToDoctorPage(page: number) {
    if (page >= 0 && page < this.doctorTotalPages) {
      this.doctorPage = page;
      this.loadDoctors();
    }
  }

  get doctorFilterActiveCount(): number {
    let count = 0;
    if (this.doctorSearch) count++;
    if (this.selectedDoctorVerificationFilter !== 'ALL') count++;
    return count;
  }

  clearDoctorFilters() {
    this.doctorSearch = '';
    this.selectedDoctorVerificationFilter = 'ALL';
    this.doctorPage = 0;
    this.loadDoctors();
  }

  get filteredDoctors(): AdminDoctorListItem[] {
    return this.doctors;
  }

  get verifiedDoctorCount(): number {
    return this.totalVerifiedDoctorsCount;
  }

  toggleDoctorVerification(doc: AdminDoctorListItem, verify: boolean) {
    const prevVerified = doc.isVerified;
    this.verifyingDoctorId = doc.id;
    this.adminService.verifyDoctor(doc.id, verify).subscribe({
      next: (res) => {
        doc.isVerified = verify;
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
    this.selectedDoctor = null;
    this.selectedDoctorProfile = doc;
    this.selectedDoctorExperiences = [];
    this.selectedDoctorEducations = [];
    this.selectedDoctorCertificates = [];
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
      error: (err) => {
        this.loadingDoctorDetails = false;
        this.toastService.showError('Failed to load doctor profile details');
      }
    });
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

  get totalUsersCount(): number {
    return this.users.length;
  }

  get activeDoctorsCount(): number {
    return this.totalVerifiedDoctorsCount;
  }

  get pendingDoctorsCount(): number {
    return this.totalPendingDoctorsCount;
  }

  get blockedIPsCount(): number {
    return this.blockedIPs.length;
  }

  logout() {
    this.authService.logout();
  }
}
