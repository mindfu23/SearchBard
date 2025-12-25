"""
SearchBard - Conference Data Scraping, Aggregation, and Storage

This module provides functionality for:
1. Web scraping conference data from websites using BeautifulSoup and Requests
2. Large-scale scraping and crawling with Scrapy
3. Data aggregation, deduplication, and merging with Pandas/Dask
4. Firebase integration for storing and retrieving conference data

Usage:
    from searchBard import ConferenceDataManager
    
    manager = ConferenceDataManager()
    
    # Scrape conference data
    conferences = manager.scrape_conference_page('https://example.com/conferences')
    
    # Aggregate and deduplicate data
    clean_data = manager.aggregate_and_deduplicate(conferences)
    
    # Store in Firebase
    manager.store_to_firebase(clean_data)
    
    # Query from Firebase
    results = manager.query_firebase(subject='Technology')
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Web Scraping
import requests
from bs4 import BeautifulSoup

# Data Processing
import pandas as pd

# Firebase
import firebase_admin
from firebase_admin import credentials, db, firestore

# Scrapy imports (for advanced scraping)
from scrapy import Spider, Request
from scrapy.crawler import CrawlerProcess


class ConferenceDataManager:
    """
    Main class for managing conference data through scraping, aggregation, and storage.
    """
    
    def __init__(self, firebase_creds_path: Optional[str] = None):
        """
        Initialize the ConferenceDataManager.
        
        Args:
            firebase_creds_path: Path to Firebase credentials JSON file.
                                If None, will try to load from environment variable.
        """
        load_dotenv()
        self.firebase_initialized = False
        
        if firebase_creds_path or os.getenv('FIREBASE_CREDENTIALS_PATH'):
            self._initialize_firebase(firebase_creds_path)
    
    def _initialize_firebase(self, creds_path: Optional[str] = None):
        """
        Initialize Firebase Admin SDK.
        
        Args:
            creds_path: Path to Firebase service account credentials JSON file.
        """
        try:
            if not creds_path:
                creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            
            if creds_path and os.path.exists(creds_path):
                cred = credentials.Certificate(creds_path)
                
                # Check if already initialized
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred, {
                        'databaseURL': os.getenv('FIREBASE_DATABASE_URL', ''),
                        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', '')
                    })
                
                self.firebase_initialized = True
                self.db = firestore.client()
                print("Firebase initialized successfully")
            else:
                print("Warning: Firebase credentials not found. Firebase features disabled.")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            self.firebase_initialized = False
    
    # =========================================================================
    # Web Scraping Methods - BeautifulSoup & Requests
    # =========================================================================
    
    def scrape_conference_page(self, url: str, parser: str = 'html.parser') -> List[Dict[str, Any]]:
        """
        Scrape conference data from a webpage using BeautifulSoup.
        
        This is a generic scraper that attempts to extract conference information
        from common HTML structures. You may need to customize the selectors
        for specific websites.
        
        Args:
            url: The URL to scrape
            parser: BeautifulSoup parser to use ('html.parser', 'lxml', etc.)
        
        Returns:
            List of dictionaries containing conference data
            
        Example:
            conferences = manager.scrape_conference_page('https://example.com/events')
            for conf in conferences:
                print(f"{conf['title']} - {conf['location']}")
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, parser)
            conferences = []
            
            # Example extraction logic - customize based on target website
            # Looking for common conference listing patterns
            
            # Try to find conference containers (common class names)
            conference_containers = (
                soup.find_all('div', class_=['event', 'conference', 'listing']) or
                soup.find_all('article') or
                soup.find_all('li', class_=['event-item', 'conference-item'])
            )
            
            for container in conference_containers:
                conference = self._extract_conference_data(container)
                if conference:
                    conferences.append(conference)
            
            print(f"Scraped {len(conferences)} conferences from {url}")
            return conferences
            
        except requests.exceptions.RequestException as e:
            print(f"Error scraping {url}: {e}")
            return []
    
    def _extract_conference_data(self, container) -> Optional[Dict[str, Any]]:
        """
        Extract conference information from a BeautifulSoup element.
        
        Args:
            container: BeautifulSoup element containing conference data
            
        Returns:
            Dictionary with conference data or None if extraction fails
        """
        try:
            # Extract title
            title_elem = (
                container.find('h1') or 
                container.find('h2') or 
                container.find('h3') or
                container.find(class_=['title', 'event-title', 'conference-name'])
            )
            title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"
            
            # Extract location
            location_elem = container.find(class_=['location', 'venue', 'place'])
            location = location_elem.get_text(strip=True) if location_elem else "Location TBD"
            
            # Extract dates
            date_elem = container.find(class_=['date', 'event-date', 'time'])
            date = date_elem.get_text(strip=True) if date_elem else "Date TBD"
            
            # Extract description
            desc_elem = (
                container.find('p') or 
                container.find(class_=['description', 'summary'])
            )
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # Extract link
            link_elem = container.find('a', href=True)
            link = link_elem['href'] if link_elem else ""
            
            return {
                'title': title,
                'location': location,
                'date': date,
                'description': description,
                'url': link,
                'scraped_at': datetime.now().isoformat(),
                'source': 'web_scraper'
            }
        except Exception as e:
            print(f"Error extracting conference data: {e}")
            return None
    
    def scrape_multiple_pages(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape conference data from multiple URLs.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            Combined list of conferences from all URLs
            
        Example:
            urls = ['https://site1.com/events', 'https://site2.com/conferences']
            all_conferences = manager.scrape_multiple_pages(urls)
        """
        all_conferences = []
        for url in urls:
            conferences = self.scrape_conference_page(url)
            all_conferences.extend(conferences)
        return all_conferences
    
    # =========================================================================
    # Scrapy Integration - Large-scale Scraping
    # =========================================================================
    
    def create_scrapy_spider(self, start_urls: List[str], allowed_domains: Optional[List[str]] = None):
        """
        Create a Scrapy spider for large-scale conference data scraping.
        
        This creates a basic spider that can be customized for specific websites.
        Scrapy is more suitable for crawling multiple pages and handling complex scenarios.
        
        Args:
            start_urls: List of URLs to start crawling from
            allowed_domains: Optional list of allowed domains for crawling
            
        Returns:
            ConferenceSpider class ready to be run
            
        Example:
            spider_class = manager.create_scrapy_spider(
                ['https://example.com/conferences'],
                ['example.com']
            )
            # Run the spider using Scrapy's CrawlerProcess
        """
        
        class ConferenceSpider(Spider):
            name = 'conference_spider'
            start_urls = start_urls
            allowed_domains = allowed_domains or []
            
            def parse(self, response):
                """Parse conference data from response."""
                # Extract conferences from the page
                for conference in response.css('div.event, div.conference, article'):
                    yield {
                        'title': conference.css('h2::text, h3::text').get(),
                        'location': conference.css('.location::text, .venue::text').get(),
                        'date': conference.css('.date::text, .event-date::text').get(),
                        'description': conference.css('p::text, .description::text').get(),
                        'url': conference.css('a::attr(href)').get(),
                        'scraped_at': datetime.now().isoformat(),
                        'source': 'scrapy_spider'
                    }
                
                # Follow pagination links
                next_page = response.css('a.next::attr(href)').get()
                if next_page:
                    yield response.follow(next_page, self.parse)
        
        return ConferenceSpider
    
    def run_scrapy_spider(self, spider_class, output_file: str = 'scraped_conferences.json'):
        """
        Run a Scrapy spider and save results to a file.
        
        Args:
            spider_class: The spider class to run
            output_file: Path to save the scraped data
            
        Example:
            spider = manager.create_scrapy_spider(['https://example.com'])
            manager.run_scrapy_spider(spider, 'conferences.json')
        """
        process = CrawlerProcess(settings={
            'FEEDS': {
                output_file: {'format': 'json'},
            },
            'LOG_LEVEL': 'INFO',
        })
        
        process.crawl(spider_class)
        process.start()
        print(f"Scrapy spider completed. Results saved to {output_file}")
    
    # =========================================================================
    # Data Aggregation and Deduplication - Pandas
    # =========================================================================
    
    def aggregate_and_deduplicate(self, conferences: List[Dict[str, Any]], 
                                   dedupe_keys: List[str] = None) -> pd.DataFrame:
        """
        Aggregate conference data from multiple sources and remove duplicates.
        
        Args:
            conferences: List of conference dictionaries
            dedupe_keys: Keys to use for deduplication (default: ['title', 'date', 'location'])
            
        Returns:
            Pandas DataFrame with deduplicated conferences
            
        Example:
            conferences = manager.scrape_multiple_pages(urls)
            clean_df = manager.aggregate_and_deduplicate(conferences)
            print(f"Found {len(clean_df)} unique conferences")
        """
        if not conferences:
            print("No conferences to aggregate")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(conferences)
        
        # Default deduplication keys
        if dedupe_keys is None:
            dedupe_keys = ['title', 'location', 'date']
        
        # Ensure dedupe keys exist in the dataframe
        available_keys = [key for key in dedupe_keys if key in df.columns]
        
        if not available_keys:
            print("Warning: No deduplication keys found in data")
            return df
        
        # Normalize data for better deduplication
        for key in available_keys:
            if key in df.columns:
                # Convert to string, lowercase, and strip whitespace
                df[f'{key}_normalized'] = df[key].astype(str).str.lower().str.strip()
        
        # Create normalized columns list
        normalized_keys = [f'{key}_normalized' for key in available_keys]
        
        # Remove duplicates based on normalized keys
        df_deduped = df.drop_duplicates(subset=normalized_keys, keep='first')
        
        # Drop the normalized columns
        df_deduped = df_deduped.drop(columns=normalized_keys)
        
        print(f"Deduplicated: {len(df)} -> {len(df_deduped)} conferences")
        return df_deduped
    
    def merge_conference_sources(self, *dataframes: pd.DataFrame) -> pd.DataFrame:
        """
        Merge conference data from multiple DataFrame sources.
        
        Args:
            *dataframes: Variable number of DataFrames to merge
            
        Returns:
            Combined and deduplicated DataFrame
            
        Example:
            df1 = manager.aggregate_and_deduplicate(source1_data)
            df2 = manager.aggregate_and_deduplicate(source2_data)
            merged = manager.merge_conference_sources(df1, df2)
        """
        if not dataframes:
            return pd.DataFrame()
        
        # Concatenate all dataframes
        combined = pd.concat(dataframes, ignore_index=True)
        
        # Convert back to list of dicts for deduplication
        conferences = combined.to_dict('records')
        
        # Deduplicate
        return self.aggregate_and_deduplicate(conferences)
    
    def add_conference_hash(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add a unique hash ID to each conference for tracking.
        
        Args:
            df: DataFrame with conference data
            
        Returns:
            DataFrame with added 'conference_id' column
        """
        def create_hash(row):
            # Create hash from title, location, and date
            hash_string = f"{row.get('title', '')}_{row.get('location', '')}_{row.get('date', '')}"
            return hashlib.md5(hash_string.encode()).hexdigest()
        
        df['conference_id'] = df.apply(create_hash, axis=1)
        return df
    
    # =========================================================================
    # Firebase Integration - Storage and Retrieval
    # =========================================================================
    
    def store_to_firebase(self, data: pd.DataFrame, collection_name: str = 'conferences') -> bool:
        """
        Store conference data to Firebase Firestore.
        
        Args:
            data: DataFrame containing conference data
            collection_name: Firestore collection name
            
        Returns:
            True if successful, False otherwise
            
        Example:
            df = manager.aggregate_and_deduplicate(conferences)
            success = manager.store_to_firebase(df)
        """
        if not self.firebase_initialized:
            print("Error: Firebase not initialized")
            return False
        
        try:
            # Add hash IDs if not present
            if 'conference_id' not in data.columns:
                data = self.add_conference_hash(data)
            
            # Convert DataFrame to list of dicts
            conferences = data.to_dict('records')
            
            # Store each conference
            collection_ref = self.db.collection(collection_name)
            batch = self.db.batch()
            count = 0
            
            for conference in conferences:
                # Convert any non-serializable types
                conference = self._sanitize_for_firebase(conference)
                
                # Use conference_id as document ID
                doc_ref = collection_ref.document(conference.get('conference_id', ''))
                batch.set(doc_ref, conference, merge=True)
                count += 1
                
                # Commit in batches of 500 (Firestore limit)
                if count % 500 == 0:
                    batch.commit()
                    batch = self.db.batch()
            
            # Commit remaining
            if count % 500 != 0:
                batch.commit()
            
            print(f"Stored {count} conferences to Firebase collection '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"Error storing to Firebase: {e}")
            return False
    
    def query_firebase(self, collection_name: str = 'conferences', 
                      filters: Optional[Dict[str, Any]] = None,
                      limit: int = 100) -> List[Dict[str, Any]]:
        """
        Query conferences from Firebase Firestore.
        
        Args:
            collection_name: Firestore collection name
            filters: Dictionary of field:value pairs to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of conference dictionaries
            
        Example:
            # Get all Technology conferences
            tech_conferences = manager.query_firebase(
                filters={'subject': 'Technology'},
                limit=50
            )
        """
        if not self.firebase_initialized:
            print("Error: Firebase not initialized")
            return []
        
        try:
            query = self.db.collection(collection_name)
            
            # Apply filters
            if filters:
                for field, value in filters.items():
                    query = query.where(field, '==', value)
            
            # Apply limit
            query = query.limit(limit)
            
            # Execute query
            docs = query.stream()
            
            results = []
            for doc in docs:
                conference = doc.to_dict()
                conference['firebase_id'] = doc.id
                results.append(conference)
            
            print(f"Retrieved {len(results)} conferences from Firebase")
            return results
            
        except Exception as e:
            print(f"Error querying Firebase: {e}")
            return []
    
    def get_all_conferences(self, collection_name: str = 'conferences') -> List[Dict[str, Any]]:
        """
        Retrieve all conferences from Firebase.
        
        Args:
            collection_name: Firestore collection name
            
        Returns:
            List of all conference dictionaries
        """
        if not self.firebase_initialized:
            print("Error: Firebase not initialized")
            return []
        
        try:
            docs = self.db.collection(collection_name).stream()
            
            conferences = []
            for doc in docs:
                conference = doc.to_dict()
                conference['firebase_id'] = doc.id
                conferences.append(conference)
            
            print(f"Retrieved {len(conferences)} conferences from Firebase")
            return conferences
            
        except Exception as e:
            print(f"Error retrieving conferences: {e}")
            return []
    
    def delete_conference(self, conference_id: str, collection_name: str = 'conferences') -> bool:
        """
        Delete a specific conference from Firebase.
        
        Args:
            conference_id: The conference ID to delete
            collection_name: Firestore collection name
            
        Returns:
            True if successful, False otherwise
        """
        if not self.firebase_initialized:
            print("Error: Firebase not initialized")
            return False
        
        try:
            self.db.collection(collection_name).document(conference_id).delete()
            print(f"Deleted conference {conference_id}")
            return True
        except Exception as e:
            print(f"Error deleting conference: {e}")
            return False
    
    def _sanitize_for_firebase(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize data for Firebase storage (handle non-serializable types).
        
        Args:
            data: Dictionary to sanitize
            
        Returns:
            Sanitized dictionary
        """
        sanitized = {}
        for key, value in data.items():
            if pd.isna(value):
                sanitized[key] = None
            elif isinstance(value, (pd.Timestamp, datetime)):
                sanitized[key] = value.isoformat()
            elif isinstance(value, (int, float, str, bool, type(None))):
                sanitized[key] = value
            else:
                sanitized[key] = str(value)
        return sanitized
    
    # =========================================================================
    # Utility Methods
    # =========================================================================
    
    def export_to_json(self, data: pd.DataFrame, filename: str = 'conferences.json'):
        """
        Export conference data to a JSON file.
        
        Args:
            data: DataFrame with conference data
            filename: Output filename
            
        Example:
            df = manager.aggregate_and_deduplicate(conferences)
            manager.export_to_json(df, 'my_conferences.json')
        """
        try:
            data.to_json(filename, orient='records', indent=2)
            print(f"Exported {len(data)} conferences to {filename}")
        except Exception as e:
            print(f"Error exporting to JSON: {e}")
    
    def import_from_json(self, filename: str) -> pd.DataFrame:
        """
        Import conference data from a JSON file.
        
        Args:
            filename: Input filename
            
        Returns:
            DataFrame with conference data
        """
        try:
            df = pd.read_json(filename)
            print(f"Imported {len(df)} conferences from {filename}")
            return df
        except Exception as e:
            print(f"Error importing from JSON: {e}")
            return pd.DataFrame()


# =========================================================================
# Example Usage and Demo Functions
# =========================================================================

def demo_scraping():
    """Demonstrate web scraping functionality."""
    print("\n=== Web Scraping Demo ===")
    manager = ConferenceDataManager()
    
    # Example: Scrape a conference listing page
    # Note: Replace with actual conference website URL
    example_url = "https://example.com/conferences"
    print(f"Scraping conferences from {example_url}")
    conferences = manager.scrape_conference_page(example_url)
    
    if conferences:
        print(f"\nFound {len(conferences)} conferences")
        print("\nFirst conference:")
        print(json.dumps(conferences[0], indent=2))


def demo_aggregation():
    """Demonstrate data aggregation and deduplication."""
    print("\n=== Data Aggregation Demo ===")
    manager = ConferenceDataManager()
    
    # Example data from multiple sources
    source1 = [
        {'title': 'Tech Conference 2024', 'location': 'San Francisco, CA', 'date': '2024-06-15'},
        {'title': 'AI Summit', 'location': 'New York, NY', 'date': '2024-07-20'},
    ]
    
    source2 = [
        {'title': 'Tech Conference 2024', 'location': 'San Francisco, CA', 'date': '2024-06-15'},  # Duplicate
        {'title': 'DevOps Days', 'location': 'Austin, TX', 'date': '2024-08-10'},
    ]
    
    # Combine and deduplicate
    all_conferences = source1 + source2
    df = manager.aggregate_and_deduplicate(all_conferences)
    
    print(f"\nOriginal count: {len(all_conferences)}")
    print(f"After deduplication: {len(df)}")
    print("\nDeduplicated conferences:")
    print(df[['title', 'location', 'date']])


def demo_firebase():
    """Demonstrate Firebase integration."""
    print("\n=== Firebase Demo ===")
    
    # Initialize with Firebase credentials
    manager = ConferenceDataManager()
    
    if not manager.firebase_initialized:
        print("Firebase not initialized. Set FIREBASE_CREDENTIALS_PATH in .env")
        return
    
    # Example data
    conferences = [
        {
            'title': 'Tech Conference 2024',
            'location': 'San Francisco, CA',
            'date': '2024-06-15',
            'subject': 'Technology',
            'description': 'Annual technology conference'
        }
    ]
    
    df = manager.aggregate_and_deduplicate(conferences)
    
    # Store to Firebase
    print("\nStoring conferences to Firebase...")
    manager.store_to_firebase(df)
    
    # Query from Firebase
    print("\nQuerying Technology conferences...")
    results = manager.query_firebase(filters={'subject': 'Technology'}, limit=10)
    print(f"Found {len(results)} Technology conferences")


def main():
    """Main entry point for demonstration."""
    print("SearchBard - Conference Data Management System")
    print("=" * 50)
    
    # Run demos
    # demo_scraping()  # Uncomment to test scraping
    demo_aggregation()
    # demo_firebase()  # Uncomment if Firebase is configured
    
    print("\n" + "=" * 50)
    print("Demo complete!")
    print("\nTo use this module in your own code:")
    print("  from searchBard import ConferenceDataManager")
    print("  manager = ConferenceDataManager()")


if __name__ == "__main__":
    main()

