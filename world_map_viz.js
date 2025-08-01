// Simple World Map Visualization
// Shows countries colored by movie diversity

class WorldMapViz {
    constructor(containerSelector) {
        this.container = d3.select(containerSelector);
        this.data = null;
        
        // Dimensions
        this.width = 1000;
        this.height = 600;
        
        // Color scale for diversity
        this.colorScale = d3.scaleSequential()
            .domain([1.5, 3.0])
            .interpolator(d3.interpolateViridis);
        
        this.init();
    }
    
    init() {
        console.log('🗺️ Initializing World Map...');
        
        // Clear container and create SVG
        this.container.html('');
        
        this.svg = this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('border', '2px solid #333')
            .style('background', '#f0f8ff');
        
        // Map projection
        this.projection = d3.geoNaturalEarth1()
            .scale(160)
            .translate([this.width / 2, this.height / 2]);
        
        this.path = d3.geoPath().projection(this.projection);
        
        // Tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'map-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '14px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '10000');
        
        console.log('✅ Map structure created');
    }
    
    async loadData() {
        try {
            console.log('🌍 Loading world map and cinema data...');
            
            // Load world map data
            const world = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
            
            // Load our cinema data
            if (!window.GLOBAL_DATA) {
                await window.loadGlobalData();
            }
            
            this.worldData = world;
            this.cinemaData = window.GLOBAL_DATA.democratic_diversity_data;
            
            console.log(`✅ Loaded map with ${world.features.length} countries`);
            console.log(`✅ Loaded cinema data for ${this.cinemaData.length} countries`);
            
            this.createMap();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(error.message);
        }
    }
    
    createMap() {
        console.log('🎨 Creating world map...');
        
        // Create country lookup with multiple name variations
        const countryData = {};
        this.cinemaData.forEach(d => {
            // Map country codes to full names for matching
            const countryNames = this.getCountryNames(d.country);
            countryNames.forEach(name => {
                countryData[name] = d;
            });
        });
        
        console.log('📊 Total country mappings:', Object.keys(countryData).length);
        console.log('📊 Sample mappings:', Object.keys(countryData).slice(0, 10));
        
        // Track found and missing countries
        let foundCount = 0;
        let missingCountries = [];
        
        // Draw countries
        this.svg.selectAll('.country')
            .data(this.worldData.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', this.path)
            .style('fill', d => {
                const countryName = d.properties.NAME;
                const data = countryData[countryName];
                
                if (data) {
                    foundCount++;
                    return this.colorScale(data.diversity_index);
                } else {
                    missingCountries.push(countryName);
                    return '#e0e0e0'; // Gray for no data
                }
            })
            .style('stroke', '#333')
            .style('stroke-width', '0.5px')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                const countryName = d.properties.NAME;
                const data = countryData[countryName];
                this.showTooltip(event, countryName, data);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });
        
        // Add legend
        this.createLegend();
        
        // Add title
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('🎬 World Cinema Diversity Map');
        
        console.log('✅ World map created successfully!');
        console.log(`🎯 Found data for ${foundCount} countries on map`);
        console.log(`❌ Missing data for ${missingCountries.length} countries`);
        
        if (foundCount === 0) {
            console.log('⚠️ NO COUNTRIES COLORED! Checking first few map country names:');
            const firstFewNames = this.worldData.features.slice(0, 10).map(f => f.properties.NAME);
            console.log('📋 Map country names:', firstFewNames);
            console.log('📋 Our data keys:', Object.keys(countryData).slice(0, 10));
        } else {
            console.log('🎨 Successfully colored countries with data!');
        }
    }
    
    getCountryNames(code) {
        // Return array of possible names for each country code
        const mappings = {
            'US': ['United States of America', 'United States', 'USA', 'US'],
            'GB': ['United Kingdom', 'Great Britain', 'Britain', 'UK', 'England'],
            'FR': ['France'],
            'DE': ['Germany', 'Deutschland'],
            'IT': ['Italy'],
            'ES': ['Spain', 'España'],
            'CA': ['Canada'],
            'AU': ['Australia'],
            'JP': ['Japan'],
            'IN': ['India'],
            'KR': ['South Korea', 'Korea'],
            'CN': ['China', 'People\'s Republic of China'],
            'RU': ['Russia', 'Russian Federation'],
            'BR': ['Brazil', 'Brasil'],
            'MX': ['Mexico', 'México'],
            'AR': ['Argentina'],
            'TR': ['Turkey', 'Türkiye'],
            'IR': ['Iran', 'Islamic Republic of Iran'],
            'EG': ['Egypt'],
            'NG': ['Nigeria'],
            'ZA': ['South Africa'],
            'SE': ['Sweden'],
            'NO': ['Norway'],
            'DK': ['Denmark'],
            'FI': ['Finland'],
            'NL': ['Netherlands', 'Holland'],
            'BE': ['Belgium'],
            'CH': ['Switzerland'],
            'AT': ['Austria'],
            'PT': ['Portugal'],
            'GR': ['Greece'],
            'HU': ['Hungary'],
            'CZ': ['Czech Republic', 'Czechia'],
            'PL': ['Poland'],
            'RO': ['Romania'],
            'BG': ['Bulgaria'],
            'HR': ['Croatia'],
            'SI': ['Slovenia'],
            'SK': ['Slovakia'],
            'EE': ['Estonia'],
            'LV': ['Latvia'],
            'LT': ['Lithuania'],
            'IE': ['Ireland'],
            'IS': ['Iceland']
        };
        
        return mappings[code] || [code];
    }
    
    showTooltip(event, countryName, data) {
        if (data) {
            const html = `
                <strong>${countryName}</strong><br>
                🎭 Diversity Index: ${data.diversity_index.toFixed(2)}<br>
                🎬 Total Movies: ${data.movie_count.toLocaleString()}<br>
                ⭐ Average Rating: ${data.avg_rating.toFixed(1)}<br>
                🏆 Top Genre: ${this.getTopGenre(data)}
            `;
            
            this.tooltip
                .style('opacity', 1)
                .html(html)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        } else {
            this.tooltip
                .style('opacity', 1)
                .html(`<strong>${countryName}</strong><br>No cinema data available`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        }
    }
    
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
    
    getTopGenre(data) {
        const genres = data.genre_distribution;
        let maxGenre = '';
        let maxCount = 0;
        
        for (const [genre, count] of Object.entries(genres)) {
            if (count > maxCount) {
                maxCount = count;
                maxGenre = genre;
            }
        }
        
        return `${maxGenre} (${maxCount})`;
    }
    
    createLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(50, 450)');
        
        // Title
        legend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Diversity Index');
        
        // Color gradient
        const gradient = this.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'diversity-gradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');
        
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const value = 1.5 + (i / steps) * (3.0 - 1.5);
            gradient.append('stop')
                .attr('offset', `${(i / steps) * 100}%`)
                .attr('stop-color', this.colorScale(value));
        }
        
        // Legend rectangle
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 200)
            .attr('height', 20)
            .style('fill', 'url(#diversity-gradient)')
            .style('stroke', '#333');
        
        // Legend labels
        legend.append('text')
            .attr('x', 0)
            .attr('y', 35)
            .style('font-size', '12px')
            .text('1.5 (Low)');
        
        legend.append('text')
            .attr('x', 200)
            .attr('y', 35)
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .text('3.0 (High)');
    }
    
    showError(message) {
        this.container.html(`
            <div style="text-align: center; padding: 100px; color: #666;">
                <h3>❌ Error loading world map</h3>
                <p>${message}</p>
                <p>Check console for details.</p>
            </div>
        `);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Initializing World Map Visualization...');
    
    const worldMapViz = new WorldMapViz('#viz-diversity .chart-placeholder');
    
    // Auto-load after a short delay
    setTimeout(() => {
        worldMapViz.loadData();
    }, 1000);
    
    // Store globally for debugging
    window.worldMapViz = worldMapViz;
});

window.WorldMapViz = WorldMapViz;