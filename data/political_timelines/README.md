# Political Timeline Data Directory

This directory contains the processed political timeline JSON files for the visualization project.

## Structure

- **Directory**: `data/political_timelines/`
- **Files**: `political_timeline_{country_code}.json`
- **Purpose**: Organized storage for country-specific political events and cinema data

## File Format

Each JSON file contains:
- Country metadata (code, name)
- Timeline data (2000-2024) with yearly genre counts
- Political events with severity and type
- Impact analysis showing before/after event changes
- Smoothed and raw data for visualization

## Generated Countries (30 total)

- **Major Powers**: US, CN, RU, IN, JP
- **Europe**: GB, FR, DE, IT, ES, UA, TR, PL, SE
- **Middle East & Africa**: IR, IL, SA, ZA, NG, EG
- **Americas**: CA, BR, MX, AR
- **Asia-Pacific**: KR, AU, ID, TH

## File Generation

Files are automatically created/updated by running:
```bash
python run_political_timeline.py
```

The processor will:
1. Read IMDb data from `data/` directory
2. Process political events and cinema data
3. Export organized JSON files to this directory
4. Ensure proper directory structure exists

## Web Access

The visualization reads files from this directory via:
```javascript
fetch('data/political_timelines/political_timeline_{country}.json')
```

This keeps all political timeline data organized and separate from the main IMDb datasets.