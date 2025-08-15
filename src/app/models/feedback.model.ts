export interface Feedback {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  appointment?: {
    id: number;
    appointmentDateTime: string;
    reason: string;
  };
}

export interface FeedbackCreate {
  appointmentId: number;
  rating: number;
  comment: string;
}

export interface FeedbackUpdate {
  appointmentId: number;
  rating: number;
  comment: string;
}

export interface FeedbackFilter {
  doctorId?: number;
  patientId?: number;
  appointmentId?: number;
  rating?: number;
  startDate?: string;
  endDate?: string;
}

export interface AverageRating {
  doctorId: number;
  averageRating: number;
  totalFeedbacks: number;
  ratingBreakdown: RatingBreakdown;
}

export interface RatingBreakdown {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
  total: number;
}

export interface RatingDistribution {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
  total: number;
  averageRating: number;
}
