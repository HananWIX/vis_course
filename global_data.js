// Global Cinema Data for D3.js visualizations
// Generated from global_data_processor.py

let GLOBAL_DATA = null;

// Load the processed data
async function loadGlobalData() {
    try {
        console.log('🔄 Fetching global cinema data...');
        console.log('🌐 Current URL:', window.location.href);
        console.log('📁 Requesting: global_cinema_data.json');
        
        const response = await fetch('global_cinema_data.json');
        
        console.log('📡 Response details:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url,
            headers: {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        console.log('📥 Parsing JSON data...');
        const rawText = await response.text();
        console.log('📝 Raw response length:', rawText.length);
        console.log('📝 Raw response preview:', rawText.substring(0, 200) + '...');
        
        GLOBAL_DATA = JSON.parse(rawText);
        
        if (!GLOBAL_DATA) {
            throw new Error('Parsed data is null or undefined');
        }
        
        if (!GLOBAL_DATA.democratic_diversity_data) {
            console.error('❌ Data structure:', Object.keys(GLOBAL_DATA));
            throw new Error('Invalid data structure: missing democratic_diversity_data');
        }
        
        console.log('✅ Global cinema data loaded successfully');
        console.log(`📊 Countries: ${GLOBAL_DATA.metadata.total_countries}`);
        console.log(`🎬 Movies: ${GLOBAL_DATA.metadata.total_movies.toLocaleString()}`);
        console.log(`📈 Avg Diversity: ${GLOBAL_DATA.metadata.avg_diversity_index}`);
        console.log('🏷️ First country sample:', GLOBAL_DATA.democratic_diversity_data[0]);
        
        // Set global reference
        window.GLOBAL_DATA = GLOBAL_DATA;
        
        return GLOBAL_DATA;
    } catch (error) {
        console.error('❌ Error loading global data:', error);
        console.error('🔍 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        console.error('🔍 Make sure the HTTP server is running and global_cinema_data.json exists');
        throw error;
    }
}

// Country name mapping for better display
const COUNTRY_NAMES = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'IN': 'India',
    'KR': 'South Korea',
    'CN': 'China',
    'RU': 'Russia',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'TR': 'Turkey',
    'IR': 'Iran',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'ZA': 'South Africa',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'PT': 'Portugal',
    'GR': 'Greece',
    'HU': 'Hungary',
    'CZ': 'Czech Republic',
    'PL': 'Poland',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'EE': 'Estonia',
    'LV': 'Latvia',
    'LT': 'Lithuania',
    'IE': 'Ireland',
    'IS': 'Iceland',
    'LU': 'Luxembourg',
    'MT': 'Malta',
    'CY': 'Cyprus'
};

// Democracy Index data (2023) - simplified for demonstration
const DEMOCRACY_INDEX = {
    'US': 7.85,
    'GB': 8.28,
    'FR': 7.99,
    'DE': 8.67,
    'IT': 7.71,
    'ES': 8.07,
    'CA': 9.24,
    'AU': 8.71,
    'JP': 8.15,
    'IN': 6.61,
    'KR': 8.09,
    'CN': 2.12,
    'RU': 2.28,
    'BR': 6.86,
    'MX': 6.09,
    'AR': 6.95,
    'TR': 4.35,
    'IR': 2.20,
    'EG': 3.06,
    'NG': 4.10,
    'ZA': 7.05,
    'SE': 9.26,
    'NO': 9.81,
    'DK': 9.64,
    'FI': 9.30,
    'NL': 8.88,
    'BE': 7.64,
    'CH': 9.14,
    'AT': 8.29,
    'PT': 8.16,
    'GR': 7.39,
    'HU': 6.56,
    'CZ': 7.97,
    'PL': 6.60,
    'RO': 6.38,
    'BG': 6.64,
    'HR': 6.50,
    'SI': 7.54,
    'SK': 7.17,
    'EE': 7.96,
    'LV': 7.31,
    'LT': 7.31,
    'IE': 9.00,
    'IS': 9.58,
    'LU': 8.68,
    'MT': 8.21,
    'CY': 7.43
};

// Gini coefficient data (income inequality) - for future visualizations
const GINI_COEFFICIENT = {
    'US': 41.4,
    'GB': 33.2,
    'FR': 31.6,
    'DE': 31.7,
    'IT': 35.2,
    'ES': 34.7,
    'CA': 33.3,
    'AU': 34.4,
    'JP': 32.9,
    'IN': 35.7,
    'KR': 31.4,
    'CN': 38.5,
    'RU': 37.5,
    'BR': 53.9,
    'MX': 45.4,
    'AR': 41.4,
    'TR': 41.9,
    'IR': 40.8,
    'EG': 31.8,
    'NG': 35.1,
    'ZA': 63.0,
    'SE': 30.0,
    'NO': 27.5,
    'DK': 28.2,
    'FI': 27.3,
    'NL': 28.5,
    'BE': 27.4,
    'CH': 32.3,
    'AT': 30.0,
    'PT': 33.5,
    'GR': 34.3,
    'HU': 30.6,
    'CZ': 25.0,
    'PL': 30.2,
    'RO': 34.8,
    'BG': 40.4,
    'HR': 30.4,
    'SI': 24.6,
    'SK': 23.2,
    'EE': 30.5,
    'LV': 35.6,
    'LT': 35.7,
    'IE': 31.4,
    'IS': 26.1,
    'LU': 34.9,
    'MT': 28.7,
    'CY': 29.1
};

// GDP per capita data (USD, 2023) - for context
const GDP_PER_CAPITA = {
    'US': 76329,
    'GB': 46125,
    'FR': 42409,
    'DE': 48111,
    'IT': 35220,
    'ES': 29350,
    'CA': 54966,
    'AU': 64674,
    'JP': 34064,
    'IN': 2411,
    'KR': 32422,
    'CN': 12720,
    'RU': 15345,
    'BR': 8917,
    'MX': 12800,
    'AR': 13650,
    'TR': 9539,
    'IR': 4290,
    'EG': 4295,
    'NG': 2184,
    'ZA': 7055,
    'SE': 54608,
    'NO': 89154,
    'DK': 68037,
    'FI': 53655,
    'NL': 56489,
    'BE': 50114,
    'CH': 91867,
    'AT': 48104,
    'PT': 24568,
    'GR': 17676,
    'HU': 18773,
    'CZ': 26821,
    'PL': 17840,
    'RO': 12919,
    'BG': 12259,
    'HR': 18307,
    'SI': 29291,
    'SK': 20561,
    'EE': 27385,
    'LV': 20303,
    'LT': 23663,
    'IE': 99013,
    'IS': 73466,
    'LU': 125003,
    'MT': 31058,
    'CY': 30869
};

// Helper functions
function getCountryName(countryCode) {
    return COUNTRY_NAMES[countryCode] || countryCode;
}

function getDemocracyIndex(countryCode) {
    return DEMOCRACY_INDEX[countryCode] || null;
}

function getGiniCoefficient(countryCode) {
    return GINI_COEFFICIENT[countryCode] || null;
}

function getGDPPerCapita(countryCode) {
    return GDP_PER_CAPITA[countryCode] || null;
}

// Data processing helpers
function enrichCountryData(countryData) {
    return {
        ...countryData,
        country_name: getCountryName(countryData.country),
        democracy_index: getDemocracyIndex(countryData.country),
        gini_coefficient: getGiniCoefficient(countryData.country),
        gdp_per_capita: getGDPPerCapita(countryData.country)
    };
}

function filterCountriesByMinMovies(data, minMovies = 100) {
    return data.filter(country => country.movie_count >= minMovies);
}

function sortCountriesByDiversity(data, descending = true) {
    return [...data].sort((a, b) => {
        const aDiv = a.diversity_index;
        const bDiv = b.diversity_index;
        return descending ? bDiv - aDiv : aDiv - bDiv;
    });
}

function getTopGenresForCountry(countryData, topN = 5) {
    const genres = Object.entries(countryData.genre_distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, topN);
    
    return genres.map(([genre, count]) => ({
        genre,
        count,
        percentage: (count / countryData.movie_count * 100).toFixed(1)
    }));
}

// Color scales and utilities
function getDiversityColor(diversityIndex) {
    // Color scale from red (low diversity) to green (high diversity)
    const minDiv = 1.5;
    const maxDiv = 3.0;
    const normalized = (diversityIndex - minDiv) / (maxDiv - minDiv);
    const clamped = Math.max(0, Math.min(1, normalized));
    
    // Interpolate between red and green
    const red = Math.round(255 * (1 - clamped));
    const green = Math.round(255 * clamped);
    
    return `rgb(${red}, ${green}, 100)`;
}

function getDemocracyColor(democracyIndex) {
    // Color scale from dark red (authoritarian) to bright blue (democratic)
    const minDemo = 1.0;
    const maxDemo = 10.0;
    const normalized = (democracyIndex - minDemo) / (maxDemo - minDemo);
    const clamped = Math.max(0, Math.min(1, normalized));
    
    // Interpolate from red to blue
    const red = Math.round(200 * (1 - clamped));
    const blue = Math.round(255 * clamped);
    
    return `rgb(${red}, 50, ${blue})`;
}

// Export for global use
window.GLOBAL_DATA = GLOBAL_DATA;
window.loadGlobalData = loadGlobalData;
window.getCountryName = getCountryName;
window.getDemocracyIndex = getDemocracyIndex;
window.enrichCountryData = enrichCountryData;
window.filterCountriesByMinMovies = filterCountriesByMinMovies;
window.sortCountriesByDiversity = sortCountriesByDiversity;
window.getTopGenresForCountry = getTopGenresForCountry;
window.getDiversityColor = getDiversityColor;
window.getDemocracyColor = getDemocracyColor;