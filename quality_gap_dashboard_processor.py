import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import warnings
warnings.filterwarnings('ignore')

class QualityGapDashboardProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.output_dir = os.path.join(data_dir, "quality_gap_dashboard")
        
        # Dynamic countries database - will be populated from actual data
        self.countries_db = {}
        
        # Regional classification lookup
        self.region_lookup = {
            # North America
            'US': 'north-america', 'CA': 'north-america', 'MX': 'north-america',
            
            # Europe
            'GB': 'europe', 'FR': 'europe', 'DE': 'europe', 'IT': 'europe', 'ES': 'europe',
            'SE': 'europe', 'NO': 'europe', 'DK': 'europe', 'FI': 'europe', 'NL': 'europe',
            'BE': 'europe', 'CH': 'europe', 'AT': 'europe', 'PT': 'europe', 'PL': 'europe',
            'CZ': 'europe', 'HU': 'europe', 'GR': 'europe', 'IE': 'europe', 'IS': 'europe',
            'LU': 'europe', 'MT': 'europe', 'CY': 'europe', 'RO': 'europe', 'BG': 'europe',
            'HR': 'europe', 'SI': 'europe', 'SK': 'europe', 'EE': 'europe', 'LV': 'europe',
            'LT': 'europe', 'RU': 'europe',
            
            # Asia
            'JP': 'asia', 'IN': 'asia', 'KR': 'asia', 'CN': 'asia', 'TH': 'asia',
            'ID': 'asia', 'MY': 'asia', 'SG': 'asia', 'PH': 'asia', 'VN': 'asia',
            'TW': 'asia', 'HK': 'asia', 'BD': 'asia', 'PK': 'asia', 'IR': 'asia',
            'IL': 'asia', 'SA': 'asia', 'AE': 'asia', 'EG': 'asia', 'LB': 'asia',
            'JO': 'asia', 'SY': 'asia', 'IQ': 'asia', 'KW': 'asia', 'QA': 'asia',
            
            # Others (South America, Africa, Oceania)
            'BR': 'others', 'AR': 'others', 'CL': 'others', 'CO': 'others', 'PE': 'others',
            'AU': 'others', 'NZ': 'others', 'ZA': 'others', 'NG': 'others', 'KE': 'others',
            'GH': 'others', 'MA': 'others', 'TN': 'others', 'DZ': 'others', 'ET': 'others',
            'TR': 'others',  # Turkey spans Europe/Asia but often grouped separately
        }
        
        # Country name lookup
        self.country_names = {
            'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
            'IT': 'Italy', 'ES': 'Spain', 'CA': 'Canada', 'AU': 'Australia', 'JP': 'Japan',
            'IN': 'India', 'KR': 'South Korea', 'CN': 'China', 'RU': 'Russia', 'BR': 'Brazil',
            'MX': 'Mexico', 'AR': 'Argentina', 'TR': 'Turkey', 'SE': 'Sweden', 'NO': 'Norway',
            'DK': 'Denmark', 'FI': 'Finland', 'NL': 'Netherlands', 'BE': 'Belgium',
            'CH': 'Switzerland', 'AT': 'Austria', 'PT': 'Portugal', 'PL': 'Poland',
            'CZ': 'Czech Republic', 'HU': 'Hungary', 'GR': 'Greece', 'IE': 'Ireland',
            'IS': 'Iceland', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus',
            'RO': 'Romania', 'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia',
            'SK': 'Slovakia', 'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania',
            'TH': 'Thailand', 'ID': 'Indonesia', 'MY': 'Malaysia', 'SG': 'Singapore',
            'PH': 'Philippines', 'VN': 'Vietnam', 'TW': 'Taiwan', 'HK': 'Hong Kong',
            'BD': 'Bangladesh', 'PK': 'Pakistan', 'IR': 'Iran', 'IL': 'Israel',
            'SA': 'Saudi Arabia', 'AE': 'UAE', 'EG': 'Egypt', 'LB': 'Lebanon',
            'JO': 'Jordan', 'SY': 'Syria', 'IQ': 'Iraq', 'KW': 'Kuwait', 'QA': 'Qatar',
            'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'NZ': 'New Zealand',
            'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya', 'GH': 'Ghana',
            'MA': 'Morocco', 'TN': 'Tunisia', 'DZ': 'Algeria', 'ET': 'Ethiopia'
        }
        
        # Focus genres for analysis
        self.focus_genres = ['Drama', 'Comedy', 'Action', 'Documentary', 'Thriller']
        
        # Quality thresholds for analysis
        self.quality_tiers = {
            'excellent': 8.0,
            'great': 7.0,
            'good': 6.0,
            'decent': 5.0,
            'poor': 0.0
        }
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
    
    def discover_countries_from_data(self, min_movies=10):
        """Dynamically discover countries from the actual data files"""
        print(f"🔍 Discovering countries from data (min {min_movies} movies)...")
        
        discovered_countries = {}
        
        try:
            # Try to load existing diversity data which has country information
            diversity_file = os.path.join(self.data_dir, 'global_cinema_data.json')
            if os.path.exists(diversity_file):
                with open(diversity_file, 'r') as f:
                    diversity_data = json.load(f)
                
                for country_data in diversity_data:
                    country_code = country_data.get('country')
                    movie_count = country_data.get('movie_count', 0)
                    
                    if movie_count >= min_movies and country_code:
                        # Get region and name from our lookups, with fallbacks
                        region = self.region_lookup.get(country_code, 'others')
                        name = self.country_names.get(country_code, country_code.upper())
                        
                        # Determine tier based on movie count
                        if movie_count >= 1000:
                            tier = 'major'
                        elif movie_count >= 100:
                            tier = 'secondary'
                        else:
                            tier = 'minor'
                        
                        discovered_countries[country_code] = {
                            'name': name,
                            'region': region,
                            'tier': tier,
                            'movie_count': movie_count
                        }
                
                print(f"✅ Discovered {len(discovered_countries)} countries from diversity data")
                self.countries_db = discovered_countries
                return discovered_countries
                
        except Exception as e:
            print(f"⚠️ Could not load diversity data: {e}")
        
        # Fallback: use predefined major countries if no data found
        print("📋 Using fallback country list...")
        fallback_countries = ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 'IN', 'KR', 'CN', 'RU', 'BR', 'MX']
        
        for country_code in fallback_countries:
            region = self.region_lookup.get(country_code, 'others')
            name = self.country_names.get(country_code, country_code.upper())
            
            discovered_countries[country_code] = {
                'name': name,
                'region': region,
                'tier': 'major',
                'movie_count': 100  # Assumed minimum
            }
        
        self.countries_db = discovered_countries
        print(f"✅ Using {len(discovered_countries)} fallback countries")
        return discovered_countries
    
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 📊 {message}")
    
    def load_country_movies(self, country_code, year_range=(2010, 2024)):
        """Load movies for a specific country within year range"""
        self.log(f"Loading movies for {self.countries_db[country_code]['name']}...")
        
        try:
            akas_path = os.path.join(self.data_dir, "title.akas.tsv")
            
            if not os.path.exists(akas_path):
                self.log(f"Error: {akas_path} not found")
                return []
            
            movie_ids = []
            total_processed = 0
            
            # Process in chunks to handle large files
            for chunk in pd.read_csv(
                akas_path, sep='\t', chunksize=200000,
                low_memory=False, na_values=['\\N']
            ):
                total_processed += len(chunk)
                
                # Filter for this country's region
                country_chunk = chunk[chunk['region'] == country_code]
                
                if len(country_chunk) > 0:
                    movie_ids.extend(country_chunk['titleId'].tolist())
                
                # Progress logging
                if total_processed % 1000000 == 0:
                    self.log(f"Processed {total_processed:,} records, found {len(movie_ids):,} movies")
            
            # Remove duplicates
            movie_ids = list(set(movie_ids))
            self.log(f"Found {len(movie_ids):,} unique movies for {country_code}")
            
            return movie_ids
            
        except Exception as e:
            self.log(f"Error loading country movies: {e}")
            return []
    
    def load_movie_details_with_ratings(self, movie_ids):
        """Load movie details with ratings for analysis"""
        self.log(f"Loading details and ratings for {len(movie_ids):,} movies...")
        
        try:
            # Load basics
            basics_path = os.path.join(self.data_dir, "title.basics.tsv")
            ratings_path = os.path.join(self.data_dir, "title.ratings.tsv")
            
            if not os.path.exists(basics_path) or not os.path.exists(ratings_path):
                self.log("Error: Required data files not found")
                return None
            
            movie_id_set = set(movie_ids)
            movies_data = []
            total_processed = 0
            
            # Load movie basics
            for chunk in pd.read_csv(
                basics_path, sep='\t', chunksize=100000,
                low_memory=False, na_values=['\\N']
            ):
                total_processed += len(chunk)
                
                # Filter for our movies
                relevant_chunk = chunk[
                    (chunk['tconst'].isin(movie_id_set)) &
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['genres'].notna())
                ]
                
                if len(relevant_chunk) > 0:
                    # Convert year to numeric
                    relevant_chunk['startYear'] = pd.to_numeric(
                        relevant_chunk['startYear'], errors='coerce'
                    )
                    
                    # Filter by year range (2010-2024)
                    relevant_chunk = relevant_chunk[
                        (relevant_chunk['startYear'] >= 2010) &
                        (relevant_chunk['startYear'] <= 2024)
                    ]
                    
                    movies_data.append(relevant_chunk)
                
                if total_processed % 500000 == 0:
                    current_movies = sum(len(df) for df in movies_data)
                    self.log(f"Processed {total_processed:,} basics records, found {current_movies:,} movies")
            
            if not movies_data:
                self.log("No movie data found")
                return None
            
            movies_df = pd.concat(movies_data, ignore_index=True)
            self.log(f"Loaded {len(movies_df):,} movie records")
            
            # Load ratings
            self.log("Loading ratings data...")
            ratings_df = pd.read_csv(ratings_path, sep='\t', low_memory=False, na_values=['\\N'])
            
            # Merge with ratings
            movies_with_ratings = movies_df.merge(
                ratings_df[['tconst', 'averageRating', 'numVotes']],
                on='tconst',
                how='inner'
            )
            
            # Filter for movies with sufficient votes (100+ for reliability)
            movies_with_ratings = movies_with_ratings[
                movies_with_ratings['numVotes'] >= 100
            ]
            
            self.log(f"Final dataset: {len(movies_with_ratings):,} movies with ratings")
            return movies_with_ratings
            
        except Exception as e:
            self.log(f"Error loading movie details: {e}")
            return None
    
    def process_genres_with_quality(self, movies_df):
        """Process genres and create quality metrics"""
        self.log("Processing genres and quality metrics...")
        
        genre_data = []
        
        for _, movie in movies_df.iterrows():
            genres = str(movie['genres']).split(',') if pd.notna(movie['genres']) else []
            
            for genre in genres:
                genre = genre.strip()
                if genre in self.focus_genres:
                    genre_data.append({
                        'tconst': movie['tconst'],
                        'title': movie['primaryTitle'],
                        'year': int(movie['startYear']),
                        'genre': genre,
                        'rating': float(movie['averageRating']),
                        'votes': int(movie['numVotes']),
                        'runtime': movie.get('runtimeMinutes', 0)
                    })
        
        genre_df = pd.DataFrame(genre_data)
        self.log(f"Created {len(genre_df):,} genre-movie records")
        
        return genre_df
    
    def create_quality_gap_data(self, genre_df, country_code):
        """Create comprehensive quality gap analysis data"""
        self.log("Creating quality gap analysis data...")
        
        country_info = self.countries_db[country_code]
        
        # Overall country metrics
        total_movies = len(genre_df['tconst'].unique())
        avg_rating = genre_df['rating'].mean()
        median_rating = genre_df['rating'].median()
        std_rating = genre_df['rating'].std()
        
        # Genre-wise analysis
        genre_analysis = {}
        for genre in self.focus_genres:
            genre_data = genre_df[genre_df['genre'] == genre]
            if len(genre_data) > 0:
                genre_analysis[genre] = {
                    'count': len(genre_data),
                    'avg_rating': float(genre_data['rating'].mean()),
                    'median_rating': float(genre_data['rating'].median()),
                    'std_rating': float(genre_data['rating'].std()),
                    'top_rated': genre_data.nlargest(3, 'rating')[['title', 'rating', 'year']].to_dict('records')
                }
        
        # Year-wise analysis (for trends)
        yearly_analysis = {}
        for year in range(2010, 2025):
            year_data = genre_df[genre_df['year'] == year]
            if len(year_data) > 0:
                yearly_analysis[year] = {
                    'total_movies': len(year_data['tconst'].unique()),
                    'avg_rating': float(year_data['rating'].mean()),
                    'median_rating': float(year_data['rating'].median()),
                    'genres': {}
                }
                
                # Genre breakdown by year
                for genre in self.focus_genres:
                    genre_year_data = year_data[year_data['genre'] == genre]
                    if len(genre_year_data) > 0:
                        yearly_analysis[year]['genres'][genre] = {
                            'count': len(genre_year_data),
                            'avg_rating': float(genre_year_data['rating'].mean())
                        }
        
        # Quality tier analysis
        quality_distribution = {}
        for tier, threshold in self.quality_tiers.items():
            if tier != 'poor':
                next_threshold = list(self.quality_tiers.values())[
                    list(self.quality_tiers.keys()).index(tier) - 1
                ] if tier != 'excellent' else 10.0
                
                tier_data = genre_df[
                    (genre_df['rating'] >= threshold) & 
                    (genre_df['rating'] < next_threshold)
                ]
            else:
                tier_data = genre_df[genre_df['rating'] < self.quality_tiers['decent']]
            
            quality_distribution[tier] = {
                'count': len(tier_data['tconst'].unique()),
                'percentage': len(tier_data['tconst'].unique()) / total_movies * 100 if total_movies > 0 else 0
            }
        
        # Rating distribution for histogram
        rating_histogram = []
        for rating in np.arange(1.0, 10.1, 0.2):
            count = len(genre_df[
                (genre_df['rating'] >= rating) & 
                (genre_df['rating'] < rating + 0.2)
            ])
            rating_histogram.append({
                'rating': round(rating, 1),
                'count': count
            })
        
        # Compile final data structure
        quality_gap_data = {
            'country': {
                'code': country_code,
                'name': country_info['name'],
                'region': country_info['region'],
                'tier': country_info['tier']
            },
            'summary': {
                'total_movies': total_movies,
                'avg_rating': float(avg_rating),
                'median_rating': float(median_rating),
                'std_rating': float(std_rating),
                'year_range': [2010, 2024],
                'genres_covered': len(genre_analysis)
            },
            'genre_analysis': genre_analysis,
            'yearly_trends': yearly_analysis,
            'quality_distribution': quality_distribution,
            'rating_histogram': rating_histogram,
            'generated': datetime.now().isoformat()
        }
        
        return quality_gap_data
    
    def export_country_data(self, country_code, quality_data):
        """Export quality gap data for a country"""
        try:
            output_file = os.path.join(
                self.output_dir, 
                f"quality_gap_{country_code.lower()}.json"
            )
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(quality_data, f, indent=2, ensure_ascii=False)
            
            self.log(f"✅ Exported data to {output_file}")
            return True
            
        except Exception as e:
            self.log(f"❌ Export error: {e}")
            return False
    
    def process_all_countries(self, min_movies=10, selected_countries=None):
        """Process all discovered countries to create dashboard data"""
        print("🚀 Starting Quality Gap Dashboard processing...")
        
        # Step 1: Discover countries from data
        self.discover_countries_from_data(min_movies)
        
        if not self.countries_db:
            print("❌ No countries discovered. Exiting.")
            return False
        
        print(f"📊 Processing {len(self.countries_db)} countries...")
        
        # Process specified countries or all discovered ones
        countries_to_process = selected_countries or list(self.countries_db.keys())
        successful_countries = []
        
        for country_code in countries_to_process:
            if country_code in self.countries_db:
                success = self.process_country(country_code)
                if success:
                    successful_countries.append(country_code)
            else:
                print(f"⚠️ Skipping unknown country: {country_code}")
        
        if successful_countries:
            print(f"✅ Successfully processed {len(successful_countries)} countries")
            # Create combined dashboard data
            self.create_dashboard_data(successful_countries)
            return True
        else:
            print("❌ No countries processed successfully")
            return False
    
    def process_country(self, country_code):
        """Complete processing pipeline for a country"""
        if country_code not in self.countries_db:
            print(f"❌ Unknown country code: {country_code}")
            return False
            
        self.log(f"=== Processing {self.countries_db[country_code]['name']} ===")
        
        # Step 1: Load country movies
        movie_ids = self.load_country_movies(country_code)
        if not movie_ids:
            self.log("No movies found for this country")
            return False
        
        # Step 2: Load movie details with ratings
        movies_df = self.load_movie_details_with_ratings(movie_ids)
        if movies_df is None or len(movies_df) == 0:
            self.log("No movie details with ratings found")
            return False
        
        # Step 3: Process genres with quality
        genre_df = self.process_genres_with_quality(movies_df)
        if len(genre_df) == 0:
            self.log("No genre data found")
            return False
        
        # Step 4: Create quality gap analysis
        quality_data = self.create_quality_gap_data(genre_df, country_code)
        
        # Step 5: Export data
        success = self.export_country_data(country_code, quality_data)
        
        if success:
            self.log(f"✅ Processing complete!")
            self.log(f"📊 {quality_data['summary']['total_movies']} movies analyzed")
            self.log(f"⭐ Average rating: {quality_data['summary']['avg_rating']:.2f}")
            self.log(f"🎭 {len(quality_data['genre_analysis'])} genres covered")
        
        return success
    
    def create_dashboard_summary(self, countries_processed):
        """Create a summary file for the dashboard"""
        self.log("Creating dashboard summary...")
        
        try:
            # Load all processed country data
            all_countries_data = []
            
            for country_code in countries_processed:
                data_file = os.path.join(
                    self.output_dir, 
                    f"quality_gap_{country_code.lower()}.json"
                )
                
                if os.path.exists(data_file):
                    with open(data_file, 'r', encoding='utf-8') as f:
                        country_data = json.load(f)
                        all_countries_data.append(country_data)
            
            # Create dashboard summary with comparative metrics
            dashboard_data = {
                'countries': all_countries_data,
                'comparative_metrics': {
                    'total_countries': len(all_countries_data),
                    'total_movies': sum(c['summary']['total_movies'] for c in all_countries_data),
                    'avg_rating_range': [
                        min(c['summary']['avg_rating'] for c in all_countries_data),
                        max(c['summary']['avg_rating'] for c in all_countries_data)
                    ],
                    'top_producers': sorted(
                        all_countries_data,
                        key=lambda x: x['summary']['total_movies'],
                        reverse=True
                    )[:10],
                    'quality_leaders': sorted(
                        all_countries_data,
                        key=lambda x: x['summary']['avg_rating'],
                        reverse=True
                    )[:10]
                },
                'generated': datetime.now().isoformat()
            }
            
            # Export dashboard data
            dashboard_file = os.path.join(self.output_dir, "dashboard_data.json")
            with open(dashboard_file, 'w', encoding='utf-8') as f:
                json.dump(dashboard_data, f, indent=2, ensure_ascii=False)
            
            self.log(f"✅ Dashboard summary created: {dashboard_file}")
            return True
            
        except Exception as e:
            self.log(f"❌ Dashboard summary error: {e}")
            return False

if __name__ == "__main__":
    processor = QualityGapDashboardProcessor()
    
    # Process major countries for demonstration
    major_countries = ['US', 'GB', 'FR', 'DE', 'IT', 'IN', 'JP', 'KR', 'CN']
    
    successful_countries = []
    
    for country in major_countries:
        if processor.process_country(country):
            successful_countries.append(country)
    
    if successful_countries:
        processor.create_dashboard_summary(successful_countries)
        print(f"\n🎉 Successfully processed {len(successful_countries)} countries!")
        print(f"📊 Dashboard data ready for visualization")
    else:
        print(f"\n❌ No countries processed successfully")