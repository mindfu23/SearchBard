import { Conference } from '../types/Conference';

const TICKETMASTER_API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY || '';
const TICKETMASTER_API_URL = 'https://app.ticketmaster.com/discovery/v2';

interface TicketmasterVenue {
  name?: string;
  city?: {
    name?: string;
  };
  state?: {
    name?: string;
    stateCode?: string;
  };
  country?: {
    name?: string;
    countryCode?: string;
  };
  location?: {
    latitude?: string;
    longitude?: string;
  };
}

interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  description?: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    end?: {
      localDate?: string;
    };
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
    genre?: {
      name?: string;
    };
  }>;
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
}

interface TicketmasterSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Map Ticketmaster classifications to our conference subjects
const mapClassificationToSubject = (classifications?: Array<{
  segment?: { name?: string };
  genre?: { name?: string };
}>): string => {
  if (!classifications || classifications.length === 0) return 'Other';

  const segment = classifications[0]?.segment?.name?.toLowerCase() || '';
  const genre = classifications[0]?.genre?.name?.toLowerCase() || '';
  const combined = `${segment} ${genre}`;

  // Technology
  if (combined.includes('tech') || combined.includes('science') || 
      combined.includes('innovation') || combined.includes('digital')) {
    return 'Technology';
  }
  
  // Business
  if (combined.includes('business') || combined.includes('conference') ||
      combined.includes('professional') || combined.includes('corporate')) {
    return 'Business';
  }

  // Education
  if (combined.includes('education') || combined.includes('learning') ||
      combined.includes('academic') || combined.includes('workshop')) {
    return 'Education';
  }

  // Arts & Design
  if (combined.includes('art') || combined.includes('design') ||
      combined.includes('creative') || combined.includes('cultural')) {
    return 'Arts & Design';
  }

  // Healthcare
  if (combined.includes('health') || combined.includes('medical') ||
      combined.includes('wellness')) {
    return 'Healthcare';
  }

  // Default based on segment
  if (segment.includes('sports')) return 'Other';
  if (segment.includes('music')) return 'Other';
  
  return 'Business'; // Default for most conferences
};

const convertTicketmasterToConference = (event: TicketmasterEvent): Conference => {
  const venue = event._embedded?.venues?.[0];
  const priceRange = event.priceRanges?.[0];

  return {
    id: event.id,
    title: event.name,
    subject: mapClassificationToSubject(event.classifications),
    location: {
      city: venue?.city?.name || 'TBD',
      state: venue?.state?.stateCode || '',
      country: venue?.country?.countryCode || 'US',
      coordinates: venue?.location?.latitude && venue?.location?.longitude
        ? {
            lat: parseFloat(venue.location.latitude),
            lng: parseFloat(venue.location.longitude)
          }
        : undefined
    },
    startDate: event.dates.start.localDate,
    endDate: event.dates.end?.localDate || event.dates.start.localDate,
    description: event.info || event.description || 'No description available',
    website: event.url,
    organizer: 'Ticketmaster Event',
    price: priceRange
      ? {
          min: priceRange.min || 0,
          max: priceRange.max || priceRange.min || 0,
          currency: priceRange.currency || 'USD'
        }
      : undefined
  };
};

export class TicketmasterApiService {
  static async searchEvents(
    query: string,
    location?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Conference[]> {
    if (!TICKETMASTER_API_KEY) {
      console.error('Ticketmaster API key is not configured');
      return [];
    }

    try {
      // Build query parameters
      const params = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        keyword: query || 'conference',
        size: '50',
        sort: 'date,asc'
      });

      // Add location if provided
      if (location) {
        params.append('city', location);
      }

      // Add date range if provided
      if (startDate && endDate) {
        params.append('startDateTime', `${startDate}T00:00:00Z`);
        params.append('endDateTime', `${endDate}T23:59:59Z`);
      } else if (startDate) {
        params.append('startDateTime', `${startDate}T00:00:00Z`);
      }

      const url = `${TICKETMASTER_API_URL}/events.json?${params.toString()}`;
      console.log('Fetching from Ticketmaster:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ticketmaster API error: ${response.status}`, errorText);
        return [];
      }

      const data: TicketmasterSearchResponse = await response.json();
      
      console.log('Ticketmaster response:', data);
      
      if (!data._embedded?.events) {
        console.log('No events found from Ticketmaster');
        return [];
      }

      console.log(`Found ${data._embedded.events.length} events from Ticketmaster`);
      
      return data._embedded.events.map(convertTicketmasterToConference);
    } catch (error) {
      console.error('Error fetching from Ticketmaster API:', error);
      return [];
    }
  }
}
