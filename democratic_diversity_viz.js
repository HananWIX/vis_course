// Democratic Diversity Index Visualization
// Bubble chart showing correlation between democracy and genre diversity

class DemocraticDiversityViz {
    constructor(containerSelector) {
        console.log('🔧 Creating DemocraticDiversityViz with selector:', containerSelector);
        this.container = d3.select(containerSelector);
        
        if (this.container.empty()) {
            console.error('❌ Container not found:', containerSelector);
            return;
        }
        
        console.log('✅ Container found:', this.container.node());
        
        this.data = null;
        this.currentMetric = 'democracy-index';
        this.currentTimeRange = 'all';
        this.minMovies = 50;
        
        // Chart dimensions
        this.margin = { top: 40, right: 120, bottom: 80, left: 80 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;
        
        // Scales
        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.sizeScale = d3.scaleSqrt();
        this.colorScale = d3.scaleSequential(d3.interpolateRdYlBu);
        
        this.init();
    }
    
    init() {
        this.logStatus('🏗️ Initializing chart structure...', 'info');
        
        // Find the chart placeholder within the container
        const placeholder = this.container.select('.chart-placeholder');
        if (placeholder.empty()) {
            this.logStatus('❌ Chart placeholder not found', 'error');
            console.error('Chart placeholder not found in container:', this.container.node());
            return;
        }
        
        this.logStatus('✅ Chart placeholder found', 'success');
        
        // Create SVG
        this.svg = placeholder
            .html('') // Clear placeholder
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .style('background', '#fff')
            .style('border', '1px solid #ddd');
        
        this.logStatus('✅ SVG created', 'success');
        
        // Create main group
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'diversity-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '10000');
        
        // Create axes groups
        this.xAxisGroup = this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`);
        
        this.yAxisGroup = this.g.append('g')
            .attr('class', 'y-axis');
        
        // Create bubble group
        this.bubbleGroup = this.g.append('g')
            .attr('class', 'bubbles');
        
        // Add axis labels
        this.g.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', this.height + 50)
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Democracy Index (0-10)');
        
        this.g.append('text')
            .attr('class', 'y-axis-label')
            .attr('text-anchor', 'middle')
            .attr('y', -50)
            .attr('x', -this.height / 2)
            .attr('transform', 'rotate(-90)')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Genre Diversity Index (Shannon)');
        
        // Add title
        this.g.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', -15)
            .style('font-size', '18px')
            .style('font-weight', '700')
            .style('fill', '#2c3e50')
            .text('Democracy vs Cinema Genre Diversity');
        
        // Add background grid for better visibility
        this.g.append('rect')
            .attr('class', 'chart-background')
            .attr('x', -5)
            .attr('y', -5)
            .attr('width', this.width + 10)
            .attr('height', this.height + 10)
            .style('fill', '#ffffff')
            .style('stroke', '#ff0000')
            .style('stroke-width', '3px');
        
        this.logStatus('✅ Chart background and title added', 'success');
        
        // Create legend
        this.createLegend();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Democracy metric selector
        d3.select('#democracyMetric').on('change', (event) => {
            this.currentMetric = event.target.value;
            this.updateVisualization();
        });
        
        // Time range selector
        d3.select('#timeRange').on('change', (event) => {
            this.currentTimeRange = event.target.value;
            this.updateVisualization();
        });
        
        // Minimum movies selector
        d3.select('#minMovies').on('change', (event) => {
            this.minMovies = parseInt(event.target.value);
            this.updateVisualization();
        });
    }
    
    async loadData() {
        try {
            this.logStatus('📊 Starting data load for Democratic Diversity...', 'info');
            
            // Show loading state
            this.showLoading();
            
            if (!window.GLOBAL_DATA) {
                this.logStatus('🔄 Loading global data from server...', 'info');
                
                // Make sure the loadGlobalData function exists
                if (typeof window.loadGlobalData !== 'function') {
                    throw new Error('loadGlobalData function not found. Check if global_data.js is loaded.');
                }
                
                const data = await window.loadGlobalData();
                
                if (!data || !data.democratic_diversity_data) {
                    throw new Error('Loaded data is invalid or missing democratic_diversity_data');
                }
                
                this.logStatus(`✅ Global data loaded: ${data.democratic_diversity_data.length} countries`, 'success');
            } else {
                this.logStatus('✅ Using existing global data', 'success');
            }
            
            this.processData();
            
            if (this.data && this.data.length > 0) {
                this.logStatus('📈 Updating visualization...', 'info');
                this.updateVisualization();
            } else {
                this.logStatus('❌ No data available after processing', 'error');
                this.showError('No countries available for visualization with current filters');
            }
            
        } catch (error) {
            this.logStatus(`❌ Error loading data: ${error.message}`, 'error');
            console.error('Full error details:', error);
            this.showError(`Failed to load data: ${error.message}`);
        }
    }
    
    showLoading() {
        const placeholder = this.container.select('.chart-placeholder');
        if (!placeholder.empty()) {
            placeholder.html(`
                <div class="loading-content" style="text-align: center; padding: 100px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #e9ecef; border-top: 4px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #666;">Loading diversity analysis...</p>
                </div>
            `);
            this.logStatus('🔄 Loading screen displayed', 'info');
        }
    }
    
    processData() {
        if (!window.GLOBAL_DATA) {
            this.logStatus('❌ No GLOBAL_DATA available', 'error');
            return;
        }
        
        this.logStatus(`🔄 Processing data with filters: ${this.minMovies}+ movies, ${this.currentTimeRange}`, 'info');
        
        // Get base data
        let data = window.GLOBAL_DATA.democratic_diversity_data;
        this.logStatus(`📥 Initial data: ${data.length} countries`);
        
        // Filter by minimum movies
        data = window.filterCountriesByMinMovies(data, this.minMovies);
        this.logStatus(`🎬 After movie filter (${this.minMovies}+): ${data.length} countries`);
        
        // Enrich with external data
        data = data.map(window.enrichCountryData);
        
        // Filter out countries without democracy data
        const beforeDemocracy = data.length;
        data = data.filter(d => d.democracy_index !== null && d.democracy_index !== undefined);
        this.logStatus(`🗳️ After democracy filter: ${data.length} countries (removed ${beforeDemocracy - data.length})`);
        
        // Calculate time-specific movie counts if needed
        if (this.currentTimeRange !== 'all') {
            data = data.map(d => {
                const periodCount = d.periods && d.periods[this.currentTimeRange] ? d.periods[this.currentTimeRange] : 0;
                return {
                    ...d,
                    period_movie_count: periodCount,
                    period_valid: periodCount >= 5 // Lower minimum for specific periods
                };
            });
            
            const beforePeriod = data.length;
            // Filter countries with enough movies in the selected period
            data = data.filter(d => d.period_valid);
            this.logStatus(`📅 After period filter (${this.currentTimeRange}): ${data.length} countries (removed ${beforePeriod - data.length})`);
        } else {
            // For 'all' time range, use total movie count
            data = data.map(d => ({
                ...d,
                period_movie_count: d.movie_count,
                period_valid: true
            }));
            this.logStatus(`📅 Using all-time data: ${data.length} countries`);
        }
        
        this.data = data;
        this.logStatus(`✅ Final processed data: ${data.length} countries`, 'success');
        
        if (data.length === 0) {
            this.logStatus('⚠️ No countries remain after filtering. Trying relaxed filters...', 'warning');
            this.tryRelaxedFilters();
        }
    }
    
    logStatus(message, type = 'info') {
        console.log(message);
        
        // Also log to the UI status panel
        const logsDiv = document.getElementById('data-logs');
        if (logsDiv) {
            const logEntry = document.createElement('div');
            logEntry.style.color = type === 'error' ? '#dc3545' : 
                                 type === 'warning' ? '#fd7e14' : 
                                 type === 'success' ? '#28a745' : '#495057';
            logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
            logsDiv.appendChild(logEntry);
            logsDiv.scrollTop = logsDiv.scrollHeight; // Auto-scroll to bottom
        }
    }
    
    tryRelaxedFilters() {
        console.log('🔄 Trying relaxed filters...');
        let data = window.GLOBAL_DATA.democratic_diversity_data;
        
        // Much more relaxed filtering
        data = window.filterCountriesByMinMovies(data, 10); // Very low minimum
        data = data.map(window.enrichCountryData);
        
        // Keep countries even without democracy data for debugging
        const withoutDemocracy = data.filter(d => d.democracy_index === null || d.democracy_index === undefined);
        if (withoutDemocracy.length > 0) {
            console.log('Countries without democracy data:', withoutDemocracy.map(d => d.country));
        }
        
        data = data.filter(d => d.democracy_index !== null && d.democracy_index !== undefined);
        
        if (data.length > 0) {
            this.data = data;
            console.log(`✅ Relaxed filters worked: ${data.length} countries`);
        } else {
            console.error('❌ Even relaxed filters failed');
        }
    }
    
    updateVisualization() {
        if (!this.data || this.data.length === 0) {
            this.logStatus('❌ No data available for visualization', 'error');
            this.showError('No data available for current filters');
            return;
        }
        
        this.logStatus(`🎨 Creating visualization with ${this.data.length} countries`, 'info');
        
        // Make sure we have an SVG element - ALWAYS recreate to clear loading
        this.logStatus('🖼️ Initializing chart display...', 'info');
        this.init();
        
        try {
            // Update scales
            this.updateScales();
            this.logStatus('✅ Scales updated', 'success');
            
            // Update axes
            this.updateAxes();
            this.logStatus('✅ Axes updated', 'success');
            
            // Update bubbles
            this.updateBubbles();
            this.logStatus('✅ Bubbles updated', 'success');
            
            // Update insights
            this.updateInsights();
            this.logStatus('✅ Insights updated', 'success');
            
            this.logStatus('🎉 Visualization complete!', 'success');
            
        } catch (error) {
            this.logStatus(`❌ Visualization error: ${error.message}`, 'error');
            console.error('Visualization error details:', error);
        }
    }
    
    updateScales() {
        // X scale (Democracy)
        const xExtent = d3.extent(this.data, d => d.democracy_index);
        this.xScale
            .domain([Math.max(0, xExtent[0] - 0.5), Math.min(10, xExtent[1] + 0.5)])
            .range([0, this.width]);
        
        // Y scale (Diversity)
        const yExtent = d3.extent(this.data, d => d.diversity_index);
        this.yScale
            .domain([Math.max(0, yExtent[0] - 0.1), yExtent[1] + 0.1])
            .range([this.height, 0]);
        
        // Size scale (Movie count)
        const movieCounts = this.data.map(d => 
            this.currentTimeRange === 'all' ? d.movie_count : d.period_movie_count
        );
        const sizeExtent = d3.extent(movieCounts);
        this.sizeScale
            .domain(sizeExtent)
            .range([5, 40]);
        
        // Color scale (Average rating)
        const ratingExtent = d3.extent(this.data, d => d.avg_rating);
        this.colorScale
            .domain(ratingExtent);
    }
    
    updateAxes() {
        // X axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format('.1f'))
            .ticks(8);
        
        this.xAxisGroup
            .transition()
            .duration(750)
            .call(xAxis);
        
        // Y axis
        const yAxis = d3.axisLeft(this.yScale)
            .tickFormat(d3.format('.2f'))
            .ticks(6);
        
        this.yAxisGroup
            .transition()
            .duration(750)
            .call(yAxis);
    }
    
    updateBubbles() {
        this.logStatus(`🫧 Creating ${this.data.length} bubbles...`, 'info');
        
        // Debug first few data points
        console.log('First 3 countries for bubbles:', this.data.slice(0, 3).map(d => ({
            country: d.country_name || d.country,
            democracy: d.democracy_index,
            diversity: d.diversity_index,
            movies: d.movie_count
        })));
        
        // FORCE CLEAR ALL EXISTING BUBBLES FIRST
        this.bubbleGroup.selectAll('.country-bubble').remove();
        this.logStatus('🧹 Cleared all existing bubbles', 'info');
        
        const bubbles = this.bubbleGroup
            .selectAll('.country-bubble')
            .data(this.data);
        
        this.logStatus(`📊 Fresh data binding: ${bubbles.size()} existing, ${bubbles.enter().size()} new`, 'info');
        
        // Remove old bubbles
        bubbles.exit()
            .transition()
            .duration(500)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();
        
        // Add new bubbles - FORCE VISIBLE WITH BRIGHT COLORS
        const newBubbles = bubbles.enter()
            .append('circle')
            .attr('class', 'country-bubble')
            .attr('cx', d => this.xScale(d.democracy_index))
            .attr('cy', d => this.yScale(d.diversity_index))
            .attr('r', d => {
                const movieCount = this.currentTimeRange === 'all' ? 
                    d.movie_count : d.period_movie_count;
                const radius = this.sizeScale(movieCount);
                return Math.max(radius, 8); // Minimum radius of 8px
            })
            .style('fill', (d, i) => {
                // DEBUG: Use bright visible colors
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                return colors[i % colors.length];
            })
            .style('stroke', '#000000')
            .style('stroke-width', '3px')
            .style('opacity', 1)
            .style('cursor', 'pointer');
        
        this.logStatus(`✅ New bubbles created: ${newBubbles.size()}`, 'success');
        
        // Debug positioning for first few bubbles
        this.data.slice(0, 3).forEach((d, i) => {
            const x = this.xScale(d.democracy_index);
            const y = this.yScale(d.diversity_index);
            const r = this.sizeScale(d.movie_count);
            const color = this.colorScale(d.avg_rating);
            console.log(`Bubble ${i} (${d.country}): x=${x}, y=${y}, r=${r}, color=${color}`);
        });
        
        // Add event handlers
        newBubbles
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.showCountryDetails(d));
        
        this.logStatus(`✅ All ${newBubbles.size()} bubbles positioned and styled`, 'success');
        
        // Count visible bubbles in DOM
        const visibleBubbles = this.bubbleGroup.selectAll('.country-bubble').size();
        this.logStatus(`🔍 DOM check: ${visibleBubbles} bubbles in DOM`, visibleBubbles > 0 ? 'success' : 'error');
        
        // DEBUG: Add test circles at fixed positions
        this.g.append('circle')
            .attr('cx', 50)
            .attr('cy', 50)
            .attr('r', 20)
            .style('fill', '#ff0000')
            .style('stroke', '#000')
            .style('stroke-width', '3px');
            
        this.g.append('circle')
            .attr('cx', this.width - 50)
            .attr('cy', this.height - 50)
            .attr('r', 15)
            .style('fill', '#00ff00')
            .style('stroke', '#000')
            .style('stroke-width', '3px');
            
        this.logStatus('🎯 Added debug circles at corners', 'info');
    }
    
    showTooltip(event, d) {
        const movieCount = this.currentTimeRange === 'all' ? 
            d.movie_count : d.period_movie_count;
        
        const topGenres = window.getTopGenresForCountry(d, 3)
            .map(g => `${g.genre}: ${g.percentage}%`)
            .join('<br>');
        
        this.tooltip
            .style('opacity', 1)
            .html(`
                <strong>${d.country_name}</strong><br>
                Democracy Index: ${d.democracy_index.toFixed(1)}<br>
                Diversity Index: ${d.diversity_index.toFixed(2)}<br>
                Movies: ${movieCount.toLocaleString()}<br>
                Avg Rating: ${d.avg_rating.toFixed(1)}<br>
                <br>
                <strong>Top Genres:</strong><br>
                ${topGenres}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip
            .style('opacity', 0);
    }
    
    showCountryDetails(d) {
        console.log('Country details:', d);
        // This could open a modal or side panel with detailed information
        alert(`${d.country_name}\nClick implemented - could show detailed country analysis`);
    }
    
    createLegend() {
        const legend = this.g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width + 20}, 50)`);
        
        // Size legend
        legend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Movie Count');
        
        const sizeLegendData = [100, 1000, 5000, 15000];
        const sizeLegendItems = legend.selectAll('.size-legend-item')
            .data(sizeLegendData)
            .enter()
            .append('g')
            .attr('class', 'size-legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 35})`);
        
        sizeLegendItems.append('circle')
            .attr('cx', 20)
            .attr('cy', 20)
            .attr('r', d => this.sizeScale(d))
            .style('fill', '#ccc')
            .style('stroke', '#666')
            .style('stroke-width', '1px');
        
        sizeLegendItems.append('text')
            .attr('x', 45)
            .attr('y', 25)
            .style('font-size', '11px')
            .text(d => d.toLocaleString());
        
        // Color legend
        const colorLegend = legend.append('g')
            .attr('transform', 'translate(0, 180)');
        
        colorLegend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Avg Rating');
        
        // Create color gradient
        const gradient = this.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'rating-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', 0).attr('y2', 60);
        
        gradient.selectAll('stop')
            .data([
                { offset: '0%', color: this.colorScale(8.0) },
                { offset: '50%', color: this.colorScale(6.5) },
                { offset: '100%', color: this.colorScale(5.0) }
            ])
            .enter()
            .append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);
        
        colorLegend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 60)
            .style('fill', 'url(#rating-gradient)');
        
        colorLegend.selectAll('.rating-tick')
            .data([8.0, 6.5, 5.0])
            .enter()
            .append('text')
            .attr('class', 'rating-tick')
            .attr('x', 25)
            .attr('y', (d, i) => i * 30 + 5)
            .style('font-size', '11px')
            .text(d => d.toFixed(1));
    }
    
    updateInsights() {
        if (!this.data) return;
        
        // Calculate correlation between democracy and diversity
        const correlation = this.calculateCorrelation(
            this.data.map(d => d.democracy_index),
            this.data.map(d => d.diversity_index)
        );
        
        // Find top countries by diversity
        const topDiverse = [...this.data]
            .sort((a, b) => b.diversity_index - a.diversity_index)
            .slice(0, 3);
        
        // Find countries with high democracy but low diversity (unexpected)
        const unexpected = this.data
            .filter(d => d.democracy_index > 8 && d.diversity_index < 2.0)
            .sort((a, b) => b.democracy_index - a.democracy_index);
        
        const insights = [
            `📊 Correlation between democracy and diversity: ${correlation.toFixed(3)}`,
            `🎭 Most diverse: ${topDiverse.map(d => d.country_name).join(', ')}`,
            `🏆 ${topDiverse[0].country_name} leads with diversity index ${topDiverse[0].diversity_index.toFixed(2)}`,
            `🎬 Total movies analyzed: ${this.data.reduce((sum, d) => sum + d.movie_count, 0).toLocaleString()}`,
            unexpected.length > 0 ? 
                `🤔 High democracy, lower diversity: ${unexpected.slice(0, 2).map(d => d.country_name).join(', ')}` :
                `✅ Democracy and diversity show expected positive correlation`
        ];
        
        // Update insights in the UI
        const insightsList = d3.select('#viz-diversity .insights ul');
        if (!insightsList.empty()) {
            insightsList.selectAll('li').remove();
            insightsList.selectAll('li')
                .data(insights)
                .enter()
                .append('li')
                .text(d => d);
        }
    }
    
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = d3.sum(x);
        const sumY = d3.sum(y);
        const sumXY = d3.sum(x.map((d, i) => d * y[i]));
        const sumX2 = d3.sum(x.map(d => d * d));
        const sumY2 = d3.sum(y.map(d => d * d));
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    showError(message) {
        const placeholder = this.container.select('.chart-placeholder');
        if (!placeholder.empty()) {
            placeholder.html(`
                <div style="text-align: center; padding: 100px; color: #666;">
                    <h4>⚠️ ${message}</h4>
                    <p>Please check the browser console for detailed error information.</p>
                    <p style="font-size: 0.9em; margin-top: 1rem;">
                        <strong>Debug:</strong> Make sure global_cinema_data.json is accessible and valid.
                    </p>
                </div>
            `);
        } else {
            console.error('❌ Could not find chart placeholder to show error');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Initializing Democratic Diversity Visualization...');
    
    // Check if required dependencies are loaded
    if (typeof d3 === 'undefined') {
        console.error('❌ D3.js not loaded');
        return;
    }
    
    if (typeof window.loadGlobalData !== 'function') {
        console.error('❌ global_data.js not loaded properly');
        return;
    }
    
    console.log('✅ Dependencies checked, creating visualization...');
    const diversityViz = new DemocraticDiversityViz('#viz-diversity');
    
    // Check if this visualization is initially active
    const navItem = document.querySelector('[data-viz="diversity"]');
    const vizSection = document.querySelector('#viz-diversity');
    
    console.log('📋 Nav item active:', navItem?.classList.contains('active'));
    console.log('📋 Viz section active:', vizSection?.classList.contains('active'));
    
    // Always load data on page load if this is the active viz
    console.log('🚀 Auto-loading data for diversity visualization...');
    setTimeout(() => {
        diversityViz.loadData();
    }, 500);
    
    if (navItem && navItem.classList.contains('active')) {
        console.log('✅ Diversity visualization is active by default');
    }
    
    // Listen for navigation changes
    document.addEventListener('viz-change', function(event) {
        console.log('🔄 Viz change event:', event.detail);
        if (event.detail.viz === 'diversity') {
            console.log('📊 Loading data for diversity visualization via nav change');
            diversityViz.loadData();
        }
    });
    
    // Store reference globally for debugging
    window.diversityViz = diversityViz;
    
    // Add manual trigger for testing
    window.testLoadData = function() {
        console.log('🧪 Manual data load trigger');
        diversityViz.loadData();
    };
});

// Export for global use
window.DemocraticDiversityViz = DemocraticDiversityViz;