# SearchBard - Conference Search Portal

A React-based web application that aggregates conference and event data from multiple sources to help users discover professional conferences across various subjects, locations, and date ranges.

## Overview

SearchBard solves the problem of fragmented conference information by querying multiple event APIs simultaneously and presenting unified, deduplicated results. Users can search for conferences by subject (Technology, Healthcare, Business, etc.), location with radius filtering, and date ranges.

The application employs a resilient multi-source strategy: if one API fails or returns no results, others continue to provide data, with a fallback to curated mock data for demonstration purposes.

## Project Structure

```
SearchBard/
├── conference-search/          # Main React application
│   ├── src/
│   │   ├── components/         # React UI components
│   │   │   ├── SearchForm.tsx          # Search filter interface
│   │   │   ├── ConferenceResults.tsx   # Results display container
│   │   │   └── ConferenceCard.tsx      # Individual conference card
│   │   ├── services/           # API integration layer
│   │   │   ├── ConferenceSearchService.ts  # Main search orchestration
│   │   │   ├── SerpApiService.ts           # Google Events via SerpAPI
│   │   │   ├── TicketmasterApiService.ts   # Ticketmaster Discovery API
│   │   │   └── EventbriteApiService.ts     # Eventbrite API (optional)
│   │   ├── types/              # TypeScript definitions
│   │   │   └── Conference.ts   # Core data models
│   │   ├── data/               # Mock/fallback data
│   │   └── App.tsx             # Root application component
│   ├── public/                 # Static assets
│   ├── .env.example            # Environment variable template
│   └── package.json            # Dependencies and scripts
├── searchBard.py               # LEGACY: Python prototype (not used)
├── search.html                 # LEGACY: Indeed API experiment (not used)
└── README.md                   # This file
```

## Features

### Multi-Source Data Aggregation
- **SerpAPI (Google Events)**: Primary source for general conference data
- **Ticketmaster Discovery API**: Secondary source, especially for ticketed events
- **Eventbrite API**: Optional third source (requires additional setup)
- Automatic deduplication of results across sources

### Smart Filtering
- **Subject Categories**: 11 predefined subjects (Technology, Healthcare, Business, etc.)
- **Location Search**: City-based search with configurable radius (10-500 miles)
- **Date Ranges**: Filter conferences by start and end dates
- **Geographic Distance**: Haversine formula for accurate distance calculations

### User Experience
- Responsive design for mobile and desktop
- Real-time search with loading states
- Clear "no results" messaging
- Conference cards with essential information (title, location, dates, description)

## Getting Started

### Prerequisites

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher
- **API Keys**: At least one of the following:
  - SerpAPI key (recommended) - [Get key](https://serpapi.com/)
  - Ticketmaster API key - [Get key](https://developer.ticketmaster.com/)
  - Eventbrite API key (optional) - [Get key](https://www.eventbrite.com/platform/)

### Installation

1. **Clone or navigate to the repository**:
   ```bash
   cd /path/to/SearchBard/conference-search
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Add your API keys to `.env`**:
   ```env
   REACT_APP_SERPAPI_API_KEY=your_serpapi_key_here
   REACT_APP_TICKETMASTER_API_KEY=your_ticketmaster_key_here
   REACT_APP_EVENTBRITE_API_KEY=your_eventbrite_key_here  # Optional
   ```

   **Note**: You need at least one API key for the application to fetch real data. Without API keys, the app will fall back to mock data.

5. **Start the development server**:
   ```bash
   npm start
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be in the `build/` directory, ready for deployment.

## Usage

### Searching for Conferences

1. **Select Subjects**: Choose one or more subject categories, or select all
2. **Enter Location**: Type a city and state (e.g., "San Francisco, CA")
3. **Adjust Radius**: Use the slider to set search radius (10-500 miles)
4. **Set Date Range**: Choose start and end dates for your search window
5. **Click Search**: Results will appear below the search form

### Understanding Results

Each conference card displays:
- **Title**: Conference name
- **Subject Category**: The categorized topic area
- **Location**: City, state, and country
- **Dates**: Start date (and end date if multi-day)
- **Description**: Brief overview of the conference
- **Website Link**: Direct link to conference website (when available)

### Search Tips

- **Broad searches**: Select all subjects and use a large radius for comprehensive results
- **Focused searches**: Choose 1-2 subjects and a small radius for targeted results
- **Date flexibility**: Use wider date ranges when exploring options
- **Location variations**: Try different city names if initial search returns few results

## API Configuration

### SerpAPI (Recommended)

SerpAPI provides access to Google Events data, which is the most comprehensive source for conferences.

**Setup**:
1. Sign up at [serpapi.com](https://serpapi.com/)
2. Get your API key from the dashboard
3. Add to `.env`: `REACT_APP_SERPAPI_API_KEY=your_key`

**Pricing**: 100 free searches/month, then paid tiers

### Ticketmaster Discovery API

Ticketmaster provides data for ticketed conferences and professional events.

**Setup**:
1. Register at [developer.ticketmaster.com](https://developer.ticketmaster.com/)
2. Create an app to get an API key
3. Add to `.env`: `REACT_APP_TICKETMASTER_API_KEY=your_key`

**Pricing**: Free tier with rate limits (5000 requests/day)

### Eventbrite API (Optional)

Eventbrite provides additional event data, particularly for smaller conferences.

**Setup**:
1. Create account at [eventbrite.com](https://www.eventbrite.com/)
2. Get API key from [eventbrite.com/platform](https://www.eventbrite.com/platform/)
3. Add to `.env`: `REACT_APP_EVENTBRITE_API_KEY=your_key`

**Note**: Eventbrite integration is implemented but not active by default. Enable in `ConferenceSearchService.ts` if desired.

## Architecture

### Data Flow

```
User Input (SearchForm)
    ↓
ConferenceSearchService.searchConferences()
    ↓
Parallel API Calls:
    ├── SerpApiService.searchEvents()
    ├── TicketmasterApiService.searchEvents()
    └── EventbriteApiService.searchEvents()
    ↓
Results Aggregation & Deduplication
    ↓
Filtering (subjects, location, dates)
    ↓
ConferenceResults Display
```

### Key Components

**ConferenceSearchService**: Orchestrates the search process
- Calls multiple APIs in parallel
- Deduplicates results using normalized titles and dates
- Applies filters (subjects, location radius, date range)
- Falls back to mock data if all APIs fail

**API Services**: Wrap external APIs
- Transform API responses into unified `Conference` interface
- Handle API-specific error cases
- Map external categories to our subject taxonomy

**React Components**: Handle UI and user interaction
- SearchForm: Captures user input, manages form state
- ConferenceResults: Displays results with loading and empty states
- ConferenceCard: Renders individual conference information

### Deduplication Strategy

Conferences from multiple APIs are deduplicated by creating a normalized key from:
- Lowercase, trimmed title
- Start date (YYYY-MM-DD format)
- City name

This prevents the same conference from appearing multiple times when found by different APIs.

## Development

### Running Tests

```bash
npm test
```

Launches the test runner in interactive watch mode.

### Code Style

The project uses:
- **TypeScript** for type safety
- **ESLint** for code quality (extends react-app config)
- **CSS Modules** for component styling

### Adding a New API Source

To integrate a new conference API:

1. Create a service file in `src/services/` (e.g., `NewApiService.ts`)
2. Implement a method that returns `Promise<Conference[]>`
3. Transform the API response to match the `Conference` interface
4. Add the service call to `ConferenceSearchService.searchConferences()`
5. Update `.env.example` with the new API key variable

See existing services for implementation patterns.

## Troubleshooting

### No Results Returned

**Possible causes**:
- API keys not configured or invalid
- Search criteria too restrictive (try broader filters)
- APIs experiencing downtime
- Rate limits exceeded

**Solutions**:
- Check `.env` file has valid API keys
- Check browser console for API error messages
- Widen search radius and date range
- Wait if rate-limited (Ticketmaster: 5000/day, SerpAPI: 100/month free tier)

### Application Won't Start

**Possible causes**:
- Node modules not installed
- Wrong Node.js version
- Port 3000 already in use

**Solutions**:
```bash
npm install          # Reinstall dependencies
node --version       # Verify Node 16+ is installed
lsof -ti:3000 | xargs kill  # Kill process on port 3000
```

### API Errors in Console

Check that:
- API keys are correctly formatted in `.env`
- `.env` file is in the `conference-search/` directory
- You've restarted the dev server after adding API keys
- API keys have not exceeded their rate limits

## Legacy Files

The following files in the root directory are from earlier project iterations and are **not used** by the current application:

- **searchBard.py**: Python prototype with stub functions. Not functional.
- **search.html**: Experiment with Indeed Jobs API. Deprecated.
- **requirements.txt**: Python virtualenv setup for old prototype.

The active codebase is entirely within the `conference-search/` directory.

## Deployment

### Netlify

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variables in Netlify dashboard
6. Deploy

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `conference-search/` directory
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard

### Static Hosting

The production build is a static site that can be hosted anywhere:
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting
- Any static file server

## Future Enhancements

Potential improvements for future versions:

- **User Accounts**: Save favorite conferences and search preferences
- **Email Alerts**: Notify users when new conferences match their criteria
- **Conference Ratings**: Allow users to rate and review conferences
- **Advanced Filters**: Filter by price range, conference size, topics/tags
- **Calendar Integration**: Export conferences to Google Calendar, iCal
- **Mobile App**: Native iOS/Android applications
- **API Caching**: Cache API responses to reduce costs and improve speed
- **Admin Dashboard**: Manually curate and verify conference data

## Contributing

When contributing to this project:

1. Follow the existing code style and TypeScript patterns
2. Add inline comments for complex logic
3. Update this README if adding features or changing architecture
4. Test with multiple API sources
5. Ensure the app gracefully handles API failures

## License

[Add your license information here]

## Contact

[Add contact information or link to issue tracker]

---

**Last Updated**: December 4, 2025
