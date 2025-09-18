# SearchBard - Conference Search Portal

A conference search application that helps you find conferences across the top 10 subjects in your area and time range.

## Features

- Search conferences by multiple subjects (Technology, Healthcare, Business, Education, Science, Marketing, Finance, Environment, Arts & Design, Engineering)
- Filter by location (City, State)
- Filter by date range
- Mock conference data with real examples
- Clean, responsive web interface

## Project Structure

- `search.html` - Main conference search web application
- `searchBard.py` - Python search script (utility functions)
- `requirements.txt` - Python dependencies
- `netlify.toml` - Deployment configuration

## Usage

### Web Application
Open `search.html` in a web browser to use the conference search portal. The interface allows you to:

1. Select one or more conference subjects from the top 10 categories
2. Enter a location (optional)
3. Set a date range (optional) 
4. Click "Search Conferences" to find matching events

### Python Script
```bash
python3 searchBard.py
```

## Deployment

The application is configured for deployment on Netlify with `search.html` as the main entry point.

## Technical Details

- Pure HTML/CSS/JavaScript implementation
- No external frameworks required
- Mock data for demonstration (can be replaced with real API integration)
- Responsive design that works on desktop and mobile