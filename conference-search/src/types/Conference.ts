export interface Conference {
  id: string;
  title: string;
  subject: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate: string;
  endDate: string;
  description: string;
  website?: string;
  organizer: string;
  attendeeCount?: number;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface SearchFilters {
  subjects: string[];
  location: string;
  startDate: string;
  endDate: string;
  radius?: number; // in miles
}

export const TOP_SUBJECTS = [
  'Technology',
  'Healthcare',
  'Business',
  'Education',
  'Science',
  'Marketing',
  'Finance',
  'Environment',
  'Arts & Design',
  'Engineering',
  'Sports'
] as const;

export type SubjectType = typeof TOP_SUBJECTS[number];