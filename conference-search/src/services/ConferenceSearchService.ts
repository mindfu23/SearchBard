import { Conference, SearchFilters } from '../types/Conference';
import { mockConferences } from '../data/mockConferences';
import { TicketmasterApiService } from './TicketmasterApiService';

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
    'san jose': { lat: 37.3382, lng: -121.8863 }
  };

  return cityCoords[city.toLowerCase()] || null;
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
    // Try to fetch from Ticketmaster API first
    try {
      const subjects = filters.subjects.length > 0 ? filters.subjects.join(' ') : 'conference';
      const apiResults = await TicketmasterApiService.searchEvents(
        subjects,
        filters.location,
        filters.startDate,
        filters.endDate
      );

      if (apiResults.length > 0) {
        // Apply additional filtering
        let results = apiResults;

        // Filter by subjects if specific subjects were selected
        if (filters.subjects.length > 0) {
          results = results.filter(conference =>
            filters.subjects.includes(conference.subject)
          );
        }

        // Filter by radius if location is provided
        if (filters.location && filters.radius) {
          const searchCoords = getCityCoordinates(filters.location);
          
          if (searchCoords) {
            results = results.filter(conference => {
              if (!conference.location.coordinates) return true; // Include if no coordinates
              
              const distance = calculateDistance(
                searchCoords.lat,
                searchCoords.lng,
                conference.location.coordinates.lat,
                conference.location.coordinates.lng
              );
              
              return distance <= filters.radius!;
            });
          }
        }

        return results;
      }
    } catch (error) {
      console.error('Error fetching from Ticketmaster, falling back to mock data:', error);
    }

    // Fallback to mock data if API fails or returns no results
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

  static getAllSubjects(): string[] {
    return Array.from(new Set(mockConferences.map(c => c.subject))).sort();
  }

  static getConferenceById(id: string): Conference | undefined {
    return mockConferences.find(c => c.id === id);
  }
}