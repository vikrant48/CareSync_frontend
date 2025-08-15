export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  APPOINTMENT_RESCHEDULE = 'APPOINTMENT_RESCHEDULE',
  DAILY_SCHEDULE = 'DAILY_SCHEDULE',
  WEEKLY_SCHEDULE = 'WEEKLY_SCHEDULE',
  FEEDBACK_REMINDER = 'FEEDBACK_REMINDER',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  BULK_NOTIFICATION = 'BULK_NOTIFICATION',
  CUSTOM_NOTIFICATION = 'CUSTOM_NOTIFICATION'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum TargetAudience {
  ALL = 'ALL',
  PATIENTS = 'PATIENTS',
  DOCTORS = 'DOCTORS',
  ADMINS = 'ADMINS'
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  recipientId?: number;
  recipientType?: string;
  appointmentId?: number;
  status: NotificationStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreate {
  type: NotificationType;
  title: string;
  message: string;
  recipientId?: number;
  recipientType?: string;
  appointmentId?: number;
  targetAudience?: TargetAudience;
}

export interface NotificationFilter {
  type?: NotificationType;
  status?: NotificationStatus;
  recipientId?: number;
  recipientType?: string;
  startDate?: string;
  endDate?: string;
  isRead?: boolean;
}

export interface NotificationPreferences {
  userId: number;
  userType: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  appointmentReminders: boolean;
  feedbackReminders: boolean;
  systemNotifications: boolean;
  marketingNotifications: boolean;
}

export interface NotificationStatistics {
  totalNotifications: number;
  sentNotifications: number;
  deliveredNotifications: number;
  readNotifications: number;
  failedNotifications: number;
  notificationsByType: NotificationTypeStats[];
  notificationsByStatus: NotificationStatusStats[];
}

export interface NotificationTypeStats {
  type: NotificationType;
  count: number;
  percentage: number;
}

export interface NotificationStatusStats {
  status: NotificationStatus;
  count: number;
  percentage: number;
}

export interface NotificationServiceStatus {
  serviceName: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastCheck: string;
  uptime: number;
  message?: string;
}

export interface AppointmentReminderNotification {
  appointmentId: number;
  reminderTime: string;
  message?: string;
}

export interface ScheduleNotification {
  doctorId: number;
  date: string;
  message?: string;
}

export interface SystemNotification {
  message: string;
  targetAudience: TargetAudience;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface BulkNotification {
  message: string;
  userType: TargetAudience;
  filters?: {
    specialization?: string;
    ageRange?: string;
    location?: string;
  };
}

export interface CustomNotification {
  message: string;
  userId: number;
  userType: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
