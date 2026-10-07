export enum AppointmentStatus {
    HELD = 'HELD',
    BOOKED = 'BOOKED',
    CONFIRMED = 'CONFIRMED',
    SCHEDULED = 'SCHEDULED',
    INTAKE = 'INTAKE',
    INTAKE_COMPLETED = 'INTAKE_COMPLETED',
    WAITING_ROOM = 'WAITING_ROOM',
    READY_FOR_VISIT = 'READY_FOR_VISIT',
    IN_PROGRESS = 'IN_PROGRESS',
    MEDICAL_RECORD = 'MEDICAL_RECORD',
    REPORT_DRAFTED = 'REPORT_DRAFTED',
    READY_TO_COMPLETE = 'READY_TO_COMPLETE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
    CANCELLED_BY_PATIENT = 'CANCELLED_BY_PATIENT',
    CANCELLED_BY_DOCTOR = 'CANCELLED_BY_DOCTOR',
    NO_SHOW = 'NO_SHOW',
    NO_SHOW_PATIENT = 'NO_SHOW_PATIENT',
    NO_SHOW_DOCTOR = 'NO_SHOW_DOCTOR',
    AUTO_CLOSED = 'AUTO_CLOSED'
}

export interface AllowedActionDto {
    actionKey: string;
    label: string;
    icon: string;
    enabled: boolean;
    disabledReason?: string;
    stageIndex: number;
    isPrimary?: boolean;
}

export interface AppointmentDto {
    id?: number;
    appointmentId?: number;
    patientId?: number;
    patientName?: string;
    patientMobile?: string;
    patientProfileImageUrl?: string;
    doctorId?: number;
    doctorName?: string;
    doctorSpecialization?: string;
    doctorProfileImageUrl?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    status?: AppointmentStatus | string;
    reason?: string;
    notes?: string;
    consultationFees?: number;
    [key: string]: any;
}

export interface SlotHoldRequest {
    doctorId: number;
    appointmentDateTime: string;
}

export interface SlotHoldResponse {
    holdId: string;
    lockedUntil: string;
    remainingSeconds: number;
}

export interface PreVisitIntakeRequest {
    chiefComplaint: string;
    symptoms: string[] | string;
    duration: string;
    symptomDuration?: string;
    severity: string;
    symptomSeverity?: string;
    currentMedications?: string;
    allergies?: string;
    consentGiven: boolean;
}

export interface PreVisitIntakeResponse {
    appointmentId: number;
    chiefComplaint: string;
    symptoms?: string;
    symptomsSummary?: string;
    symptomDuration?: string;
    duration?: string;
    severity?: string;
    symptomSeverity?: string;
    currentMedications?: string;
    allergies?: string;
    consentGiven?: boolean;
    aiTriageSummary?: string;
    preVisitSummary?: string;
    intakeCompleted: boolean;
    intakeStatus?: string;
    isConfirmedByPatient?: boolean;
    confirmedAt?: string;
    confirmedBy?: string;
    hasRedFlags?: boolean;
    redFlags?: string;
    editHistory?: string;
    updatedAt: string;
}

export interface SoapReportDto {
    id?: number;
    appointmentId: number;
    patientId: number;
    patientName?: string;
    doctorId: number;
    doctorName?: string;
    visitDate?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    medicine?: string;
    doses?: string;
    notes?: string;
    transcript?: string;
    isDraft?: boolean;
    isSigned?: boolean;
    signedAt?: string;
}

export interface AppointmentAnalyticsResponse {
    totalAppointments: number;
    completedAppointments: number;
    noShowAppointments: number;
    cancelledAppointments: number;
    completionRate: number;
    noShowRate: number;
    cancellationRate: number;
    statusBreakdown: Record<string, number>;
    funnelConversion: Record<string, number>;
}

export interface AppointmentStatusLogDto {
    id: number;
    appointmentId: number;
    previousStatus: AppointmentStatus;
    newStatus: AppointmentStatus;
    changedBy: string;
    reason?: string;
    createdAt: string;
}

// Map of allowed status transitions for front-end action guard (canDo)
export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.HELD]: [AppointmentStatus.BOOKED, AppointmentStatus.CANCELLED_BY_PATIENT],
    [AppointmentStatus.BOOKED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED, AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_DOCTOR],
    [AppointmentStatus.CONFIRMED]: [AppointmentStatus.INTAKE, AppointmentStatus.INTAKE_COMPLETED, AppointmentStatus.READY_FOR_VISIT, AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_DOCTOR, AppointmentStatus.REJECTED],
    [AppointmentStatus.SCHEDULED]: [AppointmentStatus.INTAKE, AppointmentStatus.INTAKE_COMPLETED, AppointmentStatus.READY_FOR_VISIT, AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_DOCTOR],
    [AppointmentStatus.INTAKE]: [AppointmentStatus.WAITING_ROOM, AppointmentStatus.READY_FOR_VISIT, AppointmentStatus.CANCELLED_BY_PATIENT],
    [AppointmentStatus.INTAKE_COMPLETED]: [AppointmentStatus.WAITING_ROOM, AppointmentStatus.READY_FOR_VISIT, AppointmentStatus.IN_PROGRESS],
    [AppointmentStatus.WAITING_ROOM]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW],
    [AppointmentStatus.READY_FOR_VISIT]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW_PATIENT, AppointmentStatus.NO_SHOW_DOCTOR],
    [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.MEDICAL_RECORD, AppointmentStatus.REPORT_DRAFTED],
    [AppointmentStatus.MEDICAL_RECORD]: [AppointmentStatus.READY_TO_COMPLETE],
    [AppointmentStatus.REPORT_DRAFTED]: [AppointmentStatus.READY_TO_COMPLETE],
    [AppointmentStatus.READY_TO_COMPLETE]: [AppointmentStatus.COMPLETED, AppointmentStatus.MEDICAL_RECORD],
    [AppointmentStatus.COMPLETED]: [],
    [AppointmentStatus.CANCELLED]: [],
    [AppointmentStatus.REJECTED]: [],
    [AppointmentStatus.CANCELLED_BY_PATIENT]: [],
    [AppointmentStatus.CANCELLED_BY_DOCTOR]: [],
    [AppointmentStatus.NO_SHOW]: [],
    [AppointmentStatus.NO_SHOW_PATIENT]: [],
    [AppointmentStatus.NO_SHOW_DOCTOR]: [],
    [AppointmentStatus.AUTO_CLOSED]: []
};

export interface RecordReadiness {
    appointmentId: number;
    isReady: boolean;
    recordSaved: boolean;
    soapSaved: boolean;
    missingFields: string[];
    reasons: string[];
}

export interface CompletionPreview {
    appointmentId: number;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    intake?: any;
    soapReport?: any;
    medicalHistory?: any;
    isReadyForSign?: boolean;
    readyForSign?: boolean;
    readinessReasons: string[];
}

export interface ESignCompletionRequest {
    appointmentId: number;
    doctorNameTyped: string;
    password: string;
    declarationAccepted: boolean;
    signatureImageUrl?: string;
}

export interface ESignCompletionResponse {
    appointmentId: number;
    status: AppointmentStatus | string;
    signedAt: string;
    signedByName: string;
    contentHash: string;
    pdfUrl: string;
    message: string;
}
