#!/usr/bin/env python3
"""
Quality Gap Analysis Runner
Processes IMDb data to analyze the relationship between economic inequality 
and cinema quality distributions by country.

Usage:
    python run_quality_gap.py [options]

Options:
    --sample-size N    Number of movies to sample (default: 30000)
    --data-dir PATH    Path to data directory (default: data)
    --help            Show this help message
"""

import os
import sys
import argparse
from quality_gap_processor import QualityGapProcessor

def print_banner():
    """Print application banner"""
    print("=" * 60)
    print("🎬 IMDb Quality Gap Analysis")
    print("   Economic Inequality vs Cinema Quality Distributions")
    print("=" * 60)

def check_environment(data_dir):
    """Check if the environment is set up correctly"""
    print("\n🔍 Environment Check")
    print("-" * 30)
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"❌ Data directory '{data_dir}' not found!")
        print(f"   Creating directory: {data_dir}")
        try:
            os.makedirs(data_dir, exist_ok=True)
            print(f"✅ Created data directory: {data_dir}")
        except Exception as e:
            print(f"❌ Failed to create directory: {e}")
            return False
    else:
        print(f"✅ Data directory found: {data_dir}")
    
    # Check for required files
    required_files = [
        "title.basics.tsv",
        "title.ratings.tsv", 
        "title.akas.tsv"
    ]
    
    missing_files = []
    file_sizes = {}
    
    for file in required_files:
        file_path = os.path.join(data_dir, file)
        if not os.path.exists(file_path):
            missing_files.append(file)
        else:
            try:
                size = os.path.getsize(file_path)
                size_mb = size / (1024 * 1024)
                file_sizes[file] = size_mb
                print(f"✅ {file}: {size_mb:.1f} MB")
            except Exception as e:
                print(f"⚠️  {file}: Error reading file size")
    
    if missing_files:
        print(f"\n❌ Missing required IMDb dataset files:")
        for file in missing_files:
            print(f"   - {file}")
        print(f"\n📥 Download Instructions:")
        print(f"   1. Visit: https://datasets.imdbws.com/")
        print(f"   2. Download the following files:")
        for file in missing_files:
            print(f"      - {file}.gz")
        print(f"   3. Extract them to the '{data_dir}' directory")
        print(f"      gunzip {data_dir}/*.gz")
        return False
    
    # Check file sizes (basic validation)
    expected_min_sizes = {
        "title.basics.tsv": 800,    # ~800MB minimum
        "title.ratings.tsv": 20,    # ~20MB minimum
        "title.akas.tsv": 2000      # ~2GB minimum
    }
    
    for file, min_size in expected_min_sizes.items():
        if file in file_sizes and file_sizes[file] < min_size:
            print(f"⚠️  {file} seems too small ({file_sizes[file]:.1f} MB)")
            print(f"   Expected at least {min_size} MB")
            print(f"   File might be corrupted or incomplete")
    
    print("✅ All required files found")
    return True

def estimate_processing_time(sample_size):
    """Estimate processing time based on sample size"""
    # Rough estimates based on typical performance
    minutes = sample_size / 10000  # ~10k movies per minute
    if minutes < 1:
        return "< 1 minute"
    elif minutes < 60:
        return f"~{int(minutes)} minutes"
    else:
        hours = minutes / 60
        return f"~{hours:.1f} hours"

def main():
    """Main execution function"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Process IMDb data for quality gap analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_quality_gap.py
    python run_quality_gap.py --sample-size 50000
    python run_quality_gap.py --data-dir /path/to/imdb/data
        """
    )
    
    parser.add_argument(
        '--sample-size', 
        type=int, 
        default=30000,
        help='Number of movies to sample (default: 30000)'
    )
    
    parser.add_argument(
        '--data-dir', 
        type=str, 
        default='data',
        help='Path to data directory (default: data)'
    )
    
    args = parser.parse_args()
    
    # Print banner
    print_banner()
    
    # Validate arguments
    if args.sample_size < 1000:
        print("❌ Sample size must be at least 1000")
        return False
    
    if args.sample_size > 100000:
        print("⚠️  Large sample size may take a very long time to process")
        response = input("Continue? (y/N): ")
        if response.lower() not in ['y', 'yes']:
            print("Cancelled by user")
            return False
    
    # Environment check
    if not check_environment(args.data_dir):
        return False
    
    # Show processing info
    print(f"\n⚙️  Processing Configuration")
    print("-" * 30)
    print(f"📊 Sample size: {args.sample_size:,} movies")
    print(f"📁 Data directory: {args.data_dir}")
    print(f"⏱️  Estimated time: {estimate_processing_time(args.sample_size)}")
    print(f"💾 Output files:")
    print(f"   - {os.path.join(args.data_dir, 'quality_gap_data.json')}")
    print(f"   - {os.path.join(args.data_dir, 'quality_gap_summary.json')}")
    print(f"   - {os.path.join(args.data_dir, 'quality_gap_movies.json')}")
    
    # Confirm processing
    print(f"\n🚀 Ready to start processing...")
    response = input("Continue? (Y/n): ")
    if response.lower() in ['n', 'no']:
        print("Cancelled by user")
        return False
    
    # Initialize processor
    print(f"\n🎬 Initializing Quality Gap Processor...")
    try:
        processor = QualityGapProcessor(args.data_dir)
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return False
    
    # Run processing
    print(f"\n📊 Starting data processing...")
    print(f"   This may take a while depending on your system...")
    
    try:
        success = processor.process_all_data(args.sample_size)
    except KeyboardInterrupt:
        print(f"\n\n⚠️  Processing interrupted by user")
        print(f"   Partial results may be available in {args.data_dir}")
        return False
    except Exception as e:
        print(f"\n❌ Processing failed with error: {e}")
        print(f"   Check the data files and try again")
        return False
    
    # Report results
    if success:
        print(f"\n🎉 Processing completed successfully!")
        print(f"=" * 50)
        
        # Check output files
        output_files = [
            'quality_gap_data.json',
            'quality_gap_summary.json', 
            'quality_gap_movies.json'
        ]
        
        print(f"📊 Generated files:")
        for filename in output_files:
            filepath = os.path.join(args.data_dir, filename)
            if os.path.exists(filepath):
                size = os.path.getsize(filepath) / 1024  # KB
                print(f"   ✅ {filename} ({size:.1f} KB)")
            else:
                print(f"   ❌ {filename} (missing)")
        
        print(f"\n🌐 Next Steps:")
        print(f"   1. Open global-cinema-map.html in your browser")
        print(f"   2. Navigate to the 'National Quality Gap' section")
        print(f"   3. Explore the violin plots and quality distributions")
        
        print(f"\n📈 Visualization Features:")
        print(f"   • Interactive violin plots showing rating distributions")
        print(f"   • Countries ordered by Gini coefficient (inequality)")
        print(f"   • Box plots with mean and median indicators")
        print(f"   • Hover tooltips with detailed statistics")
        print(f"   • Filter by development level and production volume")
        
        return True
    else:
        print(f"\n❌ Processing failed!")
        print(f"   Check the error messages above and try again")
        return False

def show_help():
    """Show detailed help information"""
    print(__doc__)
    
if __name__ == "__main__":
    try:
        success = main()
        exit_code = 0 if success else 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        print(f"   Please report this issue with the full error message")
        exit_code = 2
    
    print(f"\n" + "=" * 60)
    sys.exit(exit_code)