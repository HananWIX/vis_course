#!/usr/bin/env python3
"""
Quality Gap Dashboard Runner
Processes IMDb data to create a comprehensive dashboard analyzing movie quantity vs quality patterns.

Usage:
    python run_quality_gap_dashboard.py [options]

Options:
    --mode MODE         Processing mode: 'interactive' or 'batch' (default: interactive)
    --countries LIST    Comma-separated country codes (default: major countries)
    --data-dir PATH     Path to data directory (default: data)
    --help             Show this help message

Examples:
    python run_quality_gap_dashboard.py
    python run_quality_gap_dashboard.py --mode batch
    python run_quality_gap_dashboard.py --countries US,GB,FR,DE,IT
"""

import os
import sys
import argparse
from quality_gap_dashboard_processor import QualityGapDashboardProcessor

def print_banner():
    """Print application banner"""
    print("=" * 70)
    print("📊 Quality Gap Dashboard Generator")
    print("   Movie Quantity vs Quality Analysis Across Countries")
    print("=" * 70)

def print_research_context():
    """Print research context and expected insights"""
    print("\n🎯 Research Question")
    print("-" * 30)
    print("What is the relationship between movie quantity and quality")
    print("across different countries, and how has this evolved over time?")
    
    print("\n🔍 Expected Insights")
    print("-" * 30)
    print("• 🎭 Quality vs Quantity Trade-offs")
    print("  - Hollywood Effect: High quantity, mixed quality")
    print("  - Art House Pattern: Lower quantity, higher quality")
    print("  - Emerging Markets: Quantity growth, quality catching up")
    
    print("• 🌍 Regional Patterns")
    print("  - European countries: Higher average quality")
    print("  - Asian markets: Rapid production growth")
    print("  - Streaming era: Quality improvements post-2015")
    
    print("• 📈 Temporal Trends")
    print("  - Digital transformation impact")
    print("  - COVID-19 effects on production patterns")
    print("  - Genre-specific quality evolution")

def check_environment(data_dir):
    """Check if the environment is set up correctly"""
    print("\n🔍 Environment Check")
    print("-" * 30)
    
    # Check data directory
    if not os.path.exists(data_dir):
        print(f"❌ Data directory '{data_dir}' not found!")
        return False
    else:
        print(f"✅ Data directory found: {data_dir}")
    
    # Check for required IMDb files
    required_files = [
        "title.basics.tsv",
        "title.ratings.tsv", 
        "title.akas.tsv"
    ]
    
    missing_files = []
    for file in required_files:
        file_path = os.path.join(data_dir, file)
        if not os.path.exists(file_path):
            missing_files.append(file)
        else:
            size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            print(f"✅ {file}: {size:.1f} MB")
    
    if missing_files:
        print(f"\n❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        print(f"\n📥 Download from: https://datasets.imdbws.com/")
        return False
    
    print("✅ All required files found")
    return True

def get_available_countries():
    """Get list of available countries for processing"""
    processor = QualityGapDashboardProcessor()
    return processor.countries_db

def process_interactive_mode():
    """Interactive mode - let user select countries"""
    print("\n🎯 Interactive Mode")
    print("-" * 30)
    
    countries = get_available_countries()
    
    # Group countries by region for display
    regions = {}
    for code, info in countries.items():
        region = info['region']
        if region not in regions:
            regions[region] = []
        regions[region].append((code, info['name']))
    
    print("Available countries by region:")
    for region, country_list in regions.items():
        print(f"\n📍 {region.replace('-', ' ').title()}:")
        for code, name in sorted(country_list, key=lambda x: x[1]):
            print(f"   {code}: {name}")
    
    print(f"\n💡 Tip: Major countries recommended for first run:")
    major_countries = [code for code, info in countries.items() if info['tier'] == 'major']
    print(f"   {', '.join(major_countries[:10])}")
    
    while True:
        user_input = input(f"\nEnter country codes (comma-separated) or 'major' for top 10: ").strip()
        
        if user_input.lower() == 'major':
            selected = major_countries[:10]
            break
        elif user_input.lower() == 'all':
            selected = list(countries.keys())
            break
        else:
            selected = []
            for code in user_input.split(','):
                code = code.strip().upper()
                if code in countries:
                    selected.append(code)
                else:
                    print(f"⚠️  Unknown country code: {code}")
            
            if selected:
                break
            else:
                print("❌ No valid country codes entered")
    
    print(f"\n📊 Selected countries: {len(selected)}")
    for code in selected:
        print(f"   • {countries[code]['name']} ({code})")
    
    return selected

def process_batch_mode():
    """Batch mode - process priority countries automatically"""
    print("\n⚡ Batch Mode")
    print("-" * 30)
    
    # Priority countries for comprehensive analysis
    priority_countries = [
        'US', 'GB', 'FR', 'DE', 'IT', 'ES',  # Major Western
        'JP', 'IN', 'KR', 'CN',              # Major Asian
        'CA', 'AU', 'BR', 'RU'               # Other major
    ]
    
    countries = get_available_countries()
    
    print("Processing priority countries for comprehensive dashboard:")
    for code in priority_countries:
        if code in countries:
            print(f"   • {countries[code]['name']} ({code})")
    
    return priority_countries

def process_countries(selected_countries, data_dir):
    """Process countries using the new robust dynamic discovery method"""
    print(f"\n🚀 Processing Countries with Dynamic Discovery")
    print("-" * 50)
    
    processor = QualityGapDashboardProcessor(data_dir)
    
    try:
        # Use the new dynamic processing method
        if selected_countries and len(selected_countries) > 0:
            print(f"📋 Processing specified countries: {', '.join(selected_countries)}")
            success = processor.process_all_countries(min_movies=10, selected_countries=selected_countries)
        else:
            print(f"🔍 Auto-discovering countries from data...")
            success = processor.process_all_countries(min_movies=10)
        
        if success:
            print(f"\n✅ Quality Gap Dashboard processing completed successfully!")
            return list(processor.countries_db.keys()), []
        else:
            print(f"\n❌ Processing failed - check error messages above")
            return [], list(processor.countries_db.keys()) if processor.countries_db else []
            
    except KeyboardInterrupt:
        print(f"\n⚠️ Processing interrupted by user")
        return [], []
    except Exception as e:
        print(f"\n❌ Processing error: {e}")
        return [], []

def generate_dashboard_summary(successful_countries, processor):
    """Generate the final dashboard summary"""
    print(f"\n📊 Generating Dashboard Summary")
    print("-" * 40)
    
    success = processor.create_dashboard_summary(successful_countries)
    
    if success:
        print("✅ Dashboard summary generated successfully")
        
        # Check output files
        output_dir = processor.output_dir
        dashboard_file = os.path.join(output_dir, "dashboard_data.json")
        
        if os.path.exists(dashboard_file):
            size = os.path.getsize(dashboard_file) / 1024  # KB
            print(f"📄 Dashboard data: {size:.1f} KB")
        
        # List individual country files
        country_files = []
        for country in successful_countries:
            country_file = os.path.join(output_dir, f"quality_gap_{country.lower()}.json")
            if os.path.exists(country_file):
                country_files.append(country_file)
        
        print(f"📁 Country data files: {len(country_files)}")
        
        return True
    else:
        print("❌ Dashboard summary generation failed")
        return False

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(
        description="Generate Quality Gap Dashboard data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        '--mode', 
        choices=['interactive', 'batch'], 
        default='interactive',
        help='Processing mode (default: interactive)'
    )
    
    parser.add_argument(
        '--countries', 
        type=str,
        help='Comma-separated country codes (overrides mode selection)'
    )
    
    parser.add_argument(
        '--data-dir', 
        type=str, 
        default='data',
        help='Path to data directory (default: data)'
    )
    
    args = parser.parse_args()
    
    # Print banner and context
    print_banner()
    print_research_context()
    
    # Environment check
    if not check_environment(args.data_dir):
        print(f"\n❌ Environment check failed. Please fix the issues above.")
        return False
    
    # Determine countries to process
    if args.countries:
        # Manual country list
        selected_countries = [c.strip().upper() for c in args.countries.split(',')]
        print(f"\n📊 Manual selection: {len(selected_countries)} countries")
    elif args.mode == 'batch':
        selected_countries = process_batch_mode()
    else:
        selected_countries = process_interactive_mode()
    
    if not selected_countries:
        print("❌ No countries selected for processing")
        return False
    
    # Confirm processing
    print(f"\n🚀 Ready to Process Dashboard Data")
    print("-" * 40)
    print(f"Countries: {len(selected_countries)}")
    print(f"Data directory: {args.data_dir}")
    print(f"Output: data/quality_gap_dashboard/")
    
    response = input(f"\nProceed with processing? (Y/n): ")
    if response.lower() in ['n', 'no']:
        print("Cancelled by user")
        return False
    
    # Initialize processor
    processor = QualityGapDashboardProcessor(args.data_dir)
    
    # Process countries
    successful_countries, failed_countries = process_countries(selected_countries, args.data_dir)
    
    # Generate dashboard summary
    if successful_countries:
        dashboard_success = generate_dashboard_summary(successful_countries, processor)
        
        # Final report
        print(f"\n🎉 Processing Complete!")
        print("=" * 50)
        print(f"✅ Successful: {len(successful_countries)} countries")
        if failed_countries:
            print(f"❌ Failed: {len(failed_countries)} countries")
        
        if dashboard_success:
            print(f"\n🌐 Next Steps:")
            print(f"1. Open global-cinema-map.html in your browser")
            print(f"2. Navigate to the 'Quality Gap Dashboard' section")
            print(f"3. Explore the interactive multi-chart dashboard")
            
            print(f"\n📊 Dashboard Features:")
            print(f"• 📈 Scatter plot: Quantity vs Quality by country")
            print(f"• 🏆 Rankings: Top countries by quality metrics")
            print(f"• 📊 Trends: Quality evolution over time")
            print(f"• 📉 Distribution: Rating frequency analysis")
            print(f"• 🎛️ Interactive filters: Year, genre, region, thresholds")
        
        return True
    else:
        print(f"\n❌ No countries processed successfully")
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit_code = 0 if success else 1
    except KeyboardInterrupt:
        print(f"\n\n⚠️ Processing interrupted by user")
        exit_code = 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        exit_code = 2
    
    print(f"\n" + "=" * 70)
    sys.exit(exit_code)