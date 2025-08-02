#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Political Events Timeline Data Processor Runner
Run this script to process political events timeline data for any country
"""

import os
import sys
from political_events_processor import UniversalPoliticalEventsProcessor

def show_welcome():
    """Display welcome message and instructions"""
    print("🌍 Universal Political Events Timeline Processor")
    print("=" * 70)
    print()
    print("This tool analyzes how political events affect cinema production")
    print("by creating timeline data for D3.js visualization.")
    print()

def check_data_files():
    """Check if required data files exist"""
    required_files = [
        "data/title.basics.tsv",
        "data/title.akas.tsv"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required data files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print()
        print("💡 Please ensure you have downloaded and extracted:")
        print("   - title.basics.tsv.gz → data/title.basics.tsv")
        print("   - title.akas.tsv.gz → data/title.akas.tsv")
        print()
        print("   Download from: https://datasets.imdbws.com/")
        return False
    
    print("✅ All required data files found!")
    return True

def show_available_countries(processor):
    """Display available countries with their political events"""
    print("\n📊 Available Countries for Analysis:")
    print("-" * 50)
    
    for code, name in processor.country_names.items():
        events = processor.political_events_db.get(code, [])
        if events:
            event_years = [str(e['year']) for e in events]
            print(f"🏳️  {code}: {name}")
            print(f"   Events: {', '.join(event_years)}")
            print(f"   Count: {len(events)} major political events")
            print()

def process_country_interactive(processor):
    """Interactive country selection and processing"""
    while True:
        print("\n" + "="*50)
        country_code = input("Enter country code (e.g., 'US', 'IR', 'RU') or 'list' to see options: ").strip().upper()
        
        if country_code == 'LIST':
            show_available_countries(processor)
            continue
        
        if country_code == 'EXIT' or country_code == 'QUIT':
            print("👋 Goodbye!")
            return
        
        if not country_code:
            print("❌ Please enter a country code")
            continue
        
        if country_code not in processor.country_names:
            print(f"❌ Country '{country_code}' not available")
            print(f"Available codes: {', '.join(processor.country_names.keys())}")
            continue
        
        # Process the selected country
        print(f"\n🚀 Processing {processor.country_names[country_code]}...")
        print("-" * 40)
        
        success = processor.process_country(country_code)
        
        if success:
            print(f"\n🎉 Success! Timeline data for {processor.country_names[country_code]} is ready!")
            print(f"📄 Generated file: political_timeline_{country_code.lower()}.json")
            print("🎬 You can now view this in the Political Events Timeline visualization!")
            print()
            
            # Ask if they want to process another country
            another = input("Process another country? (y/n): ").strip().lower()
            if another not in ['y', 'yes']:
                break
        else:
            print(f"\n❌ Failed to process {processor.country_names[country_code]}")
            print("This might be due to insufficient data for this country.")
            
            retry = input("Try another country? (y/n): ").strip().lower()
            if retry not in ['y', 'yes']:
                break

def process_batch_mode():
    """Process multiple countries in batch mode"""
    processor = UniversalPoliticalEventsProcessor()
    
    print("\n🔄 Batch Processing Mode")
    print("Processing all 30 countries with 3 key events each...")
    print("This may take some time as we process IMDb data for each country.")
    print()
    
    # Get all available countries
    all_countries = list(processor.country_names.keys())
    
    successful = []
    failed = []
    
    for i, country_code in enumerate(all_countries, 1):
        print(f"\n📍 [{i:2d}/{len(all_countries)}] Processing {processor.country_names[country_code]}...")
        success = processor.process_country(country_code)
        
        if success:
            successful.append(country_code)
            print(f"✅ {processor.country_names[country_code]} - Complete")
        else:
            failed.append(country_code)
            print(f"❌ {processor.country_names[country_code]} - Failed (insufficient data)")
    
    # Summary
    print("\n" + "="*60)
    print("📊 BATCH PROCESSING SUMMARY - 30 COUNTRIES")
    print("="*60)
    print(f"✅ Successfully processed: {len(successful)} countries")
    
    if successful:
        # Group by region for better readability
        regions = {
            'Major Powers': ['US', 'CN', 'RU', 'IN', 'JP'],
            'Europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'UA', 'TR', 'PL', 'SE'],
            'Middle East & Africa': ['IR', 'IL', 'SA', 'ZA', 'NG', 'EG'],
            'Americas': ['CA', 'BR', 'MX', 'AR'],
            'Asia-Pacific': ['KR', 'AU', 'ID', 'TH']
        }
        
        for region, codes in regions.items():
            region_successful = [code for code in successful if code in codes]
            if region_successful:
                print(f"\n   🌍 {region}:")
                for code in region_successful:
                    print(f"      ✓ {processor.country_names[code]}")
    
    if failed:
        print(f"\n❌ Failed to process: {len(failed)} countries")
        print("   (Likely due to insufficient IMDb data for these regions)")
        for code in failed:
            print(f"      ✗ {processor.country_names[code]}")
    
    print(f"\n🎯 Ready for visualization: {len(successful)}/{len(all_countries)} countries")
    print(f"📄 Generated {len(successful)} JSON files for timeline visualization")

def main():
    """Main execution function"""
    show_welcome()
    
    # Check data files
    if not check_data_files():
        return
    
    # Initialize processor
    processor = UniversalPoliticalEventsProcessor()
    
    # Processing mode selection
    print("\n🎯 Choose Processing Mode:")
    print("1. Interactive Mode - Process one country at a time")
    print("2. Batch Mode - Process priority countries automatically")
    print("3. Show Available Countries")
    print()
    
    while True:
        choice = input("Enter your choice (1/2/3): ").strip()
        
        if choice == '1':
            print("\n🔄 Starting Interactive Mode...")
            process_country_interactive(processor)
            break
        elif choice == '2':
            print("\n🔄 Starting Batch Mode...")
            process_batch_mode()
            break
        elif choice == '3':
            show_available_countries(processor)
            continue
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")
    
    print("\n🎬 Next Steps:")
    print("1. Open global-cinema-map.html in your browser")
    print("2. Navigate to the 'Political Events Timeline' tab")
    print("3. Select a processed country from the dropdown")
    print("4. Explore how political events affected cinema production!")
    print()
    print("💡 Tip: Use the data smoothing toggle to see clearer trends")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Processing interrupted by user. Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please check your data files and try again.")