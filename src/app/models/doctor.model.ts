import { Doctor as BaseDoctor, Experience, Education, Certificate } from './user.model';

export interface DoctorAppointment {
  id: number;
  appointmentDateTime: string;
  status: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  statusChangedBy: string;
}

export interface DoctorFeedback {
  id: number;
  rating: number;
  comment: string;
  patientName: string;
  createdAt: string;
}

// Extended Doctor interface for profile API response
export interface DoctorProfile extends BaseDoctor {
  password?: string;
  lastLogin: string;
  dateOfBirth: string;
  experiences: Experience[];
  educations: Education[];
  certificates: Certificate[];
  appointments: DoctorAppointment[];
  feedbacks: DoctorFeedback[];
  name: string;
}

// Re-export the base Doctor for compatibility
export type { Doctor, Experience, Education, Certificate } from './user.model';

export interface UpdateDoctorRequest {
  firstName: string;
  lastName: string;
  specialization: string;
  contactInfo: string;
  email: string;
  isActive: boolean;
}

export interface CreateExperienceRequest {
  hospitalName: string;
  position: string;
  yearsOfService: number;
  details: string;
}

export interface CreateEducationRequest {
  degree: string;
  institution: string;
  yearOfCompletion: number;
  details: string;
}

export interface CreateCertificateRequest {
  name: string;
  url?: string;
  details?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}