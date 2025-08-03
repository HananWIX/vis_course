class QualityGapViz {
    constructor(containerSelector) {
        this.container = d3.select(containerSelector);
        this.data = null;
        
        // Dimensions
        this.margin = { top: 60, right: 40, bottom: 100, left: 100 };
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 650 - this.margin.bottom - this.margin.top;
        
        // Scales
        this.xScale = d3.scaleBand()
            .range([0, this.width])
            .padding(0.05);
        
        this.yScale = d3.scaleLinear()
            .domain([1, 10])
            .range([this.height, 0]);
        
        // Color scales
        this.giniColorScale = d3.scaleSequential()
            .domain([25, 55])
            .interpolator(d3.interpolateRdYlBu);
        
        this.qualityColorScale = d3.scaleSequential()
            .domain([5.5, 7.5])
            .interpolator(d3.interpolateViridis);
        
        this.init();
    }
    
    init() {
        console.log('🎭 Initializing Quality Gap Visualization...');
        
        // Clear container
        this.container.html('');
        
        // Create main container div
        const vizContainer = this.container
            .append('div')
            .attr('class', 'quality-gap-container')
            .style('width', '100%')
            .style('height', '100%')
            .style('position', 'relative');
        
        // Create SVG with proper sizing
        this.svg = vizContainer
            .append('svg')
            .attr('width', '100%')
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .attr('viewBox', `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .style('display', 'block')
            .style('margin', '0 auto')
            .style('background', '#ffffff')
            .style('border-radius', '8px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
            .style('max-width', `${this.width + this.margin.left + this.margin.right}px`);
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'quality-tooltip')
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
        
        // Add axes
        this.xAxis = this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`);
        
        this.yAxis = this.g.append('g')
            .attr('class', 'y-axis');
        
        // Add grid lines
        this.yGrid = this.g.append('g')
            .attr('class', 'y-grid')
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);
        
        // Add axis labels
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 20)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('IMDb Rating');
        
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(${this.width / 2}, ${this.height + this.margin.bottom - 20})`)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Countries (ordered by Gini Coefficient)');
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', (this.width + this.margin.left + this.margin.right) / 2)
            .attr('y', 25)
            .style('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Movie Quality Distributions vs Economic Inequality');
        
        // Add legend
        this.createLegend();
        
        // Bind events
        this.bindEvents();
    }
    
    async loadData() {
        try {
            console.log('📊 Loading quality gap data...');
            
            // Try to load from data folder first
            try {
                this.data = await d3.json('data/quality_gap_data.json');
            } catch (e) {
                // Fallback to root level
                this.data = await d3.json('quality_gap_data.json');
            }
            
            console.log(`Loaded data for ${this.data.length} countries`);
            
            if (this.data && this.data.length > 0) {
                this.render();
            } else {
                this.showNoDataMessage();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorMessage();
        }
    }
    
    showNoDataMessage() {
        this.container.html(`
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>📊 No Data Available</h3>
                <p>Quality gap data has not been generated yet.</p>
                <p>Please run: <code>python run_quality_gap.py</code></p>
            </div>
        `);
    }
    
    showErrorMessage() {
        this.container.html(`
            <div style="text-align: center; padding: 50px; color: #d32f2f;">
                <h3>⚠️ Error Loading Data</h3>
                <p>Could not load quality gap data.</p>
                <p>Please ensure the data processing has been completed.</p>
            </div>
        `);
    }
    
    bindEvents() {
        // Control handlers - only for Country Group filter
        const countryGroupSelect = d3.select('#countryGroup');
        
        if (!countryGroupSelect.empty()) {
            countryGroupSelect.on('change', () => this.updateVisualization());
        }
    }
    
    updateVisualization() {
        if (!this.data) return;
        
        // Get current filter settings
        const countryGroup = d3.select('#countryGroup').property('value') || 'all';
        
        // Filter data based on country group
        let filteredData = [...this.data];
        
        if (countryGroup === 'developed') {
            filteredData = filteredData.filter(d => d.developmentLevel === 'developed');
        } else if (countryGroup === 'developing') {
            filteredData = filteredData.filter(d => d.developmentLevel === 'developing');
        } else if (countryGroup === 'high-production') {
            filteredData = filteredData.filter(d => d.movieCount >= 100);
        }
        
        this.render(filteredData);
    }
    
    render(data = this.data) {
        if (!data || data.length === 0) return;
        
        console.log(`🎨 Rendering ${data.length} countries...`);
        
        // Update scales
        this.xScale.domain(data.map(d => d.country));
        
        // Update axes
        this.xAxis.call(d3.axisBottom(this.xScale))
            .selectAll('text')
            .style('font-size', '11px')
            .style('fill', '#2c3e50')
            .style('font-weight', '500')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');
        
        this.yAxis.call(d3.axisLeft(this.yScale))
            .selectAll('text')
            .style('font-size', '11px')
            .style('fill', '#2c3e50')
            .style('font-weight', '500');
        
        // Add grid lines
        this.yGrid.call(d3.axisLeft(this.yScale)
            .tickSize(-this.width)
            .tickFormat("")
        );
        
        // Style axis lines
        this.xAxis.selectAll('line, path')
            .style('stroke', '#34495e')
            .style('stroke-width', '1px');
            
        this.yAxis.selectAll('line, path')
            .style('stroke', '#34495e')
            .style('stroke-width', '1px');
        
        // Create violin plots
        this.createViolinPlots(data);
        
        // Add box plots overlay
        this.createBoxPlots(data);
        
        // Add inequality indicators
        this.createInequalityIndicators(data);
        
        // Update legend with current data
        this.updateLegend(data);
    }
    
    createViolinPlots(data) {
        const violinWidth = this.xScale.bandwidth() * 0.8;
        
        // Create violin groups
        const violins = this.g.selectAll('.violin-group')
            .data(data, d => d.country);
        
        violins.exit().remove();
        
        const violinEnter = violins.enter()
            .append('g')
            .attr('class', 'violin-group')
            .style('cursor', 'pointer');
        
        const violinUpdate = violinEnter.merge(violins)
            .attr('transform', d => `translate(${this.xScale(d.country) + this.xScale.bandwidth()/2}, 0)`);
        
        // Create violin paths
        violinUpdate.selectAll('.violin-path').remove();
        
        violinUpdate.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            const distribution = d.distribution;
            
            if (!distribution || distribution.length === 0) return;
            
            // Create density scale for this violin
            const maxDensity = d3.max(distribution, d => d.density) || 1;
            const densityScale = d3.scaleLinear()
                .domain([0, maxDensity])
                .range([0, violinWidth / 2]);
            
            // Filter out zero density points and smooth the curve
            const validPoints = distribution.filter(p => p.density > 0);
            
            if (validPoints.length < 2) return;
            
            // Create line generator
            const line = d3.line()
                .x(p => densityScale(p.density))
                .y(p => this.yScale(p.rating))
                .curve(d3.curveBasis);
            
            // Create right side of violin
            group.append('path')
                .datum(validPoints)
                .attr('class', 'violin-path')
                .attr('d', line)
                .attr('fill', this.giniColorScale(d.gini))
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1)
                .attr('opacity', 0.8)
                .style('transition', 'all 0.2s ease');
            
            // Create left side (mirror)
            group.append('path')
                .datum(validPoints)
                .attr('class', 'violin-path')
                .attr('d', line)
                .attr('transform', 'scale(-1,1)')
                .attr('fill', this.giniColorScale(d.gini))
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1)
                .attr('opacity', 0.8)
                .style('transition', 'all 0.2s ease');
        });
        
        // Add hover effects
        violinUpdate
            .on('mouseover', (event, d) => {
                // Highlight this violin
                d3.select(event.currentTarget)
                    .selectAll('.violin-path')
                    .attr('opacity', 0.9)
                    .attr('stroke-width', 1);
                
                this.showTooltip(event, d);
            })
            .on('mousemove', (event, d) => this.moveTooltip(event))
            .on('mouseout', (event, d) => {
                // Reset violin appearance
                d3.select(event.currentTarget)
                    .selectAll('.violin-path')
                    .attr('opacity', 0.7)
                    .attr('stroke-width', 0.5);
                
                this.hideTooltip();
            });
    }
    
    createBoxPlots(data) {
        const boxWidth = this.xScale.bandwidth() * 0.2;
        
        // Create box plot groups
        const boxes = this.g.selectAll('.box-group')
            .data(data, d => d.country);
        
        boxes.exit().remove();
        
        const boxEnter = boxes.enter()
            .append('g')
            .attr('class', 'box-group');
        
        const boxUpdate = boxEnter.merge(boxes)
            .attr('transform', d => `translate(${this.xScale(d.country) + this.xScale.bandwidth()/2}, 0)`);
        
        // Remove old elements
        boxUpdate.selectAll('*').remove();
        
        // Add box plot elements
        boxUpdate.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            
            // Quartile box
            group.append('rect')
                .attr('x', -boxWidth/2)
                .attr('y', this.yScale(d.q3))
                .attr('width', boxWidth)
                .attr('height', this.yScale(d.q1) - this.yScale(d.q3))
                .attr('fill', 'rgba(255, 255, 255, 0.9)')
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1.5);
            
            // Median line
            group.append('line')
                .attr('x1', -boxWidth/2)
                .attr('x2', boxWidth/2)
                .attr('y1', this.yScale(d.medianRating))
                .attr('y2', this.yScale(d.medianRating))
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 2.5);
            
            // Mean point
            group.append('circle')
                .attr('cx', 0)
                .attr('cy', this.yScale(d.meanRating))
                .attr('r', 3.5)
                .attr('fill', '#e74c3c')
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1.5);
            
            // Whiskers
            group.append('line')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', this.yScale(d.maxRating))
                .attr('y2', this.yScale(d.q3))
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1.5);
            
            group.append('line')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', this.yScale(d.minRating))
                .attr('y2', this.yScale(d.q1))
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 1.5);
        });
    }
    
    createInequalityIndicators(data) {
        // Add Gini coefficient indicators at the bottom
        const indicators = this.g.selectAll('.gini-indicator')
            .data(data, d => d.country);
        
        indicators.exit().remove();
        
        const indicatorEnter = indicators.enter()
            .append('g')
            .attr('class', 'gini-indicator');
        
        const indicatorUpdate = indicatorEnter.merge(indicators)
            .attr('transform', d => `translate(${this.xScale(d.country)}, ${this.height + 30})`);
        
        // Remove old elements
        indicatorUpdate.selectAll('*').remove();
        
        // Add Gini bars
        indicatorUpdate.append('rect')
            .attr('width', this.xScale.bandwidth())
            .attr('height', 15)
            .attr('fill', d => this.giniColorScale(d.gini))
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('stroke-width', 2);
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr('stroke-width', 1);
            });
        
        // Add Gini values
        indicatorUpdate.append('text')
            .attr('x', this.xScale.bandwidth() / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(d => d.gini.toFixed(1));
        
        // Add country names
        indicatorUpdate.append('text')
            .attr('x', this.xScale.bandwidth() / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#34495e')
            .style('font-weight', '500')
            .text(d => `${d.movieCount} films`);
    }
    
    createLegend() {
        // Use the separate legend container
        const legendContainer = d3.select('#quality-gap-legend');
        legendContainer.html(''); // Clear any existing content
        
        const legend = legendContainer
            .append('div')
            .attr('class', 'legend-content')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('align-items', 'center')
            .style('gap', '30px');
        
        // Create legend sections using HTML
        const giniSection = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '15px');
        
        giniSection.append('span')
            .style('font-weight', 'bold')
            .style('color', '#333')
            .style('font-size', '14px')
            .text('Economic Inequality (Gini):');
        
        const giniValues = [25, 35, 45, 55];
        giniValues.forEach(value => {
            const item = giniSection.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '5px');
            
            item.append('div')
                .style('width', '15px')
                .style('height', '15px')
                .style('background-color', this.giniColorScale(value))
                .style('border', '1px solid #333')
                .style('border-radius', '2px');
            
            item.append('span')
                .style('font-size', '12px')
                .style('color', '#333')
                .text(`${value} (${value <= 30 ? 'Low' : value <= 40 ? 'Med' : 'High'})`);
        });
        
        // Chart elements section
        const elementsSection = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '15px');
        
        elementsSection.append('span')
            .style('font-weight', 'bold')
            .style('color', '#333')
            .style('font-size', '14px')
            .text('Chart Elements:');
        
        const elements = [
            { color: 'rgba(255, 255, 255, 0.9)', label: 'IQR Box', shape: 'rect' },
            { color: '#e74c3c', label: 'Mean Rating', shape: 'circle' },
            { color: '#2c3e50', label: 'Median Line', shape: 'line' }
        ];
        
        elements.forEach(element => {
            const item = elementsSection.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '5px');
            
            if (element.shape === 'circle') {
                item.append('div')
                    .style('width', '15px')
                    .style('height', '15px')
                    .style('background-color', element.color)
                    .style('border', '2px solid #2c3e50')
                    .style('border-radius', '50%');
            } else if (element.shape === 'rect') {
                item.append('div')
                    .style('width', '15px')
                    .style('height', '15px')
                    .style('background-color', element.color)
                    .style('border', '2px solid #2c3e50');
            } else {
                item.append('div')
                    .style('width', '15px')
                    .style('height', '3px')
                    .style('background-color', element.color)
                    .style('margin', '6px 0');
            }
            
            item.append('span')
                .style('font-size', '12px')
                .style('color', '#333')
                .text(element.label);
        });
    }
    
    updateLegend(data) {
        // Update legend with current data statistics
        if (!data || data.length === 0) return;
        
        const legendContainer = d3.select('#quality-gap-legend');
        
        // Remove old stats
        legendContainer.selectAll('.data-stats').remove();
        
        // Add current data statistics at the end of the legend
        const statsSection = legendContainer.select('.legend-content')
            .append('div')
            .attr('class', 'data-stats')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '10px')
            .style('padding', '10px 15px')
            .style('background', '#ffffff')
            .style('border', '1px solid #dee2e6')
            .style('border-radius', '6px')
            .style('margin-left', 'auto');
        
        statsSection.append('span')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('color', '#495057')
            .text(`📊 ${data.length} countries • ${data.reduce((sum, d) => sum + d.movieCount, 0).toLocaleString()} movies`);
    }
    
    showTooltip(event, d) {
        const html = `
            <div style="margin-bottom: 8px;">
                <strong>${d.countryName}</strong>
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Movies:</strong> ${d.movieCount.toLocaleString()}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Mean Rating:</strong> ${d.meanRating.toFixed(2)} ⭐
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Median Rating:</strong> ${d.medianRating.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Rating Range:</strong> ${d.minRating.toFixed(1)} - ${d.maxRating.toFixed(1)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Std Dev:</strong> ${d.stdRating.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>Gini Coefficient:</strong> ${d.gini.toFixed(1)}
            </div>
            <div style="margin-bottom: 4px;">
                <strong>High Quality:</strong> ${d.highQualityPercent.toFixed(1)}% (≥7.5)
            </div>
            <div>
                <strong>Low Quality:</strong> ${d.lowQualityPercent.toFixed(1)}% (≤5.5)
            </div>
        `;
        
        this.tooltip
            .html(html)
            .style('opacity', 1);
        
        this.moveTooltip(event);
    }
    
    moveTooltip(event) {
        const tooltipWidth = 250;
        let left = event.pageX + 15;
        let top = event.pageY - 10;
        
        // Prevent tooltip from going off-screen
        if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 15;
        }
        
        this.tooltip
            .style('left', left + 'px')
            .style('top', top + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
    
    // Public method to update data
    updateData(newData) {
        this.data = newData;
        this.render();
    }
}

// Initialize visualization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Initializing Quality Gap Visualization...');
    
    // Check if we're on the right page and container exists
    const container = document.querySelector('#viz-quality .chart-placeholder');
    if (container) {
        const viz = new QualityGapViz('#viz-quality .chart-placeholder');
        viz.loadData();
        
        // Store reference for debugging
        window.qualityGapViz = viz;
        
        console.log('✅ Quality Gap Visualization initialized');
    } else {
        console.log('⚠️ Quality Gap container not found');
    }
});