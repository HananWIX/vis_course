import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import sys
from collections import defaultdict, Counter
import warnings
import math
warnings.filterwarnings('ignore')

class GlobalCinemaDataProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.processed_data = {}
        
        # We'll focus on major film-producing countries/regions for initial analysis
        self.major_regions = [
            'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 'IN', 
            'KR', 'CN', 'RU', 'BR', 'MX', 'AR', 'TR', 'IR', 'EG', 'NG',
            'ZA', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT', 'PT',
            'GR', 'HU', 'CZ', 'PL', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE',
            'LV', 'LT', 'IE', 'IS', 'LU', 'MT', 'CY'
        ]
        
        self.genre_mapping = {
            'Drama': 'Drama',
            'Action': 'Action', 
            'Comedy': 'Comedy',
            'Horror': 'Horror',
            'Documentary': 'Documentary',
            'Thriller': 'Thriller',
            'Romance': 'Romance',
            'Adventure': 'Adventure',
            'Crime': 'Crime',
            'Sci-Fi': 'Sci-Fi',
            'Fantasy': 'Fantasy',
            'Mystery': 'Mystery',
            'Biography': 'Biography',
            'History': 'History',
            'War': 'War',
            'Western': 'Western',
            'Musical': 'Musical',
            'Sport': 'Sport',
            'Family': 'Family',
            'Animation': 'Animation'
        }
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def load_basics_sample(self, sample_size=100000):
        """Load a representative sample of basics data for initial processing"""
        self.log("Loading basics data sample...")
        
        try:
            basics_path = os.path.join(self.data_dir, "title.basics.tsv")
            
            # Read in chunks and filter movies from 2000-2024
            chunks = []
            chunk_size = 50000
            total_processed = 0
            movies_found = 0
            
            for i, chunk in enumerate(pd.read_csv(
                basics_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            )):
                # Filter for movies only
                chunk = chunk[
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['startYear'] != '\\N') &
                    (chunk['genres'].notna()) &
                    (chunk['genres'] != '\\N')
                ]
                
                # Convert year to numeric and filter date range
                chunk['startYear'] = pd.to_numeric(chunk['startYear'], errors='coerce')
                chunk = chunk[
                    (chunk['startYear'] >= 2000) & 
                    (chunk['startYear'] <= 2024)
                ]
                
                if len(chunk) > 0:
                    chunks.append(chunk)
                    movies_found += len(chunk)
                
                total_processed += chunk_size
                
                if movies_found >= sample_size:
                    self.log(f"Reached sample size of {movies_found} movies")
                    break
                    
                if (i + 1) % 20 == 0:
                    self.log(f"Processed {total_processed:,} rows, found {movies_found:,} movies")
                    
            if chunks:
                basics_df = pd.concat(chunks, ignore_index=True)
                self.log(f"Loaded {len(basics_df):,} movies for analysis")
                return basics_df
            else:
                self.log("No movies found in the data")
                return None
                
        except Exception as e:
            self.log(f"Error loading basics: {e}")
            return None
    
    def load_akas_for_movies(self, movie_ids):
        """Load regional data for specific movies"""
        self.log(f"Loading regional data for {len(movie_ids):,} movies...")
        
        try:
            akas_path = os.path.join(self.data_dir, "title.akas.tsv")
            
            # Convert movie_ids to set for faster lookup
            movie_id_set = set(movie_ids)
            
            chunks = []
            chunk_size = 100000
            total_processed = 0
            found_records = 0
            
            for chunk in pd.read_csv(
                akas_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            ):
                # Filter for our movies only
                chunk = chunk[chunk['titleId'].isin(movie_id_set)]
                
                # Focus on original titles and major regions
                chunk = chunk[
                    (chunk['region'].notna()) &
                    (chunk['region'] != '\\N') &
                    (chunk['region'].isin(self.major_regions))
                ]
                
                if len(chunk) > 0:
                    chunks.append(chunk)
                    found_records += len(chunk)
                
                total_processed += chunk_size
                
                if total_processed % 1000000 == 0:
                    self.log(f"Processed {total_processed:,} akas records, found {found_records:,} matches")
            
            if chunks:
                akas_df = pd.concat(chunks, ignore_index=True)
                self.log(f"Loaded {len(akas_df):,} regional records")
                return akas_df
            else:
                self.log("No regional data found")
                return None
                
        except Exception as e:
            self.log(f"Error loading akas: {e}")
            return None
    
    def load_ratings_for_movies(self, movie_ids):
        """Load ratings for specific movies"""
        self.log(f"Loading ratings for {len(movie_ids):,} movies...")
        
        try:
            ratings_path = os.path.join(self.data_dir, "title.ratings.tsv")
            
            # Load all ratings (it's a small file)
            ratings_df = pd.read_csv(
                ratings_path,
                sep='\t',
                low_memory=False,
                na_values=['\\N']
            )
            
            # Filter for our movies only
            ratings_df = ratings_df[ratings_df['tconst'].isin(movie_ids)]
            
            # Filter for movies with decent number of votes
            ratings_df = ratings_df[ratings_df['numVotes'] >= 10]
            
            self.log(f"Loaded {len(ratings_df):,} ratings")
            return ratings_df
            
        except Exception as e:
            self.log(f"Error loading ratings: {e}")
            return None
    
    def calculate_shannon_diversity(self, genre_counts):
        """Calculate Shannon Diversity Index for genres"""
        if not genre_counts or sum(genre_counts.values()) == 0:
            return 0
        
        total = sum(genre_counts.values())
        shannon_index = 0
        
        for count in genre_counts.values():
            if count > 0:
                proportion = count / total
                shannon_index -= proportion * math.log(proportion)
        
        return shannon_index
    
    def process_genres(self, basics_df):
        """Process and expand genre information"""
        self.log("Processing genres...")
        
        genre_data = []
        
        for _, row in basics_df.iterrows():
            if pd.notna(row['genres']) and row['genres'] != '\\N':
                genres = row['genres'].split(',')
                for genre in genres:
                    genre_clean = genre.strip()
                    if genre_clean in self.genre_mapping:
                        genre_data.append({
                            'tconst': row['tconst'],
                            'startYear': row['startYear'],
                            'genre': genre_clean,
                            'genre_english': self.genre_mapping[genre_clean],
                            'primaryTitle': row['primaryTitle'],
                            'runtimeMinutes': row['runtimeMinutes'] if pd.notna(row['runtimeMinutes']) else None
                        })
        
        genre_df = pd.DataFrame(genre_data)
        self.log(f"Processed {len(genre_df):,} genre entries")
        return genre_df
    
    def identify_original_countries(self, akas_df):
        """Identify original country for each movie"""
        self.log("Identifying original countries...")
        
        # Group by movie and try to identify original country
        movie_countries = {}
        
        for movie_id, group in akas_df.groupby('titleId'):
            # Look for original title markers or most common region
            original_entries = group[
                (group['types'].notna()) & 
                (group['types'].str.contains('original', na=False))
            ]
            
            if len(original_entries) > 0:
                # Use the first original entry
                country = original_entries.iloc[0]['region']
            else:
                # Use the first region as fallback
                country = group.iloc[0]['region']
            
            if pd.notna(country) and country in self.major_regions:
                movie_countries[movie_id] = country
        
        self.log(f"Identified original countries for {len(movie_countries):,} movies")
        return movie_countries
    
    def create_democratic_diversity_data(self, genre_df, movie_countries, ratings_df):
        """Create data for Democratic Diversity Index visualization"""
        self.log("Creating Democratic Diversity Index data...")
        
        # Merge genre data with countries and ratings
        genre_df['country'] = genre_df['tconst'].map(movie_countries)
        genre_df = genre_df[genre_df['country'].notna()]
        
        # Merge with ratings
        ratings_dict = ratings_df.set_index('tconst').to_dict('index')
        genre_df['averageRating'] = genre_df['tconst'].map(
            lambda x: ratings_dict.get(x, {}).get('averageRating')
        )
        genre_df['numVotes'] = genre_df['tconst'].map(
            lambda x: ratings_dict.get(x, {}).get('numVotes')
        )
        
        # Calculate country-level statistics
        country_stats = []
        
        for country in genre_df['country'].unique():
            country_data = genre_df[genre_df['country'] == country]
            
            # Count movies and genres
            movie_count = len(country_data['tconst'].unique())
            if movie_count < 10:  # Skip countries with too few movies
                continue
            
            # Genre distribution
            genre_counts = Counter(country_data['genre'])
            
            # Calculate diversity index
            diversity_index = self.calculate_shannon_diversity(genre_counts)
            
            # Calculate average rating and popularity
            rated_movies = country_data[country_data['averageRating'].notna()]
            avg_rating = rated_movies['averageRating'].mean() if len(rated_movies) > 0 else None
            avg_votes = rated_movies['numVotes'].mean() if len(rated_movies) > 0 else None
            
            # Time period analysis
            period_2020_2024 = len(country_data[country_data['startYear'] >= 2020])
            period_2015_2019 = len(country_data[
                (country_data['startYear'] >= 2015) & (country_data['startYear'] < 2020)
            ])
            period_2010_2014 = len(country_data[
                (country_data['startYear'] >= 2010) & (country_data['startYear'] < 2015)
            ])
            period_2005_2009 = len(country_data[
                (country_data['startYear'] >= 2005) & (country_data['startYear'] < 2010)
            ])
            period_2000_2004 = len(country_data[country_data['startYear'] < 2005])
            
            country_stats.append({
                'country': country,
                'movie_count': int(movie_count),
                'diversity_index': round(diversity_index, 3),
                'avg_rating': round(avg_rating, 2) if avg_rating else None,
                'avg_votes': int(avg_votes) if avg_votes else None,
                'genre_distribution': dict(genre_counts),
                'periods': {
                    '2020-2024': int(period_2020_2024),
                    '2015-2019': int(period_2015_2019),
                    '2010-2014': int(period_2010_2014),
                    '2005-2009': int(period_2005_2009),
                    '2000-2004': int(period_2000_2004)
                }
            })
        
        # Sort by movie count for better visualization
        country_stats.sort(key=lambda x: x['movie_count'], reverse=True)
        
        self.log(f"Created diversity data for {len(country_stats)} countries")
        return country_stats
    
    def fill_missing_values(self, data):
        """Handle missing values in various data types"""
        self.log("Handling missing values...")
        
        for item in data:
            # Fill missing ratings with median
            if item.get('avg_rating') is None:
                # Calculate global median rating
                ratings = [d['avg_rating'] for d in data if d.get('avg_rating') is not None]
                if ratings:
                    item['avg_rating'] = round(np.median(ratings), 2)
                else:
                    item['avg_rating'] = 6.0  # Default fallback
            
            # Fill missing votes with median
            if item.get('avg_votes') is None:
                votes = [d['avg_votes'] for d in data if d.get('avg_votes') is not None]
                if votes:
                    item['avg_votes'] = int(np.median(votes))
                else:
                    item['avg_votes'] = 1000  # Default fallback
        
        return data
    
    def export_for_d3(self, data, filename):
        """Export processed data in D3-friendly format"""
        self.log(f"Exporting data to {filename}...")
        
        d3_data = {
            'democratic_diversity_data': data,
            'metadata': {
                'total_countries': len(data),
                'total_movies': sum(d['movie_count'] for d in data),
                'avg_diversity_index': round(np.mean([d['diversity_index'] for d in data]), 3),
                'processed_at': datetime.now().isoformat(),
                'data_period': '2000-2024',
                'major_regions': self.major_regions,
                'genre_mapping': self.genre_mapping
            }
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(d3_data, f, ensure_ascii=False, indent=2)
            
            self.log(f"Successfully exported data to {filename}")
            self.log(f"Data includes {len(data)} countries with cinema data")
            
            return True
            
        except Exception as e:
            self.log(f"Error exporting data: {e}")
            return False
    
    def process_all_data(self, sample_size=200000):
        """Main processing pipeline"""
        self.log("=== Starting Global Cinema Data Processing ===")
        
        # Step 1: Load basics sample
        basics_df = self.load_basics_sample(sample_size)
        if basics_df is None:
            return False
        
        # Step 2: Get movie IDs for regional lookup
        movie_ids = basics_df['tconst'].tolist()
        
        # Step 3: Load regional data
        akas_df = self.load_akas_for_movies(movie_ids)
        if akas_df is None:
            return False
        
        # Step 4: Load ratings
        ratings_df = self.load_ratings_for_movies(movie_ids)
        if ratings_df is None:
            return False
        
        # Step 5: Process genres
        genre_df = self.process_genres(basics_df)
        
        # Step 6: Identify original countries
        movie_countries = self.identify_original_countries(akas_df)
        
        # Step 7: Create visualization data
        diversity_data = self.create_democratic_diversity_data(
            genre_df, movie_countries, ratings_df
        )
        
        # Step 8: Handle missing values
        diversity_data = self.fill_missing_values(diversity_data)
        
        # Step 9: Export for D3
        success = self.export_for_d3(diversity_data, 'global_cinema_data.json')
        
        if success:
            self.log("=== Processing Complete! ===")
            self.log(f"Processed {len(diversity_data)} countries")
            self.log(f"Total movies analyzed: {sum(d['movie_count'] for d in diversity_data):,}")
            return True
        else:
            self.log("=== Processing Failed ===")
            return False

if __name__ == "__main__":
    processor = GlobalCinemaDataProcessor()
    
    print("🎬 Global Cinema Data Processor")
    print("Processing IMDb data for democratic diversity analysis...")
    print()
    
    success = processor.process_all_data(sample_size=150000)
    
    if success:
        print("\n✅ Data processing completed successfully!")
        print("📄 File 'global_cinema_data.json' is ready for D3.js")
        print("🎭 Now ready to build the Democratic Diversity Index visualization")
    else:
        print("\n❌ Error during data processing")
        print("🔧 Check the logs above for details")