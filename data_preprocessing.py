import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import sys
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

class IMDbDataProcessor:
    def __init__(self, data_dir="."):
        self.data_dir = data_dir
        self.crisis_years = {
            2001: "September 11 Attacks",
            2008: "Global Financial Crisis", 
            2020: "COVID-19 Pandemic",
            2022: "Russia-Ukraine War",
            2023: "October 7 Attack"
        }
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
            'Sci-Fi': 'Sci-Fi'
        }
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def load_basics_data(self):
        self.log("Starting to load basics data...")
        
        try:
            chunks = []
            chunk_size = 50000
            total_movies = 0
            
            basics_path = os.path.join(self.data_dir, "title.basics.tsv", "title.basics.tsv")
            
            self.log(f"Reading file: {basics_path}")
            
            important_cols = ['tconst', 'titleType', 'primaryTitle', 'startYear', 'genres']
            
            for i, chunk in enumerate(pd.read_csv(
                basics_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N'],
                usecols=important_cols
            )):
                chunk = chunk[
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['startYear'] != '\\N') &
                    (chunk['genres'].notna()) &
                    (chunk['genres'] != '\\N')
                ]
                
                chunk['startYear'] = pd.to_numeric(chunk['startYear'], errors='coerce')
                
                chunk = chunk[
                    (chunk['startYear'] >= 2000) & 
                    (chunk['startYear'] <= 2024)
                ]
                
                if len(chunk) > 0:
                    chunks.append(chunk)
                    total_movies += len(chunk)
                
                if (i + 1) % 50 == 0:
                    self.log(f"Processing chunk {i + 1}, found {total_movies} movies so far...")
                    
        except Exception as e:
            self.log(f"Error loading basics: {e}")
            return None
            
        if not chunks:
            self.log("No valid data found")
            return None
            
        basics_df = pd.concat(chunks, ignore_index=True)
        self.log(f"Loaded {len(basics_df)} movies from 2000-2024")
        return basics_df
    
    def load_ratings_data(self):
        self.log("Loading ratings data...")
        
        try:
            ratings_path = os.path.join(self.data_dir, "title.ratings.tsv", "title.ratings.tsv")
            
            ratings_df = pd.read_csv(
                ratings_path,
                sep='\t',
                low_memory=False,
                na_values=['\\N']
            )
            
            ratings_df = ratings_df[ratings_df['numVotes'] >= 10]
            
            self.log(f"Loaded {len(ratings_df)} ratings")
            return ratings_df
            
        except Exception as e:
            self.log(f"Error loading ratings: {e}")
            return None
    
    def process_genres(self, basics_df):
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
                            'titleType': row['titleType']
                        })
        
        genre_df = pd.DataFrame(genre_data)
        self.log(f"Processed {len(genre_df)} genre entries")
        return genre_df
    
    def create_line_chart_data(self, merged_df):
        self.log("Creating line chart data...")
        
        line_data = []
        
        for year in range(2000, 2025):
            year_data = merged_df[merged_df['startYear'] == year]
            
            if len(year_data) > 0:
                genre_counts = year_data.groupby('genre')['tconst'].nunique()
                
                row = {
                    'year': int(year), 
                    'isCrisis': year in self.crisis_years,
                    'total': len(year_data.drop_duplicates('tconst'))
                }
                
                for genre in self.genre_mapping.keys():
                    row[genre] = int(genre_counts.get(genre, 0))
                
                line_data.append(row)
        
        self.log(f"Created data for {len(line_data)} years")
        return line_data
    
    def create_bar_chart_data(self, merged_df):
        """יצירת נתונים לגרף עמודות - השוואה לפני/אחרי משבר"""
        self.log("Creating bar chart data...")
        
        bar_data = {}
        
        for crisis_year in self.crisis_years.keys():
            before_year = crisis_year - 1
            after_year = crisis_year + 1
            
            before_data = merged_df[merged_df['startYear'] == before_year]
            after_data = merged_df[merged_df['startYear'] == after_year]
            
            crisis_data = []
            
            for genre in ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary']:
                before_count = len(before_data[before_data['genre'] == genre].drop_duplicates('tconst'))
                after_count = len(after_data[after_data['genre'] == genre].drop_duplicates('tconst'))
                
                change_percent = ((after_count - before_count) / before_count * 100) if before_count > 0 else 0
                
                crisis_data.append({
                    'genre': self.genre_mapping.get(genre, genre),
                    'genre_en': genre,
                    'before': int(before_count),
                    'after': int(after_count),
                    'change': round(change_percent, 1)
                })
            
            bar_data[str(crisis_year)] = crisis_data
        
        return bar_data
    
    def create_pie_chart_data(self, merged_df):
        """Creating data for pie chart - genre distribution in crisis year"""
        self.log("Creating pie chart data...")
        
        pie_data = {}
        
        for crisis_year in self.crisis_years.keys():
            crisis_data = merged_df[merged_df['startYear'] == crisis_year]
            
            if len(crisis_data) > 0:
                genre_counts = crisis_data.groupby('genre')['tconst'].nunique()
                total = genre_counts.sum()
                
                pie_data[str(crisis_year)] = []
                
                for genre, count in genre_counts.items():
                    if count > 0:  # רק ז'אנרים עם סרטים
                        percentage = (count / total * 100) if total > 0 else 0
                        pie_data[str(crisis_year)].append({
                            'genre': self.genre_mapping.get(genre, genre),
                            'genre_en': genre,
                            'count': int(count),
                            'percentage': round(percentage, 1)
                        })
                
                # מיון לפי כמות
                pie_data[str(crisis_year)].sort(key=lambda x: x['count'], reverse=True)
        
        return pie_data
    
    def create_scatter_chart_data(self, merged_df):
        """יצירת נתונים לגרף פיזור - דירוגים מול שנים"""
        self.log("Creating scatter plot data...")
        
        # סינון נתונים תקינים
        valid_data = merged_df[
            (merged_df['averageRating'].notna()) &
            (merged_df['numVotes'] > 100)  # מינימום הצבעות
        ].copy()
        
        # דגימה אקראית לביצועים טובים יותר
        if len(valid_data) > 10000:
            valid_data = valid_data.sample(n=10000, random_state=42)
        
        scatter_data = []
        
        for _, row in valid_data.iterrows():
            scatter_data.append({
                'year': int(row['startYear']),
                'rating': float(row['averageRating']),
                'votes': int(row['numVotes']),
                'genre': self.genre_mapping.get(row['genre'], row['genre']),
                'genre_en': row['genre'],
                'title': row['primaryTitle'],
                'isCrisis': row['startYear'] in self.crisis_years
            })
        
        self.log(f"נוצרו {len(scatter_data)} נקודות לגרף פיזור")
        return scatter_data
    
    def create_area_chart_data(self, merged_df):
        """יצירת נתונים לגרף אזור - תפוצת סרטים לפי עשור"""
        self.log("Creating area chart data...")
        
        area_data = []
        
        for year in range(2000, 2025):
            year_data = merged_df[merged_df['startYear'] == year]
            count = len(year_data.drop_duplicates('tconst'))
            
            if count > 0:
                decade = f"{(year//10)*10}s"
                area_data.append({
                    'year': int(year),
                    'count': int(count),
                    'decade': decade,
                    'isCrisis': year in self.crisis_years
                })
        
        return area_data
    
    def create_heatmap_data(self, merged_df):
        """Creating data for heat map - genres vs years"""
        self.log("Creating heat map data...")
        
        heatmap_data = []
        years = list(range(2000, 2025, 2))  # כל שנתיים
        genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary']
        
        for year in years:
            year_data = merged_df[merged_df['startYear'] == year]
            
            for genre in genres:
                genre_data = year_data[year_data['genre'] == genre]
                
                if len(genre_data) > 0:
                    count = len(genre_data.drop_duplicates('tconst'))
                    avg_rating = genre_data['averageRating'].mean()
                    total_votes = genre_data['numVotes'].sum()
                    
                    heatmap_data.append({
                        'year': int(year),
                        'genre': self.genre_mapping.get(genre, genre),
                        'genre_en': genre,
                        'count': int(count),
                        'rating': round(float(avg_rating), 2) if not pd.isna(avg_rating) else 0,
                        'votes': int(total_votes) if not pd.isna(total_votes) else 0
                    })
        
        return heatmap_data
    
    def create_bubble_chart_data(self, merged_df):
        """יצירת נתונים לגרף בועות - דירוג מול פופולריות"""
        self.log("Creating bubble chart data...")
        
        # קיבוץ לפי שנה וז'אנר
        bubble_data = []
        
        for year in range(2000, 2025, 2):  # כל שנתיים
            year_data = merged_df[
                (merged_df['startYear'] == year) &
                (merged_df['averageRating'].notna()) &
                (merged_df['numVotes'] > 50)
            ]
            
            for genre in ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary']:
                genre_data = year_data[year_data['genre'] == genre]
                
                if len(genre_data) > 0:
                    avg_rating = genre_data['averageRating'].mean()
                    total_votes = genre_data['numVotes'].sum()
                    movie_count = len(genre_data.drop_duplicates('tconst'))
                    
                    bubble_data.append({
                        'year': int(year),
                        'genre': self.genre_mapping.get(genre, genre),
                        'genre_en': genre,
                        'rating': round(float(avg_rating), 2),
                        'votes': int(total_votes),
                        'count': int(movie_count),
                        'isCrisis': year in self.crisis_years
                    })
        
        return bubble_data
    
    def process_all_data(self):
        """עיבוד כל הנתונים"""
        self.log("מתחיל עיבוד נתונים...")
        
        # בדיקת קיום קבצים
        basics_path = os.path.join(self.data_dir, "title.basics.tsv", "title.basics.tsv")
        ratings_path = os.path.join(self.data_dir, "title.ratings.tsv", "title.ratings.tsv")
        
        if not os.path.exists(basics_path):
            self.log(f"שגיאה: לא נמצא קובץ {basics_path}")
            return None
            
        if not os.path.exists(ratings_path):
            self.log(f"שגיאה: לא נמצא קובץ {ratings_path}")
            return None
        
        # טעינת נתונים
        basics_df = self.load_basics_data()
        if basics_df is None:
            return None
            
        ratings_df = self.load_ratings_data()
        if ratings_df is None:
            return None
            
        # עיבוד ז'אנרים
        genre_df = self.process_genres(basics_df)
        if len(genre_df) == 0:
            self.log("שגיאה: לא נמצאו ז'אנרים תקינים")
            return None
        
        # מיזוג נתונים
        self.log("ממזג נתונים...")
        # מיזוג genres עם ratings (genre_df כבר מכיל את הנתונים מ-basics)
        merged_df = genre_df.merge(ratings_df, on='tconst', how='left')
        
        self.log(f"נתונים ממוזגים: {len(merged_df)} רשומות")
        
        # יצירת נתונים לכל הגרפים
        processed_data = {
            'lineChartData': self.create_line_chart_data(merged_df),
            'barChartData': self.create_bar_chart_data(merged_df),
            'pieChartData': self.create_pie_chart_data(merged_df),
            'scatterChartData': self.create_scatter_chart_data(merged_df),
            'areaChartData': self.create_area_chart_data(merged_df),
            'heatmapData': self.create_heatmap_data(merged_df),
            'bubbleChartData': self.create_bubble_chart_data(merged_df),
            'crisisData': {
                'crisisYears': list(self.crisis_years.keys()),
                'crisisNames': self.crisis_years
            },
            'genreMapping': self.genre_mapping,
            'metadata': {
                'totalMovies': len(basics_df),
                'totalRatings': len(ratings_df),
                'mergedRecords': len(merged_df),
                'processedAt': datetime.now().isoformat(),
                'years': list(range(2000, 2025)),
                'genres': list(self.genre_mapping.keys())
            }
        }
        
        output_file = 'processed_data.json'
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(processed_data, f, ensure_ascii=False, indent=2)
            
            self.log(f"Data successfully saved to {output_file}")
            
            self.log("=== Processing Summary ===")
            self.log(f"Total movies: {processed_data['metadata']['totalMovies']:,}")
            self.log(f"Total ratings: {processed_data['metadata']['totalRatings']:,}")
            self.log(f"Merged records: {processed_data['metadata']['mergedRecords']:,}")
            self.log(f"Line chart data: {len(processed_data['lineChartData'])} years")
            self.log(f"Scatter chart data: {len(processed_data['scatterChartData'])} points")
            
            return processed_data
            
        except Exception as e:
            self.log(f"Error saving file: {e}")
            return None

if __name__ == "__main__":
    print("=== IMDb Data Processor ===")
    print("This script will process the files:")
    print("- title.basics.tsv/title.basics.tsv")
    print("- title.ratings.tsv/title.ratings.tsv")
    print()
    
    processor = IMDbDataProcessor()
    data = processor.process_all_data()
    
    if data:
        print("\n✅ Data processing completed successfully!")
        print("📄 File processed_data.json is ready for use")
        print("🎬 Now you can run the visualization")
    else:
        print("\n❌ Error processing data")
        print("🔧 Check that the files exist and are accessible") 