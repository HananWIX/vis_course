# 🎬 IMDb Visualization - Crisis Impact on Cinema Analysis

## Overview

Advanced visualization project analyzing the impact of global crises on the film industry using IMDb data from 2000 to 2024.

## Features

### 📊 Interactive Visualizations
- **Time Trends Chart** - Movie count trends over time
- **Crisis Comparison Chart** - Genre comparison before and after crises
- **Genre Distribution Chart** - Pie chart analysis
- **Cinema DNA** - Dynamic analysis
- **Crisis Impact Analysis** - Psychological analysis
- **Heat Map** - Genres vs years

### 🌍 Global Cinema Map
- **Interactive Chart** - Sortable cinema diversity analysis
- **Quality Gap Dashboard** - Movie quantity vs quality analysis
- **National Quality Gap** - Inequality vs cinema quality
- **Global Collaboration Network** - International cinema partnerships
- **Political Events Timeline** - How politics affects cinema

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Visualization**: D3.js v7
- **Backend**: Python 3.8+
- **Data Processing**: Pandas, NumPy
- **Data Source**: IMDb Official Datasets

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vis_course
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run data preprocessing:
```bash
python run_preprocessing.py
```

4. Start the application:
```bash
python -m http.server 8000
```

5. Open your browser and navigate to:
```
http://localhost:8000
```

## Data Processing

### Preprocessing Pipeline

1. **Data Loading**: Load IMDb datasets (title.basics.tsv, title.ratings.tsv, etc.)
2. **Data Cleaning**: Remove duplicates, handle missing values
3. **Feature Engineering**: Extract genres, calculate metrics
4. **Crisis Mapping**: Map crisis events to specific years
5. **Visualization Data**: Generate chart-specific datasets

### Data Sources

- **Primary**: IMDb Official Datasets
- **Secondary**: World Bank, Freedom House, Democracy Index
- **Period**: 2000-2024
- **Coverage**: 195+ countries, 400,000+ movies

## Project Structure

```
vis_course/
├── index.html                 # Main homepage
├── crisis-research.html       # Crisis analysis page
├── global-cinema-map.html     # Global cinema map
├── data/                      # Data files
│   ├── political_timelines/   # Political events data
│   └── quality_gap_dashboard/ # Quality gap data
├── *.js                       # JavaScript visualization files
├── *.py                       # Python processing scripts
└── styles.css                 # Styling
```

## Usage

### Crisis Research Page

1. **Time Trends**: Analyze movie production trends over time
2. **Crisis Comparison**: Compare genres before and after specific crises
3. **Genre Distribution**: View genre breakdown in crisis years
4. **Cinema DNA**: Explore dynamic genre composition changes
5. **Crisis Impact**: Psychological analysis of viewing patterns
6. **Heat Map**: Visualize genre popularity across years

### Global Cinema Map

1. **Interactive Chart**: Sort countries by various metrics
2. **Quality Gap Dashboard**: Analyze quantity vs quality relationships
3. **National Quality Gap**: Study inequality's impact on cinema
4. **Collaboration Network**: Explore international partnerships
5. **Political Timeline**: Examine political events' effects

## Research Insights

### Crisis Impact Patterns

- **Documentary Decline**: Documentary production drops during political crackdowns
- **Drama Sensitivity**: Drama and social commentary show immediate impact
- **Comedy Coping**: Comedy production increases as coping mechanism
- **Recovery Patterns**: Recovery varies by country and regime type
- **Anticipatory Changes**: Some countries show changes before major events

### Quality vs Quantity Trade-offs

- **🇺🇸 Hollywood Effect**: High quantity, mixed quality spectrum
- **🇫🇷 Art House Pattern**: Lower quantity, higher average quality
- **🇮🇳 Bollywood Scale**: Massive production, wide quality range
- **🇰🇷 K-cinema Rise**: Moderate quantity, improving quality trends

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- IMDb for providing comprehensive film data
- D3.js community for excellent visualization tools
- Academic institutions for research methodology

## Contact

For questions or contributions, please open an issue or contact the development team.

---

*"Understanding global cinema through the lens of democracy, economy, and human creativity"* 