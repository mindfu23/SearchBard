# searchBard.py - Technical Documentation

## Overview

`searchBard.py` is a comprehensive Python module for conference data management, providing tools for web scraping, data aggregation, and cloud storage. It complements the React-based conference search application in the `conference-search/` directory.

## Architecture

### Class Structure

```
ConferenceDataManager
│
├── Initialization
│   ├── __init__()
│   └── _initialize_firebase()
│
├── Web Scraping (BeautifulSoup + Requests)
│   ├── scrape_conference_page()
│   ├── scrape_multiple_pages()
│   └── _extract_conference_data()
│
├── Large-Scale Scraping (Scrapy)
│   ├── create_scrapy_spider()
│   └── run_scrapy_spider()
│
├── Data Aggregation (Pandas)
│   ├── aggregate_and_deduplicate()
│   ├── merge_conference_sources()
│   └── add_conference_hash()
│
├── Firebase Integration
│   ├── store_to_firebase()
│   ├── query_firebase()
│   ├── get_all_conferences()
│   ├── delete_conference()
│   └── _sanitize_for_firebase()
│
└── Utilities
    ├── export_to_json()
    └── import_from_json()
```

## Data Flow

### 1. Web Scraping Pipeline

```
URL → HTTP Request → HTML Response → BeautifulSoup Parser
                                            ↓
                                   Extract Conference Data
                                            ↓
                                   List[Dict[str, Any]]
```

### 2. Aggregation Pipeline

```
Multiple Data Sources → Pandas DataFrame → Normalize Fields
                                                ↓
                                         Remove Duplicates
                                                ↓
                                         Generate Hash IDs
                                                ↓
                                    Clean DataFrame with IDs
```

### 3. Storage Pipeline

```
DataFrame → Convert to Dicts → Sanitize → Firebase Batch Write
                                                    ↓
                                            Firestore Collection
```

## Data Models

### Conference Data Structure

```python
{
    'title': str,              # Conference name
    'location': str,           # City, State, Country
    'date': str,              # Date string (flexible format)
    'description': str,        # Conference description
    'url': str,               # Conference website
    'scraped_at': str,        # ISO timestamp
    'source': str,            # Data source identifier
    'conference_id': str      # SHA-256 hash (added by add_conference_hash)
}
```

## Deduplication Strategy

Duplicates are identified using normalized keys:

1. **Normalize**: Convert title, location, date to lowercase and strip whitespace
2. **Compare**: Match on normalized values
3. **Keep**: First occurrence is retained
4. **Drop**: Subsequent duplicates removed

Example:
```python
# These are considered duplicates:
{'title': 'PyCon 2024', 'location': 'Pittsburgh, PA', 'date': '2024-05-15'}
{'title': 'PYCON 2024', 'location': 'Pittsburgh, PA  ', 'date': '2024-05-15'}
```

## Security Features

### 1. SHA-256 Hashing
- Conference IDs use SHA-256 (not MD5)
- Provides cryptographically secure unique identifiers
- 64-character hexadecimal output

### 2. URL Validation
- Only accepts URLs starting with `http://`, `https://`, or `/`
- Rejects javascript: and other potentially dangerous schemes
- Prevents XSS and injection attacks

### 3. Firebase Sanitization
- Converts non-serializable types (Pandas NaN, Timestamps)
- Validates document IDs before storage
- Prevents Firebase write errors

### 4. Optional Dependencies
- Gracefully handles missing Firebase or Scrapy packages
- Clear warnings when features are unavailable
- No crashes due to missing dependencies

## Performance Considerations

### Batch Operations

**Firebase Writes**: Limited to 500 documents per batch
```python
# Automatically handles batching
for i, conference in enumerate(conferences):
    batch.set(doc_ref, conference)
    if (i + 1) % 500 == 0:
        batch.commit()
        batch = db.batch()
```

### Memory Management

**Large Datasets**: Use Pandas for efficient memory usage
```python
# Pandas DataFrame is memory-efficient for large datasets
df = pd.DataFrame(conferences)  # Better than list of dicts for 10K+ items
```

### Scrapy Limitations

**Single Process**: CrawlerProcess can only run once per Python process
```python
# Solution 1: Separate Python processes
subprocess.run(['python', 'spider1.py'])
subprocess.run(['python', 'spider2.py'])

# Solution 2: Use CrawlerRunner with asyncio
from scrapy.crawler import CrawlerRunner
runner = CrawlerRunner()
runner.crawl(Spider1)
runner.crawl(Spider2)
```

## Error Handling

### HTTP Errors
```python
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Error scraping {url}: {e}")
    return []
```

### Firebase Errors
```python
if not self.firebase_initialized:
    print("Error: Firebase not initialized")
    return False
```

### Scrapy Errors
```python
try:
    process.crawl(spider_class)
    process.start()
except RuntimeError as e:
    if "Cannot run reactor twice" in str(e):
        print("Error: CrawlerProcess can only be started once")
```

## Firebase Schema

### Collection: `conferences`

**Document Structure**:
```javascript
{
  conference_id: "sha256_hash",          // Document ID
  title: "Conference Name",
  location: "City, State",
  date: "2024-06-15",
  description: "Conference description",
  url: "https://example.com",
  scraped_at: "2024-12-25T18:00:00.000",
  source: "web_scraper"
}
```

**Indexes** (recommended):
- `date` (ascending) - for date range queries
- `location` (ascending) - for location filtering
- `subject` (ascending) - if subject field added

**Security Rules** (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conferences/{conference} {
      // Public read, authenticated write
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Customization Guide

### Custom Scraper

Create a specialized scraper for a specific website:

```python
def scrape_specific_site(url):
    manager = ConferenceDataManager()
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'lxml')
    
    conferences = []
    for item in soup.select('div.your-specific-selector'):
        conferences.append({
            'title': item.select_one('.title-class').text.strip(),
            'location': item.select_one('.location-class').text.strip(),
            'date': item.select_one('.date-class').get('datetime'),
            'description': item.select_one('.desc-class').text.strip(),
            'url': item.select_one('a').get('href'),
            'scraped_at': datetime.now().isoformat(),
            'source': 'custom_scraper'
        })
    
    return conferences
```

### Custom Aggregation

Add custom logic for specific data sources:

```python
def custom_merge_logic(df1, df2):
    """Merge with preference for source1 data quality"""
    manager = ConferenceDataManager()
    
    # Tag each source
    df1['priority'] = 1
    df2['priority'] = 2
    
    # Combine
    combined = pd.concat([df1, df2])
    
    # Sort by priority (lower is better)
    combined = combined.sort_values('priority')
    
    # Deduplicate (keeps first = highest priority)
    conferences = combined.to_dict('records')
    return manager.aggregate_and_deduplicate(conferences)
```

### Custom Firebase Queries

Add complex Firebase queries:

```python
def query_conferences_by_date_range(manager, start_date, end_date):
    """Query conferences within date range"""
    query = manager.db.collection('conferences')
    query = query.where('date', '>=', start_date)
    query = query.where('date', '<=', end_date)
    query = query.order_by('date')
    
    docs = query.stream()
    return [doc.to_dict() for doc in docs]
```

## Testing

### Unit Tests

```python
import unittest
from searchBard import ConferenceDataManager

class TestConferenceDataManager(unittest.TestCase):
    def setUp(self):
        self.manager = ConferenceDataManager()
    
    def test_deduplication(self):
        data = [
            {'title': 'Conf A', 'location': 'NYC', 'date': '2024-01-01'},
            {'title': 'Conf A', 'location': 'NYC', 'date': '2024-01-01'},
        ]
        df = self.manager.aggregate_and_deduplicate(data)
        self.assertEqual(len(df), 1)
    
    def test_hash_generation(self):
        df = pd.DataFrame([{'title': 'Test', 'location': 'Test', 'date': '2024-01-01'}])
        df_hashed = self.manager.add_conference_hash(df)
        self.assertIn('conference_id', df_hashed.columns)
        self.assertEqual(len(df_hashed['conference_id'].iloc[0]), 64)
```

## Deployment

### Production Checklist

- [ ] Install all dependencies: `pip install -r requirements.txt`
- [ ] Set up Firebase credentials securely
- [ ] Configure `.env` file (never commit!)
- [ ] Test scraping with target websites
- [ ] Set up Firebase security rules
- [ ] Monitor Firebase quota usage
- [ ] Implement rate limiting for web scraping
- [ ] Set up error logging
- [ ] Schedule periodic scraping jobs
- [ ] Back up Firebase data regularly

### Environment Variables

Required for Firebase:
```bash
FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Troubleshooting

### Common Issues

**1. Firebase not initializing**
- Check credentials file exists and path is correct
- Verify service account has Firestore permissions
- Ensure firebase-admin is installed

**2. Web scraping returns empty results**
- Verify target website structure
- Check for rate limiting or blocking
- Update HTML selectors if website changed
- Add delays between requests

**3. Scrapy reactor error**
- Can only call CrawlerProcess.start() once
- Use separate Python processes for multiple runs
- Or use CrawlerRunner with asyncio

**4. Memory issues with large datasets**
- Use Dask instead of Pandas for huge datasets
- Process in chunks
- Clear unnecessary data with `del df`

## Future Enhancements

Potential improvements:

1. **Async Scraping**: Use aiohttp for concurrent requests
2. **Machine Learning**: Detect duplicate conferences with ML
3. **Auto-detection**: Detect website structure automatically
4. **Scheduling**: Built-in cron-like scheduling
5. **Monitoring**: Health checks and alerts
6. **Caching**: Redis cache for frequently accessed data
7. **API**: REST API wrapper around functionality

---

**Last Updated**: December 25, 2025
