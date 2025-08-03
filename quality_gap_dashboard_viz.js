// Quality Gap Dashboard Visualization
// Multi-chart D3.js dashboard analyzing movie quantity vs quality patterns

class QualityGapDashboard {
    constructor(containerId) {
        this.container = d3.select(containerId);
        
        // Chart dimensions and margins
        this.scatterDimensions = { 
            width: 600, height: 400, 
            margin: { top: 20, right: 20, bottom: 60, left: 80 } 
        };
        this.barDimensions = { 
            width: 300, height: 400, 
            margin: { top: 20, right: 20, bottom: 60, left: 120 } 
        };
        this.timelineDimensions = { 
            width: 450, height: 250, 
            margin: { top: 20, right: 20, bottom: 40, left: 60 } 
        };
        this.histogramDimensions = { 
            width: 450, height: 250, 
            margin: { top: 20, right: 20, bottom: 40, left: 60 } 
        };
        
        // Color scales
        this.regionColorScale = d3.scaleOrdinal()
            .domain(['north-america', 'europe', 'asia', 'others'])
            .range(['#e74c3c', '#3498db', '#2ecc71', '#f39c12']);
            
        this.qualityColorScale = d3.scaleSequential()
            .domain([5.0, 8.5])
            .interpolator(d3.interpolateViridis);
            
        this.genreColorScale = d3.scaleOrdinal()
            .domain(['Drama', 'Comedy', 'Action', 'Documentary', 'Thriller'])
            .range(['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6']);
        
        // Data and filters
        this.data = null;
        this.filteredData = null;
        this.currentFilters = {
            yearRange: '2010-2024',
            region: 'all',
            qualityThreshold: 2.0,
            minMovies: 50,
            topCountries: 30
        };
        
        this.initializeVisualization();
    }
    
    initializeVisualization() {
        console.log('📊 Initializing Quality Gap Dashboard...');
        
        // Clear container
        this.container.selectAll("*").remove();
        
        // Create main container
        const mainContainer = this.container
            .append('div')
            .attr('class', 'quality-gap-dashboard')
            .style('width', '100%')
            .style('min-height', '800px');
        
        // Create filter controls
        this.createFilterControls();
        
        // Create dashboard layout
        this.createDashboardLayout();
        
        // Create tooltips
        this.createTooltips();
        
        // Bind filter events
        this.bindFilterEvents();
        
        // Load data
        this.loadData();
    }
    
    createFilterControls() {
        const controlsContainer = this.container.select('.quality-gap-dashboard')
            .append('div')
            .attr('class', 'dashboard-controls')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('gap', '15px')
            .style('padding', '20px')
            .style('background', '#f8f9fa')
            .style('border-radius', '8px')
            .style('margin-bottom', '20px')
            .style('border', '1px solid #dee2e6');
        
        // Year Range Filter
        const yearControl = controlsContainer.append('div').attr('class', 'control-group');
        yearControl.append('label')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px')
            .style('display', 'block')
            .text('Year Range:');
        yearControl.append('select')
            .attr('id', 'yearRange')
            .style('padding', '5px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ddd')
            .html(`
                <option value="2015-2024">2015-2024 (Recent)</option>
                <option value="2010-2024" selected>2010-2024 (Full Range)</option>
                <option value="2020-2024">2020-2024 (COVID Era)</option>
            `);
        
        
        // Region Filter
        const regionControl = controlsContainer.append('div').attr('class', 'control-group');
        regionControl.append('label')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px')
            .style('display', 'block')
            .text('Region:');
        regionControl.append('select')
            .attr('id', 'countryRegion')
            .style('padding', '5px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ddd')
            .html(`
                <option value="all" selected>All Regions</option>
                <option value="north-america">North America</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="others">Others</option>
            `);
        
        // Quality Threshold
        const qualityControl = controlsContainer.append('div').attr('class', 'control-group');
        qualityControl.append('label')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px')
            .style('display', 'block')
            .text('Min Quality:');
        qualityControl.append('select')
            .attr('id', 'qualityThreshold')
            .style('padding', '5px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ddd')
            .html(`
                <option value="2.0" selected>2.0+ (Very Poor)</option>
                <option value="3.0">3.0+ (Poor)</option>
                <option value="4.0">4.0+ (Below Average)</option>
                <option value="5.0">5.0+ (Average)</option>
                <option value="6.0">6.0+ (Good)</option>
                <option value="7.0">7.0+ (Great)</option>
            `);
        
        // Top Countries
        const topControl = controlsContainer.append('div').attr('class', 'control-group');
        topControl.append('label')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px')
            .style('display', 'block')
            .text('Show Top:');
        topControl.append('select')
            .attr('id', 'topCountries')
            .style('padding', '5px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ddd')
            .html(`
                <option value="50">50 Countries</option>
                <option value="30" selected>30 Countries</option>
                <option value="20">20 Countries</option>
                <option value="15">15 Countries</option>
                <option value="10">10 Countries</option>
            `);
    }
    
    createDashboardLayout() {
        const dashboard = this.container.select('.quality-gap-dashboard')
            .append('div')
            .attr('class', 'dashboard-layout');
        
        // Top row: Main scatter plot + Quality leaders bar chart
        const topRow = dashboard.append('div')
            .style('display', 'grid')
            .style('grid-template-columns', '2fr 1fr')
            .style('gap', '20px')
            .style('margin-bottom', '20px');
        
        // Main scatter plot container
        const scatterContainer = topRow.append('div')
            .attr('class', 'chart-container')
            .style('background', 'white')
            .style('border-radius', '10px')
            .style('padding', '20px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');
            
        scatterContainer.append('h3')
            .style('text-align', 'center')
            .style('margin-bottom', '20px')
            .style('color', '#2c3e50')
            .text('📈 Movie Quantity vs Average Quality');
            
        scatterContainer.append('div')
            .attr('id', 'quantity-quality-scatter')
            .style('min-height', '400px');
        
        // Quality leaders bar chart container
        const barContainer = topRow.append('div')
            .attr('class', 'chart-container')
            .style('background', 'white')
            .style('border-radius', '10px')
            .style('padding', '20px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');
            
        barContainer.append('h3')
            .style('text-align', 'center')
            .style('margin-bottom', '20px')
            .style('color', '#2c3e50')
            .text('🏆 Quality Leaders');
            
        barContainer.append('div')
            .attr('id', 'quality-leaders-bar')
            .style('min-height', '400px');
        
        // Bottom row: Timeline + Histogram
        const bottomRow = dashboard.append('div')
            .style('display', 'grid')
            .style('grid-template-columns', '1fr 1fr')
            .style('gap', '20px');
        
        // Timeline container
        const timelineContainer = bottomRow.append('div')
            .attr('class', 'chart-container')
            .style('background', 'white')
            .style('border-radius', '10px')
            .style('padding', '20px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');
            
        timelineContainer.append('h3')
            .style('text-align', 'center')
            .style('margin-bottom', '20px')
            .style('color', '#2c3e50')
            .text('📈 Quality Evolution');
            
        timelineContainer.append('div')
            .attr('id', 'quality-gap-timeline')
            .style('min-height', '250px');
        
        // Histogram container
        const histogramContainer = bottomRow.append('div')
            .attr('class', 'chart-container')
            .style('background', 'white')
            .style('border-radius', '10px')
            .style('padding', '20px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');
            
        histogramContainer.append('h3')
            .style('text-align', 'center')
            .style('margin-bottom', '20px')
            .style('color', '#2c3e50')
            .text('📊 Rating Distribution');
            
        histogramContainer.append('div')
            .attr('id', 'rating-distribution')
            .style('min-height', '250px');
    }
    
    createTooltips() {
        // Main tooltip for scatter plot
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'quality-dashboard-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('border', '1px solid rgba(255,255,255,0.2)')
            .style('font-family', "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
            .style('line-height', '1.4');
    }
    
    bindFilterEvents() {
        // Bind all filter change events
        const filters = ['yearRange', 'countryRegion', 'qualityThreshold', 'topCountries'];
        
        filters.forEach(filterId => {
            d3.select(`#${filterId}`).on('change', () => {
                this.updateFilters();
                this.updateVisualization();
            });
        });
    }
    
    updateFilters() {
        this.currentFilters = {
            yearRange: d3.select('#yearRange').property('value'),
            region: d3.select('#countryRegion').property('value'),
            qualityThreshold: parseFloat(d3.select('#qualityThreshold').property('value')),
            minMovies: 50, // Fixed for now
            topCountries: parseInt(d3.select('#topCountries').property('value'))
        };
        
        console.log('🎛️ Filters updated:', this.currentFilters);
    }
    
    async loadData() {
        try {
            console.log('📊 Loading quality gap dashboard data...');
            
            // Try to load dashboard data
            let dashboardData;
            try {
                dashboardData = await d3.json('data/quality_gap_dashboard/dashboard_data.json');
            } catch (e) {
                console.log('Dashboard data not found, showing placeholder...');
                this.showDataProcessingNeeded();
                return;
            }
            
            this.data = dashboardData;
            console.log(`Loaded data for ${this.data.countries.length} countries`);
            
            this.updateVisualization();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorMessage();
        }
    }
    
    showDataProcessingNeeded() {
        // Clear container first
        this.container.selectAll("*").remove();
        
        // Create message container
        const messageDiv = this.container
            .append('div')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', '#666');
            
        messageDiv.append('h3').text('📊 Quality Gap Dashboard');
        messageDiv.append('p').html('<strong>Data Processing Needed</strong>');
        messageDiv.append('p').text('To generate this dashboard, run:');
        
        messageDiv.append('code')
            .style('background', '#f5f5f5')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('display', 'block')
            .style('margin', '20px 0')
            .text('python run_quality_gap_dashboard.py');
            
        messageDiv.append('p').text('This will analyze movie quantity vs quality relationships across countries.');
        
        const featuresDiv = messageDiv.append('div')
            .style('background', '#e3f2fd')
            .style('padding', '15px')
            .style('border-radius', '5px')
            .style('margin-top', '20px');
            
        featuresDiv.append('h4').text('Dashboard Features:');
        
        const featuresList = featuresDiv.append('ul')
            .style('text-align', 'left')
            .style('display', 'inline-block');
            
        featuresList.append('li').html('📈 <strong>Scatter Plot:</strong> Quantity vs Quality by country');
        featuresList.append('li').html('🏆 <strong>Rankings:</strong> Top countries by quality metrics');
        featuresList.append('li').html('📊 <strong>Trends:</strong> Quality evolution over time');
        featuresList.append('li').html('📉 <strong>Distribution:</strong> Rating frequency analysis');
        featuresList.append('li').html('🎛️ <strong>Filters:</strong> Year, region, quality thresholds');
    }
    
    showErrorMessage() {
        // Clear container first
        this.container.selectAll("*").remove();
        
        // Create error message container
        const errorDiv = this.container
            .append('div')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', '#d32f2f');
            
        errorDiv.append('h3').text('⚠️ Error Loading Dashboard');
        errorDiv.append('p').text('Could not load quality gap data.');
        errorDiv.append('p').text('Please ensure the data processing has been completed.');
    }
    
    filterData() {
        if (!this.data) return [];
        
        let filtered = [...this.data.countries];
        
        // Apply filters
        if (this.currentFilters.region !== 'all') {
            filtered = filtered.filter(d => d.country.region === this.currentFilters.region);
        }
        
        if (this.currentFilters.qualityThreshold > 0) {
            filtered = filtered.filter(d => d.summary.avg_rating >= this.currentFilters.qualityThreshold);
        }
        
        // Apply minimum movies filter
        filtered = filtered.filter(d => d.summary.total_movies >= this.currentFilters.minMovies);
        
        // Limit to top N countries by movie count
        filtered = filtered
            .sort((a, b) => b.summary.total_movies - a.summary.total_movies)
            .slice(0, this.currentFilters.topCountries);
        
        return filtered;
    }
    
    updateVisualization() {
        if (!this.data) return;
        
        this.filteredData = this.filterData();
        console.log(`🎨 Rendering ${this.filteredData.length} countries...`);
        
        // Update all charts
        this.renderScatterPlot();
        this.renderQualityLeaders();
        this.renderTimeline();
        this.renderHistogram();
    }
    
    renderScatterPlot() {
        const container = d3.select('#quantity-quality-scatter');
        container.selectAll('*').remove();
        
        if (!this.filteredData || this.filteredData.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No data matches current filters');
            return;
        }
        
        const { width, height, margin } = this.scatterDimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.summary.total_movies)])
            .range([0, innerWidth])
            .nice();
        
        const yScale = d3.scaleLinear()
            .domain(d3.extent(this.filteredData, d => d.summary.avg_rating))
            .range([innerHeight, 0])
            .nice();
        
        const radiusScale = d3.scaleSqrt()
            .domain([1, d3.max(this.filteredData, d => d.summary.total_movies)])
            .range([3, 15]);
        
        // Axes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('.0s')));
        
        g.append('g')
            .call(d3.axisLeft(yScale));
        
        // Axis labels
        g.append('text')
            .attr('transform', `translate(${innerWidth/2}, ${innerHeight + 40})`)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Total Movies');
        
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 20)
            .attr('x', 0 - (innerHeight / 2))
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Average Rating');
        
        // Scatter points
        g.selectAll('.country-point')
            .data(this.filteredData)
            .enter()
            .append('circle')
            .attr('class', 'country-point')
            .attr('cx', d => xScale(d.summary.total_movies))
            .attr('cy', d => yScale(d.summary.avg_rating))
            .attr('r', d => radiusScale(d.summary.total_movies))
            .attr('fill', d => this.regionColorScale(d.country.region))
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showScatterTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());
        
        // Add legend
        this.addScatterLegend(g, innerWidth, innerHeight);
    }
    
    renderQualityLeaders() {
        const container = d3.select('#quality-leaders-bar');
        container.selectAll('*').remove();
        
        if (!this.filteredData || this.filteredData.length === 0) return;
        
        const { width, height, margin } = this.barDimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Sort by average rating
        const topCountries = [...this.filteredData]
            .sort((a, b) => b.summary.avg_rating - a.summary.avg_rating)
            .slice(0, 10);
        
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scales
        const yScale = d3.scaleBand()
            .domain(topCountries.map(d => d.country.name))
            .range([0, innerHeight])
            .padding(0.1);
        
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(topCountries, d => d.summary.avg_rating)])
            .range([0, innerWidth]);
        
        // Bars
        g.selectAll('.quality-bar')
            .data(topCountries)
            .enter()
            .append('rect')
            .attr('class', 'quality-bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.country.name))
            .attr('width', d => xScale(d.summary.avg_rating))
            .attr('height', yScale.bandwidth())
            .attr('fill', d => this.qualityColorScale(d.summary.avg_rating))
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 1);
        
        // Labels
        g.selectAll('.country-label')
            .data(topCountries)
            .enter()
            .append('text')
            .attr('class', 'country-label')
            .attr('x', -5)
            .attr('y', d => yScale(d.country.name) + yScale.bandwidth()/2)
            .attr('dy', '0.35em')
            .style('text-anchor', 'end')
            .style('font-size', '11px')
            .style('fill', '#2c3e50')
            .text(d => d.country.name);
        
        // Values
        g.selectAll('.rating-value')
            .data(topCountries)
            .enter()
            .append('text')
            .attr('class', 'rating-value')
            .attr('x', d => xScale(d.summary.avg_rating) + 5)
            .attr('y', d => yScale(d.country.name) + yScale.bandwidth()/2)
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .style('fill', '#2c3e50')
            .text(d => d.summary.avg_rating.toFixed(2));
    }
    
    renderTimeline() {
        const container = d3.select('#quality-gap-timeline');
        container.selectAll('*').remove();
        
        if (!this.filteredData || this.filteredData.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No data matches current filters');
            return;
        }
        
        const { width, height, margin } = this.timelineDimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Calculate average quality by year
        const yearlyData = {};
        this.filteredData.forEach(country => {
            if (country.yearly_trends) {
                Object.entries(country.yearly_trends).forEach(([year, data]) => {
                    if (!yearlyData[year]) {
                        yearlyData[year] = { totalRating: 0, totalMovies: 0, countries: 0 };
                    }
                    yearlyData[year].totalRating += data.avg_rating * data.total_movies;
                    yearlyData[year].totalMovies += data.total_movies;
                    yearlyData[year].countries += 1;
                });
            }
        });
        
        // Convert to array and calculate weighted averages
        const timelineData = Object.entries(yearlyData)
            .map(([year, data]) => ({
                year: parseInt(year),
                avgRating: data.totalRating / data.totalMovies,
                totalMovies: data.totalMovies,
                countries: data.countries
            }))
            .filter(d => d.year >= 2010 && d.year <= 2024)
            .sort((a, b) => a.year - b.year);
        
        if (timelineData.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No yearly trend data available');
            return;
        }
        
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(timelineData, d => d.year))
            .range([0, innerWidth]);
        
        const yScale = d3.scaleLinear()
            .domain(d3.extent(timelineData, d => d.avgRating))
            .nice()
            .range([innerHeight, 0]);
        
        // Line generator
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.avgRating))
            .curve(d3.curveMonotoneX);
        
        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
        
        g.append('g')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (innerHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Average Rating');
        
        g.append('text')
            .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Year');
        
        // Add line
        g.append('path')
            .datum(timelineData)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', line);
        
        // Add dots
        g.selectAll('.dot')
            .data(timelineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.avgRating))
            .attr('r', 4)
            .attr('fill', '#3498db')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                this.tooltip.html(`
                    <strong>${d.year}</strong><br/>
                    Average Rating: ${d.avgRating.toFixed(2)} ⭐<br/>
                    Total Movies: ${d.totalMovies.toLocaleString()}<br/>
                    Countries: ${d.countries}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }
    
    renderHistogram() {
        const container = d3.select('#rating-distribution');
        container.selectAll('*').remove();
        
        if (!this.filteredData || this.filteredData.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No data matches current filters');
            return;
        }
        
        const { width, height, margin } = this.histogramDimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Collect all country average ratings
        const ratings = this.filteredData.map(d => d.summary.avg_rating);
        
        if (ratings.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No rating data available');
            return;
        }
        
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create histogram bins
        const bins = d3.histogram()
            .domain([5.0, 8.5])  // Rating range
            .thresholds(10)
            (ratings);
        
        // Scales
        const xScale = d3.scaleLinear()
            .domain([5.0, 8.5])
            .range([0, innerWidth]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([innerHeight, 0]);
        
        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale));
        
        g.append('g')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (innerHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Number of Countries');
        
        g.append('text')
            .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Average Rating');
        
        // Add bars
        g.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.x0))
            .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
            .attr('y', d => yScale(d.length))
            .attr('height', d => innerHeight - yScale(d.length))
            .attr('fill', '#2ecc71')
            .attr('stroke', '#27ae60')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                this.tooltip.html(`
                    <strong>Rating Range: ${d.x0.toFixed(1)} - ${d.x1.toFixed(1)}</strong><br/>
                    Countries: ${d.length}<br/>
                    Percentage: ${((d.length / ratings.length) * 100).toFixed(1)}%
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Add mean line
        const meanRating = d3.mean(ratings);
        g.append('line')
            .attr('x1', xScale(meanRating))
            .attr('x2', xScale(meanRating))
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4');
        
        g.append('text')
            .attr('x', xScale(meanRating))
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#e74c3c')
            .text(`Mean: ${meanRating.toFixed(2)}`);
    }
    
    addScatterLegend(g, innerWidth, innerHeight) {
        const legendData = [
            { region: 'north-america', label: 'North America' },
            { region: 'europe', label: 'Europe' },
            { region: 'asia', label: 'Asia' },
            { region: 'others', label: 'Others' }
        ];
        
        const legend = g.append('g')
            .attr('class', 'scatter-legend')
            .attr('transform', `translate(${innerWidth - 120}, 20)`);
        
        // Capture class instance reference for use in callbacks
        const self = this;
        
        legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each(function(legendItem) {
                const item = d3.select(this);
                
                item.append('circle')
                    .attr('cx', 8)
                    .attr('cy', 0)
                    .attr('r', 6)
                    .attr('fill', self.regionColorScale(legendItem.region))
                    .attr('stroke', '#2c3e50')
                    .attr('stroke-width', 1);
                
                item.append('text')
                    .attr('x', 20)
                    .attr('y', 0)
                    .attr('dy', '0.35em')
                    .style('font-size', '11px')
                    .style('fill', '#2c3e50')
                    .text(legendItem.label);
            });
    }
    
    showScatterTooltip(event, d) {
        const html = `
            <div style="margin-bottom: 8px;">
                <strong>${d.country.name}</strong>
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Total Movies:</strong> ${d.summary.total_movies.toLocaleString()}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Average Rating:</strong> ${d.summary.avg_rating.toFixed(2)} ⭐
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Median Rating:</strong> ${d.summary.median_rating.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Rating Std Dev:</strong> ${d.summary.std_rating.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Region:</strong> ${d.country.region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div>
                <strong>Genres Covered:</strong> ${d.summary.genres_covered}
            </div>
        `;
        
        this.tooltip
            .html(html)
            .style('opacity', 1)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
}

// Initialize dashboard when DOM is ready
// Quality Gap Dashboard initialization function
window.initQualityGapDashboard = function() {
    console.log('🎯 Initializing Quality Gap Dashboard...');
    
    const container = document.querySelector('#viz-quality-gap .chart-placeholder');
    if (!container) {
        console.error('❌ Quality Gap Dashboard container not found');
        return null;
    }
    
    // Clear placeholder content
    container.innerHTML = '';
    
    try {
        // Create and initialize dashboard
        const dashboard = new QualityGapDashboard('#viz-quality-gap .chart-placeholder');
        
        // Store reference for debugging and access
        window.qualityGapDashboard = dashboard;
        
        console.log('✅ Quality Gap Dashboard initialized successfully');
        return dashboard;
    } catch (error) {
        console.error('❌ Error initializing Quality Gap Dashboard:', error);
        return null;
    }
};