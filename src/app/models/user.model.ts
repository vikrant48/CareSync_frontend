export enum UserRole {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  bio?: string;
}

export interface Doctor extends User {
  role: UserRole.DOCTOR;
  specialization: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  contactInfo?: string;
  education: Education[];
  experience: Experience[];
  certificates: Certificate[];
  rating?: number;
  totalPatients?: number;
  totalAppointments?: number;
  yearsOfExperience?: number;
  consultationFee?: number;
  availability?: DoctorAvailability[];
  averageRating?: number;
  ratingDistribution?: RatingDistribution;
}

export interface Patient extends User {
  role: UserRole.PATIENT;
  dateOfBirth: string;
  emergencyContact: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  illnessDetails?: string;
  contactInfo?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  medicalHistories?: MedicalHistory[];
  healthSummary?: HealthSummary;
}

export interface MedicalHistory {
  id: number;
  patientId: number;
  doctorId?: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistoryCreate {
  patientId: number;
  doctorId?: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

export interface MedicalHistoryUpdate {
  visitDate?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

export interface MedicalHistoryFilter {
  patientId?: number;
  doctorId?: number;
  startDate?: string;
  endDate?: string;
  diagnosis?: string;
  searchQuery?: string;
}

export interface MedicalHistorySummary {
  totalRecords: number;
  lastVisit: string;
  commonDiagnoses: string[];
  activeConditions: string[];
  medications: string[];
  allergies: string[];
}

export interface Education {
  id: number;
  degree: string;
  institution: string;
  yearOfCompletion: number;
  details?: string;
  certificateUrl?: string;
}

export interface Experience {
  id: number;
  hospitalName: string;
  position: string;
  yearsOfService: number;
  details?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certificate {
  id: number;
  name: string;
  url?: string;
  details?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingOrganization?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface DoctorAvailability {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RatingDistribution {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
  total: number;
}

export interface HealthSummary {
  totalVisits: number;
  lastVisit: string;
  commonDiagnoses: string[];
  activeConditions: string[];
  medications: string[];
  allergies: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  role: string;
  message: string;
  user?: User;
  token?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber: string;
  address: string;
  specialization?: string;
  dateOfBirth?: string;
  contactInfo?: string;
  emergencyContact?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DoctorProfileUpdate {
  firstName: string;
  lastName: string;
  specialization: string;
  phoneNumber: string;
  address: string;
}

export interface PatientProfileUpdate {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  contactInfo: string;
  illnessDetails: string;
  email: string;
  isActive: boolean;
}
