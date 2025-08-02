# 📈 Political Events Timeline Visualization

**A sophisticated D3.js visualization analyzing how political events affect national cinema production patterns**

## 🎯 Overview

The Political Events Timeline is an interactive multi-line time series visualization that reveals the relationship between political upheavals and cinema production across different genres. This tool is designed for academic research in cinema studies, political science, and cultural analysis.

### Research Question
**"How do dramatic political changes affect the cinema production of countries?"**

## 🌟 Key Features

### 📊 **Multi-Genre Analysis**
- Tracks 5 key genres: Drama, Documentary, Comedy, Action, Thriller
- Shows both raw and smoothed data (3-year moving average)
- Color-coded lines for easy genre identification

### ⚡ **Political Event Annotations**
- Vertical markers indicate major political events
- Color-coded by event type (terrorism, war, economic crisis, etc.)
- Interactive tooltips with event details

### 🌍 **Multi-Country Support**
- Pre-configured for 9 major countries with rich political histories
- Comprehensive political events database (2000-2024)
- Easy to add new countries and events

### 🖱️ **Interactive Features**
- Hover tooltips with detailed statistics
- Data smoothing toggle
- Year highlighting on mouse movement
- Responsive design

## 📁 File Structure

```
political-events-timeline/
├── political_events_processor.py    # Data processor (Python)
├── political_events_timeline.js     # D3.js visualization
├── run_political_timeline.py        # Easy-to-use runner script
├── political_timeline_us.json       # Sample data (US)
├── global-cinema-map.html          # Integration in main app
└── POLITICAL_TIMELINE_README.md    # This documentation
```

## 🚀 Quick Start

### Step 1: Data Processing

1. **Download IMDb datasets:**
   ```bash
   # Download these files to data/ directory:
   # https://datasets.imdbws.com/title.basics.tsv.gz
   # https://datasets.imdbws.com/title.akas.tsv.gz
   ```

2. **Run the processor:**
   ```bash
   python run_political_timeline.py
   ```

3. **Select processing mode:**
   - **Interactive Mode**: Process one country at a time
   - **Batch Mode**: Process priority countries automatically

### Step 2: Visualization

1. Open `global-cinema-map.html` in your browser
2. Navigate to the "📈 Political Events Timeline" tab
3. Select a country from the dropdown
4. Explore the visualization!

## 🎨 Visualization Guide

### Understanding the Chart

- **X-Axis**: Years (2000-2024)
- **Y-Axis**: Number of movies produced
- **Colored Lines**: Different genres
- **Vertical Dashed Lines**: Political events
- **Circles at Top**: Event markers (hover for details)

### Event Type Color Coding

| Event Type | Color | Example |
|------------|-------|---------|
| 🏴 Terrorism | Red | 9/11 Attacks |
| ⚔️ War | Dark Red | Iraq War |
| 💰 Economic Crisis | Orange | 2008 Financial Crisis |
| 🗳️ Political Shift | Blue | Elections |
| 🏠 Domestic Unrest | Orange-Red | Capitol Insurrection |
| 🏥 Health Crisis | Teal | COVID-19 |
| 🤝 Diplomatic | Purple | Nuclear Deals |

### Expected Insights

- 📉 **Documentary production** often drops during political crackdowns
- 🎭 **Drama films** show immediate impact from social upheaval  
- 😂 **Comedy production** may increase as a coping mechanism
- ⏱️ **Recovery patterns** vary by country and regime type
- 🔄 Some countries show **anticipatory changes** before major events

## 🛠️ Technical Implementation

### Data Processing Pipeline

1. **Country Movie Extraction**: Uses `title.akas.tsv` to identify movies by region
2. **Movie Details Loading**: Fetches metadata from `title.basics.tsv`
3. **Genre Processing**: Expands multi-genre entries into individual records
4. **Timeline Creation**: Generates yearly counts with smoothing options
5. **Impact Analysis**: Calculates before/after statistics for events
6. **JSON Export**: Creates D3-ready data files

### D3.js Visualization Architecture

```javascript
class PoliticalEventsTimeline {
    // Core components:
    - Multi-line chart with scales and axes
    - Political event annotations
    - Interactive tooltips and controls
    - Legend and metadata display
}
```

### Key Technologies

- **Backend**: Python 3.7+, Pandas, NumPy
- **Frontend**: D3.js v7, HTML5, CSS3
- **Data**: IMDb Official Datasets (7GB+)

## 📊 Available Countries

| Code | Country | Major Events Covered |
|------|---------|---------------------|
| 🇺🇸 US | United States | 9/11, Iraq War, Financial Crisis, COVID-19 |
| 🇮🇷 IR | Iran | Green Movement, Nuclear Deal, Protests |
| 🇷🇺 RU | Russia | Georgia War, Crimea, Ukraine Invasion |
| 🇨🇳 CN | China | Earthquake, Hong Kong Protests, COVID-19 |
| 🇺🇦 UA | Ukraine | Orange Revolution, Euromaidan, War |
| 🇬🇧 GB | United Kingdom | 7/7 Bombings, Brexit |
| 🇫🇷 FR | France | Charlie Hebdo, Paris Attacks, Yellow Vests |
| 🇩🇪 DE | Germany | Refugee Crisis, Berlin Attack |
| 🇯🇵 JP | Japan | Tohoku Earthquake, Fukushima |

## 🔧 Advanced Configuration

### Adding New Countries

1. **Update the processor:**
   ```python
   # In political_events_processor.py
   self.political_events_db['NEW_CODE'] = [
       {'year': 2020, 'date': '2020-01-01', 'event': 'Major Event', 
        'type': 'event_type', 'severity': 'high'}
   ]
   ```

2. **Add country name:**
   ```python
   self.country_names['NEW_CODE'] = 'Country Name'
   ```

3. **Process the new country:**
   ```bash
   python run_political_timeline.py
   # Select the new country code
   ```

### Customizing Event Types

Event types can be customized in both the processor and visualization:

```python
# Processor: Add new event types
{'year': 2023, 'event': 'New Event', 'type': 'custom_type', 'severity': 'medium'}
```

```javascript
// Visualization: Add corresponding colors
this.eventTypeColors = {
    'custom_type': '#custom_color',
    // ... existing types
};
```

## 📈 Research Applications

### Academic Use Cases

1. **Cinema Studies**: Analyze how political events influence artistic expression
2. **Political Science**: Study government impact on cultural production
3. **Cultural Analysis**: Examine national responses to crisis through art
4. **Media Studies**: Investigate genre preferences during political periods

### Potential Research Questions

- Do authoritarian crackdowns consistently reduce documentary production?
- How quickly does cinema production recover after major political events?  
- Are there genre-specific patterns in political responses?
- Do democratic vs. authoritarian countries show different cinema patterns?

## 🤝 Contributing

### Data Quality Improvements

- Add more countries and political events
- Improve event categorization and severity ratings
- Enhance data validation and error handling

### Visualization Enhancements

- Add more interaction modes (zoom, pan, brush selection)
- Implement additional chart types (heatmaps, correlation matrices)
- Add export functionality for academic papers

### Technical Improvements

- Optimize processing for larger datasets
- Add real-time data updates
- Implement caching for better performance

## 📚 Academic Citations

When using this tool in academic work, please cite:

```
Political Events Timeline Visualization (2024)
Cinema Studies & Data Science Research Project
Data Source: IMDb Non-Commercial Datasets
https://datasets.imdbws.com/
```

## ⚠️ Limitations & Considerations

### Data Limitations
- Based on IMDb data, which may have regional biases
- Political events database is manually curated
- Movie production data may not capture all national cinema

### Interpretation Cautions
- Correlation does not imply causation
- Multiple factors affect cinema production beyond politics
- Regional and cultural contexts require careful consideration

## 🔮 Future Development

### Planned Features
- Real-time political events integration
- Machine learning for event impact prediction
- Cross-country comparative analysis tools
- Integration with economic and social indicators

### Research Opportunities
- Expand to TV series and streaming content
- Include box office and audience reception data
- Add sentiment analysis of movie themes
- Develop predictive models for cinema responses

---

**Built for academic research and cultural analysis**  
*Understanding how politics shapes the stories we tell*

📧 Questions? Issues? Contributions welcome!