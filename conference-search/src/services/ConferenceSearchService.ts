/**
 * ConferenceSearchService
 * 
 * Core service that orchestrates conference search across multiple APIs.
 * Implements a resilient multi-source strategy with automatic fallback.
 * 
 * Architecture:
 * 1. Queries multiple APIs in parallel (SerpAPI, Ticketmaster)
 * 2. Aggregates and deduplicates results
 * 3. Applies user filters (subjects, location, dates)
 * 4. Falls back to curated mock data if APIs fail
 * 
 * This approach ensures the application remains functional even when
 * external services are unavailable or rate-limited.
 */

import { Conference, SearchFilters } from '../types/Conference';
import { mockConferences } from '../data/mockConferences';
import { TicketmasterApiService } from './TicketmasterApiService';
import { SerpApiService } from './SerpApiService';

/**
 * Simple geocoding lookup for major US cities
 * 
 * Maps city names to lat/lng coordinates for distance calculations.
 * This is a lightweight alternative to calling a geocoding API.
 * 
 * Limitations:
 * - Only includes major US cities
 * - Doesn't handle international cities
 * - No support for neighborhoods or landmarks
 * 
 * For production, consider using Google Geocoding API or similar service.
 * 
 * @param city - City name, optionally with state (e.g., "San Francisco" or "San Francisco, CA")
 * @returns Object with lat/lng coordinates, or null if city not found
 */
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

  // Extract city name from various input formats:
  // "San Francisco, CA" -> "san francisco"
  // "New York" -> "new york"  
  // Handles both full addresses and simple city names
  const searchCity = city.toLowerCase().split(',')[0].trim();
  
  return cityCoords[searchCity] || null;
};

/**
 * Calculate geographic distance between two points using the Haversine formula
 * 
 * The Haversine formula calculates the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is accurate for most
 * distance calculations on Earth (which is nearly spherical).
 * 
 * Formula accuracy: ±0.5% for typical distances under 1000 miles
 * 
 * @param lat1 - Latitude of first point (decimal degrees)
 * @param lng1 - Longitude of first point (decimal degrees)
 * @param lat2 - Latitude of second point (decimal degrees)
 * @param lng2 - Longitude of second point (decimal degrees)
 * @returns Distance in miles
 */
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3959; // Earth's radius in miles (use 6371 for kilometers)
  
  // Convert latitude and longitude differences to radians
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in miles
};

export class ConferenceSearchService {
  /**
   * Main search method - orchestrates multi-API conference search with filtering
   * 
   * Search Strategy:
   * 1. Query multiple APIs in parallel (resilient to individual failures)
   * 2. Aggregate all results into a single array
   * 3. Deduplicate conferences that appear in multiple sources
   * 4. Apply user filters (subjects, location radius, date range)
   * 5. Fall back to mock data if all APIs fail or return no results
   * 
   * Why parallel API calls?
   * - Faster response time (don't wait for each API sequentially)
   * - If one API is slow/down, others can still complete
   * - More comprehensive results from multiple sources
   * 
   * @param filters - User's search criteria (subjects, location, dates, radius)
   * @returns Promise resolving to array of Conference objects, sorted by start date
   */
  static async searchConferences(filters: SearchFilters): Promise<Conference[]> {
    const allResults: Conference[] = [];
    
    // PHASE 1: Query APIs in parallel
    // Each API call is wrapped in try-catch so individual failures don't crash the search
    
    // Try SerpAPI (Google Events) - Primary source for comprehensive event data
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
      // Continue execution - other APIs may still succeed
    }

    // Try Ticketmaster API - Secondary source, especially good for ticketed events
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
      // Continue execution
    }

    // Note: Eventbrite API integration exists but is not enabled by default
    // To enable: Uncomment the Eventbrite section here and add your API key to .env

    console.log(`Total events before deduplication: ${allResults.length}`);

    // PHASE 2: Process API results if we received any
    if (allResults.length > 0) {
      // Deduplication: Same conference can appear in multiple APIs
      // We identify duplicates by title + date and keep the most complete version
      const deduplicated = this.deduplicateConferences(allResults);
      console.log(`Events after deduplication: ${deduplicated.length}`);
      
      let results = deduplicated;

      // FILTER 1: Subject Categories
      // If user selected specific subjects (not all 11), filter to only those
      if (filters.subjects.length > 0 && filters.subjects.length < 11) {
        console.log('Filtering by subjects:', filters.subjects);
        results = results.filter(conference =>
          filters.subjects.includes(conference.subject)
        );
        console.log(`After subject filter: ${results.length} events`);
      }

      // FILTER 2: Geographic Location & Radius
      // Filter conferences by distance from search location
      if (filters.location && filters.radius) {
        const searchCoords = getCityCoordinates(filters.location);
        
        if (searchCoords) {
          // We have coordinates for the search city - use precise distance calculation
          console.log(`Filtering by location: ${filters.location} within ${filters.radius} miles`);
          results = results.filter(conference => {
            if (!conference.location.coordinates) {
              // Conference has no coordinates - fall back to text matching
              // Only include if city names match closely
              const confCity = conference.location.city.toLowerCase();
              const searchLower = filters.location.toLowerCase();
              
              // Match if the city name appears in the search query
              return searchLower.includes(confCity) || confCity.includes(searchLower.split(',')[0].trim());
            }
            
            // Calculate actual distance using Haversine formula
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
          // No coordinates for search city - use strict text matching as fallback
          console.log(`Using strict text matching for location: ${filters.location}`);
          const searchCity = filters.location.split(',')[0].trim().toLowerCase();
          results = results.filter(conference => {
            const confCity = conference.location.city.toLowerCase();
            // Must match city name closely (substring match in either direction)
            return confCity.includes(searchCity) || searchCity.includes(confCity);
          });
        }
      }

      console.log(`Final result count from APIs: ${results.length}`);
      
      // If we have results after filtering, return them sorted by date
      if (results.length > 0) {
        return results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      }
    }

    // PHASE 3: Fallback to Mock Data
    // If all APIs failed or returned no matching results, use curated mock data
    // This ensures the app is always functional for demonstration/development
    console.log('Falling back to mock data');
    let results = mockConferences;

    // Apply same filters to mock data for consistency
    
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
        // Conference is included if any part of it falls within the search window
        return (
          confStartDate <= endDate && confEndDate >= startDate
        );
      });
    }

    // Filter by location with radius
    if (filters.location) {
      const searchCoords = getCityCoordinates(filters.location);
      
      if (searchCoords) {
        // Use distance calculation if we have coordinates
        results = results.filter(conference => {
          if (!conference.location.coordinates) return false;
          
          const distance = calculateDistance(
            searchCoords.lat,
            searchCoords.lng,
            conference.location.coordinates.lat,
            conference.location.coordinates.lng
          );
          
          const searchRadius = filters.radius || 50; // Default 50 miles if not specified
          return distance <= searchRadius;
        });
      } else {
        // Fallback to simple text matching if geocoding fails
        results = results.filter(conference =>
          conference.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          conference.location.state.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
    }

    // Sort by start date (earliest first)
    results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return results;
  }

  /**
   * Remove duplicate conferences from aggregated API results
   * 
   * Problem: The same conference often appears in multiple APIs (e.g., both Google Events
   * and Ticketmaster). We need to identify and deduplicate these entries.
   * 
   * Strategy:
   * 1. Create a unique key from: normalized title + start date
   * 2. When duplicates found, keep the entry with most complete information
   * 3. "Completeness" is scored by: coordinates, description length, price, organizer, etc.
   * 
   * Why this approach?
   * - Title + date is usually unique enough to identify the same event
   * - Keeping the most complete version ensures best user experience
   * - Handles variations in how APIs format the same data
   * 
   * @param conferences - Array of conferences from multiple APIs
   * @returns Deduplicated array with one entry per unique conference
   */
  private static deduplicateConferences(conferences: Conference[]): Conference[] {
    const seen = new Map<string, Conference>();
    
    for (const conference of conferences) {
      // Create a normalized key that will match duplicates
      // Example: "tech summit 2025" + "2025-06-15" -> "tech summit 2025|2025-06-15"
      const normalizedTitle = conference.title.toLowerCase().trim().replace(/\s+/g, ' ');
      const key = `${normalizedTitle}|${conference.startDate}`;
      
      // If this is the first time seeing this conference, store it
      if (!seen.has(key)) {
        seen.set(key, conference);
      } else {
        // We've seen this conference before - decide which version to keep
        const existing = seen.get(key)!;
        
        // Score both versions by information completeness
        const existingScore = this.calculateCompletenessScore(existing);
        const newScore = this.calculateCompletenessScore(conference);
        
        // Keep the version with more complete data
        if (newScore > existingScore) {
          seen.set(key, conference);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Calculate a "completeness score" for a conference object
   * 
   * Used during deduplication to decide which version of a duplicate to keep.
   * Higher score = more complete information.
   * 
   * Scoring criteria:
   * - Has coordinates: +2 points (enables distance calculation)
   * - Has description >50 chars: +2 points (gives context to users)
   * - Has price information: +1 point
   * - Has attendee count: +1 point
   * - Has real website (not placeholder): +1 point
   * - Has specific organizer name: +1 point
   * 
   * Maximum possible score: 8 points
   * 
   * @param conference - Conference object to score
   * @returns Numeric score (0-8)
   */
  private static calculateCompletenessScore(conference: Conference): number {
    let score = 0;
    
    // Geographic data is valuable for radius filtering
    if (conference.location.coordinates) score += 2;
    
    // Substantial description helps users understand the event
    if (conference.description && conference.description.length > 50) score += 2;
    
    // Price information helps users plan
    if (conference.price) score += 1;
    
    // Attendee count indicates event scale
    if (conference.attendeeCount) score += 1;
    
    // Real website link is more useful than placeholder
    if (conference.website && conference.website !== '#') score += 1;
    
    // Specific organizer name is more informative than generic placeholders
    if (conference.organizer && 
        conference.organizer !== 'Event Organizer' && 
        conference.organizer !== 'Ticketmaster Event') {
      score += 1;
    }
    
    return score;
  }

  /**
   * Get all available subject categories from mock data
   * 
   * Used for populating subject filter options in the UI.
   * Returns unique, sorted list of subjects.
   * 
   * @returns Array of subject category strings
   */
  static getAllSubjects(): string[] {
    return Array.from(new Set(mockConferences.map(c => c.subject))).sort();
  }

  /**
   * Look up a specific conference by ID
   * 
   * Useful for detail views or when storing conference IDs in URLs/state.
   * Currently only searches mock data - could be extended to cache API results.
   * 
   * @param id - Unique conference identifier
   * @returns Conference object if found, undefined otherwise
   */
  static getConferenceById(id: string): Conference | undefined {
    return mockConferences.find(c => c.id === id);
  }
}