import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserSummary, BlockedIP } from '../../core/services/admin.service';
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

  doctors: Doctor[] = [];
  doctorSearch = '';
  loadingUsers = true;
  loadingDoctors = true;
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

  // Master Data Delete Confirmation Modal State
  itemToDelete: string | null = null;
  isDeletingMaster = false;

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
    this.adminService.getAllDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.loadingDoctors = false;
      },
      error: (err) => {
        this.loadingDoctors = false;
        this.toastService.showError('Failed to load doctors');
      }
    });
  }

  get doctorFilterActiveCount(): number {
    return this.doctorSearch ? 1 : 0;
  }

  clearDoctorFilters() {
    this.doctorSearch = '';
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

  logout() {
    this.authService.logout();
  }
}
