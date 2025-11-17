import { Conference } from '../types/Conference';

const EVENTBRITE_API_KEY = process.env.REACT_APP_EVENTBRITE_API_KEY || '';
const EVENTBRITE_API_URL = 'https://www.eventbriteapi.com/v3';

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description: {
    text: string;
  };
  start: {
    utc: string;
    local: string;
  };
  end: {
    utc: string;
    local: string;
  };
  url: string;
  venue?: {
    address?: {
      city?: string;
      region?: string;
      country?: string;
      latitude?: string;
      longitude?: string;
    };
  };
  organizer?: {
    name?: string;
  };
  capacity?: number;
  ticket_availability?: {
    minimum_ticket_price?: {
      major_value?: number;
      currency?: string;
    };
    maximum_ticket_price?: {
      major_value?: number;
      currency?: string;
    };
  };
}

interface EventbriteSearchResponse {
  events: EventbriteEvent[];
  pagination: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
  };
}

// Map of keywords to conference subjects
const SUBJECT_KEYWORDS: { [key: string]: string[] } = {
  'Technology': ['tech', 'software', 'coding', 'programming', 'ai', 'machine learning', 'developer', 'data'],
  'Healthcare': ['health', 'medical', 'healthcare', 'medicine', 'nursing', 'clinical'],
  'Business': ['business', 'entrepreneur', 'startup', 'leadership', 'management', 'commerce'],
  'Education': ['education', 'teaching', 'learning', 'academic', 'school', 'university'],
  'Science': ['science', 'research', 'laboratory', 'scientific', 'physics', 'chemistry', 'biology'],
  'Marketing': ['marketing', 'advertising', 'social media', 'content', 'branding', 'seo'],
  'Finance': ['finance', 'fintech', 'banking', 'investment', 'trading', 'cryptocurrency'],
  'Environment': ['environment', 'climate', 'sustainability', 'green', 'renewable', 'conservation'],
  'Arts & Design': ['art', 'design', 'creative', 'ux', 'ui', 'graphic', 'illustration'],
  'Engineering': ['engineering', 'mechanical', 'civil', 'electrical', 'infrastructure', 'robotics']
};

const determineSubject = (eventName: string, description: string): string => {
  const combinedText = `${eventName} ${description}`.toLowerCase();
  
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      return subject;
    }
  }
  
  return 'Other';
};

const convertEventbriteToConference = (event: EventbriteEvent): Conference => {
  const eventName = event.name.text;
  const description = event.description?.text || 'No description available';
  
  return {
    id: event.id,
    title: eventName,
    subject: determineSubject(eventName, description),
    location: {
      city: event.venue?.address?.city || 'TBD',
      state: event.venue?.address?.region || '',
      country: event.venue?.address?.country || 'USA',
      coordinates: event.venue?.address?.latitude && event.venue?.address?.longitude
        ? {
            lat: parseFloat(event.venue.address.latitude),
            lng: parseFloat(event.venue.address.longitude)
          }
        : undefined
    },
    startDate: event.start.local.split('T')[0],
    endDate: event.end.local.split('T')[0],
    description: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
    website: event.url,
    organizer: event.organizer?.name || 'Unknown',
    attendeeCount: event.capacity,
    price: event.ticket_availability?.minimum_ticket_price
      ? {
          min: event.ticket_availability.minimum_ticket_price.major_value || 0,
          max: event.ticket_availability.maximum_ticket_price?.major_value || event.ticket_availability.minimum_ticket_price.major_value || 0,
          currency: event.ticket_availability.minimum_ticket_price.currency || 'USD'
        }
      : undefined
  };
};

export class EventbriteApiService {
  static async searchEvents(
    query: string,
    location?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Conference[]> {
    if (!EVENTBRITE_API_KEY) {
      console.error('Eventbrite API key is not configured');
      return [];
    }

    try {
      // Build query parameters
      const params = new URLSearchParams({
        token: EVENTBRITE_API_KEY,
        q: query || 'conference',
        'sort_by': 'date',
        expand: 'venue,organizer,ticket_availability'
      });

      if (location) {
        params.append('location.address', location);
        params.append('location.within', '50mi');
      }

      if (startDate) {
        params.append('start_date.range_start', `${startDate}T00:00:00`);
      }

      if (endDate) {
        params.append('start_date.range_end', `${endDate}T23:59:59`);
      }

      const response = await fetch(`${EVENTBRITE_API_URL}/events/search/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
      }

      const data: EventbriteSearchResponse = await response.json();
      
      return data.events.map(convertEventbriteToConference);
    } catch (error) {
      console.error('Error fetching from Eventbrite API:', error);
      return [];
    }
  }
}
