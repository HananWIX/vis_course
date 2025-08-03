import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

class QualityGapProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        
        # Major film-producing countries
        self.major_countries = [
            'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 'IN', 
            'KR', 'CN', 'RU', 'BR', 'MX', 'AR', 'TR', 'SE', 'NO', 'DK', 
            'FI', 'NL', 'BE', 'CH', 'AT', 'PT', 'PL', 'CZ', 'HU', 'GR'
        ]
        
        # Economic inequality data (Gini coefficients - World Bank 2020-2022)
        self.gini_data = {
            'US': 41.4, 'GB': 33.5, 'FR': 31.6, 'DE': 31.9, 'IT': 35.2,
            'ES': 34.7, 'CA': 33.3, 'AU': 34.4, 'JP': 32.9, 'IN': 35.7,
            'KR': 31.4, 'CN': 38.2, 'RU': 36.0, 'BR': 53.4, 'MX': 45.4,
            'AR': 42.9, 'TR': 41.9, 'SE': 30.0, 'NO': 27.6, 'DK': 28.2,
            'FI': 27.3, 'NL': 28.1, 'BE': 27.2, 'CH': 32.3, 'AT': 30.0,
            'PT': 33.5, 'PL': 30.2, 'CZ': 25.3, 'HU': 30.6, 'GR': 34.4
        }
        
        # Country name mapping
        self.country_names = {
            'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France',
            'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain', 'CA': 'Canada',
            'AU': 'Australia', 'JP': 'Japan', 'IN': 'India', 'KR': 'South Korea',
            'CN': 'China', 'RU': 'Russia', 'BR': 'Brazil', 'MX': 'Mexico',
            'AR': 'Argentina', 'TR': 'Turkey', 'SE': 'Sweden', 'NO': 'Norway',
            'DK': 'Denmark', 'FI': 'Finland', 'NL': 'Netherlands', 
            'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
            'PT': 'Portugal', 'PL': 'Poland', 'CZ': 'Czech Republic', 
            'HU': 'Hungary', 'GR': 'Greece'
        }
        
        # Development classification
        self.development_groups = {
            'developed': ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 
                         'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT', 'GR'],
            'developing': ['IN', 'CN', 'BR', 'MX', 'AR', 'TR', 'RU', 'PL', 'CZ', 'HU'],
            'emerging': ['KR', 'PT']
        }
    
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎬 {message}")
    
    def load_movie_sample(self, sample_size=50000):
        """Load sample of popular movies from 2010-2024"""
        self.log(f"Loading {sample_size:,} popular movies...")
        
        try:
            basics_path = os.path.join(self.data_dir, "title.basics.tsv")
            
            if not os.path.exists(basics_path):
                self.log(f"Error: File not found: {basics_path}")
                return None
            
            # Load movies in chunks and filter
            chunks = []
            total_processed = 0
            
            for chunk in pd.read_csv(
                basics_path, sep='\t', chunksize=50000,
                low_memory=False, na_values=['\\N'],
                usecols=['tconst', 'titleType', 'primaryTitle', 'startYear', 'genres', 'runtimeMinutes']
            ):
                total_processed += len(chunk)
                
                # Filter for feature films
                chunk = chunk[
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['genres'].notna()) &
                    (chunk['runtimeMinutes'].notna())
                ]
                
                chunk['startYear'] = pd.to_numeric(chunk['startYear'], errors='coerce')
                chunk['runtimeMinutes'] = pd.to_numeric(chunk['runtimeMinutes'], errors='coerce')
                
                # Focus on 2010-2024, feature length films
                chunk = chunk[
                    (chunk['startYear'] >= 2010) & 
                    (chunk['startYear'] <= 2024) &
                    (chunk['runtimeMinutes'] >= 80) &
                    (chunk['runtimeMinutes'] <= 200)
                ]
                
                if len(chunk) > 0:
                    chunks.append(chunk)
                
                # Progress logging
                if total_processed % 500000 == 0:
                    current_movies = sum(len(c) for c in chunks)
                    self.log(f"Processed {total_processed:,} records, found {current_movies:,} movies")
                
                # Stop when we have enough data
                if sum(len(c) for c in chunks) >= sample_size * 2:
                    break
            
            if chunks:
                movies_df = pd.concat(chunks, ignore_index=True)
                
                # Sort by start year and take most recent if we have too many
                if len(movies_df) > sample_size:
                    movies_df = movies_df.sort_values('startYear', ascending=False).head(sample_size)
                
                self.log(f"Loaded {len(movies_df):,} movies from 2010-2024")
                return movies_df
            else:
                self.log("No suitable movies found")
                return None
                
        except Exception as e:
            self.log(f"Error loading movies: {e}")
            return None
    
    def load_movie_countries(self, movie_ids):
        """Map movies to origin countries"""
        self.log(f"Loading country data for {len(movie_ids):,} movies...")
        
        try:
            akas_path = os.path.join(self.data_dir, "title.akas.tsv")
            
            if not os.path.exists(akas_path):
                self.log(f"Error: File not found: {akas_path}")
                return {}
            
            movie_id_set = set(movie_ids)
            country_mapping = {}
            total_processed = 0
            
            for chunk in pd.read_csv(
                akas_path, sep='\t', chunksize=100000,
                low_memory=False, na_values=['\\N']
            ):
                total_processed += len(chunk)
                
                # Filter for our movies and major regions
                chunk = chunk[
                    (chunk['titleId'].isin(movie_id_set)) &
                    (chunk['region'].notna()) &
                    (chunk['region'].isin(self.major_countries))
                ]
                
                for _, row in chunk.iterrows():
                    movie_id = row['titleId']
                    region = row['region']
                    
                    # Prioritize original titles
                    if pd.notna(row.get('types')) and 'original' in str(row['types']):
                        country_mapping[movie_id] = region
                    elif movie_id not in country_mapping:
                        country_mapping[movie_id] = region
                
                # Progress logging
                if total_processed % 1000000 == 0:
                    self.log(f"Processed {total_processed:,} akas records, found {len(country_mapping):,} mappings")
            
            self.log(f"Mapped {len(country_mapping):,} movies to countries")
            return country_mapping
            
        except Exception as e:
            self.log(f"Error loading countries: {e}")
            return {}
    
    def load_ratings(self, movie_ids):
        """Load ratings for specific movies"""
        self.log(f"Loading ratings for {len(movie_ids):,} movies...")
        
        try:
            ratings_path = os.path.join(self.data_dir, "title.ratings.tsv")
            
            if not os.path.exists(ratings_path):
                self.log(f"Error: File not found: {ratings_path}")
                return None
            
            ratings_df = pd.read_csv(
                ratings_path, sep='\t',
                low_memory=False, na_values=['\\N']
            )
            
            # Filter for our movies with sufficient votes
            ratings_df = ratings_df[
                (ratings_df['tconst'].isin(movie_ids)) &
                (ratings_df['numVotes'] >= 100)  # Minimum 100 votes for reliability
            ]
            
            self.log(f"Loaded {len(ratings_df):,} ratings")
            return ratings_df
            
        except Exception as e:
            self.log(f"Error loading ratings: {e}")
            return None
    
    def calculate_quality_distributions(self, movies_df, country_mapping, ratings_df):
        """Calculate quality distributions for each country"""
        self.log("Calculating country quality distributions...")
        
        # Create movie-country-rating dataset
        movie_data = []
        
        for _, movie in movies_df.iterrows():
            movie_id = movie['tconst']
            
            # Get country and rating
            country = country_mapping.get(movie_id)
            if not country:
                continue
            
            # Get rating data
            rating_row = ratings_df[ratings_df['tconst'] == movie_id]
            if rating_row.empty:
                continue
            
            rating = rating_row.iloc[0]['averageRating']
            votes = rating_row.iloc[0]['numVotes']
            
            movie_data.append({
                'tconst': movie_id,
                'title': movie['primaryTitle'],
                'year': movie['startYear'],
                'country': country,
                'rating': rating,
                'votes': votes,
                'runtime': movie['runtimeMinutes'],
                'genres': movie['genres']
            })
        
        movie_df = pd.DataFrame(movie_data)
        self.log(f"Created dataset with {len(movie_df):,} movie-country-rating records")
        
        # Save intermediate data
        intermediate_path = os.path.join(self.data_dir, 'quality_gap_movies.json')
        movie_df.to_json(intermediate_path, orient='records', indent=2)
        self.log(f"Saved intermediate data to {intermediate_path}")
        
        # Calculate country-level statistics
        country_stats = []
        
        for country in self.major_countries:
            country_movies = movie_df[movie_df['country'] == country]
            
            if len(country_movies) < 20:  # Minimum sample size
                continue
            
            ratings = country_movies['rating'].values
            
            # Basic statistics
            stats = {
                'country': country,
                'countryName': self.country_names.get(country, country),
                'gini': self.gini_data.get(country, 35.0),  # Default if missing
                'movieCount': len(country_movies),
                'meanRating': float(np.mean(ratings)),
                'medianRating': float(np.median(ratings)),
                'stdRating': float(np.std(ratings)),
                'minRating': float(np.min(ratings)),
                'maxRating': float(np.max(ratings)),
                'ratingRange': float(np.max(ratings) - np.min(ratings)),
                'developmentLevel': self.get_development_level(country)
            }
            
            # Quality distribution (for violin plots)
            # Create bins for histogram
            rating_bins = np.linspace(1, 10, 50)
            hist, bin_edges = np.histogram(ratings, bins=rating_bins, density=True)
            
            # Create violin plot data points
            violin_points = []
            for i in range(len(hist)):
                bin_center = (bin_edges[i] + bin_edges[i+1]) / 2
                violin_points.append({
                    'rating': float(bin_center),
                    'density': float(hist[i])
                })
            
            stats['distribution'] = violin_points
            
            # Quartiles
            q1, q3 = np.percentile(ratings, [25, 75])
            stats['q1'] = float(q1)
            stats['q3'] = float(q3)
            stats['iqr'] = float(q3 - q1)
            
            # Additional metrics
            stats['highQualityPercent'] = float(len(country_movies[country_movies['rating'] >= 7.5]) / len(country_movies) * 100)
            stats['lowQualityPercent'] = float(len(country_movies[country_movies['rating'] <= 5.5]) / len(country_movies) * 100)
            
            country_stats.append(stats)
        
        # Sort by Gini coefficient for visualization
        country_stats.sort(key=lambda x: x['gini'])
        
        self.log(f"Calculated distributions for {len(country_stats)} countries")
        return country_stats
    
    def get_development_level(self, country):
        """Get development level for country"""
        for level, countries in self.development_groups.items():
            if country in countries:
                return level
        return 'other'
    
    def export_data(self, data, filename='quality_gap_data.json'):
        """Export processed data for D3 to data folder"""
        try:
            output_path = os.path.join(self.data_dir, filename)
            
            # Ensure data directory exists
            os.makedirs(self.data_dir, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.log(f"Exported data to {output_path}")
            
            # Also create a summary file
            summary = {
                'generated': datetime.now().isoformat(),
                'countries': len(data),
                'totalMovies': sum(d['movieCount'] for d in data),
                'dataFields': list(data[0].keys()) if data else [],
                'giniRange': [min(d['gini'] for d in data), max(d['gini'] for d in data)] if data else [],
                'ratingRange': [
                    min(d['meanRating'] for d in data), 
                    max(d['meanRating'] for d in data)
                ] if data else []
            }
            
            summary_path = os.path.join(self.data_dir, 'quality_gap_summary.json')
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            self.log(f"Created summary file: {summary_path}")
            return True
            
        except Exception as e:
            self.log(f"Export error: {e}")
            return False
    
    def process_all_data(self, sample_size=30000):
        """Main processing pipeline"""
        self.log("=== Starting Quality Gap Analysis ===")
        
        # Ensure data directory exists
        if not os.path.exists(self.data_dir):
            self.log(f"Error: Data directory '{self.data_dir}' not found!")
            return False
        
        # Step 1: Load movie sample
        movies_df = self.load_movie_sample(sample_size)
        if movies_df is None:
            return False
        
        # Step 2: Map movies to countries
        movie_ids = movies_df['tconst'].tolist()
        country_mapping = self.load_movie_countries(movie_ids)
        if not country_mapping:
            return False
        
        # Step 3: Load ratings
        ratings_df = self.load_ratings(movie_ids)
        if ratings_df is None:
            return False
        
        # Step 4: Calculate quality distributions
        quality_data = self.calculate_quality_distributions(
            movies_df, country_mapping, ratings_df
        )
        
        # Step 5: Export data to data folder
        success = self.export_data(quality_data)
        
        if success:
            self.log("=== Processing Complete! ===")
            self.log(f"Processed {len(quality_data)} countries")
            total_movies = sum(d['movieCount'] for d in quality_data)
            self.log(f"Total movies analyzed: {total_movies:,}")
            self.log(f"Data saved to: {os.path.join(self.data_dir, 'quality_gap_data.json')}")
            
            # Print summary statistics
            if quality_data:
                avg_gini = np.mean([d['gini'] for d in quality_data])
                avg_rating = np.mean([d['meanRating'] for d in quality_data])
                self.log(f"Average Gini coefficient: {avg_gini:.1f}")
                self.log(f"Average movie rating: {avg_rating:.2f}")
            
            return True
        else:
            self.log("=== Processing Failed ===")
            return False

if __name__ == "__main__":
    processor = QualityGapProcessor()
    processor.process_all_data()