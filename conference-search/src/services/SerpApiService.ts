/**
 * SerpApiService
 * 
 * Integration with SerpAPI to access Google Events data.
 * 
 * SerpAPI provides a programmatic interface to Google's event search results,
 * which aggregates events from across the web including conference websites,
 * event platforms, and various other sources.
 * 
 * API Documentation: https://serpapi.com/events-results
 * 
 * Why Use SerpAPI?
 * - Access to Google's comprehensive event index
 * - No need to scrape Google directly (which violates ToS)
 * - Structured JSON responses
 * - Reliable uptime and consistent API
 * 
 * Limitations:
 * - Free tier: 100 searches/month
 * - Event data quality varies (depends on source websites)
 * - Some events may lack complete information (coordinates, prices, etc.)
 * 
 * API Key Setup:
 * 1. Sign up at https://serpapi.com/
 * 2. Add key to .env: REACT_APP_SERPAPI_API_KEY=your_key
 */

import { Conference } from '../types/Conference';

// API configuration
const SERPAPI_API_KEY = process.env.REACT_APP_SERPAPI_API_KEY || '';
const SERPAPI_API_URL = 'https://serpapi.com/search.json';

/**
 * Type definition for SerpAPI event objects
 * 
 * SerpAPI returns events in this structure from Google's event search.
 * Note: Many fields are optional as not all event sources provide complete data.
 */
interface SerpApiEvent {
  title: string;
  date: {
    start_date?: string;  // Format varies: "2025-06-15" or "Jun 15"
    when?: string;         // Human-readable date string
  };
  address?: string[];      // Array of address components
  link?: string;           // URL to event page
  description?: string;    // Event description (may be truncated)
  venue?: {
    name?: string;
    link?: string;
  };
  ticket_info?: {
    source?: string;
    link?: string;
    link_type?: string;
  }[];
}

/**
 * Type definition for SerpAPI response structure
 */
interface SerpApiResponse {
  events_results?: SerpApiEvent[];  // Array of events, if any found
  search_metadata?: {
    status?: string;                 // API call status
  };
  error?: string;                    // Error message if API call failed
}

/**
 * Intelligent subject classification based on event content
 * 
 * Analyzes title and description text to categorize events into our
 * standardized subject taxonomy. Uses keyword matching with priority
 * given to more specific topics.
 * 
 * Algorithm:
 * 1. Combine title + description into lowercase string
 * 2. Check for topic-specific keywords in order of specificity
 * 3. Return first matching category
 * 4. Default to "Business" if no matches
 * 
 * Why this approach?
 * - APIs don't use consistent categorization schemes
 * - Keyword matching is simple but effective for our 11 categories
 * - Easy to extend with new keywords or categories
 * 
 * Improvement opportunities:
 * - Use ML classification for better accuracy
 * - Support multiple categories per event
 * - Allow user to override classifications
 * 
 * @param title - Event title
 * @param description - Event description
 * @returns Subject category string matching our taxonomy
 */
const determineSubjectFromQuery = (title: string, description: string): string => {
  const combined = `${title} ${description}`.toLowerCase();
  
  if (combined.includes('tech') || combined.includes('ai') || combined.includes('software') || 
      combined.includes('data') || combined.includes('digital') || combined.includes('innovation')) {
    return 'Technology';
  }
  if (combined.includes('health') || combined.includes('medical') || combined.includes('clinical')) {
    return 'Healthcare';
  }
  if (combined.includes('business') || combined.includes('entrepreneur') || combined.includes('leadership')) {
    return 'Business';
  }
  if (combined.includes('education') || combined.includes('learning') || combined.includes('academic')) {
    return 'Education';
  }
  if (combined.includes('science') || combined.includes('research') || combined.includes('scientific')) {
    return 'Science';
  }
  if (combined.includes('marketing') || combined.includes('advertising') || combined.includes('brand')) {
    return 'Marketing';
  }
  if (combined.includes('finance') || combined.includes('fintech') || combined.includes('banking')) {
    return 'Finance';
  }
  if (combined.includes('environment') || combined.includes('climate') || combined.includes('sustainability')) {
    return 'Environment';
  }
  if (combined.includes('design') || combined.includes('art') || combined.includes('creative')) {
    return 'Arts & Design';
  }
  if (combined.includes('engineering') || combined.includes('mechanical') || combined.includes('civil')) {
    return 'Engineering';
  }
  if (combined.includes('sport') || combined.includes('athletic') || combined.includes('fitness') ||
      combined.includes('tournament') || combined.includes('championship')) {
    return 'Sports';
  }
  
  return 'Business'; // Default
};

const parseLocation = (address?: string[]) => {
  if (!address || address.length === 0) {
    return { city: 'TBD', state: '', country: 'USA' };
  }
  
  // Try to parse city, state from address
  const fullAddress = address.join(', ');
  const parts = fullAddress.split(',').map(p => p.trim());
  
  // Common format: "City, ST" or "Venue, City, ST"
  let city = 'TBD';
  let state = '';
  
  if (parts.length >= 2) {
    // Look for state code (2 letters)
    const lastPart = parts[parts.length - 1];
    const stateMatch = lastPart.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      state = stateMatch[1];
      city = parts[parts.length - 2] || 'TBD';
    } else {
      city = parts[parts.length - 1];
    }
  }
  
  return { city, state, country: 'USA' };
};

const parseDateRange = (dateInfo: { start_date?: string; when?: string }): { startDate: string; endDate: string } => {
  if (dateInfo.start_date) {
    // Format: "Sep 15" or "2026-09-15"
    const dateStr = dateInfo.start_date;
    
    // If it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { startDate: dateStr, endDate: dateStr };
    }
    
    // Try to parse "Sep 15" format
    const match = dateStr.match(/([A-Za-z]+)\s+(\d+)/);
    if (match) {
      const monthMap: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      const month = monthMap[match[1].toLowerCase().substring(0, 3)];
      const day = match[2].padStart(2, '0');
      const year = new Date().getFullYear() + 1; // Assume next year for conferences
      
      if (month) {
        return { 
          startDate: `${year}-${month}-${day}`, 
          endDate: `${year}-${month}-${day}` 
        };
      }
    }
  }
  
  // Fallback to today's date
  const today = new Date().toISOString().split('T')[0];
  return { startDate: today, endDate: today };
};

const convertSerpApiToConference = (event: SerpApiEvent, index: number): Conference => {
  const location = parseLocation(event.address);
  const dates = parseDateRange(event.date);
  const description = event.description || 'No description available';
  
  return {
    id: `serpapi-${index}`,
    title: event.title,
    subject: determineSubjectFromQuery(event.title, description),
    location: {
      city: location.city,
      state: location.state,
      country: location.country
    },
    startDate: dates.startDate,
    endDate: dates.endDate,
    description: description.substring(0, 300),
    website: event.link || event.ticket_info?.[0]?.link || '#',
    organizer: event.venue?.name || 'Event Organizer'
  };
};

export class SerpApiService {
  static async searchEvents(
    query: string,
    location?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Conference[]> {
    if (!SERPAPI_API_KEY) {
      console.error('SerpAPI key is not configured');
      return [];
    }

    try {
      // Build query - combine "conference" with location if provided
      const searchQuery = location 
        ? `conferences in ${location}`
        : 'conferences';

      const params = new URLSearchParams({
        api_key: SERPAPI_API_KEY,
        engine: 'google_events',
        q: searchQuery,
        htichips: 'date:upcoming' // Focus on upcoming events
      });

      const url = `${SERPAPI_API_URL}?${params.toString()}`;
      console.log('Fetching from SerpAPI:', url.replace(SERPAPI_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`SerpAPI error: ${response.status}`);
        return [];
      }

      const data: SerpApiResponse = await response.json();
      
      console.log('SerpAPI response:', data);

      if (data.error) {
        console.error('SerpAPI error:', data.error);
        return [];
      }
      
      if (!data.events_results || data.events_results.length === 0) {
        console.log('No events found from SerpAPI');
        return [];
      }

      console.log(`Found ${data.events_results.length} events from SerpAPI`);
      
      const conferences = data.events_results.map((event, index) => 
        convertSerpApiToConference(event, index)
      );

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return conferences.filter(conf => {
          const confStart = new Date(conf.startDate);
          return confStart >= start && confStart <= end;
        });
      }

      return conferences;
    } catch (error) {
      console.error('Error fetching from SerpAPI:', error);
      return [];
    }
  }
}
