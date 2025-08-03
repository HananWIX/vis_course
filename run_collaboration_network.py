#!/usr/bin/env python3

from collaboration_network_processor import CollaborationNetworkProcessor
import sys
import os

def main():
    print("🌐 Global Cinema Collaboration Network Processor")
    print("=" * 55)
    print("Processing IMDb data to create international collaboration networks")
    print()
    
    # Check if data directory exists
    if not os.path.exists("data"):
        print("❌ Error: 'data' directory not found")
        print("Please ensure IMDb datasets are in the 'data' directory")
        return False
    
    # Required files
    required_files = [
        "title.basics.tsv",
        "title.akas.tsv", 
        "title.principals.tsv",
        "title.ratings.tsv"
    ]
    
    missing_files = []
    for file in required_files:
        file_path = os.path.join("data", file)
        if not os.path.exists(file_path):
            missing_files.append(file)
        else:
            # Show file size
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"✅ {file:<25} ({size_mb:.1f} MB)")
    
    if missing_files:
        print(f"\n❌ Missing required files: {', '.join(missing_files)}")
        print("\nRequired IMDb datasets:")
        print("- title.basics.tsv    (Movie metadata)")
        print("- title.akas.tsv      (Regional titles/countries)")
        print("- title.principals.tsv (Cast & crew)")
        print("- title.ratings.tsv   (Ratings for popularity)")
        return False
    
    print("\n🎬 Processing Configuration:")
    print("Choose your processing parameters or press Enter for defaults\n")
    
    try:
        # Sample size
        print("📊 Sample Size:")
        print("   - Larger samples = more comprehensive but slower")
        print("   - Recommended: 25,000 for good balance")
        sample_input = input("Enter sample size [25000]: ").strip()
        sample_size = int(sample_input) if sample_input else 25000
        
        # Minimum collaborations
        print(f"\n🔗 Minimum Collaborations Threshold:")
        print("   - Higher threshold = cleaner network, fewer nodes")
        print("   - Lower threshold = more connections, noisier")
        min_collab_input = input("Enter minimum collaborations [5]: ").strip()
        min_collab = int(min_collab_input) if min_collab_input else 5
        
        print(f"\n🚀 Starting processing with:")
        print(f"   📊 Sample Size: {sample_size:,} movies")
        print(f"   🔗 Min Collaborations: {min_collab}")
        print(f"   👥 Role Processing: ALL types (directors, actors, writers, producers)")
        print(f"   📁 Output: collaboration_network_data.json")
        print()
        print("ℹ️  Processing all collaboration types for dynamic filtering in visualization...")
        print()
        
        # Create processor and run
        processor = CollaborationNetworkProcessor(data_dir="data")
        success = processor.process_collaboration_network(
            sample_size=sample_size,
            min_collaborations=min_collab
        )
        
        if success:
            print("\n" + "="*55)
            print("✅ PROCESSING COMPLETED SUCCESSFULLY!")
            print("="*55)
            print("📁 Output file: collaboration_network_data.json")
            print("🌐 Ready for 3D network visualization!")
            print("🎯 Next step: Open collaboration-network.html in browser")
            print()
            
            # Show some quick stats
            if os.path.exists('collaboration_network_data.json'):
                try:
                    import json
                    with open('collaboration_network_data.json', 'r') as f:
                        data = json.load(f)
                    
                    print("📊 Network Statistics:")
                    print(f"   🌍 Total Countries: {data['metadata']['totalUniqueCountries']}")
                    print(f"   🎭 Network Types: {data['metadata']['generatedNetworks']}")
                    print(f"   📊 Available Filters: {', '.join(data['metadata']['availableNetworks'])}")
                    print()
                    
                    # Show stats for each network type
                    print("🔗 Collaboration Networks Generated:")
                    for network_type, network_data in data['networks'].items():
                        role_name = data['roleTypes'][network_type]['name']
                        print(f"   • {role_name}: {len(network_data['nodes'])} countries, {len(network_data['links'])} links")
                    print()
                    
                    # Show top countries from 'all' network
                    if 'all' in data['networks']:
                        all_network = data['networks']['all']
                        top_countries = sorted(all_network['nodes'], key=lambda x: x['totalCollaborations'], reverse=True)[:5]
                        print("🏆 Top Collaborating Countries (All Roles):")
                        for i, country in enumerate(top_countries, 1):
                            print(f"   {i}. {country['countryName']} ({country['totalCollaborations']} collaborations)")
                    
                except Exception as e:
                    print(f"Note: Could not read output statistics: {e}")
        else:
            print("\n" + "="*55)
            print("❌ PROCESSING FAILED!")
            print("="*55)
            print("Please check the error messages above and try again.")
            print("Common issues:")
            print("- Insufficient memory for large datasets")
            print("- Corrupted or incomplete IMDb files")
            print("- Insufficient disk space for processing")
            
        return success
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Processing interrupted by user")
        print("Partial data may be incomplete. Run again to restart.")
        return False
    except ValueError as e:
        print(f"\n❌ Invalid input: {e}")
        print("Please enter valid numbers for sample size and minimum collaborations.")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def quick_process():
    """Quick processing with default parameters"""
    print("🚀 Quick Processing Mode - Using Default Parameters")
    print("   📊 Sample Size: 25,000 movies")
    print("   🔗 Min Collaborations: 5") 
    print("   👥 Role Processing: ALL types (directors, actors, writers, producers)")
    print()
    print("ℹ️  Processing all collaboration types for dynamic filtering...")
    print()
    
    processor = CollaborationNetworkProcessor(data_dir="data")
    return processor.process_collaboration_network(
        sample_size=25000,
        min_collaborations=5
    )

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        success = quick_process()
    else:
        success = main()
    
    sys.exit(0 if success else 1)