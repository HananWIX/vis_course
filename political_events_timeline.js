// Universal Political Events Timeline Visualization
// Multi-line time series with political event annotations

class PoliticalEventsTimeline {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.width = 1200;
        this.height = 700;
        this.margin = { top: 100, right: 50, bottom: 100, left: 100 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        this.genres = ['Drama', 'Documentary', 'Comedy', 'Action', 'Thriller'];
        this.colorScale = d3.scaleOrdinal()
            .domain(this.genres)
            .range(['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6']);
        
        this.eventTypeColors = {
            'terrorism': '#e74c3c',
            'war': '#c0392b',
            'economic': '#f39c12',
            'political_shift': '#3498db',
            'domestic_unrest': '#e67e22',
            'health_crisis': '#1abc9c',
            'diplomatic': '#9b59b6',
            'sanctions': '#34495e',
            'positive': '#27ae60',
            'natural_disaster': '#f1c40f',
            'nuclear_disaster': '#8e44ad',
            'humanitarian_crisis': '#16a085',
            'political_revolution': '#d35400',
            'territorial_conflict': '#7f8c8d',
            'political_repression': '#2c3e50',
            'corruption_scandal': '#e91e63',
            'political_crisis': '#ff5722',
            'disaster': '#ff9800',
            'political_scandal': '#795548',
            'infrastructure_disaster': '#607d8b',
            'coup_attempt': '#9c27b0',
            'internal_conflict': '#673ab7',
            'human_rights_crisis': '#3f51b5',
            'security_crisis': '#2196f3',
            'coup': '#00bcd4',
            'political_assassination': '#8b0000'
        };
        
        this.currentCountry = null;
        this.data = null;
        this.showSmoothed = false;  // Default to raw data, smoothing optional
        
        this.initializeVisualization();
    }
    
    initializeVisualization() {
        // Clear container
        this.container.selectAll("*").remove();
        
        // Remove any existing tooltips from body
        d3.selectAll('.timeline-tooltip').remove();
        
        // Create controls container
        this.controlsContainer = this.container
            .append('div')
            .attr('class', 'timeline-controls')
            .style('margin-bottom', '20px')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('gap', '20px')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('padding', '15px')
            .style('background', '#f8f9fa')
            .style('border-radius', '8px')
            .style('border', '1px solid #e9ecef');
        
        // Create SVG
        this.svg = this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Create main group
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Create scales
        this.xScale = d3.scaleLinear()
            .domain([2000, 2024])
            .range([0, this.innerWidth]);
        
        this.yScale = d3.scaleLinear()
            .range([this.innerHeight, 0]);
        
        // Create line generator
        this.line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.count))
            .curve(d3.curveMonotoneX);
        
        // Create axes with explicit tick formatting
        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format('d'))
            .ticks(10)
            .tickSize(6)
            .tickPadding(10);
        
        this.yAxis = d3.axisLeft(this.yScale)
            .ticks(8)
            .tickFormat(d3.format('.0f'))
            .tickSize(6)
            .tickPadding(10);
        
        // Add axis groups
        this.xAxisGroup = this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`);
        
        this.yAxisGroup = this.g.append('g')
            .attr('class', 'y-axis');
            
        // Debug: Log axis group creation
        console.log('📊 Axis groups created:', {
            xAxisGroup: this.xAxisGroup.size(),
            yAxisGroup: this.yAxisGroup.size()
        });
        
        // Create tooltip - attach to body for proper positioning
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'timeline-tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('color', '#333')
            .style('padding', '12px')
            .style('border-radius', '12px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10000)
            .style('transition', 'opacity 0.3s ease, transform 0.3s ease')
            .style('transform', 'translateY(10px)')
            .style('box-shadow', '0 8px 32px rgba(0,0,0,0.15)')
            .style('border', '1px solid #e0e0e0')
            .style('backdrop-filter', 'blur(10px)')
            .style('line-height', '1.4');
        
        // Add title
        this.titleGroup = this.g.append('g')
            .attr('class', 'timeline-title');
        
        // Add legends container - positioned below the chart
        this.legendsContainer = this.container
            .append('div')
            .attr('class', 'legends-container')
            .style('display', 'flex')
            .style('justify-content', 'space-around')
            .style('margin-top', '20px')
            .style('padding', '20px')
            .style('background', '#f8f9fa')
            .style('border-radius', '8px')
            .style('border', '1px solid #e9ecef');
        
        this.setupControls();
    }
    
    setupControls() {
        // Country selector with organized groups - 30 countries
        this.controlsContainer.append('div')
            .attr('class', 'country-selector-container')
            .html(`
                <label style="margin-right: 10px; font-weight: 600; color: #2c3e50;">Select Country:</label>
                <select id="countrySelector" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background: white; min-width: 200px;">
                    <option value="US" selected>🇺🇸 United States</option>
                    <optgroup label="━━━ Major Powers ━━━">
                        <option value="CN">🇨🇳 China</option>
                        <option value="RU">🇷🇺 Russia</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="JP">🇯🇵 Japan</option>
                    </optgroup>
                    <optgroup label="━━━ Europe ━━━">
                        <option value="GB">🇬🇧 United Kingdom</option>
                        <option value="FR">🇫🇷 France</option>
                        <option value="DE">🇩🇪 Germany</option>
                        <option value="IT">🇮🇹 Italy</option>
                        <option value="ES">🇪🇸 Spain</option>
                        <option value="UA">🇺🇦 Ukraine</option>
                        <option value="TR">🇹🇷 Turkey</option>
                        <option value="PL">🇵🇱 Poland</option>
                        <option value="SE">🇸🇪 Sweden</option>
                    </optgroup>
                    <optgroup label="━━━ Middle East & Africa ━━━">
                        <option value="IR">🇮🇷 Iran</option>
                        <option value="IL">🇮🇱 Israel</option>
                        <option value="SA">🇸🇦 Saudi Arabia</option>
                        <option value="ZA">🇿🇦 South Africa</option>
                        <option value="NG">🇳🇬 Nigeria</option>
                        <option value="EG">🇪🇬 Egypt</option>
                    </optgroup>
                    <optgroup label="━━━ Americas ━━━">
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="BR">🇧🇷 Brazil</option>
                        <option value="MX">🇲🇽 Mexico</option>
                        <option value="AR">🇦🇷 Argentina</option>
                    </optgroup>
                    <optgroup label="━━━ Asia-Pacific ━━━">
                        <option value="KR">🇰🇷 South Korea</option>
                        <option value="AU">🇦🇺 Australia</option>
                        <option value="ID">🇮🇩 Indonesia</option>
                        <option value="TH">🇹🇭 Thailand</option>
                    </optgroup>
                </select>
            `);
        
        // Data smoothing toggle
        this.controlsContainer.append('div')
            .attr('class', 'smoothing-toggle-container')
            .html(`
                <label style="font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="smoothingToggle" style="transform: scale(1.1);">
                    Apply Data Smoothing (3-year average)
                </label>
            `);
        
        // Info button
        this.controlsContainer.append('div')
            .attr('class', 'info-container')
            .html(`
                <button id="infoButton" style="padding: 10px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.3s ease;">
                    ℹ️ About This Visualization
                </button>
            `);
        
        // Event handlers
        d3.select('#countrySelector').on('change', (event) => {
            const selectedCountry = event.target.value;
            if (selectedCountry) {
                this.loadCountryData(selectedCountry);
            }
        });
        
        // Auto-load US data on initialization
        setTimeout(() => {
            this.loadCountryData('US');
        }, 500);
        
        d3.select('#smoothingToggle').on('change', (event) => {
            this.showSmoothed = event.target.checked;
            if (this.data) {
                this.updateVisualization();
            }
        });
        
        d3.select('#infoButton').on('click', () => {
            this.showInfoModal();
        });
    }
    
    async loadCountryData(countryCode) {
        try {
            // Show loading state
            this.showLoadingState();
            
            const filename = `data/political_timelines/political_timeline_${countryCode.toLowerCase()}.json`;
            const response = await fetch(filename);
            
            if (!response.ok) {
                // If data file doesn't exist, show helpful message
                if (response.status === 404) {
                    this.showDataProcessingNeeded(countryCode);
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return;
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (!data.country || !data.timeline_data || !Array.isArray(data.timeline_data)) {
                throw new Error('Invalid data structure in file');
            }
            
            this.data = data;
            this.currentCountry = countryCode;
            this.updateVisualization();
            
        } catch (error) {
            console.error('Error loading country data:', error);
            this.showError(`Failed to load data for ${countryCode}. ${error.message}`);
        }
    }
    
    updateVisualization() {
        if (!this.data) return;
        
        // Clear any loading/error states
        this.g.selectAll('.loading-text, .error-text, .data-processing-text').remove();
        
        // Process data for line chart
        const lineData = this.processLineData();
        
        // Update scales
        const maxCount = d3.max(lineData, d => d3.max(d.values, v => v.count));
        this.yScale.domain([0, maxCount * 1.1]);
        
        // Debug: Log scale domains before axis update
        console.log('📊 Scale domains:', {
            xScale: this.xScale.domain(),
            yScale: this.yScale.domain(),
            maxCount: maxCount
        });
        
        // Update axes directly (no transition)
        this.xAxisGroup.call(this.xAxis);
        this.yAxisGroup.call(this.yAxis);
            
        // Debug: Check if axes have text elements after calling
        setTimeout(() => {
            console.log('📊 Axis elements after call:', {
                xAxisTexts: this.xAxisGroup.selectAll('text').size(),
                yAxisTexts: this.yAxisGroup.selectAll('text').size()
            });
        }, 50);
        
        // Style axes immediately after calling
        this.xAxisGroup.selectAll('text')
            .style('fill', '#2c3e50')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .style('font-family', 'Arial, sans-serif')
            .style('opacity', 1);
            
        this.yAxisGroup.selectAll('text')
            .style('fill', '#2c3e50')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .style('font-family', 'Arial, sans-serif')
            .style('opacity', 1);
            
        this.xAxisGroup.selectAll('path, line')
            .style('stroke', '#34495e')
            .style('stroke-width', '2px')
            .style('opacity', 1);
            
        this.yAxisGroup.selectAll('path, line')
            .style('stroke', '#34495e')
            .style('stroke-width', '2px')
            .style('opacity', 1);
            
        // Add subtle grid lines for better readability
        this.addGridLines();
        
        // Add axis labels
        this.updateAxisLabels();
        
        // Update title
        this.updateTitle();
        
        // Draw lines
        this.drawGenreLines(lineData);
        
        // Draw political events
        this.drawPoliticalEvents();
        
        // Update legends
        this.updateLegends();
        
        // Add interaction overlay
        this.addInteractionOverlay();
    }
    
    processLineData() {
        const dataSource = this.showSmoothed ? 'genre_counts' : 'raw_genre_counts';
        
        return this.genres.map(genre => ({
            genre: genre,
            color: this.colorScale(genre),
            values: this.data.timeline_data.map(d => ({
                year: d.year,
                count: d[dataSource][genre],
                hasEvent: d.has_events,
                events: d.events
            }))
        }));
    }
    
    drawGenreLines(lineData) {
        // Remove existing lines
        this.g.selectAll('.genre-line').remove();
        this.g.selectAll('.genre-dots').remove();
        
        // Line groups
        const lineGroups = this.g.selectAll('.genre-line')
            .data(lineData)
            .enter()
            .append('g')
            .attr('class', 'genre-line');
        
        // Draw lines
        lineGroups.append('path')
            .attr('class', 'line')
            .attr('d', d => this.line(d.values))
            .attr('stroke', d => d.color)
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .attr('opacity', 0.8);
        
        // Draw dots
        lineGroups.selectAll('.dot')
            .data(d => d.values.map(v => ({ ...v, genre: d.genre, color: d.color })))
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => this.xScale(d.year))
            .attr('cy', d => this.yScale(d.count))
            .attr('r', d => d.hasEvent ? 6 : 4)
            .attr('fill', d => d.color)
            .attr('stroke', d => d.hasEvent ? '#2c3e50' : 'white')
            .attr('stroke-width', d => d.hasEvent ? 3 : 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.showTooltip(event, d);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });
    }
    
    drawPoliticalEvents() {
        // Remove existing event markers
        this.g.selectAll('.event-marker').remove();
        
        if (!this.data.political_events || this.data.political_events.length === 0) {
            return;
        }
        
        // Limit to 3 events max to avoid overcrowding
        const events = this.data.political_events.slice(0, 3);
        
        // Calculate event positions to avoid overlap
        const eventPositions = events.map((event, index) => ({
            ...event,
            labelY: -50 - (index % 2) * 25, // Alternate height levels
            circleY: -35 - (index % 2) * 15
        }));
        
        // Event markers
        const eventGroups = this.g.selectAll('.event-marker')
            .data(eventPositions)
            .enter()
            .append('g')
            .attr('class', 'event-marker');
        
        // Vertical lines with better styling
        eventGroups.append('line')
            .attr('x1', d => this.xScale(d.year))
            .attr('x2', d => this.xScale(d.year))
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .attr('stroke', d => this.eventTypeColors[d.type] || '#34495e')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '8,4')
            .attr('opacity', 0.6);
        
        // Event labels with better positioning
        eventGroups.append('text')
            .attr('x', d => this.xScale(d.year))
            .attr('y', d => d.labelY)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('fill', d => this.eventTypeColors[d.type] || '#34495e')
            .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
            .text(d => {
                // Truncate long event names
                return d.event.length > 20 ? d.event.substring(0, 18) + '...' : d.event;
            });
        
        // Event symbols with enhanced styling
        eventGroups.append('circle')
            .attr('cx', d => this.xScale(d.year))
            .attr('cy', d => d.circleY)
            .attr('r', d => d.severity === 'high' ? 10 : 8)
            .attr('fill', d => this.eventTypeColors[d.type] || '#34495e')
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .attr('opacity', 0.9)
            .style('cursor', 'pointer')
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))')
            .on('mouseover', (event, d) => {
                // Enhance on hover
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .attr('r', d.severity === 'high' ? 12 : 10)
                    .attr('opacity', 1);
                    
                this.showEventTooltip(event, d);
            })
            .on('mouseout', (event, d) => {
                // Reset on hover out
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .attr('r', d.severity === 'high' ? 10 : 8)
                    .attr('opacity', 0.9);
                    
                this.hideTooltip();
            });
        
        // Add severity indicators
        eventGroups.append('text')
            .attr('x', d => this.xScale(d.year))
            .attr('y', d => d.circleY + 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .attr('pointer-events', 'none')
            .text(d => d.severity === 'high' ? '!' : d.severity === 'medium' ? '•' : '');
    }
    
    addGridLines() {
        // Remove existing grid lines
        this.g.selectAll('.grid-line').remove();
        
        // Horizontal grid lines (Y-axis)
        const yTicks = this.yScale.ticks(8);
        this.g.selectAll('.grid-line-y')
            .data(yTicks)
            .enter()
            .append('line')
            .attr('class', 'grid-line grid-line-y')
            .attr('x1', 0)
            .attr('x2', this.innerWidth)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .style('stroke', '#ecf0f1')
            .style('stroke-width', '1px')
            .style('opacity', 0.7);
        
        // Vertical grid lines (X-axis)
        const xTicks = this.xScale.ticks(12);
        this.g.selectAll('.grid-line-x')
            .data(xTicks)
            .enter()
            .append('line')
            .attr('class', 'grid-line grid-line-x')
            .attr('x1', d => this.xScale(d))
            .attr('x2', d => this.xScale(d))
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .style('stroke', '#ecf0f1')
            .style('stroke-width', '1px')
            .style('opacity', 0.5);
    }

    updateAxisLabels() {
        // Remove existing labels
        this.g.selectAll('.axis-label').remove();
        
        // X-axis label
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text('Year');
        
        // Y-axis label
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text('Number of Movies');
    }
    
    updateTitle() {
        this.titleGroup.selectAll('*').remove();
        
        const countryName = this.data.country.name;
        const dataType = this.showSmoothed ? 'Smoothed' : 'Raw';
        
        this.titleGroup.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', '700')
            .attr('fill', '#2c3e50')
            .text(`Political Events Impact on Cinema: ${countryName}`);
        
        this.titleGroup.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('fill', '#7f8c8d')
            .text(`${dataType} Data • Genre Production Timeline (2000-2024)`);
    }
    
    updateLegends() {
        this.legendsContainer.selectAll('*').remove();
        
        // Genre legend
        const genreLegendDiv = this.legendsContainer
            .append('div')
            .style('flex', '1')
            .style('margin-right', '20px');
        
        genreLegendDiv.append('h4')
            .style('margin', '0 0 15px 0')
            .style('color', '#2c3e50')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .text('🎭 Genres');
        
        const genreList = genreLegendDiv.append('div')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('gap', '15px');
        
        this.genres.forEach(genre => {
            const genreItem = genreList.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '8px');
            
            genreItem.append('div')
                .style('width', '20px')
                .style('height', '3px')
                .style('background', this.colorScale(genre))
                .style('border-radius', '2px');
            
            genreItem.append('span')
                .style('font-size', '13px')
                .style('color', '#2c3e50')
                .style('font-weight', '500')
                .text(genre);
        });
        
        // Event types legend
        if (this.data.political_events.length > 0) {
            const eventTypesUsed = [...new Set(this.data.political_events.map(e => e.type))];
            
            const eventLegendDiv = this.legendsContainer
                .append('div')
                .style('flex', '1');
            
            eventLegendDiv.append('h4')
                .style('margin', '0 0 15px 0')
                .style('color', '#2c3e50')
                .style('font-size', '16px')
                .style('font-weight', '600')
                .text('⚡ Event Types');
            
            const eventList = eventLegendDiv.append('div')
                .style('display', 'flex')
                .style('flex-wrap', 'wrap')
                .style('gap', '15px');
            
            eventTypesUsed.forEach(eventType => {
                const eventItem = eventList.append('div')
                    .style('display', 'flex')
                    .style('align-items', 'center')
                    .style('gap', '8px');
                
                eventItem.append('div')
                    .style('width', '12px')
                    .style('height', '12px')
                    .style('background', this.eventTypeColors[eventType] || '#34495e')
                    .style('border-radius', '50%')
                    .style('border', '2px solid white')
                    .style('box-shadow', '0 0 0 1px #ddd');
                
                eventItem.append('span')
                    .style('font-size', '13px')
                    .style('color', '#2c3e50')
                    .style('font-weight', '500')
                    .text(eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            });
        }
    }
    
    addInteractionOverlay() {
        // Remove existing overlay
        this.g.selectAll('.interaction-overlay').remove();
        
        // Add invisible overlay for year highlighting (but don't block dot hover events)
        this.g.append('rect')
            .attr('class', 'interaction-overlay')
            .attr('width', this.innerWidth)
            .attr('height', this.innerHeight)
            .attr('fill', 'none')
            .attr('pointer-events', 'none')  // Don't block hover events on dots
            .style('z-index', -1);  // Put it behind other elements
            
        // Add year highlighting on chart area hover
        this.g.on('mousemove', (event) => {
            const [mouseX] = d3.pointer(event);
            const year = Math.round(this.xScale.invert(mouseX));
            this.highlightYear(year);
        })
        .on('mouseleave', () => {
            this.clearHighlight();
        });
    }
    
    highlightYear(year) {
        if (year < 2000 || year > 2024) return;
        
        // Highlight vertical line
        this.g.selectAll('.year-highlight').remove();
        
        this.g.append('line')
            .attr('class', 'year-highlight')
            .attr('x1', this.xScale(year))
            .attr('x2', this.xScale(year))
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .attr('stroke', '#bdc3c7')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.8);
        
        // Highlight year dots
        this.g.selectAll('.dot')
            .attr('opacity', d => d.year === year ? 1 : 0.5)
            .attr('r', d => d.year === year ? (d.hasEvent ? 8 : 6) : (d.hasEvent ? 6 : 4));
    }
    
    clearHighlight() {
        this.g.selectAll('.year-highlight').remove();
        this.g.selectAll('.dot')
            .attr('opacity', 1)
            .attr('r', d => d.hasEvent ? 6 : 4);
    }
    
    showTooltip(event, d) {
        try {
            // Validate data exists
            if (!this.data || !this.data.timeline_data || !d) {
                return;
            }

            // Find the year data for context
            const yearData = this.data.timeline_data.find(yd => yd.year === d.year);
            const prevYearData = this.data.timeline_data.find(yd => yd.year === d.year - 1);
            
            if (!yearData) {
                return;
            }
            
            // Calculate percentage change from previous year
            let changePercent = 0;
            let changeIcon = '';
            if (prevYearData && yearData.genre_counts && prevYearData.genre_counts) {
                const currentCount = this.showSmoothed ? yearData.genre_counts[d.genre] : yearData.raw_genre_counts[d.genre];
                const prevCount = this.showSmoothed ? prevYearData.genre_counts[d.genre] : prevYearData.raw_genre_counts[d.genre];
                
                if (prevCount > 0 && currentCount !== undefined && prevCount !== undefined) {
                    changePercent = ((currentCount - prevCount) / prevCount * 100);
                    changeIcon = changePercent > 0 ? '📈' : changePercent < 0 ? '📉' : '➡️';
                }
            }
        
            // Get all genre counts for this year for comparison
            const allGenreCounts = this.genres.map(genre => ({
                genre: genre,
                count: this.showSmoothed ? yearData.genre_counts[genre] : yearData.raw_genre_counts[genre]
            })).sort((a, b) => b.count - a.count);
            
            // Find rank of current genre
            const currentRank = allGenreCounts.findIndex(g => g.genre === d.genre) + 1;
        
            // Build comprehensive tooltip
            let tooltipContent = `
                <div style="max-width: 300px;">
                    <div style="background: ${d.color}; color: white; padding: 8px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center;">
                        ${d.genre} Movies in ${d.year}
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 24px; font-weight: bold; color: ${d.color}; text-align: center;">
                            ${Math.round(d.count)} movies
                        </div>
                        <div style="text-align: center; color: #666; font-size: 12px;">
                            ${this.showSmoothed ? '(3-year average)' : '(raw count)'}
                        </div>
                    </div>
            `;
        
            // Year-over-year change
            if (prevYearData && changePercent !== 0) {
                tooltipContent += `
                    <div style="margin-bottom: 12px; padding: 6px; background: ${changePercent > 0 ? '#e8f5e8' : changePercent < 0 ? '#fde8e8' : '#f5f5f5'}; border-radius: 4px;">
                        <strong>${changeIcon} Year-over-Year:</strong><br/>
                        ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% from ${d.year - 1}
                    </div>
                `;
            }
            
            // Genre ranking
            tooltipContent += `
                <div style="margin-bottom: 12px;">
                    <strong>📊 Genre Ranking:</strong><br/>
                    #${currentRank} of ${this.genres.length} genres this year
                </div>
            `;
            
            // Top 3 genres comparison
            tooltipContent += `
                <div style="margin-bottom: 12px;">
                    <strong>🏆 Top Genres in ${d.year}:</strong><br/>
            `;
            
            allGenreCounts.slice(0, 3).forEach((g, i) => {
                const isCurrentGenre = g.genre === d.genre;
                tooltipContent += `
                    <div style="display: flex; justify-content: space-between; padding: 2px 0; ${isCurrentGenre ? 'background: #f0f8ff; font-weight: bold;' : ''}">
                        <span>${i + 1}. ${g.genre}</span>
                        <span>${Math.round(g.count)}</span>
                    </div>
                `;
            });
            tooltipContent += `</div>`;
            
            // Political events
            if (d.hasEvent && d.events.length > 0) {
                tooltipContent += `
                    <div style="margin-bottom: 12px; padding: 8px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <strong>⚡ Political Events:</strong><br/>
                `;
                d.events.forEach(evt => {
                    const severityColor = evt.severity === 'high' ? '#dc3545' : evt.severity === 'medium' ? '#fd7e14' : '#28a745';
                    tooltipContent += `
                        <div style="margin: 4px 0;">
                            <span style="color: ${severityColor}; font-weight: bold;">•</span> 
                            ${evt.event}<br/>
                            <small style="color: #666; margin-left: 12px;">
                                ${evt.type.replace(/_/g, ' ')} • ${evt.severity} impact
                            </small>
                        </div>
                    `;
                });
                tooltipContent += `</div>`;
            }
            
            // Country context
            const totalMovies = yearData.total_movies || 0;
            const genrePercentage = totalMovies > 0 ? ((d.count / totalMovies) * 100).toFixed(1) : 0;
            
            tooltipContent += `
                <div style="border-top: 1px solid #eee; padding-top: 8px; font-size: 12px; color: #666;">
                    <strong>${this.data.country.name} ${d.year}:</strong><br/>
                    Total movies: ${totalMovies} • ${d.genre}: ${genrePercentage}% of production
                </div>
            `;
            
            tooltipContent += `</div>`;
            
            this.tooltip
                .html(tooltipContent)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .style('max-width', '350px')
                .style('opacity', 1)
                .style('transform', 'translateY(0px)');
                
        } catch (error) {
            // Fallback simple tooltip
            this.tooltip
                .html(`
                    <div style="padding: 8px;">
                        <strong>${d.genre} (${d.year})</strong><br/>
                        Movies: ${Math.round(d.count)}
                    </div>
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .style('opacity', 1)
                .style('transform', 'translateY(0px)');
        }
    }
    
    showEventTooltip(event, d) {
        // Find impact data for this event
        const eventImpacts = this.data.impact_analysis.filter(impact => impact.year === d.year);
        
        // Get event type color
        const eventColor = this.eventTypeColors[d.type] || '#34495e';
        const severityColor = d.severity === 'high' ? '#dc3545' : d.severity === 'medium' ? '#fd7e14' : '#28a745';
        
        let tooltipContent = `
            <div style="max-width: 320px;">
                <div style="background: ${eventColor}; color: white; padding: 10px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center;">
                    ⚡ ${d.event}
                </div>
                
                <div style="margin-bottom: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: ${eventColor};">
                        ${d.date}
                    </div>
                    <div style="color: #666; font-size: 12px; margin-top: 4px;">
                        ${d.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                </div>
                
                <div style="margin-bottom: 12px; padding: 8px; background: ${d.severity === 'high' ? '#fde8e8' : d.severity === 'medium' ? '#fff3cd' : '#e8f5e8'}; border-radius: 4px; text-align: center;">
                    <strong style="color: ${severityColor};">
                        ${d.severity.toUpperCase()} IMPACT EVENT
                    </strong>
                </div>
        `;
        
        // Show cinema impact if available
        if (eventImpacts.length > 0) {
            tooltipContent += `
                <div style="margin-bottom: 12px;">
                    <strong>🎬 Cinema Production Impact:</strong><br/>
            `;
            
            // Group impacts by genre
            const genreImpacts = {};
            eventImpacts.forEach(impact => {
                if (!genreImpacts[impact.genre]) {
                    genreImpacts[impact.genre] = impact;
                }
            });
            
            Object.values(genreImpacts).forEach(impact => {
                const impactColor = impact.immediate_impact < -20 ? '#dc3545' : impact.immediate_impact < -10 ? '#fd7e14' : impact.immediate_impact > 10 ? '#28a745' : '#6c757d';
                const impactIcon = impact.immediate_impact < -10 ? '📉' : impact.immediate_impact > 10 ? '📈' : '➡️';
                
                tooltipContent += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #eee;">
                        <span style="color: ${this.colorScale(impact.genre)}; font-weight: 500;">
                            ${impact.genre}
                        </span>
                        <span style="color: ${impactColor}; font-weight: bold;">
                            ${impactIcon} ${impact.immediate_impact > 0 ? '+' : ''}${impact.immediate_impact.toFixed(1)}%
                        </span>
                    </div>
                `;
            });
            
            tooltipContent += `</div>`;
        }
        
        // Context about the event
        let contextInfo = '';
        switch(d.type) {
            case 'terrorism':
                contextInfo = 'Terrorist attacks often lead to increased security themes and reduced international co-productions.';
                break;
            case 'war':
                contextInfo = 'Military conflicts typically boost action/thriller production while reducing documentaries due to censorship.';
                break;
            case 'economic':
                contextInfo = 'Economic crises usually reduce overall production but may increase social drama content.';
                break;
            case 'domestic_unrest':
                contextInfo = 'Civil unrest often suppresses documentary production while increasing action/thriller content.';
                break;
            case 'health_crisis':
                contextInfo = 'Health emergencies typically increase documentary production while reducing comedy content.';
                break;
            case 'diplomatic':
                contextInfo = 'Diplomatic events can open or close international collaboration opportunities.';
                break;
            case 'sanctions':
                contextInfo = 'Economic sanctions typically reduce international co-productions and overall cinema funding.';
                break;
            default:
                contextInfo = 'Political events can significantly impact national cinema production patterns and content themes.';
        }
        
        tooltipContent += `
            <div style="border-top: 1px solid #eee; padding-top: 8px; font-size: 12px; color: #666; font-style: italic;">
                💡 <strong>Typical Impact:</strong><br/>
                ${contextInfo}
            </div>
        `;
        
        tooltipContent += `</div>`;
        
        this.tooltip
            .html(tooltipContent)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('max-width', '350px')
            .style('opacity', 1)
            .style('transform', 'translateY(0px)');
    }
    
    hideTooltip() {
        this.tooltip
            .style('opacity', 0)
            .style('transform', 'translateY(10px)');
    }
    
    showLoadingState() {
        this.g.selectAll('*').remove();
        
        this.g.append('text')
            .attr('class', 'loading-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('fill', '#3498db')
            .text('🔄 Loading country data...');
        
        this.g.append('text')
            .attr('class', 'loading-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#7f8c8d')
            .text('Please wait while we fetch the political events timeline');
    }
    
    showDataProcessingNeeded(countryCode) {
        this.g.selectAll('*').remove();
        
        const countryNames = {
            'US': 'United States', 'CN': 'China', 'RU': 'Russia', 'IR': 'Iran', 'IN': 'India',
            'JP': 'Japan', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy',
            'ES': 'Spain', 'UA': 'Ukraine', 'TR': 'Turkey', 'CA': 'Canada', 'BR': 'Brazil',
            'MX': 'Mexico', 'KR': 'South Korea', 'AU': 'Australia', 'EG': 'Egypt', 'IL': 'Israel',
            'ZA': 'South Africa', 'NG': 'Nigeria', 'SA': 'Saudi Arabia', 'AR': 'Argentina',
            'ID': 'Indonesia', 'TH': 'Thailand', 'PL': 'Poland', 'SE': 'Sweden'
        };
        
        const countryName = countryNames[countryCode] || countryCode;
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 - 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('fill', '#f39c12')
            .text(`📊 Data Processing Needed`);
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('fill', '#2c3e50')
            .text(`${countryName} Timeline Data`);
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#7f8c8d')
            .text('To generate this data:');
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 45)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('fill', '#27ae60')
            .text('1. Run: python run_political_timeline.py');
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 65)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('fill', '#27ae60')
            .text(`2. Select country: ${countryCode}`);
        
        this.g.append('text')
            .attr('class', 'data-processing-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 85)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('fill', '#27ae60')
            .text('3. Refresh this page');
    }

    showError(message) {
        this.g.selectAll('*').remove();
        
        this.g.append('text')
            .attr('class', 'error-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('fill', '#e74c3c')
            .text('⚠️ Error');
        
        this.g.append('text')
            .attr('class', 'error-text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2 + 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#7f8c8d')
            .text(message);
    }
    
    showInfoModal() {
        const modal = this.container.append('div')
            .attr('class', 'info-modal')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('z-index', 2000)
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center');
        
        const modalContent = modal.append('div')
            .style('background', 'white')
            .style('padding', '30px')
            .style('border-radius', '12px')
            .style('max-width', '700px')
            .style('max-height', '80%')
            .style('overflow-y', 'auto')
            .html(`
                <h2 style="margin-top: 0; color: #2c3e50;">🌍 Political Events Timeline Visualization</h2>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
                    <h3 style="margin-top: 0; color: #27ae60;">🎯 Research Question</h3>
                    <p style="margin-bottom: 0;"><strong>How do dramatic political changes affect the cinema production of different countries?</strong></p>
                </div>
                
                <h3>🎬 Coverage & Scale</h3>
                <ul>
                    <li><strong>20 Countries:</strong> Major powers, Europe, Americas, Asia-Pacific</li>
                    <li><strong>3 Key Events per Country:</strong> Curated to avoid overcrowding</li>
                    <li><strong>5 Genre Analysis:</strong> Drama, Documentary, Comedy, Action, Thriller</li>
                    <li><strong>24-Year Timeline:</strong> 2000-2024 comprehensive coverage</li>
                </ul>
                
                <h3>✨ Advanced Features</h3>
                <ul>
                    <li><strong>🎯 Smart Event Display:</strong> Max 3 events shown to prevent crowding</li>
                    <li><strong>📊 Rich Hover Tooltips:</strong> Detailed statistics, rankings, and context</li>
                    <li><strong>📈 Data Smoothing:</strong> Toggle 3-year moving average vs raw data</li>
                    <li><strong>🔍 Visual Hierarchy:</strong> Event severity indicators and color coding</li>
                    <li><strong>🌐 Geographic Organization:</strong> Countries grouped by region</li>
                    <li><strong>🛡️ Robust Error Handling:</strong> Graceful fallbacks for missing data</li>
                </ul>
                
                <h3>🔬 Expected Research Insights</h3>
                <ul>
                    <li>📉 <strong>Documentary Censorship:</strong> Production drops during political crackdowns</li>
                    <li>🎭 <strong>Drama Response:</strong> Social commentary films show immediate impact</li>
                    <li>😂 <strong>Comedy as Coping:</strong> Humor increases during difficult times</li>
                    <li>⏱️ <strong>Recovery Patterns:</strong> Vary by country and regime type</li>
                    <li>🔄 <strong>Anticipatory Changes:</strong> Some shifts occur before major events</li>
                    <li>🌍 <strong>Cultural Patterns:</strong> Regional similarities in cinema responses</li>
                </ul>
                
                <h3>📊 Data & Methodology</h3>
                <p><strong>Primary Source:</strong> IMDb Official Datasets (title.basics.tsv + title.akas.tsv)<br/>
                <strong>Political Events:</strong> Curated database of 60 major events across 20 countries<br/>
                <strong>Processing:</strong> Python-based pipeline with statistical analysis<br/>
                <strong>Visualization:</strong> D3.js v7 with custom interaction design</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #6c757d;">
                    <strong>💡 Usage Tip:</strong> Start with major powers (US, China, Russia) to see clear patterns, then explore regional differences in Europe and other continents.
                </div>
                
                <button id="closeModal" style="margin-top: 20px; padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    🔍 Explore the Data
                </button>
            `);
        
        modalContent.select('#closeModal').on('click', () => {
            modal.remove();
        });
        
        modal.on('click', (event) => {
            if (event.target === modal.node()) {
                modal.remove();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the right page
    if (document.getElementById('political-timeline-container')) {
        window.politicalTimeline = new PoliticalEventsTimeline('#political-timeline-container');
    }
});