import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
from collections import defaultdict, Counter
import warnings
import math

warnings.filterwarnings('ignore')

class CollaborationNetworkProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.major_regions = [
            'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 'IN', 
            'KR', 'CN', 'RU', 'BR', 'MX', 'AR', 'TR', 'IR', 'EG', 'NG',
            'ZA', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT', 'PT',
            'GR', 'HU', 'CZ', 'PL', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE',
            'LV', 'LT', 'IE', 'IS', 'LU', 'MT', 'CY'
        ]
        
        # Key role categories for collaboration analysis
        self.collaboration_roles = {
            'directors': ['director'],
            'actors': ['actor', 'actress'],
            'writers': ['writer'],
            'producers': ['producer'],
            'all': ['director', 'actor', 'actress', 'writer', 'producer', 'cinematographer', 'composer', 'editor']
        }
        
        # Country name mapping
        self.country_names = {
            'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France',
            'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain', 'CA': 'Canada',
            'AU': 'Australia', 'JP': 'Japan', 'IN': 'India', 'KR': 'South Korea',
            'CN': 'China', 'RU': 'Russia', 'BR': 'Brazil', 'MX': 'Mexico',
            'AR': 'Argentina', 'TR': 'Turkey', 'IR': 'Iran', 'EG': 'Egypt',
            'NG': 'Nigeria', 'ZA': 'South Africa', 'SE': 'Sweden', 'NO': 'Norway',
            'DK': 'Denmark', 'FI': 'Finland', 'NL': 'Netherlands', 'BE': 'Belgium',
            'CH': 'Switzerland', 'AT': 'Austria', 'PT': 'Portugal', 'GR': 'Greece',
            'HU': 'Hungary', 'CZ': 'Czech Republic', 'PL': 'Poland', 'RO': 'Romania',
            'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia', 'SK': 'Slovakia',
            'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania', 'IE': 'Ireland',
            'IS': 'Iceland', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus'
        }

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def load_movie_sample(self, sample_size=30000):
        """Load a sample of popular movies from 2000-2024"""
        self.log("Loading movie sample for collaboration analysis...")
        
        try:
            basics_path = os.path.join(self.data_dir, "title.basics.tsv")
            ratings_path = os.path.join(self.data_dir, "title.ratings.tsv")
            
            # Load ratings first to filter for popular movies
            self.log("Loading ratings data...")
            ratings_df = pd.read_csv(
                ratings_path,
                sep='\t',
                low_memory=False,
                na_values=['\\N']
            )
            
            # Filter for movies with decent vote count
            ratings_df = ratings_df[ratings_df['numVotes'] >= 50]
            popular_movie_ids = set(ratings_df['tconst'].tolist())
            
            self.log(f"Found {len(popular_movie_ids):,} movies with 50+ votes")
            
            # Load basics data in chunks
            movie_chunks = []
            chunk_size = 50000
            movies_found = 0
            
            for i, chunk in enumerate(pd.read_csv(
                basics_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            )):
                # Filter for movies in our criteria
                chunk = chunk[
                    (chunk['titleType'] == 'movie') &
                    (chunk['startYear'].notna()) &
                    (chunk['startYear'] != '\\N') &
                    (chunk['tconst'].isin(popular_movie_ids))
                ]
                
                if len(chunk) > 0:
                    chunk['startYear'] = pd.to_numeric(chunk['startYear'], errors='coerce')
                    chunk = chunk[
                        (chunk['startYear'] >= 2000) & 
                        (chunk['startYear'] <= 2024)
                    ]
                    
                    if len(chunk) > 0:
                        movie_chunks.append(chunk)
                        movies_found += len(chunk)
                
                if movies_found >= sample_size:
                    break
                    
                if (i + 1) % 20 == 0:
                    self.log(f"Processed {(i+1)*chunk_size:,} records, found {movies_found:,} movies so far...")
            
            if movie_chunks:
                movies_df = pd.concat(movie_chunks, ignore_index=True)
                # Merge with ratings and sort by popularity
                movies_df = movies_df.merge(ratings_df[['tconst', 'numVotes', 'averageRating']], on='tconst')
                movies_df = movies_df.nlargest(sample_size, 'numVotes')
                
                self.log(f"Selected {len(movies_df):,} popular movies for analysis")
                return movies_df
            else:
                self.log("No movies found matching criteria")
                return None
                
        except Exception as e:
            self.log(f"Error loading movie sample: {e}")
            return None

    def load_movie_countries(self, movie_ids):
        """Map movies to their origin countries using title.akas.tsv"""
        self.log(f"Loading country data for {len(movie_ids):,} movies...")
        
        try:
            akas_path = os.path.join(self.data_dir, "title.akas.tsv")
            movie_id_set = set(movie_ids)
            
            country_data = {}
            chunk_size = 100000
            processed = 0
            
            for chunk in pd.read_csv(
                akas_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            ):
                # Filter for our movies and major regions
                chunk = chunk[
                    (chunk['titleId'].isin(movie_id_set)) &
                    (chunk['region'].notna()) &
                    (chunk['region'] != '\\N') &
                    (chunk['region'].isin(self.major_regions))
                ]
                
                for _, row in chunk.iterrows():
                    movie_id = row['titleId']
                    region = row['region']
                    
                    # Prioritize original titles
                    if pd.notna(row.get('types')) and 'original' in str(row['types']):
                        country_data[movie_id] = region
                    elif movie_id not in country_data:
                        country_data[movie_id] = region
                
                processed += chunk_size
                if processed % 1000000 == 0:
                    self.log(f"Processed {processed:,} akas records, found {len(country_data):,} country mappings")
            
            self.log(f"Mapped {len(country_data):,} movies to countries")
            return country_data
            
        except Exception as e:
            self.log(f"Error loading movie countries: {e}")
            return {}

    def load_movie_principals(self, movie_ids):
        """Load cast and crew data for specific movies"""
        self.log(f"Loading principals data for {len(movie_ids):,} movies...")
        
        try:
            principals_path = os.path.join(self.data_dir, "title.principals.tsv")
            movie_id_set = set(movie_ids)
            
            principal_chunks = []
            chunk_size = 100000
            processed = 0
            found = 0
            
            # Get all role categories we care about
            all_roles = []
            for role_list in self.collaboration_roles.values():
                all_roles.extend(role_list)
            all_roles = list(set(all_roles))  # Remove duplicates
            
            for chunk in pd.read_csv(
                principals_path,
                sep='\t',
                chunksize=chunk_size,
                low_memory=False,
                na_values=['\\N']
            ):
                # Filter for our movies and key roles
                chunk = chunk[
                    (chunk['tconst'].isin(movie_id_set)) &
                    (chunk['category'].isin(all_roles))
                ]
                
                if len(chunk) > 0:
                    principal_chunks.append(chunk)
                    found += len(chunk)
                
                processed += chunk_size
                if processed % 1000000 == 0:
                    self.log(f"Processed {processed:,} principal records, found {found:,} matches")
            
            if principal_chunks:
                principals_df = pd.concat(principal_chunks, ignore_index=True)
                self.log(f"Loaded {len(principals_df):,} principal records")
                return principals_df
            else:
                self.log("No principal data found")
                return None
                
        except Exception as e:
            self.log(f"Error loading principals: {e}")
            return None

    def infer_person_countries(self, principals_df, movie_countries):
        """Infer countries for people based on their most common movie countries"""
        self.log("Inferring person countries from their filmography...")
        
        person_countries = {}
        person_movie_countries = defaultdict(list)
        
        # Collect country data for each person
        for _, row in principals_df.iterrows():
            person_id = row['nconst']
            movie_id = row['tconst']
            
            if movie_id in movie_countries:
                person_movie_countries[person_id].append(movie_countries[movie_id])
        
        # Assign most common country to each person
        for person_id, countries in person_movie_countries.items():
            if countries:
                # Count occurrences and pick most common
                country_counts = Counter(countries)
                most_common_country = country_counts.most_common(1)[0][0]
                person_countries[person_id] = most_common_country
        
        self.log(f"Assigned countries to {len(person_countries):,} people")
        return person_countries

    def calculate_collaborations(self, principals_df, movie_countries, person_countries, role_filter='all'):
        """Calculate collaboration networks between countries"""
        self.log(f"Calculating {role_filter} collaborations...")
        
        # Filter by role type
        if role_filter != 'all':
            role_categories = self.collaboration_roles[role_filter]
            filtered_principals = principals_df[principals_df['category'].isin(role_categories)]
        else:
            filtered_principals = principals_df
        
        # Country collaboration matrix
        collaborations = defaultdict(lambda: defaultdict(int))
        movie_collab_counts = defaultdict(int)
        total_collaborations = 0
        
        # Group by movie to find international collaborations
        for movie_id, group in filtered_principals.groupby('tconst'):
            movie_country = movie_countries.get(movie_id)
            if not movie_country:
                continue
            
            # Get all people in this movie and their inferred countries
            crew_countries = []
            for _, person in group.iterrows():
                person_country = person_countries.get(person['nconst'])
                if person_country:
                    crew_countries.append(person_country)
            
            # Find unique countries in this movie
            unique_countries = set(crew_countries + [movie_country])
            
            if len(unique_countries) > 1:  # International collaboration
                movie_collab_counts[movie_country] += 1
                
                # Record all pairwise collaborations
                countries_list = list(unique_countries)
                for i, country1 in enumerate(countries_list):
                    for country2 in countries_list[i+1:]:
                        collaborations[country1][country2] += 1
                        collaborations[country2][country1] += 1
                        total_collaborations += 1
        
        self.log(f"Found {total_collaborations:,} total collaborations across {len(collaborations)} countries")
        return dict(collaborations), dict(movie_collab_counts)

    def create_network_data(self, collaborations, min_collaborations=5):
        """Create network graph data for D3.js visualization"""
        self.log("Creating network data...")
        
        # Create nodes
        nodes = []
        country_stats = {}
        
        for country in collaborations:
            total_collabs = sum(collaborations[country].values())
            country_stats[country] = total_collabs
            
            if total_collabs >= min_collaborations:
                nodes.append({
                    'id': country,
                    'country': country,
                    'countryName': self.country_names.get(country, country),
                    'totalCollaborations': total_collabs,
                    'community': self.assign_community(country),
                    'region': self.get_region(country),
                    'partnerCount': len([c for c, count in collaborations[country].items() if count >= min_collaborations])
                })
        
        # Create links
        links = []
        processed_pairs = set()
        
        for source_country in collaborations:
            for target_country, weight in collaborations[source_country].items():
                pair = tuple(sorted([source_country, target_country]))
                
                if (pair not in processed_pairs and 
                    weight >= min_collaborations and
                    source_country != target_country and
                    source_country in country_stats and
                    target_country in country_stats and
                    country_stats[source_country] >= min_collaborations and
                    country_stats[target_country] >= min_collaborations):
                    
                    links.append({
                        'source': source_country,
                        'target': target_country,
                        'weight': weight,
                        'type': 'collaboration',
                        'strength': min(weight / 20, 1.0)  # Normalized strength for visualization
                    })
                    processed_pairs.add(pair)
        
        self.log(f"Created network: {len(nodes)} nodes, {len(links)} links")
        
        return {
            'nodes': nodes,
            'links': links,
            'communities': self.get_community_info(),
            'metadata': {
                'totalCountries': len(nodes),
                'totalCollaborations': len(links),
                'minCollaborations': min_collaborations,
                'processedAt': datetime.now().isoformat(),
                'networkDensity': len(links) / (len(nodes) * (len(nodes) - 1) / 2) if len(nodes) > 1 else 0
            }
        }

    def assign_community(self, country):
        """Assign community clusters based on geographic/cultural proximity"""
        communities = {
            'north_america': ['US', 'CA', 'MX'],
            'western_europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PT'],
            'northern_europe': ['SE', 'NO', 'DK', 'FI', 'IE', 'IS'],
            'eastern_europe': ['RU', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT'],
            'asia_pacific': ['JP', 'KR', 'CN', 'IN', 'AU'],
            'latin_america': ['BR', 'AR'],
            'middle_east_africa': ['TR', 'IR', 'EG', 'NG', 'ZA'],
            'other': []
        }
        
        for community, countries in communities.items():
            if country in countries:
                return community
        return 'other'

    def get_region(self, country):
        """Get broader region for country"""
        regions = {
            'Americas': ['US', 'CA', 'MX', 'BR', 'AR'],
            'Europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT', 'PT', 'RU', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'IE', 'IS'],
            'Asia': ['JP', 'KR', 'CN', 'IN'],
            'Oceania': ['AU'],
            'Africa': ['EG', 'NG', 'ZA'],
            'Middle East': ['TR', 'IR']
        }
        
        for region, countries in regions.items():
            if country in countries:
                return region
        return 'Other'

    def get_community_info(self):
        """Get community color and information mapping"""
        return {
            'north_america': {'color': '#2E86AB', 'name': 'North America'},
            'western_europe': {'color': '#A23B72', 'name': 'Western Europe'},
            'northern_europe': {'color': '#F18F01', 'name': 'Northern Europe'},
            'eastern_europe': {'color': '#C73E1D', 'name': 'Eastern Europe'},
            'asia_pacific': {'color': '#7209B7', 'name': 'Asia Pacific'},
            'latin_america': {'color': '#F72585', 'name': 'Latin America'},
            'middle_east_africa': {'color': '#4361EE', 'name': 'Middle East & Africa'},
            'other': {'color': '#6C757D', 'name': 'Other'}
        }

    def create_comprehensive_dataset(self, all_networks, min_collaborations):
        """Create comprehensive dataset with all collaboration types"""
        self.log("📊 Creating comprehensive dataset...")
        
        # Get all unique countries across all networks
        all_countries = set()
        for network_data in all_networks.values():
            for node in network_data['nodes']:
                all_countries.add(node['id'])
        
        # Create master country list with basic info
        master_countries = []
        for country in sorted(all_countries):
            country_info = {
                'id': country,
                'country': country,
                'countryName': self.country_names.get(country, country),
                'community': self.assign_community(country),
                'region': self.get_region(country)
            }
            master_countries.append(country_info)
        
        # Build comprehensive dataset
        comprehensive_data = {
            'countries': master_countries,
            'networks': all_networks,
            'communities': self.get_community_info(),
            'roleTypes': {
                'all': {'name': 'All Roles', 'description': 'Directors, actors, writers, producers, and crew'},
                'directors': {'name': 'Directors Only', 'description': 'Creative partnerships between directors'},
                'actors': {'name': 'Actors Only', 'description': 'Performance collaborations between actors'},
                'writers': {'name': 'Writers Only', 'description': 'Creative collaborations between writers'},
                'producers': {'name': 'Producers Only', 'description': 'Business partnerships between producers'}
            },
            'metadata': {
                'totalUniqueCountries': len(all_countries),
                'availableNetworks': list(all_networks.keys()),
                'minCollaborations': min_collaborations,
                'processedAt': datetime.now().isoformat(),
                'generatedNetworks': len(all_networks)
            }
        }
        
        return comprehensive_data

    def export_network_data(self, network_data, filename='collaboration_network_data.json'):
        """Export network data for D3.js visualization"""
        try:
            output_path = os.path.join('.', filename)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(network_data, f, indent=2, ensure_ascii=False)
            
            self.log(f"✅ Network data exported to {filename}")
            self.log(f"📊 Comprehensive network summary:")
            self.log(f"   - {len(network_data['countries'])} unique countries")
            self.log(f"   - {len(network_data['networks'])} network types")
            
            # Show details for each network
            for network_type, network in network_data['networks'].items():
                role_name = network_data['roleTypes'][network_type]['name']
                self.log(f"   - {role_name}: {len(network['nodes'])} countries, {len(network['links'])} links")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Export error: {e}")
            return False

    def process_collaboration_network(self, sample_size=25000, min_collaborations=5):
        """Main processing pipeline - processes ALL collaboration types"""
        self.log("=== Starting Global Collaboration Network Processing ===")
        self.log("🔄 Processing data for ALL collaboration types...")
        
        # Step 1: Load movie sample
        movies_df = self.load_movie_sample(sample_size)
        if movies_df is None:
            return False
        
        movie_ids = movies_df['tconst'].tolist()
        
        # Step 2: Map movies to countries
        movie_countries = self.load_movie_countries(movie_ids)
        if not movie_countries:
            self.log("❌ No movie-country mappings found")
            return False
        
        # Step 3: Load cast/crew data
        principals_df = self.load_movie_principals(movie_ids)
        if principals_df is None:
            return False
        
        # Step 4: Infer person countries from their filmography
        person_countries = self.infer_person_countries(principals_df, movie_countries)
        if not person_countries:
            self.log("❌ No person-country mappings found")
            return False
        
        # Step 5: Calculate collaborations for ALL role filters
        all_networks = {}
        
        for role_filter in self.collaboration_roles.keys():
            self.log(f"🎭 Processing {role_filter} collaborations...")
            
            collaborations, movie_stats = self.calculate_collaborations(
                principals_df, movie_countries, person_countries, role_filter
            )
            
            if collaborations:
                network_data = self.create_network_data(collaborations, min_collaborations)
                all_networks[role_filter] = network_data
                
                self.log(f"   ✅ {role_filter}: {len(network_data['nodes'])} countries, {len(network_data['links'])} links")
            else:
                self.log(f"   ⚠️ No collaborations found for {role_filter}")
        
        if not all_networks:
            self.log("❌ No collaborations found for any role type")
            return False
        
        # Step 6: Create comprehensive dataset
        comprehensive_data = self.create_comprehensive_dataset(all_networks, min_collaborations)
        
        # Step 7: Export data
        success = self.export_network_data(comprehensive_data, 'collaboration_network_data.json')
        
        if success:
            self.log("=== 🎉 Processing Complete! ===")
            self.log(f"📊 Generated {len(all_networks)} collaboration network types")
            return True
        else:
            self.log("=== ❌ Processing Failed ===")
            return False

if __name__ == "__main__":
    processor = CollaborationNetworkProcessor()
    processor.process_collaboration_network(
        sample_size=25000,
        min_collaborations=5
    )