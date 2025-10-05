import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorProfileService, UpdateDoctorRequest, CreateEducationRequest, CreateExperienceRequest, CreateCertificateRequest } from '../../core/services/doctor-profile.service';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  private svc = inject(DoctorProfileService);
  auth = inject(AuthService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  profile: any = {};
  username: string | null = null;
  doctorId: number | null = null;

  // Profile form model
  profileForm: UpdateDoctorRequest = {
    firstName: '',
    lastName: '',
    specialization: '',
    contactInfo: '',
    email: '',
    isActive: true,
  };

  // Education
  educations: any[] = [];
  newEducation: CreateEducationRequest = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };

  // Experience
  experiences: any[] = [];
  newExperience: CreateExperienceRequest = { hospitalName: '', position: '', yearsOfService: 1, details: '' };

  // Certificates
  certificates: any[] = [];
  certFile?: File;
  certDescription: string = '';
  certEdit: Record<number, Partial<CreateCertificateRequest>> = {};

  // Documents
  documents: any[] = [];

  ngOnInit(): void {
    this.username = this.auth.username();
    const idStr = this.auth.userId();
    this.doctorId = idStr ? Number(idStr) : null;
    if (!this.username) {
      this.error.set('No authenticated doctor user');
      this.loading.set(false);
      return;
    }
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const u = this.username!;
    const id = this.doctorId;

    const docs$ = id != null ? this.svc.getDocumentsByDoctor(id) : of([]);

    forkJoin({
      profile: this.svc.getProfile(u),
      educations: this.svc.getEducations(u),
      experiences: this.svc.getExperiences(u),
      certificates: this.svc.getCertificates(u),
      documents: docs$,
    }).subscribe({
      next: ({ profile, educations, experiences, certificates, documents }) => {
        this.profile = profile;
        this.profileForm = {
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          specialization: profile?.specialization ?? '',
          contactInfo: profile?.contactInfo ?? '',
          email: profile?.email ?? '',
          isActive: profile?.isActive ?? true,
        };
        this.educations = educations || [];
        this.experiences = experiences || [];
        this.certificates = certificates || [];
        this.documents = documents || [];
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  // Profile update
  saveProfile() {
    if (!this.username) return;
    this.svc.updateProfile(this.username, this.profileForm).subscribe({ next: (resp) => (this.profile = resp) });
  }

  // Profile image upload
  onProfileImageSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.doctorId == null) return;
    this.svc.uploadProfileImage(file, this.doctorId, 'Profile image').subscribe({
      next: () => this.loadAll(),
    });
  }

  // Education CRUD
  addEducation() {
    if (!this.username) return;
    this.svc.addEducation(this.username, this.newEducation).subscribe({
      next: (e) => {
        this.educations.push(e);
        this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
      },
    });
  }

  updateEducation(item: any) {
    if (!this.username) return;
    this.svc.updateEducation(this.username, item.id, {
      degree: item.degree,
      institution: item.institution,
      yearOfCompletion: item.yearOfCompletion,
      details: item.details,
    }).subscribe();
  }

  deleteEducation(item: any) {
    if (!this.username) return;
    this.svc.deleteEducation(this.username, item.id).subscribe({
      next: () => (this.educations = this.educations.filter((e) => e.id !== item.id)),
    });
  }

  // Experience CRUD
  addExperience() {
    if (!this.username) return;
    this.svc.addExperience(this.username, this.newExperience).subscribe({
      next: (e) => {
        this.experiences.push(e);
        this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
      },
    });
  }

  updateExperience(item: any) {
    if (!this.username) return;
    this.svc.updateExperience(this.username, item.id, {
      hospitalName: item.hospitalName,
      position: item.position,
      yearsOfService: item.yearsOfService,
      details: item.details,
    }).subscribe();
  }

  deleteExperience(item: any) {
    if (!this.username) return;
    this.svc.deleteExperience(this.username, item.id).subscribe({
      next: () => (this.experiences = this.experiences.filter((e) => e.id !== item.id)),
    });
  }

  // Certificates
  onCertFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.certFile = input.files?.[0] || undefined;
  }

  uploadCertificate() {
    if (!this.certFile || this.doctorId == null) return;
    this.svc.uploadCertificateFile(this.certFile, this.doctorId, this.certDescription).subscribe({
      next: (resp) => {
        // Create metadata update payload using returned cloudinary URL
        const certificateId = resp?.certificateId;
        const cloudinaryUrl = resp?.cloudinaryUrl;
        if (this.username && certificateId && cloudinaryUrl) {
          const payload: CreateCertificateRequest = {
            name: resp?.filename || 'Certificate',
            url: cloudinaryUrl,
            details: this.certDescription,
          };
          this.svc.updateCertificate(this.username, certificateId, payload).subscribe({
            next: () => this.svc.getCertificates(this.username!).subscribe({ next: (list) => (this.certificates = list || []) }),
          });
        }
        this.certFile = undefined;
        this.certDescription = '';
      },
    });
  }

  replaceCertificateFile(item: any, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.doctorId == null) return;
    this.svc.uploadCertificateFile(file, this.doctorId, item.details, item.id).subscribe({
      next: (resp) => {
        const cloudinaryUrl = resp?.cloudinaryUrl;
        if (this.username && cloudinaryUrl) {
          const payload: CreateCertificateRequest = {
            name: item.name,
            url: cloudinaryUrl,
            details: item.details,
            issuingOrganization: item.issuingOrganization,
            issueDate: item.issueDate,
            expiryDate: item.expiryDate,
            credentialId: item.credentialId,
            credentialUrl: item.credentialUrl,
          };
          this.svc.updateCertificate(this.username, item.id, payload).subscribe({
            next: () => this.svc.getCertificates(this.username!).subscribe({ next: (list) => (this.certificates = list || []) }),
          });
        }
      },
    });
  }

  saveCertificateMeta(item: any) {
    if (!this.username) return;
    const edited = this.certEdit[item.id] || {};
    const payload: CreateCertificateRequest = {
      name: edited.name ?? item.name,
      url: edited.url ?? item.url,
      details: edited.details ?? item.details,
      issuingOrganization: edited.issuingOrganization ?? item.issuingOrganization,
      issueDate: edited.issueDate ?? item.issueDate,
      expiryDate: edited.expiryDate ?? item.expiryDate,
      credentialId: edited.credentialId ?? item.credentialId,
      credentialUrl: edited.credentialUrl ?? item.credentialUrl,
    };
    this.svc.updateCertificate(this.username, item.id, payload).subscribe({
      next: (updated) => {
        const idx = this.certificates.findIndex((c) => c.id === item.id);
        if (idx >= 0) this.certificates[idx] = updated;
      },
    });
  }

  deleteCertificate(item: any) {
    if (!this.username) return;
    this.svc.deleteCertificate(this.username, item.id).subscribe({
      next: () => (this.certificates = this.certificates.filter((c) => c.id !== item.id)),
    });
  }

  // Documents
  deleteDocument(doc: any) {
    this.svc.deleteDocument(doc.id).subscribe({
      next: () => (this.documents = this.documents.filter((d) => d.id !== doc.id)),
    });
  }

  updateDocDescription(doc: any) {
    this.svc.updateDocumentDescription(doc.id, doc.description || '').subscribe();
  }
}