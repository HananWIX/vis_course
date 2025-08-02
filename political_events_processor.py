import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import warnings
warnings.filterwarnings('ignore')

class UniversalPoliticalEventsProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.output_dir = os.path.join(data_dir, "political_timelines")
        
        # Comprehensive political events database - 20 countries with 3 key events each
        self.political_events_db = {
            'US': [  # United States
                {'year': 2001, 'date': '2001-09-11', 'event': '9/11 Attacks', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2008, 'date': '2008-09-15', 'event': 'Financial Crisis', 'type': 'economic', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-11', 'event': 'COVID-19 Pandemic', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'IR': [  # Iran
                {'year': 2009, 'date': '2009-06-12', 'event': 'Green Movement', 'type': 'domestic_unrest', 'severity': 'high'},
                {'year': 2018, 'date': '2018-05-08', 'event': 'US Nuclear Deal Exit', 'type': 'sanctions', 'severity': 'high'},
                {'year': 2022, 'date': '2022-09-16', 'event': 'Mahsa Amini Protests', 'type': 'domestic_unrest', 'severity': 'high'}
            ],
            'RU': [  # Russia
                {'year': 2008, 'date': '2008-08-08', 'event': 'Georgia War', 'type': 'war', 'severity': 'medium'},
                {'year': 2014, 'date': '2014-03-18', 'event': 'Crimea Annexation', 'type': 'territorial_conflict', 'severity': 'high'},
                {'year': 2022, 'date': '2022-02-24', 'event': 'Ukraine Invasion', 'type': 'war', 'severity': 'high'}
            ],
            'CN': [  # China
                {'year': 2008, 'date': '2008-05-12', 'event': 'Sichuan Earthquake', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2019, 'date': '2019-06-09', 'event': 'Hong Kong Protests', 'type': 'domestic_unrest', 'severity': 'high'},
                {'year': 2020, 'date': '2020-01-23', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'UA': [  # Ukraine
                {'year': 2004, 'date': '2004-11-21', 'event': 'Orange Revolution', 'type': 'political_revolution', 'severity': 'high'},
                {'year': 2014, 'date': '2014-02-22', 'event': 'Euromaidan Revolution', 'type': 'political_revolution', 'severity': 'high'},
                {'year': 2022, 'date': '2022-02-24', 'event': 'Russian Invasion', 'type': 'war', 'severity': 'high'}
            ],
            'GB': [  # United Kingdom
                {'year': 2005, 'date': '2005-07-07', 'event': '7/7 London Bombings', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2016, 'date': '2016-06-23', 'event': 'Brexit Referendum', 'type': 'political_shift', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-23', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'FR': [  # France
                {'year': 2015, 'date': '2015-11-13', 'event': 'Paris Attacks', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2018, 'date': '2018-11-17', 'event': 'Yellow Vest Protests', 'type': 'domestic_unrest', 'severity': 'medium'},
                {'year': 2020, 'date': '2020-03-17', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'DE': [  # Germany
                {'year': 2015, 'date': '2015-09-01', 'event': 'Refugee Crisis Peak', 'type': 'humanitarian_crisis', 'severity': 'high'},
                {'year': 2016, 'date': '2016-12-19', 'event': 'Berlin Attack', 'type': 'terrorism', 'severity': 'medium'},
                {'year': 2020, 'date': '2020-03-22', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'JP': [  # Japan
                {'year': 2011, 'date': '2011-03-11', 'event': 'Tohoku Earthquake', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2011, 'date': '2011-03-12', 'event': 'Fukushima Nuclear Disaster', 'type': 'nuclear_disaster', 'severity': 'high'},
                {'year': 2020, 'date': '2020-04-16', 'event': 'COVID-19 Emergency', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'IN': [  # India
                {'year': 2008, 'date': '2008-11-26', 'event': 'Mumbai Attacks', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2016, 'date': '2016-11-08', 'event': 'Demonetization', 'type': 'economic', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-24', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'BR': [  # Brazil
                {'year': 2014, 'date': '2014-03-17', 'event': 'Operation Car Wash', 'type': 'corruption_scandal', 'severity': 'high'},
                {'year': 2016, 'date': '2016-08-31', 'event': 'Rousseff Impeachment', 'type': 'political_crisis', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-20', 'event': 'COVID-19 Crisis', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'KR': [  # South Korea
                {'year': 2014, 'date': '2014-04-16', 'event': 'Sewol Ferry Disaster', 'type': 'disaster', 'severity': 'high'},
                {'year': 2016, 'date': '2016-10-24', 'event': 'Park Geun-hye Scandal', 'type': 'political_scandal', 'severity': 'high'},
                {'year': 2020, 'date': '2020-02-29', 'event': 'COVID-19 Outbreak', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'IT': [  # Italy
                {'year': 2009, 'date': '2009-04-06', 'event': 'L\'Aquila Earthquake', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2018, 'date': '2018-08-14', 'event': 'Genoa Bridge Collapse', 'type': 'infrastructure_disaster', 'severity': 'medium'},
                {'year': 2020, 'date': '2020-03-09', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'ES': [  # Spain
                {'year': 2004, 'date': '2004-03-11', 'event': 'Madrid Train Bombings', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2008, 'date': '2008-07-01', 'event': 'Financial Crisis', 'type': 'economic', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-14', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'TR': [  # Turkey
                {'year': 2013, 'date': '2013-05-28', 'event': 'Gezi Park Protests', 'type': 'domestic_unrest', 'severity': 'medium'},
                {'year': 2016, 'date': '2016-07-15', 'event': 'Failed Coup Attempt', 'type': 'coup_attempt', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-21', 'event': 'COVID-19 Measures', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'MX': [  # Mexico
                {'year': 2006, 'date': '2006-12-11', 'event': 'Drug War Escalation', 'type': 'internal_conflict', 'severity': 'high'},
                {'year': 2014, 'date': '2014-09-26', 'event': 'Ayotzinapa Students', 'type': 'human_rights_crisis', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-30', 'event': 'COVID-19 Emergency', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'AU': [  # Australia
                {'year': 2009, 'date': '2009-02-07', 'event': 'Black Saturday Bushfires', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2019, 'date': '2019-12-01', 'event': 'Bushfire Crisis', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-21', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'CA': [  # Canada
                {'year': 2001, 'date': '2001-09-11', 'event': '9/11 Response', 'type': 'security_crisis', 'severity': 'medium'},
                {'year': 2008, 'date': '2008-10-01', 'event': 'Financial Crisis', 'type': 'economic', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-16', 'event': 'COVID-19 Lockdown', 'type': 'health_crisis', 'severity': 'high'}
            ],
            'EG': [  # Egypt
                {'year': 2011, 'date': '2011-01-25', 'event': 'Arab Spring Revolution', 'type': 'political_revolution', 'severity': 'high'},
                {'year': 2013, 'date': '2013-07-03', 'event': 'Military Coup', 'type': 'coup', 'severity': 'high'},
                {'year': 2020, 'date': '2020-03-25', 'event': 'COVID-19 Measures', 'type': 'health_crisis', 'severity': 'medium'}
            ],
            'IL': [  # Israel
                {'year': 2006, 'date': '2006-07-12', 'event': 'Second Lebanon War', 'type': 'war', 'severity': 'high'},
                {'year': 2014, 'date': '2014-07-08', 'event': 'Gaza War (Protective Edge)', 'type': 'war', 'severity': 'high'},
                {'year': 2020, 'date': '2020-09-15', 'event': 'Abraham Accords', 'type': 'diplomatic', 'severity': 'positive'}
            ],
            'ZA': [  # South Africa
                {'year': 2008, 'date': '2008-05-11', 'event': 'Xenophobic Attacks', 'type': 'domestic_unrest', 'severity': 'high'},
                {'year': 2018, 'date': '2018-02-14', 'event': 'Zuma Resignation', 'type': 'political_crisis', 'severity': 'medium'},
                {'year': 2021, 'date': '2021-07-09', 'event': 'Unrest and Looting', 'type': 'domestic_unrest', 'severity': 'high'}
            ],
            'NG': [  # Nigeria
                {'year': 2009, 'date': '2009-07-26', 'event': 'Boko Haram Insurgency', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2014, 'date': '2014-04-14', 'event': 'Chibok Girls Kidnapping', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2020, 'date': '2020-10-08', 'event': 'EndSARS Protests', 'type': 'domestic_unrest', 'severity': 'high'}
            ],
            'SA': [  # Saudi Arabia
                {'year': 2017, 'date': '2017-04-25', 'event': 'Vision 2030 Launch', 'type': 'economic', 'severity': 'positive'},
                {'year': 2018, 'date': '2018-10-02', 'event': 'Khashoggi Killing', 'type': 'political_scandal', 'severity': 'high'},
                {'year': 2019, 'date': '2019-12-11', 'event': 'Aramco IPO', 'type': 'economic', 'severity': 'medium'}
            ],
            'AR': [  # Argentina
                {'year': 2001, 'date': '2001-12-19', 'event': 'Economic Crisis', 'type': 'economic', 'severity': 'high'},
                {'year': 2015, 'date': '2015-12-10', 'event': 'Macri Government', 'type': 'political_shift', 'severity': 'medium'},
                {'year': 2019, 'date': '2019-12-10', 'event': 'Fernández Election', 'type': 'political_shift', 'severity': 'medium'}
            ],
            'ID': [  # Indonesia
                {'year': 2004, 'date': '2004-12-26', 'event': 'Indian Ocean Tsunami', 'type': 'natural_disaster', 'severity': 'high'},
                {'year': 2014, 'date': '2014-10-20', 'event': 'Jokowi Presidency', 'type': 'political_shift', 'severity': 'medium'},
                {'year': 2019, 'date': '2019-05-22', 'event': 'Jakarta Election Riots', 'type': 'domestic_unrest', 'severity': 'medium'}
            ],
            'TH': [  # Thailand
                {'year': 2006, 'date': '2006-09-19', 'event': 'Military Coup', 'type': 'coup', 'severity': 'high'},
                {'year': 2014, 'date': '2014-05-22', 'event': 'Second Military Coup', 'type': 'coup', 'severity': 'high'},
                {'year': 2020, 'date': '2020-07-18', 'event': 'Pro-Democracy Protests', 'type': 'domestic_unrest', 'severity': 'medium'}
            ],
            'PL': [  # Poland
                {'year': 2005, 'date': '2005-10-23', 'event': 'Kaczyński Government', 'type': 'political_shift', 'severity': 'medium'},
                {'year': 2015, 'date': '2015-10-25', 'event': 'PiS Party Victory', 'type': 'political_shift', 'severity': 'medium'},
                {'year': 2020, 'date': '2020-06-28', 'event': 'Presidential Election Crisis', 'type': 'political_crisis', 'severity': 'medium'}
            ],
            'SE': [  # Sweden
                {'year': 2003, 'date': '2003-09-10', 'event': 'Anna Lindh Assassination', 'type': 'political_assassination', 'severity': 'high'},
                {'year': 2017, 'date': '2017-04-07', 'event': 'Stockholm Truck Attack', 'type': 'terrorism', 'severity': 'high'},
                {'year': 2022, 'date': '2022-05-18', 'event': 'NATO Application', 'type': 'diplomatic', 'severity': 'medium'}
            ]
        }
        
        # ISO country codes mapping - 30 countries
        self.country_names = {
            'US': 'United States',
            'IR': 'Iran', 
            'RU': 'Russia',
            'CN': 'China',
            'UA': 'Ukraine',
            'GB': 'United Kingdom',
            'FR': 'France',
            'DE': 'Germany',
            'JP': 'Japan',
            'IN': 'India',
            'BR': 'Brazil',
            'KR': 'South Korea',
            'IT': 'Italy',
            'ES': 'Spain',
            'TR': 'Turkey',
            'MX': 'Mexico',
            'AU': 'Australia',
            'CA': 'Canada',
            'EG': 'Egypt',
            'IL': 'Israel',
            'ZA': 'South Africa',
            'NG': 'Nigeria',
            'SA': 'Saudi Arabia',
            'AR': 'Argentina',
            'ID': 'Indonesia',
            'TH': 'Thailand',
            'PL': 'Poland',
            'SE': 'Sweden'
        }
        
        # Focus genres for analysis
        self.focus_genres = ['Drama', 'Documentary', 'Comedy', 'Action', 'Thriller']
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def load_country_movies(self, country_code):
        """Load movies for a specific country"""
        self.log(f"Loading movies for {self.country_names.get(country_code, country_code)}...")
        
        # Step 1: Find country movies from title.akas.tsv
        akas_path = os.path.join(self.data_dir, "title.akas.tsv")
        
        movie_ids = set()
        chunk_size = 100000
        processed = 0
        
        try:
            for chunk in pd.read_csv(
                akas_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            ):
                # Filter for target country
                country_chunk = chunk[chunk['region'] == country_code]
                
                if len(country_chunk) > 0:
                    movie_ids.update(country_chunk['titleId'].tolist())
                
                processed += chunk_size
                if processed % 1000000 == 0:
                    self.log(f"Processed {processed:,} records, found {len(movie_ids)} movies")
            
            self.log(f"Found {len(movie_ids)} movies for {country_code}")
            return list(movie_ids)
            
        except Exception as e:
            self.log(f"Error loading country movies: {e}")
            return []
    
    def load_movie_details(self, movie_ids):
        """Load basic movie details for given IDs"""
        self.log(f"Loading details for {len(movie_ids)} movies...")
        
        basics_path = os.path.join(self.data_dir, "title.basics.tsv")
        movie_id_set = set(movie_ids)
        
        chunks = []
        chunk_size = 50000
        
        try:
            for chunk in pd.read_csv(
                basics_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            ):
                # Filter for our movies and movie type
                chunk = chunk[
                    (chunk['tconst'].isin(movie_id_set)) &
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['genres'].notna())
                ]
                
                if len(chunk) > 0:
                    chunk['startYear'] = pd.to_numeric(chunk['startYear'], errors='coerce')
                    chunk = chunk[
                        (chunk['startYear'] >= 2000) & 
                        (chunk['startYear'] <= 2024)
                    ]
                    
                    if len(chunk) > 0:
                        chunks.append(chunk)
            
            if chunks:
                movies_df = pd.concat(chunks, ignore_index=True)
                self.log(f"Loaded {len(movies_df)} movies from 2000-2024")
                return movies_df
            else:
                self.log("No movies found in date range")
                return None
                
        except Exception as e:
            self.log(f"Error loading movie details: {e}")
            return None
    
    def process_genres(self, movies_df):
        """Expand genre information"""
        self.log("Processing genres...")
        
        genre_data = []
        
        for _, row in movies_df.iterrows():
            if pd.notna(row['genres']):
                genres = row['genres'].split(',')
                for genre in genres:
                    genre_clean = genre.strip()
                    if genre_clean in self.focus_genres:
                        genre_data.append({
                            'tconst': row['tconst'],
                            'year': int(row['startYear']),
                            'genre': genre_clean,
                            'title': row['primaryTitle']
                        })
        
        return pd.DataFrame(genre_data)
    
    def create_timeline_data(self, genre_df, country_code):
        """Create timeline data with political events annotations"""
        self.log("Creating timeline data...")
        
        # Get political events for this country
        political_events = self.political_events_db.get(country_code, [])
        
        # Create yearly genre counts with smoothing
        timeline_data = []
        
        for year in range(2000, 2025):
            year_data = genre_df[genre_df['year'] == year]
            
            # Count movies by genre
            genre_counts = {}
            raw_genre_counts = {}
            
            for genre in self.focus_genres:
                raw_count = len(year_data[year_data['genre'] == genre])
                raw_genre_counts[genre] = raw_count
                
                # Apply simple 3-year moving average smoothing
                if year >= 2002:
                    prev_years = [year-2, year-1, year]
                    total_count = 0
                    valid_years = 0
                    
                    for prev_year in prev_years:
                        prev_data = genre_df[
                            (genre_df['year'] == prev_year) & 
                            (genre_df['genre'] == genre)
                        ]
                        if len(prev_data) > 0 or prev_year == year:
                            total_count += len(prev_data)
                            valid_years += 1
                    
                    smoothed_count = total_count / max(valid_years, 1)
                    genre_counts[genre] = round(smoothed_count, 1)
                else:
                    genre_counts[genre] = raw_count
            
            # Check for political events
            year_events = [e for e in political_events if e['year'] == year]
            
            timeline_data.append({
                'year': year,
                'genre_counts': genre_counts,
                'raw_genre_counts': raw_genre_counts,
                'total_movies': len(year_data.drop_duplicates('tconst')),
                'events': year_events,
                'has_events': len(year_events) > 0
            })
        
        return timeline_data
    
    def calculate_impact_analysis(self, timeline_data):
        """Calculate impact metrics for political events"""
        self.log("Calculating political impact analysis...")
        
        impact_analysis = []
        
        for data_point in timeline_data:
            if data_point['has_events']:
                year = data_point['year']
                
                # Find before/after years (avoiding other event years)
                before_year = year - 1
                after_year = year + 1
                
                # Get baseline data
                before_data = next((d for d in timeline_data if d['year'] == before_year), None)
                after_data = next((d for d in timeline_data if d['year'] == after_year), None)
                
                if before_data and after_data:
                    for genre in self.focus_genres:
                        before_count = before_data['raw_genre_counts'][genre]
                        after_count = after_data['raw_genre_counts'][genre]
                        event_count = data_point['raw_genre_counts'][genre]
                        
                        # Calculate percentage changes
                        before_change = ((event_count - before_count) / before_count * 100) if before_count > 0 else 0
                        after_change = ((after_count - event_count) / event_count * 100) if event_count > 0 else 0
                        
                        for event in data_point['events']:
                            impact_analysis.append({
                                'year': year,
                                'event': event['event'],
                                'event_type': event['type'],
                                'severity': event['severity'],
                                'genre': genre,
                                'before_count': before_count,
                                'event_count': event_count,
                                'after_count': after_count,
                                'immediate_impact': round(before_change, 1),
                                'recovery_rate': round(after_change, 1),
                                'event_date': event['date']
                            })
        
        return impact_analysis
    
    def export_political_timeline_data(self, country_code, timeline_data, impact_analysis):
        """Export processed data for D3.js visualization"""
        
        country_name = self.country_names.get(country_code, country_code)
        filename = f"political_timeline_{country_code.lower()}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        self.log(f"Exporting timeline data for {country_name}...")
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        export_data = {
            'country': {
                'code': country_code,
                'name': country_name
            },
            'timeline_data': timeline_data,
            'impact_analysis': impact_analysis,
            'political_events': self.political_events_db.get(country_code, []),
            'genres': self.focus_genres,
            'metadata': {
                'total_events': len([d for d in timeline_data if d['has_events']]),
                'date_range': '2000-2024',
                'processed_at': datetime.now().isoformat(),
                'smoothing_applied': True,
                'smoothing_window': 3
            }
        }
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2)
            
            self.log(f"✅ Data exported to {filepath}")
            return True
            
        except Exception as e:
            self.log(f"❌ Export error: {e}")
            return False
    
    def process_country(self, country_code):
        """Complete processing pipeline for a specific country"""
        self.log(f"=== Processing {self.country_names.get(country_code, country_code)} ===")
        
        # Step 1: Load country movies
        movie_ids = self.load_country_movies(country_code)
        if not movie_ids:
            self.log("No movies found for this country")
            return False
        
        # Step 2: Load movie details
        movies_df = self.load_movie_details(movie_ids)
        if movies_df is None or len(movies_df) == 0:
            self.log("No movie details found")
            return False
        
        # Step 3: Process genres
        genre_df = self.process_genres(movies_df)
        if len(genre_df) == 0:
            self.log("No genre data found")
            return False
        
        # Step 4: Create timeline data
        timeline_data = self.create_timeline_data(genre_df, country_code)
        
        # Step 5: Calculate impact analysis
        impact_analysis = self.calculate_impact_analysis(timeline_data)
        
        # Step 6: Export data
        success = self.export_political_timeline_data(country_code, timeline_data, impact_analysis)
        
        if success:
            total_movies = sum(d['total_movies'] for d in timeline_data)
            total_events = len([d for d in timeline_data if d['has_events']])
            
            self.log(f"✅ Processing complete!")
            self.log(f"📊 {total_movies} movies analyzed")
            self.log(f"⚡ {total_events} political events identified")
            self.log(f"🎭 {len(impact_analysis)} impact measurements calculated")
            
        return success

if __name__ == "__main__":
    processor = UniversalPoliticalEventsProcessor()
    
    print("🌍 Universal Political Events Timeline Processor")
    print("=" * 60)
    
    # Available countries
    available_countries = list(processor.country_names.keys())
    print(f"Available countries: {', '.join(available_countries)}")
    print()
    
    # Process a specific country (you can change this)
    target_country = input("Enter country code (e.g., 'US', 'IR', 'RU'): ").upper()
    
    if target_country in available_countries:
        success = processor.process_country(target_country)
        
        if success:
            print(f"\n🎉 Timeline data for {processor.country_names[target_country]} is ready!")
            print(f"📄 File: political_timeline_{target_country.lower()}.json")
            print("🎬 Ready for D3.js visualization!")
        else:
            print(f"\n❌ Failed to process {processor.country_names[target_country]}")
    else:
        print(f"❌ Country '{target_country}' not available")
        print(f"Available: {', '.join(available_countries)}")