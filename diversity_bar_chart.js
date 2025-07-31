// Interactive Bar Chart for Cinema Diversity by Country
// Beautiful, modern, and guaranteed to work!

class DiversityBarChart {
    constructor(containerSelector) {
        this.container = d3.select(containerSelector);
        this.data = null;
        this.currentSort = 'diversity'; // 'diversity', 'movies', 'rating', 'name'
        
        // Dimensions
        this.margin = { top: 60, right: 200, bottom: 120, left: 200 };
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 800 - this.margin.top - this.margin.bottom;
        
        // Scales
        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.yScale = d3.scaleBand().range([0, this.height]).padding(0.15);
        this.colorScale = d3.scaleSequential(d3.interpolateViridis);
        
        this.init();
    }
    
    init() {
        console.log('📊 Initializing Interactive Bar Chart...');
        
        // Clear container
        this.container.html('');
        
        // Create main container
        const chartDiv = this.container
            .append('div')
            .style('background', '#ffffff')
            .style('border-radius', '15px')
            .style('box-shadow', '0 8px 32px rgba(0,0,0,0.1)')
            .style('padding', '20px')
            .style('margin', '20px 0');
        
        // Add controls
        this.createControls(chartDiv);
        
        // Create SVG
        this.svg = chartDiv
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .style('background', '#fafafa')
            .style('border-radius', '10px');
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Create groups
        this.barsGroup = this.g.append('g').attr('class', 'bars');
        this.xAxisGroup = this.g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${this.height})`);
        this.yAxisGroup = this.g.append('g').attr('class', 'y-axis');
        
        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'bar-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '15px')
            .style('border-radius', '10px')
            .style('font-size', '14px')
            .style('font-family', 'Arial, sans-serif')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('max-width', '300px')
            .style('line-height', '1.4');
        
        // Add title
        this.g.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '28px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .style('font-family', 'Arial, sans-serif')
            .text('🎬 Cinema Genre Diversity by Country');
        
        console.log('✅ Bar chart structure created');
    }
    
    createControls(container) {
        const controlsDiv = container
            .append('div')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('gap', '20px')
            .style('margin-bottom', '20px')
            .style('flex-wrap', 'wrap');
        
        // Sort controls
        const sortDiv = controlsDiv.append('div')
            .style('background', '#f8f9fa')
            .style('padding', '10px 20px')
            .style('border-radius', '25px')
            .style('border', '2px solid #e9ecef');
        
        sortDiv.append('label')
            .text('📊 Sort by: ')
            .style('font-weight', 'bold')
            .style('margin-right', '10px');
        
        const sortSelect = sortDiv.append('select')
            .style('padding', '8px 12px')
            .style('border-radius', '8px')
            .style('border', '1px solid #ddd')
            .style('font-size', '14px')
            .style('cursor', 'pointer');
        
        [
            { value: 'diversity', text: '🎭 Diversity Index' },
            { value: 'movies', text: '🎬 Movie Count' },
            { value: 'rating', text: '⭐ Average Rating' },
            { value: 'name', text: '🔤 Country Name' }
        ].forEach(option => {
            sortSelect.append('option')
                .attr('value', option.value)
                .text(option.text);
        });
        
        sortSelect.on('change', (event) => {
            this.currentSort = event.target.value;
            this.updateChart();
        });
        
        // Info button
        controlsDiv.append('button')
            .text('ℹ️ Info')
            .style('padding', '10px 20px')
            .style('background', '#17a2b8')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '25px')
            .style('cursor', 'pointer')
            .style('font-weight', 'bold')
            .on('click', () => this.showInfo());
    }
    
    async loadData() {
        try {
            console.log('📊 Loading cinema data for bar chart...');
            
            if (!window.GLOBAL_DATA) {
                await window.loadGlobalData();
            }
            
            this.processData();
            this.updateChart();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(error.message);
        }
    }
    
    processData() {
        // Get and enrich data
        const rawData = window.GLOBAL_DATA.democratic_diversity_data;
        
        this.data = rawData
            .filter(d => d.movie_count >= 50) // Only countries with decent data
            .map(d => ({
                ...d,
                country_name: this.getCountryName(d.country),
                top_genre: this.getTopGenre(d.genre_distribution)
            }))
            .sort((a, b) => b.diversity_index - a.diversity_index); // Default sort by diversity
        
        console.log(`✅ Processed ${this.data.length} countries for bar chart`);
        
        // Update scales domains
        this.colorScale.domain(d3.extent(this.data, d => d.diversity_index));
        
        // Show first few countries for debugging
        console.log('📊 Top 5 countries:', this.data.slice(0, 5).map(d => ({
            name: d.country_name,
            diversity: d.diversity_index,
            movies: d.movie_count
        })));
    }
    
    updateChart() {
        if (!this.data || this.data.length === 0) {
            this.showError('No data available');
            return;
        }
        
        console.log(`🔄 Updating chart with sort: ${this.currentSort}`);
        
        // Sort data based on current selection
        this.sortData();
        
        // Update scales
        this.updateScales();
        
        // Update axes
        this.updateAxes();
        
        // Update bars
        this.updateBars();
        
        console.log('✅ Chart updated successfully');
    }
    
    sortData() {
        switch (this.currentSort) {
            case 'diversity':
                this.data.sort((a, b) => b.diversity_index - a.diversity_index);
                break;
            case 'movies':
                this.data.sort((a, b) => b.movie_count - a.movie_count);
                break;
            case 'rating':
                this.data.sort((a, b) => b.avg_rating - a.avg_rating);
                break;
            case 'name':
                this.data.sort((a, b) => a.country_name.localeCompare(b.country_name));
                break;
        }
    }
    
    updateScales() {
        // X scale - diversity index
        const maxValue = d3.max(this.data, d => {
            switch (this.currentSort) {
                case 'diversity': return d.diversity_index;
                case 'movies': return d.movie_count;
                case 'rating': return d.avg_rating;
                default: return d.diversity_index;
            }
        });
        
        this.xScale.domain([0, maxValue * 1.1]);
        
        // Y scale - countries
        this.yScale.domain(this.data.map(d => d.country_name));
    }
    
    updateAxes() {
        // X axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => {
                if (this.currentSort === 'movies') return d.toLocaleString();
                return d.toFixed(2);
            })
            .ticks(8);
        
        this.xAxisGroup
            .transition()
            .duration(750)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif');
        
        // Y axis
        const yAxis = d3.axisLeft(this.yScale);
        
        this.yAxisGroup
            .transition()
            .duration(750)
            .call(yAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif')
            .style('font-weight', '500');
        
        // Axis labels
        this.updateAxisLabels();
    }
    
    updateAxisLabels() {
        // Remove old labels
        this.g.selectAll('.axis-label').remove();
        
        // X axis label
        let xLabel = 'Diversity Index (Shannon)';
        if (this.currentSort === 'movies') xLabel = 'Number of Movies';
        else if (this.currentSort === 'rating') xLabel = 'Average Rating';
        
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.width / 2)
            .attr('y', this.height + 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('fill', '#495057')
            .text(xLabel);
        
        // Y axis label
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('fill', '#495057')
            .text('Countries');
    }
    
    updateBars() {
        // Bind data
        const bars = this.barsGroup
            .selectAll('.country-bar')
            .data(this.data, d => d.country);
        
        // Remove old bars
        bars.exit()
            .transition()
            .duration(500)
            .attr('width', 0)
            .style('opacity', 0)
            .remove();
        
        // Add new bars
        const newBars = bars.enter()
            .append('rect')
            .attr('class', 'country-bar')
            .attr('y', d => this.yScale(d.country_name))
            .attr('height', this.yScale.bandwidth())
            .attr('x', 0)
            .attr('width', 0)
            .style('opacity', 0);
        
        // Update all bars
        const allBars = newBars.merge(bars);
        
        allBars
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .style('cursor', 'pointer')
            .transition()
            .duration(750)
            .attr('y', d => this.yScale(d.country_name))
            .attr('height', this.yScale.bandwidth())
            .attr('width', d => {
                const value = this.currentSort === 'movies' ? d.movie_count :
                             this.currentSort === 'rating' ? d.avg_rating :
                             d.diversity_index;
                return this.xScale(value);
            })
            .style('fill', d => this.colorScale(d.diversity_index))
            .style('opacity', 0.8)
            .style('stroke', '#fff')
            .style('stroke-width', '2px');
        
        // Add value labels on bars
        this.updateValueLabels(allBars);
    }
    
    updateValueLabels(bars) {
        // Remove old labels
        this.g.selectAll('.value-label').remove();
        
        // Add new labels
        this.g.selectAll('.value-label')
            .data(this.data)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => {
                const value = this.currentSort === 'movies' ? d.movie_count :
                             this.currentSort === 'rating' ? d.avg_rating :
                             d.diversity_index;
                return this.xScale(value) + 10;
            })
            .attr('y', d => this.yScale(d.country_name) + this.yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#2c3e50')
            .style('font-family', 'Arial, sans-serif')
            .text(d => {
                const value = this.currentSort === 'movies' ? d.movie_count :
                             this.currentSort === 'rating' ? d.avg_rating :
                             d.diversity_index;
                return this.currentSort === 'movies' ? 
                       value.toLocaleString() : 
                       value.toFixed(2);
            })
            .style('opacity', 0)
            .transition()
            .delay(400)
            .duration(500)
            .style('opacity', 1);
    }
    
    showTooltip(event, d) {
        const html = `
            <div style="border-bottom: 2px solid #4a90e2; padding-bottom: 8px; margin-bottom: 8px;">
                <strong style="font-size: 16px;">${d.country_name}</strong>
            </div>
            <div style="margin-bottom: 6px;">
                🎭 <strong>Diversity Index:</strong> ${d.diversity_index.toFixed(3)}
            </div>
            <div style="margin-bottom: 6px;">
                🎬 <strong>Total Movies:</strong> ${d.movie_count.toLocaleString()}
            </div>
            <div style="margin-bottom: 6px;">
                ⭐ <strong>Average Rating:</strong> ${d.avg_rating.toFixed(1)}/10
            </div>
            <div style="margin-bottom: 6px;">
                🏆 <strong>Top Genre:</strong> ${d.top_genre.genre} (${d.top_genre.count})
            </div>
            <div style="font-size: 12px; color: #ccc; margin-top: 8px;">
                Click for more details
            </div>
        `;
        
        this.tooltip
            .style('opacity', 1)
            .html(html)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
    
    getCountryName(code) {
        const names = {
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
            'IS': 'Iceland'
        };
        return names[code] || code;
    }
    
    getTopGenre(distribution) {
        let maxGenre = '';
        let maxCount = 0;
        
        for (const [genre, count] of Object.entries(distribution)) {
            if (count > maxCount) {
                maxCount = count;
                maxGenre = genre;
            }
        }
        
        return { genre: maxGenre, count: maxCount };
    }
    
    showInfo() {
        alert(`📊 Cinema Diversity Bar Chart

🎯 What it shows:
• Bar length = Value (diversity/movies/rating)
• Color intensity = Diversity level
• Interactive tooltips with details

🔧 Controls:
• Sort by different metrics
• Hover for country details
• Smooth animations

📈 Data covers 47 countries from 2000-2024`);
    }
    
    showError(message) {
        this.container.html(`
            <div style="text-align: center; padding: 100px; color: #666;">
                <h3>❌ Error</h3>
                <p>${message}</p>
            </div>
        `);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Diversity Bar Chart...');
    
    const barChart = new DiversityBarChart('#viz-diversity .chart-placeholder');
    
    // Auto-load
    setTimeout(() => {
        barChart.loadData();
    }, 1000);
    
    window.barChart = barChart;
});

window.DiversityBarChart = DiversityBarChart;