import { Conference, SearchFilters } from '../types/Conference';
import { mockConferences } from '../data/mockConferences';
import { TicketmasterApiService } from './TicketmasterApiService';
import { SerpApiService } from './SerpApiService';

// Simple geocoding function for demonstration purposes
const getCityCoordinates = (city: string): { lat: number; lng: number } | null => {
  const cityCoords: { [key: string]: { lat: number; lng: number } } = {
    'san francisco': { lat: 37.7749, lng: -122.4194 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'los angeles': { lat: 34.0522, lng: -118.2437 },
    'chicago': { lat: 41.8781, lng: -87.6298 },
    'boston': { lat: 42.3601, lng: -71.0589 },
    'seattle': { lat: 47.6062, lng: -122.3321 },
    'denver': { lat: 39.7392, lng: -104.9903 },
    'austin': { lat: 30.2672, lng: -97.7431 },
    'atlanta': { lat: 33.7490, lng: -84.3880 },
    'washington': { lat: 38.9072, lng: -77.0369 },
    'las vegas': { lat: 36.1699, lng: -115.1398 },
    'san jose': { lat: 37.3382, lng: -121.8863 },
    'orlando': { lat: 28.5383, lng: -81.3792 },
    'dallas': { lat: 32.7767, lng: -96.7970 },
    'houston': { lat: 29.7604, lng: -95.3698 },
    'phoenix': { lat: 33.4484, lng: -112.0740 },
    'san diego': { lat: 32.7157, lng: -117.1611 },
    'miami': { lat: 25.7617, lng: -80.1918 },
    'philadelphia': { lat: 39.9526, lng: -75.1652 },
    'nashville': { lat: 36.1627, lng: -86.7816 },
    'portland': { lat: 45.5152, lng: -122.6784 }
  };

  // Try to extract city name from input like "New York, NY" or "San Francisco"
  const searchCity = city.toLowerCase().split(',')[0].trim();
  
  return cityCoords[searchCity] || null;
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export class ConferenceSearchService {
  static async searchConferences(filters: SearchFilters): Promise<Conference[]> {
    const allResults: Conference[] = [];
    
    // Try SerpAPI (Google Events)
    try {
      console.log('Fetching from SerpAPI...');
      const serpResults = await SerpApiService.searchEvents(
        'conference',
        filters.location,
        filters.startDate,
        filters.endDate
      );
      console.log(`SerpAPI returned ${serpResults.length} events`);
      allResults.push(...serpResults);
    } catch (error) {
      console.error('Error fetching from SerpAPI:', error);
    }

    // Try Ticketmaster API
    try {
      console.log('Fetching from Ticketmaster API...');
      const ticketmasterResults = await TicketmasterApiService.searchEvents(
        'conference',
        filters.location,
        filters.startDate,
        filters.endDate
      );
      console.log(`Ticketmaster returned ${ticketmasterResults.length} events`);
      allResults.push(...ticketmasterResults);
    } catch (error) {
      console.error('Error fetching from Ticketmaster:', error);
    }

    console.log(`Total events before deduplication: ${allResults.length}`);

    // If we have results from APIs, process them
    if (allResults.length > 0) {
      // Remove duplicates based on title, date, and location
      const deduplicated = this.deduplicateConferences(allResults);
      console.log(`Events after deduplication: ${deduplicated.length}`);
      
      let results = deduplicated;

      // Filter by subjects if specific subjects were selected
      if (filters.subjects.length > 0 && filters.subjects.length < 11) {
        console.log('Filtering by subjects:', filters.subjects);
        results = results.filter(conference =>
          filters.subjects.includes(conference.subject)
        );
        console.log(`After subject filter: ${results.length} events`);
      }

      // Filter by location and radius if location is provided
      if (filters.location && filters.radius) {
        const searchCoords = getCityCoordinates(filters.location);
        
        if (searchCoords) {
          console.log(`Filtering by location: ${filters.location} within ${filters.radius} miles`);
          results = results.filter(conference => {
            if (!conference.location.coordinates) {
              // For events without coordinates, exclude them when searching by specific location
              // Only include if the city/state text matches closely
              const confCity = conference.location.city.toLowerCase();
              const searchLower = filters.location.toLowerCase();
              
              // Only match if the city name appears in the search
              return searchLower.includes(confCity) || confCity.includes(searchLower.split(',')[0].trim());
            }
            
            const distance = calculateDistance(
              searchCoords.lat,
              searchCoords.lng,
              conference.location.coordinates.lat,
              conference.location.coordinates.lng
            );
            
            return distance <= filters.radius!;
          });
          console.log(`After location filter: ${results.length} events`);
        } else {
          // Text matching as fallback - be more strict
          console.log(`Using strict text matching for location: ${filters.location}`);
          const searchCity = filters.location.split(',')[0].trim().toLowerCase();
          results = results.filter(conference => {
            const confCity = conference.location.city.toLowerCase();
            // Must match city name closely
            return confCity.includes(searchCity) || searchCity.includes(confCity);
          });
        }
      }

      console.log(`Final result count from APIs: ${results.length}`);
      
      if (results.length > 0) {
        return results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      }
    }

    // Fallback to mock data if API fails or returns no results
    console.log('Falling back to mock data');
    let results = mockConferences;

    // Filter by subjects
    if (filters.subjects.length > 0) {
      results = results.filter(conference =>
        filters.subjects.includes(conference.subject)
      );
    }

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      results = results.filter(conference => {
        const confStartDate = new Date(conference.startDate);
        const confEndDate = new Date(conference.endDate);
        
        // Check if conference dates overlap with search range
        return (
          confStartDate <= endDate && confEndDate >= startDate
        );
      });
    }

    // Filter by location
    if (filters.location) {
      const searchCoords = getCityCoordinates(filters.location);
      
      if (searchCoords) {
        results = results.filter(conference => {
          if (!conference.location.coordinates) return false;
          
          const distance = calculateDistance(
            searchCoords.lat,
            searchCoords.lng,
            conference.location.coordinates.lat,
            conference.location.coordinates.lng
          );
          
          const searchRadius = filters.radius || 50; // Default 50 miles
          return distance <= searchRadius;
        });
      } else {
        // Simple text matching if geocoding fails
        results = results.filter(conference =>
          conference.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          conference.location.state.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
    }

    // Sort by start date
    results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return results;
  }

  // Helper method to remove duplicate conferences
  private static deduplicateConferences(conferences: Conference[]): Conference[] {
    const seen = new Map<string, Conference>();
    
    for (const conference of conferences) {
      // Create a key based on normalized title and start date
      const normalizedTitle = conference.title.toLowerCase().trim().replace(/\s+/g, ' ');
      const key = `${normalizedTitle}|${conference.startDate}`;
      
      // If we haven't seen this event, or if this one has more info, keep it
      if (!seen.has(key)) {
        seen.set(key, conference);
      } else {
        const existing = seen.get(key)!;
        // Keep the one with more complete information (has coordinates, description, price, etc.)
        const existingScore = this.calculateCompletenessScore(existing);
        const newScore = this.calculateCompletenessScore(conference);
        
        if (newScore > existingScore) {
          seen.set(key, conference);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  // Calculate how complete the conference information is
  private static calculateCompletenessScore(conference: Conference): number {
    let score = 0;
    if (conference.location.coordinates) score += 2;
    if (conference.description && conference.description.length > 50) score += 2;
    if (conference.price) score += 1;
    if (conference.attendeeCount) score += 1;
    if (conference.website && conference.website !== '#') score += 1;
    if (conference.organizer && conference.organizer !== 'Event Organizer' && conference.organizer !== 'Ticketmaster Event') score += 1;
    return score;
  }

  static getAllSubjects(): string[] {
    return Array.from(new Set(mockConferences.map(c => c.subject))).sort();
  }

  static getConferenceById(id: string): Conference | undefined {
    return mockConferences.find(c => c.id === id);
  }
}