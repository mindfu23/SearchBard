#!/usr/bin/env python3
"""
Example usage script for searchBard.py

This script demonstrates how to use the ConferenceDataManager
for scraping, aggregating, and managing conference data.

Run: python3 example_usage.py
"""

from searchBard import ConferenceDataManager
import pandas as pd


def example_1_basic_aggregation():
    """Example 1: Basic data aggregation and deduplication"""
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Basic Data Aggregation")
    print("=" * 60)
    
    manager = ConferenceDataManager()
    
    # Simulate data from multiple sources
    conferences = [
        {
            'title': 'PyCon 2024',
            'location': 'Pittsburgh, PA',
            'date': '2024-05-15',
            'description': 'Annual Python conference'
        },
        {
            'title': 'Django Conference',
            'location': 'San Diego, CA',
            'date': '2024-06-20',
            'description': 'Django web framework conference'
        },
        {
            'title': 'PyCon 2024',  # Duplicate
            'location': 'Pittsburgh, PA',
            'date': '2024-05-15',
            'description': 'Annual Python conference'
        }
    ]
    
    # Deduplicate
    df = manager.aggregate_and_deduplicate(conferences)
    
    print(f"\nInput: {len(conferences)} conferences")
    print(f"Output: {len(df)} unique conferences\n")
    print(df[['title', 'location', 'date']])


def example_2_multiple_sources():
    """Example 2: Merging data from multiple sources"""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Merging Multiple Data Sources")
    print("=" * 60)
    
    manager = ConferenceDataManager()
    
    # Source 1: Web scraping results
    source1 = [
        {'title': 'React Summit', 'location': 'Amsterdam', 'date': '2024-06-01'},
        {'title': 'Node Congress', 'location': 'Berlin', 'date': '2024-07-15'},
    ]
    
    # Source 2: API results
    source2 = [
        {'title': 'JS Nation', 'location': 'Paris', 'date': '2024-08-20'},
    ]
    
    # Aggregate each source
    df1 = manager.aggregate_and_deduplicate(source1)
    df2 = manager.aggregate_and_deduplicate(source2)
    
    # Merge all sources
    merged = manager.merge_conference_sources(df1, df2)
    
    print(f"\nSource 1: {len(df1)} conferences")
    print(f"Source 2: {len(df2)} conferences")
    print(f"Merged: {len(merged)} total conferences\n")
    print(merged[['title', 'location', 'date']])


def example_3_export_import():
    """Example 3: Export and import data"""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Export/Import to JSON")
    print("=" * 60)
    
    manager = ConferenceDataManager()
    
    # Create sample data
    conferences = [
        {'title': 'DevOps Days', 'location': 'Chicago, IL', 'date': '2024-09-10'},
        {'title': 'Cloud Summit', 'location': 'Seattle, WA', 'date': '2024-10-05'},
    ]
    
    df = manager.aggregate_and_deduplicate(conferences)
    df = manager.add_conference_hash(df)
    
    # Export to JSON
    output_file = '/tmp/example_conferences.json'
    manager.export_to_json(df, output_file)
    print(f"\n✓ Exported to {output_file}")
    
    # Import from JSON
    imported = manager.import_from_json(output_file)
    print(f"✓ Imported {len(imported)} conferences\n")
    print(imported[['title', 'location', 'date']])


def example_4_web_scraping():
    """Example 4: Web scraping demonstration"""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Web Scraping (Mock Example)")
    print("=" * 60)
    
    manager = ConferenceDataManager()
    
    # Note: This would normally scrape a real website
    # For demonstration, we show how to use it
    print("\nTo scrape a real website, use:")
    print("  conferences = manager.scrape_conference_page('https://example.com/events')")
    print("\nOr scrape multiple pages:")
    print("  urls = ['https://site1.com/events', 'https://site2.com/events']")
    print("  all_conferences = manager.scrape_multiple_pages(urls)")
    
    # Example of parsing HTML structure
    from bs4 import BeautifulSoup
    
    mock_html = """
    <div class="event">
        <h2>Example Conference 2024</h2>
        <span class="location">New York, NY</span>
        <span class="date">November 15-17, 2024</span>
    </div>
    """
    
    soup = BeautifulSoup(mock_html, 'html.parser')
    container = soup.find('div', class_='event')
    result = manager._extract_conference_data(container)
    
    print("\n✓ Parsed conference from HTML:")
    print(f"  Title: {result['title']}")
    print(f"  Location: {result['location']}")
    print(f"  Date: {result['date']}")


def main():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("SearchBard Usage Examples")
    print("=" * 60)
    
    try:
        example_1_basic_aggregation()
        example_2_multiple_sources()
        example_3_export_import()
        example_4_web_scraping()
        
        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60)
        print("\nFor more information, see README.md")
        
    except Exception as e:
        print(f"\nError running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
