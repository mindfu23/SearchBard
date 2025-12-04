# SearchBard Architecture

## System Overview

SearchBard is a React-based single-page application (SPA) that aggregates conference data from multiple external APIs, presenting a unified search interface to users. The architecture emphasizes resilience, user experience, and extensibility.

### Design Principles

1. **Resilience**: If one API fails, others continue to work
2. **Progressive Enhancement**: Works with mock data if no APIs are configured
3. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
4. **Type Safety**: TypeScript throughout for compile-time error detection
5. **User-Centric**: Fast, responsive UI with clear feedback

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React UI Layer                          │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ SearchForm  │──│ ConferenceResults │──│ ConferenceCard   │  │
│  │ (Filters)   │  │  (Results List)   │  │ (Single Result)  │  │
│  └─────────────┘  └──────────────────┘  └──────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         ConferenceSearchService (Orchestrator)           │  │
│  │  • Multi-API query coordination                          │  │
│  │  • Result aggregation & deduplication                    │  │
│  │  • Filter application (subject, location, date)          │  │
│  │  • Fallback logic                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  SerpApiService  │  │ TicketmasterAPI  │  │ EventbriteAPI    │
│  (Google Events) │  │     Service      │  │    Service       │
│                  │  │                  │  │  (Optional)      │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External APIs                              │
│  • SerpAPI.com (Google Events proxy)                           │
│  • Ticketmaster Discovery API                                   │
│  • Eventbrite API                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### UI Layer Components

#### SearchForm
**Responsibility**: Capture user input and trigger searches

**State Management**:
- `selectedSubjects`: Array of chosen subject categories
- `location`: City/state string
- `startDate`, `endDate`: Date range strings
- `radius`: Distance in miles (10-500)

**Key Behaviors**:
- Multi-select subject checkboxes with "Select All" toggle
- Real-time validation of form inputs
- Disabled state during search to prevent duplicate requests
- Reset functionality to clear all filters

**User Experience Considerations**:
- Form persists user selections between searches
- Immediate visual feedback on selection changes
- Clear button states (enabled/disabled, loading)

#### ConferenceResults
**Responsibility**: Display search results or appropriate messaging

**States**:
1. **Initial**: No search performed yet
2. **Loading**: Search in progress (shows spinner)
3. **Results**: Conferences found (shows cards)
4. **Empty**: Search completed but no matches (helpful message)

**Props**:
- `conferences`: Array of conference objects
- `isLoading`: Boolean loading state
- `searchPerformed`: Whether any search has been initiated

#### ConferenceCard
**Responsibility**: Present single conference in consistent format

**Display Elements**:
- Title (linked to conference website when available)
- Subject category badge
- Location (city, state, country)
- Date range (formatted for readability)
- Description (truncated if too long)
- Organizer name

**Styling Approach**:
- Card-based design for scanability
- Color-coded subject badges
- Hover effects for interactivity
- Responsive layout (stacks on mobile)

### Service Layer

#### ConferenceSearchService
**Role**: Central orchestrator for all search operations

**Key Responsibilities**:

1. **Multi-API Coordination**
   - Calls APIs in parallel using `Promise.all` pattern
   - Each API wrapped in try-catch for fault tolerance
   - Aggregates results into single array

2. **Deduplication**
   - Creates normalized keys from title + date
   - Compares completeness scores when duplicates found
   - Keeps version with most information

3. **Filtering**
   - Subject filtering (if specific subjects selected)
   - Geographic filtering using Haversine distance
   - Date range filtering (overlapping dates)

4. **Fallback Strategy**
   - Returns API results if available
   - Falls back to mock data if APIs fail
   - Ensures app always shows something useful

**Why This Design?**
- Single point of coordination simplifies calling code
- Business logic isolated from API details
- Easy to add new data sources
- Testable without hitting real APIs

#### API Service Pattern
**Common Structure** (SerpApiService, TicketmasterApiService, EventbriteApiService):

```typescript
export class ApiService {
  // Main search method
  static async searchEvents(
    query: string,
    location: string,
    startDate: string,
    endDate: string
  ): Promise<Conference[]>
  
  // Transform API response to our Conference interface
  private static transformResponse(apiData): Conference[]
  
  // Parse/normalize location data
  private static parseLocation(locationData): Location
  
  // Categorize events into our subject taxonomy
  private static determineSubject(eventData): string
}
```

**Key Characteristics**:
- Static methods (no instance state needed)
- TypeScript interfaces for API response shapes
- Transform layer converts external format to internal `Conference` type
- Error handling with descriptive messages

## Data Flow

### Search Operation Sequence

```
1. User enters search criteria in SearchForm
   ↓
2. SearchForm calls onSearch callback with filters
   ↓
3. App component calls ConferenceSearchService.searchConferences()
   ↓
4. Service initiates parallel API calls
   ├─ SerpApiService.searchEvents()
   ├─ TicketmasterApiService.searchEvents()
   └─ (EventbriteApiService.searchEvents() if enabled)
   ↓
5. Each API service:
   - Makes HTTP request
   - Transforms response to Conference[]
   - Returns results or throws error
   ↓
6. Service aggregates all successful results
   ↓
7. Service deduplicates by title + date
   ↓
8. Service applies filters:
   - Subject categories
   - Geographic radius
   - Date range
   ↓
9. Service returns Conference[] to App
   ↓
10. App updates state, triggering re-render
   ↓
11. ConferenceResults displays updated list
```

### Error Handling Flow

```
API Call Fails (network error, invalid key, rate limit)
   ↓
Service catches error, logs to console
   ↓
Continues with other APIs (doesn't throw)
   ↓
If all APIs fail or return no results:
   ↓
Service falls back to mock data
   ↓
User still sees conference results
```

## Data Models

### Core Type: Conference

```typescript
interface Conference {
  id: string;                    // Unique identifier
  title: string;                 // Conference name
  subject: string;               // Category (Technology, Healthcare, etc.)
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {              // Optional: enables distance calc
      lat: number;
      lng: number;
    };
  };
  startDate: string;             // ISO 8601 format: "2025-06-15"
  endDate: string;               // ISO 8601 format
  description: string;           // Event description
  website?: string;              // URL to conference site
  organizer: string;             // Organizing entity
  attendeeCount?: number;        // Expected or past attendance
  price?: {                      // Pricing information
    min: number;
    max: number;
    currency: string;
  };
}
```

### Search Filters

```typescript
interface SearchFilters {
  subjects: string[];            // Empty array = all subjects
  location: string;              // "City, State" format
  startDate: string;             // ISO 8601 date string
  endDate: string;               // ISO 8601 date string
  radius?: number;               // Miles, default 50
}
```

## State Management

SearchBard uses React's built-in state management (useState, props) rather than Redux or Context API.

**Rationale**:
- Simple application with limited shared state
- Props drilling is minimal (2-3 levels max)
- No complex state updates or side effects requiring middleware
- Keeps bundle size small

**State Locations**:
- **App.tsx**: Search results, loading state, search performed flag
- **SearchForm.tsx**: Form inputs (subjects, location, dates, radius)
- **Component-local**: UI state like hover effects, expanded cards

## Deduplication Algorithm

### Problem Statement
When querying multiple APIs, the same conference often appears in multiple result sets. We need to identify and merge these duplicates while keeping the most complete information.

### Solution: Normalized Key + Completeness Scoring

#### Step 1: Key Generation
Create a unique identifier from conference data:

```typescript
const normalizedTitle = title
  .toLowerCase()
  .trim()
  .replace(/\s+/g, ' ');  // Normalize whitespace

const key = `${normalizedTitle}|${startDate}`;
```

**Why title + date?**
- Title alone isn't unique ("Tech Summit" happens many places)
- Date alone isn't unique (many events on same day)
- Together, they're usually unique
- Handles minor title variations (case, spacing)

#### Step 2: Duplicate Detection
Store conferences in Map with key:

```typescript
const seen = new Map<string, Conference>();

for (const conference of allResults) {
  const key = generateKey(conference);
  if (!seen.has(key)) {
    seen.set(key, conference);  // First occurrence
  } else {
    // Duplicate found - decide which to keep
    const existing = seen.get(key);
    const keepExisting = compareCompleteness(existing, conference);
    if (!keepExisting) {
      seen.set(key, conference);  // Replace with better version
    }
  }
}
```

#### Step 3: Completeness Scoring
When duplicates found, score each version:

```typescript
function calculateScore(conference: Conference): number {
  let score = 0;
  if (hasCoordinates) score += 2;      // Critical for distance filter
  if (longDescription) score += 2;     // Valuable for users
  if (hasPricing) score += 1;
  if (hasAttendeeCount) score += 1;
  if (hasRealWebsite) score += 1;
  if (hasSpecificOrganizer) score += 1;
  return score;  // 0-8 range
}
```

Keep the version with higher score.

### Performance Characteristics
- **Time Complexity**: O(n) where n = total results
- **Space Complexity**: O(u) where u = unique conferences
- **Typical Results**: 20-50% reduction in result count

## Geographic Filtering

### Challenge
Filter conferences by distance from user's search location.

### Haversine Distance Calculation

The Haversine formula calculates great-circle distance between two points on a sphere:

```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    sin(dLat/2) * sin(dLat/2) +
    cos(toRadians(lat1)) * cos(toRadians(lat2)) *
    sin(dLon/2) * sin(dLon/2);
    
  const c = 2 * atan2(sqrt(a), sqrt(1-a));
  
  return R * c;  // Distance in miles
}
```

**Accuracy**: ±0.5% for distances under 1000 miles

### Geocoding Strategy

**Option 1**: Hardcoded coordinates for major cities
- Pros: Fast, no API calls, free
- Cons: Limited coverage, US-only
- Used as primary method

**Option 2**: Text matching fallback
- Used when coordinates unavailable
- Simple substring matching on city names
- Less precise but better than nothing

**Future Enhancement**: Integrate Google Geocoding API for comprehensive coverage

## API Integration Patterns

### Parallel Execution

```typescript
// Launch all API calls simultaneously
const [serpResults, tmResults, ebResults] = await Promise.allSettled([
  SerpApiService.searchEvents(...),
  TicketmasterApiService.searchEvents(...),
  EventbriteApiService.searchEvents(...)
]);

// Process successful results
const allResults = [];
if (serpResults.status === 'fulfilled') allResults.push(...serpResults.value);
if (tmResults.status === 'fulfilled') allResults.push(...tmResults.value);
// etc.
```

**Benefits**:
- Faster total response time (not sequential)
- Resilient to individual failures
- Better user experience (quicker results)

### Error Handling Strategy

**Principle**: Fail gracefully, never crash

```typescript
try {
  const results = await apiCall();
  return transform(results);
} catch (error) {
  console.error('API failed:', error);
  // Don't throw - return empty array and let other APIs succeed
  return [];
}
```

**User Impact**:
- User never sees error messages for API failures
- Gets results from working APIs
- Falls back to mock data in worst case
- Console logs available for debugging

## Performance Optimization

### Current Optimizations

1. **Parallel API Calls**: 3x faster than sequential
2. **Efficient Deduplication**: Single-pass O(n) algorithm
3. **Client-Side Filtering**: No server round-trips for filters
4. **Lazy Loading**: Components only render when needed

### Future Optimization Opportunities

1. **Result Caching**: Cache API responses for 5-10 minutes
2. **Request Debouncing**: Wait for user to finish typing location
3. **Virtual Scrolling**: For large result sets (100+)
4. **Image Lazy Loading**: If we add conference images
5. **Service Worker**: Cache API responses offline

## Security Considerations

### API Key Protection

**Problem**: React apps expose all code to browser

**Solution**: Environment variables + server-side proxy (for production)

**Current Setup** (Development):
```
API keys in .env file
→ Bundled into React app (not ideal)
→ Visible in browser network requests
```

**Recommended Production Setup**:
```
API keys on backend server
→ React app calls your API
→ Your API calls external APIs
→ Keys never exposed to client
```

### Rate Limiting

**Strategies**:
1. Display usage warnings in UI when approaching limits
2. Implement client-side rate limiting (max N requests/minute)
3. Cache responses to reduce API calls
4. Use server-side proxy to enforce limits

## Testing Strategy

### Unit Tests
- **Services**: Mock API responses, test transformation logic
- **Utils**: Test geocoding, distance calculation
- **Components**: Test rendering with different props

### Integration Tests
- Test full search flow with mock APIs
- Verify deduplication works correctly
- Test filter combinations

### E2E Tests
- User enters search criteria
- Results appear correctly
- Filters work as expected
- Error states display properly

## Deployment Architecture

### Development
```
Local Machine
├─ Node.js dev server (port 3000)
├─ Direct API calls to SerpAPI, Ticketmaster
└─ Environment variables from .env
```

### Production (Recommended)
```
CDN (Netlify/Vercel)
├─ Static React build
└─ Serverless Functions
    ├─ /api/search
    │   └─ Proxies API calls
    │   └─ Stores API keys securely
    └─ Returns Conference[]
```

## Extensibility Points

### Adding a New API Source

1. Create service file: `src/services/NewApiService.ts`
2. Implement `searchEvents()` method
3. Transform response to `Conference[]`
4. Add call to `ConferenceSearchService.searchConferences()`
5. Update `.env.example` with new key variable

### Adding a New Filter

1. Add field to `SearchFilters` interface
2. Add UI control to `SearchForm`
3. Implement filter logic in `ConferenceSearchService`
4. Test with various inputs

### Adding a New Subject Category

1. Add to `TOP_SUBJECTS` array in `Conference.ts`
2. Update keyword mappings in API services
3. Update UI (checkboxes automatically update)

## Known Limitations

1. **Geocoding**: Only major US cities have coordinates
2. **Subject Classification**: Keyword-based, not ML
3. **API Costs**: Free tiers limit production usage
4. **Date Parsing**: Some formats not handled
5. **Mobile UX**: Could be improved for smaller screens

## Future Architecture Considerations

### Microservices Option
Split into separate services:
- Frontend (React SPA)
- Search API (Node/Express)
- Cache Layer (Redis)
- Admin Dashboard (React/Next.js)

### Real-time Updates
- WebSocket connections for live updates
- Push notifications for saved searches
- Collaborative features (sharing, ratings)

### Data Layer
- Database for user accounts
- Store search history
- Cache conference data
- Analytics on popular searches

---

**Last Updated**: December 4, 2025
