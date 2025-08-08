// Chart Base Class
class BaseChart {
    constructor(selector, data, crisisData) {
        this.selector = selector;
        this.data = data;
        this.crisisData = crisisData;
        this.svg = null;
        this.margin = { top: 80, right: 250, bottom: 60, left: 140 }; // Increased top margin to 80px
        this.width = 1200 - this.margin.left - this.margin.right; // Increased width from 1000 to 1200
        this.height = 600 - this.margin.top - this.margin.bottom; // Increased height from 500 to 600
        this.tooltipTimeout = null;
        this.tooltipVisible = false;
        this.currentTooltipElement = null;
        
        // Ensure chart is not in loading state
        const chartElement = d3.select(this.selector).node();
        if (chartElement && chartElement.classList.contains('loading')) {
            chartElement.classList.remove('loading');
            console.log("Removed loading class from chart constructor:", this.selector);
        }
        
        // Color schemes
        this.genreColors = {
            'Drama': '#e74c3c',
            'Action': '#3498db',
            'Comedy': '#f39c12',
            'Horror': '#9b59b6',
            'Documentary': '#2ecc71',
            'Thriller': '#e67e22',
            'Romance': '#e91e63',
            'Crime': '#795548',
            'Adventure': '#00bcd4',
            'Sci-Fi': '#607d8b'
        };
        
        this.hebrewToEnglish = {
            'דרמה': 'Drama',
            'אקשן': 'Action',
            'קומדיה': 'Comedy',
            'אימה': 'Horror',
            'דוקומנטרי': 'Documentary',
            'מותחן': 'Thriller',
            'רומנטיקה': 'Romance',
            'פשע': 'Crime',
            'הרפתקאות': 'Adventure',
            'מדע בדיוני': 'Sci-Fi'
        };
    }

    createSVG() {
        d3.select(this.selector).selectAll("*").remove();
        
        this.svg = d3.select(this.selector)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    showTooltip(event, content) {
        // Prevent multiple tooltips
        if (this.tooltipVisible && this.currentTooltipElement === event.target) {
            return;
        }
        
        // Clear any existing timeout
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        
        // Ensure current element is not blocked by loading state
        const chartElement = d3.select(this.selector).node();
        if (chartElement && chartElement.classList.contains('loading')) {
            chartElement.classList.remove('loading');
            console.log("Removed loading class from", this.selector);
        }
        
        const tooltip = d3.select("#tooltip");
        
        // If content is HTML string, use it directly
        if (typeof content === 'string' && content.includes('<div')) {
            tooltip.html(content);
        } else {
            // Otherwise, wrap inside div
            tooltip.html(`<div>${content}</div>`);
        }
        
        // Show tooltip with optimized delay
        this.tooltipTimeout = setTimeout(() => {
            // Only show if still hovering over the same element
            if (this.currentTooltipElement === event.target) {
                tooltip.style("display", "block")
                    .style("opacity", 0)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 40) + "px")
                    .transition()
                    .duration(100)
                    .style("opacity", 0.95);
                
                // Update state
                this.tooltipVisible = true;
            }
        }, 80);
        
        // Set current element immediately
        this.currentTooltipElement = event.target;
            
        console.log("Tooltip shown:", content); // Debug
    }

    hideTooltip() {
        // Clear any existing timeout
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        
        // Hide tooltip with optimized delay
        this.tooltipTimeout = setTimeout(() => {
            d3.select("#tooltip")
                .transition()
                .duration(100)
                .style("opacity", 0)
                .on("end", function() {
                    d3.select(this).style("display", "none");
                });
            
            // Update state
            this.tooltipVisible = false;
            this.currentTooltipElement = null;
        }, 50);
    }

    addCrisisMarkers() {
        // Check if xScale exists
        if (!this.xScale) {
            console.warn('xScale not defined, skipping crisis markers');
            return;
        }
        
        // Define crisis years from the data
        const crisisYears = [2001, 2008, 2020, 2022, 2023];
        const crisisNames = {
            2001: "September 11 attacks",
            2008: "Global Economic Crisis", 
            2020: "COVID-19 Pandemic",
            2022: "Russia-Ukraine War",
            2023: "October 7 Attack"
        };
        
        crisisYears.forEach((year, index) => {
            const xPosition = this.xScale(year);
            
            // Check if position is valid
            if (isNaN(xPosition)) {
                console.warn(`Invalid x position for year ${year}: ${xPosition}`);
                return;
            }
            
            this.svg.append("line")
                .attr("class", "crisis-marker")
                .attr("x1", xPosition)
                .attr("x2", xPosition)
                .attr("y1", 0)
                .attr("y2", this.height)
                .style("cursor", "pointer")
                .on("mouseenter", (event) => {
                    this.showTooltip(event, `<strong>${year}</strong><br/>${crisisNames[year]}`);
                })
                .on("mouseleave", () => {
                    this.hideTooltip();
                });

            // Position labels at different heights to prevent overlap
            const yPosition = 15 + (index % 3) * 20;
            
            // Shorten labels
            const shortLabels = {
                "September 11 attacks": "9/11",
                "Global Economic Crisis": "2008",
                "COVID-19 Pandemic": "COVID",
                "Russia-Ukraine War": "Ukraine",
                "October 7 Attack": "Oct 7"
            };
            
            const shortLabel = shortLabels[crisisNames[year]] || year.toString();
            
            // White background for label
            this.svg.append("text")
                .attr("class", "crisis-label-bg")
                .attr("x", xPosition + 5)
                .attr("y", yPosition)
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .style("stroke", "white")
                .style("stroke-width", "3px")
                .text(shortLabel);
            
            // The label itself
            this.svg.append("text")
                .attr("class", "crisis-label")
                .attr("x", xPosition + 5)
                .attr("y", yPosition)
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .text(shortLabel);
        });
    }
}

// Line Chart Class - Enhanced
class LineChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.showSmoothed = false; // Add smoothing state
        this.init();
    }

    init() {
        console.log('🎨 Creating line chart...');
        this.createSVG();
        this.setupScales();
        this.createAxes();
        this.createGrid();
        this.addCrisisMarkers();
        this.createLines();
        this.createLegend();
        console.log('✅ Line chart created successfully');
    }

    setupScales() {
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.year))
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => Math.max(d.Drama, d.Action, d.Comedy, d.Horror, d.Documentary))])
            .range([this.height, 0]);

        this.colorScale = d3.scaleOrdinal()
            .domain(['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'])
            .range([this.genreColors.Drama, this.genreColors.Action, this.genreColors.Comedy, 
                   this.genreColors.Horror, this.genreColors.Documentary]);
    }

    createAxes() {
        // X Axis - Enhanced
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale)
                .tickFormat(d3.format("d"))
                .ticks(10))
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Y Axis - Enhanced
        this.svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Axis labels - Enhanced
        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left + 20)
            .attr("x", 0 - (this.height / 2))
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("Number of Movies");

        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${this.width / 2}, ${this.height + 50})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "500")
            .style("fill", "#666")
            .text("Year");
    }

    createGrid() {
        console.log('📐 Creating grid...');
        
        // Grid lines - only horizontal lines
        this.svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat(""));
        
        console.log('✅ Grid created successfully');
    }

    createLines(dataToUse = this.data) {
        const line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        genres.forEach(genre => {
            const data = dataToUse.map(d => ({
                year: d.year,
                value: d[genre],
                isCrisis: d.isCrisis
            }));

            // Create line path - Enhanced
            this.svg.append("path")
                .datum(data)
                .attr("class", `genre-line line-${genre}`)
                .attr("fill", "none")
                .attr("stroke", this.colorScale(genre))
                .attr("stroke-width", 4)
                .attr("d", line)
                .style("opacity", 0.8)
                .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");

            // Create dots - Enhanced
            this.svg.selectAll(`.dot-${genre}`)
                .data(data)
                .enter().append("circle")
                .attr("class", `dot dot-${genre}`)
                .attr("cx", d => this.xScale(d.year))
                .attr("cy", d => this.yScale(d.value))
                .attr("r", d => d.isCrisis ? 8 : 5)
                .attr("fill", this.colorScale(genre))
                .attr("stroke", d => d.isCrisis ? "#e74c3c" : "white")
                .attr("stroke-width", d => d.isCrisis ? 3 : 2)
                .style("cursor", "pointer")
                .style("transition", "all 0.3s ease")
                .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                .on("mouseenter", (event, d) => {
                    // Get comprehensive data for this point
                    const crisisYear = this.currentCrisis;
                    const isCrisisYear = d.year === parseInt(crisisYear);
                    const previousYear = d.year - 1;
                    const nextYear = d.year + 1;
                    
                    // Get data for trend analysis
                    const previousData = this.data.find(item => item.year === previousYear);
                    const nextData = this.data.find(item => item.year === nextYear);
                    const previousValue = previousData ? previousData[genre] : 0;
                    const nextValue = nextData ? nextData[genre] : 0;
                    
                    // Calculate trends
                    const yearChange = previousData ? ((d.value - previousValue) / previousValue) * 100 : 0;
                    const nextYearChange = nextData ? ((nextValue - d.value) / d.value) * 100 : 0;
                    
                    // Get total movies this year
                    const totalMovies = this.data.find(item => item.year === d.year)?.total || 0;
                    const genrePercentage = totalMovies > 0 ? (d.value / totalMovies) * 100 : 0;
                    
                    // Crisis analysis
                    const crisisImpact = isCrisisYear ? 
                        (previousData ? ((d.value - previousValue) / previousValue) * 100 : 0) : 0;
                    
                    // Add smoothing indicator
                    const smoothingText = this.showSmoothed ? " (3-year average)" : "";
                    
                    this.showTooltip(event, 
                        `<div style="background: linear-gradient(135deg, ${this.colorScale(genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                            <h4 style="margin: 0 0 10px 0; font-size: 16px;">📈 ${genre} - ${d.year}${smoothingText}</h4>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <strong>🎬 Production Data:</strong><br/>
                                <strong>Movies:</strong> ${d.value.toLocaleString()}<br/>
                                <strong>Total Production:</strong> ${totalMovies.toLocaleString()}<br/>
                                <strong>Market Share:</strong> ${genrePercentage.toFixed(1)}%<br/><br/>
                                
                                <strong>📊 Trend Analysis:</strong><br/>
                                ${previousData ? `<strong>Previous Year (${previousYear}):</strong> ${previousValue.toLocaleString()}<br/>` : ''}
                                ${nextData ? `<strong>Next Year (${nextYear}):</strong> ${nextValue.toLocaleString()}<br/>` : ''}
                                <strong>Year Change:</strong> <span style="color: ${yearChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${yearChange >= 0 ? '+' : ''}${yearChange.toFixed(1)}%</span><br/>
                                ${nextData ? `<strong>Next Year Change:</strong> <span style="color: ${nextYearChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${nextYearChange >= 0 ? '+' : ''}${nextYearChange.toFixed(1)}%</span><br/>` : ''}<br/>
                                
                                ${isCrisisYear ? `
                                <strong>🔥 Crisis Impact:</strong><br/>
                                <span style="color: #e74c3c; font-weight: bold;">Crisis Year Impact: ${crisisImpact >= 0 ? '+' : ''}${crisisImpact.toFixed(1)}%</span><br/>
                                <span style="color: #e74c3c; font-weight: bold;">${crisisImpact < -5 ? 'Strong negative impact' : crisisImpact < -2 ? 'Moderate impact' : 'Minimal impact'}</span>
                                ` : ''}
                            </div>
                        </div>`
                    );
                })
                .on("mouseleave", () => {
                    this.hideTooltip();
                });
        });
    }

    createLegend() {
        console.log('🏷️ Creating legend...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 120}, 20)`);

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const genreNames = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        // Add legend title - Enhanced
        legend.append("text")
            .attr("x", 60)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("Genres");
        
        genres.forEach((genre, i) => {
            const legendRow = legend.append("g")
                .attr("class", `legend-${genre}`)
                .attr("transform", `translate(0, ${i * 35 + 30})`)
                .style("cursor", "pointer")
                .on("click", () => this.toggleGenre(genre));

            // Text in the color of the genre - no rectangles needed
            console.log(`LineChart Genre: ${genre}, Color: ${this.genreColors[genre]}`);
            legendRow.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("dominant-baseline", "middle")
                .attr("text-anchor", "start")
                .attr("fill", this.genreColors[genre])
                .attr("style", `fill: ${this.genreColors[genre]} !important; color: ${this.genreColors[genre]} !important; font-size: 16px; font-weight: 600;`)
                .text(genreNames[i]);
        });
        console.log('✅ Legend created successfully');
    }

    toggleGenre(selectedGenre) {
        const isVisible = this.svg.select(`.line-${selectedGenre}`).style("opacity") !== "0.1";
        
        if (isVisible) {
            // Hide genre
            this.svg.select(`.line-${selectedGenre}`).style("opacity", 0.1);
            this.svg.selectAll(`.dot-${selectedGenre}`).style("opacity", 0.1);
            this.svg.select(`.legend-${selectedGenre}`).style("opacity", 0.5);
        } else {
            // Show genre
            this.svg.select(`.line-${selectedGenre}`).style("opacity", 0.8);
            this.svg.selectAll(`.dot-${selectedGenre}`).style("opacity", 1);
            this.svg.select(`.legend-${selectedGenre}`).style("opacity", 1);
        }
    }

    filterByGenre(selectedGenre) {
        if (selectedGenre === "all") {
            // Show all genres
            this.svg.selectAll(".genre-line").style("opacity", 0.8);
            this.svg.selectAll(".dot").style("opacity", 1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 1);
        } else {
            // Hide all, then show only selected genre
            this.svg.selectAll(".genre-line").style("opacity", 0.1);
            this.svg.selectAll(".dot").style("opacity", 0.1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 0.3);
            
            // Show only the selected genre
            const selectedLine = this.svg.select(`.line-${selectedGenre}`);
            const selectedDots = this.svg.selectAll(`.dot-${selectedGenre}`);
            const selectedLegend = this.svg.select(`.legend-${selectedGenre}`);
            
            if (!selectedLine.empty()) {
                selectedLine.style("opacity", 0.8);
            }
            if (!selectedDots.empty()) {
                selectedDots.style("opacity", 1);
            }
            if (!selectedLegend.empty()) {
                selectedLegend.style("opacity", 1);
            }
        }
    }

    getHebrewGenre(genre) {
        // Return English genre names directly
        return genre;
    }

    toggleSmoothing(showSmoothed) {
        this.showSmoothed = showSmoothed;
        this.updateLines();
    }

    updateLines() {
        // Clear existing lines and dots
        this.svg.selectAll('.genre-line, .dot').remove();
        
        // Create smoothed or raw data
        const lineData = this.showSmoothed ? this.createSmoothedData() : this.data;
        
        // Redraw lines
        this.createLines(lineData);
    }

    createSmoothedData() {
        // Apply 3-year moving average smoothing
        const smoothedData = [];
        
        for (let i = 0; i < this.data.length; i++) {
            const year = this.data[i].year;
            const smoothed = {};
            
            // For each genre, calculate 3-year average
            ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'].forEach(genre => {
                let sum = 0;
                let count = 0;
                
                // Look at current year and 2 previous years
                for (let j = Math.max(0, i - 2); j <= i; j++) {
                    if (this.data[j] && this.data[j][genre]) {
                        sum += this.data[j][genre];
                        count++;
                    }
                }
                
                smoothed[genre] = count > 0 ? Math.round(sum / count) : 0;
            });
            
            smoothed.year = year;
            smoothed.isCrisis = this.data[i].isCrisis;
            smoothed.total = this.data[i].total;
            smoothedData.push(smoothed);
        }
        
        return smoothedData;
    }
}

// Bar Chart Class
class BarChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.currentCrisis = "2008";
        this.showPercentages = true; // Default to show percentages
        this.init();
    }

    init() {
        this.createSVG();
        this.updateChart();
    }

    updateChart() {
        this.svg.selectAll("*").remove();
        
        const data = this.data[this.currentCrisis].map(d => ({
            genre: d.genre_en || d.genre,
            before: d.before,
            after: d.after,
            change: d.change
        }));
        
        this.setupScales(data);
        this.createAxes();
        this.createBars(data);
    }

    setupScales(data) {
        this.xScale = d3.scaleBand()
            .range([0, this.width])
            .domain(data.map(d => d.genre))
            .padding(0.2);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.before, d.after))])
            .range([this.height, 0]);

        this.colorScale = d3.scaleOrdinal()
            .domain(['before', 'after'])
            .range(['#3498db', '#e74c3c']);
    }

    createAxes() {
        // X Axis
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Y Axis
        this.svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))
            .selectAll("text")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Axis labels
        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left + 15)
            .attr("x", 0 - (this.height / 2))
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("Number of Movies");
    }

    createBars(data) {
        const barWidth = this.xScale.bandwidth() / 2;

        // Before bars
        this.svg.selectAll(".bar-before")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-before")
            .attr("x", d => this.xScale(d.genre))
            .attr("width", barWidth)
            .attr("y", d => this.yScale(d.before))
            .attr("height", d => this.height - this.yScale(d.before))
            .attr("fill", this.colorScale('before'))
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                // Get comprehensive data for this genre and crisis
                const crisisYear = parseInt(this.currentCrisis);
                const beforeYear = crisisYear - 1;
                const afterYear = crisisYear + 1;
                
                // Get production data from lineChartData (this.crisisData)
                const beforeData = this.crisisData.find(item => item.year === beforeYear);
                const afterData = this.crisisData.find(item => item.year === afterYear);
                const crisisData = this.crisisData.find(item => item.year === crisisYear);
                
                // Get production counts for this genre
                const beforeCount = beforeData ? beforeData[d.genre] || 0 : 0;
                const afterCount = afterData ? afterData[d.genre] || 0 : 0;
                const crisisCount = crisisData ? crisisData[d.genre] || 0 : 0;
                
                // Calculate total production
                const beforeTotal = beforeData ? beforeData.total || 0 : 0;
                const afterTotal = afterData ? afterData.total || 0 : 0;
                const crisisTotal = crisisData ? crisisData.total || 0 : 0;
                
                // Calculate market shares
                const beforeShare = beforeTotal > 0 ? (beforeCount / beforeTotal) * 100 : 0;
                const afterShare = afterTotal > 0 ? (afterCount / afterTotal) * 100 : 0;
                
                // Calculate production trends
                const productionChange = beforeTotal > 0 ? ((afterTotal - beforeTotal) / beforeTotal) * 100 : 0;
                const ratingChange = d.change;
                
                console.log('🔍 BarChart tooltip data:', {
                    crisisYear, beforeYear, afterYear,
                    beforeData, afterData, crisisData,
                    beforeCount, afterCount, beforeTotal, afterTotal,
                    beforeShare, afterShare, productionChange, ratingChange
                });
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('before')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">⭐ ${d.genre} - Before Crisis</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>📊 Rating Data:</strong><br/>
                            <strong>Average Rating:</strong> ${d.before.toFixed(1)}/10 (${beforeYear})<br/>
                            <strong>Movies Produced:</strong> ${beforeCount.toLocaleString()}<br/>
                            <strong>Market Share:</strong> ${beforeShare.toFixed(1)}%<br/><br/>
                            
                            <strong>📈 Crisis Analysis:</strong><br/>
                            <strong>After Crisis Rating:</strong> ${d.after.toFixed(1)}/10 (${afterYear})<br/>
                            <strong>Rating Change:</strong> <span style="color: ${ratingChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${ratingChange >= 0 ? '+' : ''}${ratingChange.toFixed(1)}%</span><br/>
                            <strong>Production Change:</strong> <span style="color: ${productionChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${productionChange >= 0 ? '+' : ''}${productionChange.toFixed(1)}%</span><br/><br/>
                            
                            <strong>📊 Market Impact:</strong><br/>
                            <strong>Share Change:</strong> <span style="color: ${(afterShare - beforeShare) >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${(afterShare - beforeShare) >= 0 ? '+' : ''}${(afterShare - beforeShare).toFixed(1)}%</span><br/>
                            <strong>Performance:</strong> ${ratingChange > productionChange ? 'Rating outperformed production' : ratingChange < productionChange ? 'Rating underperformed production' : 'Rating matched production'}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // After bars
        this.svg.selectAll(".bar-after")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-after")
            .attr("x", d => this.xScale(d.genre) + barWidth)
            .attr("width", barWidth)
            .attr("y", d => this.yScale(d.after))
            .attr("height", d => this.height - this.yScale(d.after))
            .attr("fill", this.colorScale('after'))
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                // Get comprehensive data for this genre and crisis
                const crisisYear = parseInt(this.currentCrisis);
                const beforeYear = crisisYear - 1;
                const afterYear = crisisYear + 1;
                
                // Get production data from lineChartData (this.crisisData)
                const beforeData = this.crisisData.find(item => item.year === beforeYear);
                const afterData = this.crisisData.find(item => item.year === afterYear);
                const crisisData = this.crisisData.find(item => item.year === crisisYear);
                
                // Get production counts for this genre
                const beforeCount = beforeData ? beforeData[d.genre] || 0 : 0;
                const afterCount = afterData ? afterData[d.genre] || 0 : 0;
                const crisisCount = crisisData ? crisisData[d.genre] || 0 : 0;
                
                // Calculate total production
                const beforeTotal = beforeData ? beforeData.total || 0 : 0;
                const afterTotal = afterData ? afterData.total || 0 : 0;
                const crisisTotal = crisisData ? crisisData.total || 0 : 0;
                
                // Calculate market shares
                const beforeShare = beforeTotal > 0 ? (beforeCount / beforeTotal) * 100 : 0;
                const afterShare = afterTotal > 0 ? (afterCount / afterTotal) * 100 : 0;
                
                // Calculate production trends
                const productionChange = beforeTotal > 0 ? ((afterTotal - beforeTotal) / beforeTotal) * 100 : 0;
                const ratingChange = d.change;
                
                console.log('🔍 BarChart tooltip data:', {
                    crisisYear, beforeYear, afterYear,
                    beforeData, afterData, crisisData,
                    beforeCount, afterCount, beforeTotal, afterTotal,
                    beforeShare, afterShare, productionChange, ratingChange
                });
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('after')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">⭐ ${d.genre} - After Crisis</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>📊 Rating Data:</strong><br/>
                            <strong>Average Rating:</strong> ${d.after.toFixed(1)}/10 (${afterYear})<br/>
                            <strong>Movies Produced:</strong> ${afterCount.toLocaleString()}<br/>
                            <strong>Market Share:</strong> ${afterShare.toFixed(1)}%<br/><br/>
                            
                            <strong>📈 Recovery Analysis:</strong><br/>
                            <strong>Before Crisis Rating:</strong> ${d.before.toFixed(1)}/10 (${beforeYear})<br/>
                            <strong>Rating Recovery:</strong> <span style="color: ${ratingChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${ratingChange >= 0 ? '+' : ''}${ratingChange.toFixed(1)}%</span><br/>
                            <strong>Market Recovery:</strong> <span style="color: ${productionChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${productionChange >= 0 ? '+' : ''}${productionChange.toFixed(1)}%</span><br/><br/>
                            
                            <strong>📊 Recovery Assessment:</strong><br/>
                            <strong>Share Recovery:</strong> <span style="color: ${(afterShare - beforeShare) >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${(afterShare - beforeShare) >= 0 ? '+' : ''}${(afterShare - beforeShare).toFixed(1)}%</span><br/>
                            <strong>Recovery Status:</strong> ${ratingChange > productionChange ? 'Strong recovery' : ratingChange < productionChange ? 'Weak recovery' : 'Average recovery'}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // Change percentage labels
        this.svg.selectAll(".change-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "change-label")
            .attr("x", d => this.xScale(d.genre) + this.xScale.bandwidth() / 2)
            .attr("y", d => Math.min(this.yScale(d.before), this.yScale(d.after)) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", d => d.change > 0 ? "#27ae60" : "#e74c3c")
            .text(d => `${d.change > 0 ? '+' : ''}${d.change}%`);

        // Legend
        console.log('🏷️ Creating bar legend...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 120}, 50)`);

        // Add legend title
        legend.append("text")
            .attr("x", 60)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("Periods");

        const legendData = [
            { label: "Before Crisis", color: this.colorScale('before') },
            { label: "After Crisis", color: this.colorScale('after') }
        ];

        legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", (d, i) => `legend-${i === 0 ? 'before' : 'after'}`)
            .attr("transform", (d, i) => `translate(0, ${i * 30 + 20})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => this.togglePeriod(d.label))
            .each(function(d) {
                const item = d3.select(this);
                
                // Text in the color of the period - uniform style
                console.log(`BarChart Period: ${d.label}, Color: ${d.color}`);
                item.append("text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("dominant-baseline", "middle")
                    .attr("text-anchor", "start")
                    .attr("fill", d.color)
                    .attr("style", `fill: ${d.color} !important; color: ${d.color} !important; font-size: 16px; font-weight: 600;`)
                    .text(d.label);
            });
        console.log('✅ Bar legend created successfully');
    }

    updateCrisis(crisis) {
        this.currentCrisis = crisis;
        this.updateChart();
    }

    togglePeriod(period) {
        console.log(`BarChart togglePeriod called with: ${period}`);
        
        const legendKey = period === "Before Crisis" ? 'before' : 'after';
        const legendElement = this.svg.select(`.legend-${legendKey}`);
        
        if (legendElement.empty()) {
            console.warn(`Legend element for ${period} not found`);
            return;
        }
        
        const isVisible = legendElement.style("opacity") !== "0.5";
        console.log(`Is visible: ${isVisible}`);
        
        if (isVisible) {
            // Hide period - only specific bars
            legendElement.style("opacity", 0.5);
            this.svg.selectAll(`.bar`)
                .filter(d => d.period === period)
                .style("opacity", 0.1);
        } else {
            // Show period - only specific bars
            legendElement.style("opacity", 1);
            this.svg.selectAll(`.bar`)
                .filter(d => d.period === period)
                .style("opacity", 0.8);
        }
    }

    togglePercentages(showPercentages) {
        this.showPercentages = showPercentages;
        
        // Update percentage labels visibility
        this.svg.selectAll('.change-label')
            .style('display', showPercentages ? 'block' : 'none');
    }
}

// Pie Chart Class - Enhanced
class PieChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.currentYear = "2008";
        this.displayMode = "percentage"; // ברירת מחדל - אחוזים
        this.showComparison = false; // ברירת מחדל - לא להראות השוואה
        this.showPercentages = true; // ברירת מחדל - להציג אחוזים
        this.radius = Math.min(this.width, this.height) / 2 - 40;
        // הגדל את ה-margin הימני עבור גרף העוגה
        this.margin.right = 350;
        this.width = 1200 - this.margin.left - this.margin.right;
        this.init();
    }

    init() {
        this.createSVG();
        this.setupPieGenerator();
        this.updateChart();
    }

    setupPieGenerator() {
        this.pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        this.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.radius);

        this.labelArc = d3.arc()
            .innerRadius(this.radius * 0.6)
            .outerRadius(this.radius * 0.6);
    }

    updateChart() {
        this.svg.selectAll("*").remove();
        
        // Always show single chart, no comparison
        this.showComparison = false;
        this.createSingleChart();
    }

    createSingleChart() {
        console.log('🥧 Creating single pie chart...');
        const data = this.data[this.currentYear] || [];
        
        if (data.length === 0) {
            this.svg.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("fill", "#2c3e50")
                .text("No data available");
            return;
        }

        // Define the 5 main genres
        const mainGenres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        // Process data to show only 5 main genres + "Others"
        const processedData = [];
        let othersCount = 0;
        let othersPercentage = 0;
        
        data.forEach(item => {
            if (mainGenres.includes(item.genre)) {
                processedData.push(item);
            } else {
                othersCount += item.count;
                othersPercentage += item.percentage;
            }
        });
        
        // Add "Others" category if there are other genres
        if (othersCount > 0) {
            processedData.push({
                genre: 'Others',
                genre_en: 'Others',
                count: othersCount,
                percentage: othersPercentage
            });
        }

        // Create consistent color scale for main genres + others
        const colorScale = d3.scaleOrdinal()
            .domain(processedData.map(d => d.genre_en || d.genre))
            .range(processedData.map(d => {
                const colorMap = {
                    'Drama': '#e74c3c',
                    'Action': '#3498db', 
                    'Comedy': '#f39c12',
                    'Horror': '#9b59b6',
                    'Documentary': '#2ecc71',
                    'Others': '#95a5a6' // Gray color for others
                };
                return colorMap[d.genre_en || d.genre] || '#2c3e50';
            }));
        
        // Center the pie chart
        const g = this.svg.append("g")
            .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

        // Create pie data
        const pieData = this.pie(processedData);

        // Precompute total for dynamic percentage (use counts of processedData including Others)
        const dynamicTotal = processedData.reduce((s, x) => s + (x.count || 0), 0);

        // Create pie slices
        const slices = g.selectAll(".slice")
            .data(pieData)
            .enter()
            .append("g")
            .attr("class", "slice");

        slices.append("path")
            .attr("d", this.arc)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                // Market Data + genre-specific Crisis Impact
                const crisisYear = parseInt(this.currentYear);
                const beforeYear = crisisYear - 1;
                const crisisData = this.crisisData?.find(item => item.year === crisisYear);
                const crisisTotal = crisisData ? (crisisData.total || dynamicTotal) : dynamicTotal;
                const crisisCount = d.data.count;
                const currentShare = crisisTotal > 0 ? (crisisCount / crisisTotal) * 100 : 0;
                
                const beforeData = this.crisisData?.find(item => item.year === beforeYear);
                const beforeTotalLine = beforeData ? beforeData.total || 0 : 0;
                
                // Use pie data for robust per-genre previous-year count (handles 'Others')
                const mainGenres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
                const prevPie = (this.data && this.data[beforeYear]) ? this.data[beforeYear] : [];
                const beforeTotalPie = prevPie.reduce((s,x)=>s + (x.count||0), 0);
                const beforeTotal = beforeTotalPie > 0 ? beforeTotalPie : beforeTotalLine;
                
                const genreKey = d.data.genre_en || d.data.genre;
                let beforeGenreCount = 0;
                if (genreKey === 'Others') {
                    if (prevPie.length > 0) {
                        // Sum all non-main genres for 'Others' from pie data
                        beforeGenreCount = prevPie
                            .filter(x => !mainGenres.includes(x.genre))
                            .reduce((s,x)=>s + (x.count||0), 0);
                    } else if (beforeData) {
                        // Fallback: derive 'Others' from line data totals
                        const mainSum = (beforeData.Drama||0) + (beforeData.Action||0) + (beforeData.Comedy||0) + (beforeData.Horror||0) + (beforeData.Documentary||0);
                        beforeGenreCount = Math.max((beforeData.total||0) - mainSum, 0);
                    }
                } else {
                    const prevItem = prevPie.find(x => (x.genre_en || x.genre) === genreKey || x.genre === genreKey);
                    beforeGenreCount = prevItem ? prevItem.count : (beforeData ? (beforeData[genreKey] || 0) : 0);
                }
                
                const productionChange = beforeTotalLine > 0 ? ((crisisTotal - beforeTotalLine) / beforeTotalLine) * 100 : 0;
                const beforeShare = beforeTotal > 0 ? (beforeGenreCount / beforeTotal) * 100 : 0;
                let shareChange = beforeShare > 0 ? ((currentShare - beforeShare) / beforeShare) * 100 : 0;
                // Avoid displaying 0.0% when there is a tiny non-zero change
                let shareChangeDisplay = shareChange;
                if (shareChange !== 0 && Math.abs(shareChange) < 0.1) {
                    shareChangeDisplay = shareChange > 0 ? 0.1 : -0.1;
                }
                const performanceText = shareChange > productionChange ? 'Outperformed market' : shareChange < productionChange ? 'Underperformed market' : 'Matched market';
                
                this.showTooltip(event, 
                    `<div style=\"background: linear-gradient(135deg, ${colorScale(d.data.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);\">\n                        <h4 style=\"margin: 0 0 10px 0; font-size: 16px;\">🎬 ${d.data.genre} - ${crisisYear}</h4>\n                        <div style=\"font-size: 14px; line-height: 1.6;\">\n                            <strong>📊 Market Data:</strong><br/>\n                            <strong>Movies:</strong> ${crisisCount.toLocaleString()}<br/>\n                            <strong>Market Share:</strong> ${currentShare.toFixed(1)}%<br/>\n                            <strong>Total Production:</strong> ${crisisTotal.toLocaleString()}<br/><br/>\n                            <strong>🔥 Crisis Impact (genre):</strong><br/>\n                            <strong>Market Production Change:</strong> <span style=\"color: ${productionChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;\">${productionChange >= 0 ? '+' : ''}${productionChange.toFixed(1)}%</span><br/>\n                            <strong>Genre Share Change vs prev. year:</strong> <span style=\"color: ${shareChangeDisplay >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;\">${shareChangeDisplay >= 0 ? '+' : ''}${shareChangeDisplay.toFixed(1)}%</span><br/>\n                            <strong>Performance:</strong> ${performanceText}\n                        </div>\n                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // Update labels to use dynamic percentage
        slices.append("text")
            .attr("transform", d => `translate(${this.arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
            .text(d => {
                if (!this.showPercentages) return '';
                const pct = dynamicTotal > 0 ? (d.data.count / dynamicTotal) * 100 : 0;
                return pct >= 3 ? `${pct.toFixed(1)}%` : '';
            });

        // Create legend
        this.createPieLegend(g, processedData, colorScale);
        
        console.log('✅ Single pie chart created successfully');
    }

    createPieLegend(g, data, colorScale) {
        console.log('🏷️ Creating pie legend...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 200}, 100)`);

        // Add legend title
        legend.append("text")
            .attr("x", 100)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("Genres");

        const legendItems = legend.selectAll(".legend-item")
            .data(data)
            .enter()
            .append("g")
            .attr("class", d => `legend-${d.genre}`)
            .attr("transform", (d, i) => `translate(0, ${i * 40 + 25})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                console.log(`Clicked on genre: ${d.genre}`);
                this.toggleGenre(d.genre);
            });

        // Updated color mapping for main genres + others
        const colorMap = {
            'Drama': '#e74c3c',
            'Action': '#3498db', 
            'Comedy': '#f39c12',
            'Horror': '#9b59b6',
            'Documentary': '#2ecc71',
            'Others': '#95a5a6'
        };

        legendItems.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start")
            .attr("fill", d => {
                const color = colorMap[d.genre] || "#2c3e50";
                return color;
            })
            .attr("style", d => {
                const color = colorMap[d.genre] || "#2c3e50";
                return `fill: ${color} !important; color: ${color} !important; font-size: 16px; font-weight: 600; cursor: pointer;`;
            })
            .text(d => {
                if (this.displayMode === 'count') {
                    return `${d.genre} (${d.count.toLocaleString()})`;
                } else {
                    return `${d.genre} (${d.percentage}%)`;
                }
            });
        console.log('✅ Pie legend created successfully');
    }

    updateYear(year) {
        this.currentYear = year;
        this.updateChart();
    }

    updateDisplayMode(mode) {
        this.displayMode = mode;
        this.updateChart();
    }

    highlightGenre(genre) {
        // Remove highlight from all slices
        this.svg.selectAll(".slice path")
            .style("opacity", 0.3)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
        
        // Highlight the selected slice
        this.svg.selectAll(".slice path")
            .filter(d => d.data.genre === genre)
            .style("opacity", 1)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
            .transition()
            .duration(200)
            .attr("transform", "scale(1.1)");
        
        // Highlight the corresponding box in legend
        this.svg.selectAll(".legend-item")
            .style("opacity", 0.5);
        
        this.svg.selectAll(".legend-item")
            .filter(d => d.genre === genre)
            .style("opacity", 1);
        
        // Show tooltip with genre information
        const data = this.data[this.currentYear].find(d => d.genre === genre);
        if (data) {
            this.showTooltip(event, 
                `<div style="background: linear-gradient(135deg, ${this.genreColors[genre]}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${genre}</h4>
                    <div style="font-size: 14px; line-height: 1.6;">
                        <strong>Number of Movies:</strong> ${data.count.toLocaleString()}<br/>
                        <strong>Percentage:</strong> ${data.percentage}%<br/>
                        <strong>Year:</strong> ${this.currentYear}
                    </div>
                </div>`
            );
        }
    }

    removeHighlight() {
        // Return all slices to normal state
        this.svg.selectAll(".slice path")
            .style("opacity", 1)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .transition()
            .duration(200)
            .attr("transform", "scale(1)");
        
        // Return all legend boxes to normal state
        this.svg.selectAll(".legend-item")
            .style("opacity", 1);
        
        // Remove tooltip
        this.hideTooltip();
    }

    toggleGenre(selectedGenre) {
        console.log(`PieChart toggleGenre called with: ${selectedGenre}`);
        
        // בדוק אם האלמנט קיים לפני השימוש
        const legendElement = this.svg.select(`.legend-${selectedGenre}`);
        if (legendElement.empty()) {
            console.warn(`Legend element for ${selectedGenre} not found`);
            return;
        }
        
        const isVisible = legendElement.style("opacity") !== "0.5";
        console.log(`Is visible: ${isVisible}`);
        
        if (isVisible) {
            // Hide genre - only the specific slice
            legendElement.style("opacity", 0.5);
            this.svg.selectAll(`.slice path`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.1);
            this.svg.selectAll(`.slice text`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.1);
        } else {
            // Show genre - only the specific slice
            legendElement.style("opacity", 1);
            this.svg.selectAll(`.slice path`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.8);
            this.svg.selectAll(`.slice text`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.8);
        }
    }

    getHebrewGenre(genre) {
        // Return English genre names directly
        return genre;
    }
}

// Scatter Chart Class
class ScatterChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.filteredData = this.data;
        this.init();
    }

    init() {
        this.createSVG();
        this.setupScales();
        this.createAxes();
        this.createGrid();
        this.addCrisisMarkers();
        this.createDots();
        this.createLegend();
    }

    setupScales() {
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.year))
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .domain([0, 10])
            .range([this.height, 0]);

        this.sizeScale = d3.scaleSqrt()
            .domain(d3.extent(this.data, d => d.votes))
            .range([3, 15]);

        this.colorScale = d3.scaleOrdinal()
            .domain(['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'])
            .range([this.genreColors.Drama, this.genreColors.Action, this.genreColors.Comedy, 
                   this.genreColors.Horror, this.genreColors.Documentary]);
    }

    createAxes() {
        // X Axis
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")))
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Y Axis
        this.svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))
            .selectAll("text")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");

        // Axis labels
        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left + 15)
            .attr("x", 0 - (this.height / 2))
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("IMDb Rating");

        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${this.width / 2}, ${this.height + 40})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Year");
    }

    createGrid() {
        console.log('📐 Creating grid...');
        
        // Grid lines - only horizontal lines
        this.svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat(""));
        
        console.log('✅ Grid created successfully');
    }

    createDots() {
        this.svg.selectAll(".dot")
            .data(this.filteredData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => this.xScale(d.year))
            .attr("cy", d => this.yScale(d.rating))
            .attr("r", d => this.sizeScale(d.votes))
            .attr("fill", d => this.colorScale(d.genre))
            .attr("stroke", d => d.isCrisis ? "#e74c3c" : "white")
            .attr("stroke-width", d => d.isCrisis ? 2 : 1)
            .style("opacity", 0.7)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale(d.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎬 ${d.title}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Genre:</strong> ${d.genre}<br/>
                            <strong>Year:</strong> ${d.year}<br/>
                            <strong>Rating:</strong> ${d.rating}/10<br/>
                            <strong>Votes:</strong> ${d.votes.toLocaleString()}<br/>
                            ${d.isCrisis ? '<span style="color: #e74c3c; font-weight: bold;">🔥 Crisis Year</span>' : ''}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });
    }

    createLegend() {
        console.log('🏷️ Creating scatter legend...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 120}, 50)`);

        // Add legend title
        legend.append("text")
            .attr("x", 60)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("Genres");

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const genreNames = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        genres.forEach((genre, i) => {
            const legendRow = legend.append("g")
                .attr("class", `legend-${genre}`)
                .attr("transform", `translate(0, ${i * 35 + 30})`)
                .style("cursor", "pointer")
                .on("click", () => this.toggleGenre(genre));

            // Text in the color of the genre - uniform style
            console.log(`ScatterChart Genre: ${genre}, Color: ${this.genreColors[genre]}`);
            legendRow.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("dominant-baseline", "middle")
                .attr("text-anchor", "start")
                .attr("fill", this.genreColors[genre])
                .attr("style", `fill: ${this.genreColors[genre]} !important; color: ${this.genreColors[genre]} !important; font-size: 16px; font-weight: 600;`)
                .text(genreNames[i]);
        });
        console.log('✅ Scatter legend created successfully');
    }

    filterByRating(minRating) {
        this.svg.selectAll(".dot")
            .style("opacity", d => d.rating >= minRating ? 0.7 : 0.1);
    }

    filterByGenre(selectedGenre) {
        if (selectedGenre === "all") {
            // Show all genres
            this.svg.selectAll(".genre-line").style("opacity", 0.8);
            this.svg.selectAll(".dot").style("opacity", 1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 1);
        } else {
            // Hide all, then show only selected genre
            this.svg.selectAll(".genre-line").style("opacity", 0.1);
            this.svg.selectAll(".dot").style("opacity", 0.1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 0.3);
            
            // Show only the selected genre
            const selectedLine = this.svg.select(`.line-${selectedGenre}`);
            const selectedDots = this.svg.selectAll(`.dot-${selectedGenre}`);
            const selectedLegend = this.svg.select(`.legend-${selectedGenre}`);
            
            if (!selectedLine.empty()) {
                selectedLine.style("opacity", 0.8);
            }
            if (!selectedDots.empty()) {
                selectedDots.style("opacity", 1);
            }
            if (!selectedLegend.empty()) {
                selectedLegend.style("opacity", 1);
            }
        }
    }

    toggleGenre(selectedGenre) {
        const isVisible = this.svg.select(`.legend-${selectedGenre}`).style("opacity") !== "0.5";
        
        if (isVisible) {
            // Hide genre
            this.svg.select(`.legend-${selectedGenre}`).style("opacity", 0.5);
            this.svg.selectAll(".dot")
                .style("opacity", d => d.genre_en === selectedGenre ? 0.1 : 0.7);
        } else {
            // Show genre
            this.svg.select(`.legend-${selectedGenre}`).style("opacity", 1);
            this.svg.selectAll(".dot")
                .style("opacity", d => d.genre_en === selectedGenre ? 0.7 : 0.7);
        }
    }
}

        // Crisis Impact Analysis Chart - Crisis Impact Analysis Chart
class AreaChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.currentCrisis = 2020;
        this.currentView = 'ratings'; // ratings, preferences, psychology
        this.animationDuration = 1500;
        this.init();
    }

    init() {
        this.createSVG();
        this.createControls();
        this.updateVisualization();
    }

    createControls() {
        const controlsDiv = d3.select(this.selector).append("div")
            .style("text-align", "center")
            .style("margin-bottom", "10px") // Reduced from 20px
            .style("background", "rgba(255,255,255,0.1)")
            .style("border-radius", "15px")
            .style("padding", "10px") // Reduced from 20px
            .style("backdrop-filter", "blur(10px)")
            .style("border", "2px solid rgba(255,255,255,0.2)");

        // Description only (removed duplicate title)
        controlsDiv.append("p")
            .style("color", "#34495e")
            .style("margin", "0 0 10px 0") // Reduced from 20px
            .style("font-size", "14px") // Reduced from 16px
            .style("line-height", "1.4") // Reduced from 1.5
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.8)")
            .text("Select a crisis and see how it affected movie production and viewing patterns");

        // Crisis selection buttons
        const crisisButtonsDiv = controlsDiv.append("div")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("gap", "8px") // Reduced from 10px
            .style("margin-bottom", "10px") // Reduced from 20px
            .style("flex-wrap", "wrap");

        const crisisOptions = [
            { year: 2001, name: "9/11", icon: "🗽", color: "#e74c3c" },
            { year: 2008, name: "Economic Crisis", icon: "💰", color: "#f39c12" },
            { year: 2020, name: "COVID-19", icon: "🦠", color: "#e67e22" },
            { year: 2022, name: "Ukraine", icon: "⚔️", color: "#9b59b6" },
            { year: 2023, name: "October 7", icon: "🇮🇱", color: "#3498db" }
        ];

        crisisOptions.forEach(crisis => {
            const button = crisisButtonsDiv.append("button")
                .style("padding", "8px 16px") // Reduced from 12px 20px
                .style("border", "none")
                .style("border-radius", "20px")
                .style("background", crisis.year === this.currentCrisis ? crisis.color : "rgba(255,255,255,0.2)")
                .style("color", "#2c3e50")
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .style("font-size", "14px") // Reduced from 16px
                .style("transition", "all 0.3s ease")
                .style("border", "2px solid rgba(255,255,255,0.3)")
                .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.9)")
                .text(`${crisis.icon} ${crisis.year} - ${crisis.name}`)
                .on("click", () => {
                    this.currentCrisis = crisis.year;
                    this.updateVisualization();
                    // Update button colors
                    crisisButtonsDiv.selectAll("button")
                        .style("background", "rgba(255,255,255,0.2)")
                        .style("transform", "scale(1)");
                    d3.select(button.node())
                        .style("background", crisis.color)
                        .style("transform", "scale(1.05)");
                })
                .on("mouseenter", function() {
                    if (crisis.year !== this.currentCrisis) {
                        d3.select(this).style("background", "rgba(255,255,255,0.3)");
                    }
                })
                .on("mouseleave", function() {
                    if (crisis.year !== this.currentCrisis) {
                        d3.select(this).style("background", "rgba(255,255,255,0.2)");
                    }
                });
        });

        // View selection buttons
        const viewButtonsDiv = controlsDiv.append("div")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("gap", "8px") // Reduced from 10px
            .style("flex-wrap", "wrap");

        const viewOptions = [
            { view: 'ratings', name: 'Movie Ratings', icon: '⭐', color: '#3498db' },
            { view: 'preferences', name: 'Genre Trends', icon: '🎭', color: '#e74c3c' },
            { view: 'psychology', name: 'Crisis Impact', icon: '🧠', color: '#9b59b6' }
        ];

        viewOptions.forEach(view => {
            const button = viewButtonsDiv.append("button")
                .style("padding", "6px 12px") // Reduced from 10px 16px
                .style("border", "none")
                .style("border-radius", "15px") // Reduced from 20px
                .style("background", view.view === this.currentView ? view.color : "rgba(255,255,255,0.2)")
                .style("color", "#2c3e50")
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .style("font-size", "12px") // Reduced from 14px
                .style("transition", "all 0.3s ease")
                .style("border", "2px solid rgba(255,255,255,0.3)")
                .text(`${view.icon} ${view.name}`)
                .on("click", () => {
                    this.currentView = view.view;
                    this.updateVisualization();
                    // Update button colors
                    viewButtonsDiv.selectAll("button")
                        .style("background", "rgba(255,255,255,0.2)")
                        .style("transform", "scale(1)");
                    d3.select(button.node())
                        .style("background", view.color)
                        .style("transform", "scale(1.05)");
                })
                .on("mouseenter", function() {
                    if (view.view !== this.currentView) {
                        d3.select(this).style("background", "rgba(255,255,255,0.3)");
                    }
                })
                .on("mouseleave", function() {
                    if (view.view !== this.currentView) {
                        d3.select(this).style("background", "rgba(255,255,255,0.2)");
                    }
                });
        });
    }

    updateVisualization() {
        this.svg.selectAll("*").remove();

        switch(this.currentView) {
            case 'ratings':
                this.createRatingsAnalysis();
                break;
            case 'preferences':
                this.createPreferencesAnalysis();
                break;
            case 'psychology':
                this.createPsychologyAnalysis();
                break;
        }
    }

    createRatingsAnalysis() {
        // Use REAL rating data from barChartData
        const crisisYear = this.currentCrisis;
        
        // Get real rating data from barChartData (same as Bar Chart)
        const crisisData = this.data.barChartData[crisisYear];
        console.log(`🎯 Using REAL IMDb data for ${crisisYear}:`, crisisData);
        
        if (!crisisData || crisisData.length === 0) {
            this.svg.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("fill", "#2c3e50")
                .text("No data available");
            return;
        }

        // Setup scales for real ratings chart
        const xScale = d3.scaleBand()
            .domain(crisisData.map(d => d.genre))
            .range([80, this.width - 180])
            .padding(0.4);

        const maxChange = d3.max(crisisData, d => Math.abs(d.change));
        const yScale = d3.scaleLinear()
            .domain([-maxChange * 1.5, maxChange * 1.5]) // Increased multiplier from 1.2 to 1.5
            .range([this.height - 140, 140]);

        const barWidth = xScale.bandwidth() * 0.8;
        
        // Create bars showing real rating change
        this.svg.selectAll(".change-bar")
            .data(crisisData)
            .enter()
            .append("rect")
            .attr("class", "change-bar")
            .attr("x", d => xScale(d.genre) + (xScale.bandwidth() - barWidth) / 2)
            .attr("y", d => d.change >= 0 ? yScale(d.change) : yScale(0))
            .attr("width", barWidth)
            .attr("height", d => Math.abs(yScale(d.change) - yScale(0)))
            .attr("fill", d => d.change >= 0 ? "#27ae60" : "#e74c3c")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("opacity", 0.8)
            .on("mouseenter", (event, d) => {
                // Get real movie production data for this genre and crisis
                const crisisYear = parseInt(this.currentCrisis);
                const beforeYear = crisisYear - 1;
                const afterYear = crisisYear + 1;
                
                // Get movie counts from lineChartData
                const beforeData = this.data.lineChartData.find(item => item.year === beforeYear);
                const afterData = this.data.lineChartData.find(item => item.year === afterYear);
                const crisisData = this.data.lineChartData.find(item => item.year === crisisYear);
                
                const beforeCount = beforeData ? beforeData[d.genre] || 0 : 0;
                const afterCount = afterData ? afterData[d.genre] || 0 : 0;
                const crisisCount = crisisData ? crisisData[d.genre] || 0 : 0;
                
                // Calculate production change percentage
                const productionChange = beforeCount > 0 ? ((afterCount - beforeCount) / beforeCount) * 100 : 0;
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${d.color}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">⭐ ${d.genre} - ${crisisYear} Crisis</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>📊 Rating Analysis:</strong><br/>
                            <strong>Before Crisis:</strong> ${d.before}/10 rating (${beforeYear})<br/>
                            <strong>After Crisis:</strong> ${d.after}/10 rating (${afterYear})<br/>
                            <strong>Rating Change:</strong> <span style="color: ${d.change >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${d.change >= 0 ? '+' : ''}${d.change.toFixed(1)}%</span><br/>
                            <span style="color: ${d.change >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${d.change >= 0 ? '📈 Quality Improved' : '📉 Quality Declined'}</span><br/><br/>
                            
                            <strong>🎬 Production Context:</strong><br/>
                            <strong>Before:</strong> ${d.before_count || beforeCount} movies (${beforeYear})<br/>
                            <strong>During Crisis:</strong> ${crisisCount.toLocaleString()} movies (${crisisYear})<br/>
                            <strong>After:</strong> ${d.after_count || afterCount} movies (${afterYear})<br/>
                            <strong>Production Change:</strong> <span style="color: ${productionChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${productionChange >= 0 ? '+' : ''}${productionChange.toFixed(1)}%</span><br/><br/>
                            
                            <strong>📈 Crisis Impact:</strong><br/>
                            • Rating: ${d.change >= 0 ? 'Improved' : 'Declined'} by ${Math.abs(d.change).toFixed(1)}%<br/>
                            • Production: ${productionChange >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(productionChange).toFixed(1)}%<br/>
                            • Overall: ${d.change < -3 ? 'Strong negative impact' : d.change < -1 ? 'Moderate impact' : 'Minimal impact'}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // Add zero line for reference
        this.svg.append("line")
            .attr("x1", 80)
            .attr("x2", this.width - 180)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#2c3e50")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .style("opacity", 0.7);

        // Add value labels on bars
        this.svg.selectAll(".change-label")
            .data(crisisData)
            .enter()
            .append("text")
            .attr("class", "change-label")
            .attr("x", d => xScale(d.genre) + xScale.bandwidth() / 2)
            .attr("y", d => d.change >= 0 ? yScale(d.change) - 10 : yScale(d.change) + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text(d => `${d.change >= 0 ? '+' : ''}${d.change.toFixed(1)}%`);

        // Add axes with better formatting
        const xAxis = d3.axisBottom(xScale);
        
        // Create Y-axis with percentage formatting
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${d >= 0 ? '+' : ''}${d.toFixed(0)}%`)
            .ticks(8);

        this.svg.append("g")
            .attr("transform", `translate(0,${this.height - 140})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50");

        this.svg.append("g")
            .attr("transform", "translate(80,0)")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#2c3e50")
            .style("font-weight", "bold");

        // Add grid lines for better readability
        this.svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(80,0)")
            .call(d3.axisLeft(yScale)
                .tickSize(-this.width + 100)
                .tickFormat("")
                .ticks(8)
            )
            .selectAll("line")
            .style("stroke", "#ecf0f1")
            .style("stroke-width", 1)
            .style("opacity", 0.5);

        // Add labels
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height - 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Genre");

                this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", 15)
                    .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Rating Change (%)");

        // Add clear legend
        const legend = this.svg.append("g")
            .attr("transform", `translate(${this.width - 150}, 30)`);

        // Positive legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#27ae60")
            .attr("opacity", 0.8);

        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Improved");

        // Negative legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#e74c3c")
            .attr("opacity", 0.8);

        legend.append("text")
            .attr("x", 30)
            .attr("y", 45)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Declined");

        // Add title
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text(`Movie Rating Change - ${crisisYear} Crisis`);

        // Add data verification info
        this.svg.append("text")
            .attr("x", 10)
            .attr("y", this.height - 10)
            .style("font-size", "10px")
            .style("fill", "#7f8c8d")
            .style("font-style", "italic")
            .text("Data Source: Real movie rating analysis from crisis impact studies");
    }

    createPreferencesAnalysis() {
        // Create genre trend analysis
        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const data = this.data.lineChartData.map(d => ({
            year: d.year,
            genres: genres.map(genre => ({ genre, value: d[genre] }))
        }));

        if (!data || data.length === 0) {
        this.svg.append("text")
            .attr("x", this.width / 2)
                .attr("y", this.height / 2)
            .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("fill", "#2c3e50")
                .text("No data available");
            return;
        }

        // Setup scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([50, this.width - 50]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(...d.genres.map(g => g.value)))])
            .range([this.height - 50, 50]);

        const colorScale = d3.scaleOrdinal()
            .domain(genres)
            .range(['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#2ecc71']);

        // Create lines for each genre
        genres.forEach(genre => {
            const lineData = data.map(d => ({
                year: d.year,
                value: d.genres.find(g => g.genre === genre).value
            }));

            const line = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.value))
                .curve(d3.curveMonotoneX);

            this.svg.append("path")
                .datum(lineData)
                .attr("fill", "none")
                .attr("stroke", colorScale(genre))
                .attr("stroke-width", 3)
                .attr("d", line);
        });

        // Add axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale).tickFormat(d => d.toLocaleString());

        this.svg.append("g")
            .attr("transform", `translate(0,${this.height - 50})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#2c3e50");

        this.svg.append("g")
            .attr("transform", "translate(50,0)")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#2c3e50");

        // Add legend
        const legend = this.svg.append("g")
            .attr("transform", `translate(${this.width - 150}, 20)`);

        genres.forEach((genre, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendItem.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", colorScale(genre))
                .attr("stroke-width", 3);

            legendItem.append("text")
                .attr("x", 25)
                .attr("y", 5)
                .style("font-size", "12px")
                .style("fill", "#2c3e50")
                .text(genre);
        });

        // Add labels
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Year");

        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Number of Movies");
    }

    createPsychologyAnalysis() {
        // Create crisis impact analysis
        const crisisYears = [2001, 2008, 2020, 2022, 2023];
        const data = this.data.lineChartData.filter(d => crisisYears.includes(d.year));

        if (!data || data.length === 0) {
            this.svg.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("fill", "#2c3e50")
                .text("No crisis data available");
            return;
        }

        // Setup scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([50, this.width - 50])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)])
            .range([this.height - 50, 50]);

        // Create bars
        this.svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.total))
            .attr("width", xScale.bandwidth())
            .attr("height", d => this.height - 50 - yScale(d.total))
            .attr("fill", "#e74c3c")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, #e74c3c, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🔥 Crisis Year ${d.year}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Total Movies:</strong> ${d.total.toLocaleString()}<br/>
                            <strong>Impact:</strong> Crisis affected production patterns
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat(d => d.toLocaleString());

        this.svg.append("g")
            .attr("transform", `translate(0,${this.height - 50})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#2c3e50");

        this.svg.append("g")
            .attr("transform", "translate(50,0)")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#2c3e50");

        // Add labels
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height - 10)
                .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Crisis Year");

        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("Total Movies");
    }



}

// Heatmap Chart Class
class HeatmapChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.currentMetric = "count";
        this.currentColorScheme = "blues";
        this.init();
    }

    init() {
        this.createSVG();
        this.updateChart();
    }

    updateChart() {
        this.svg.selectAll("*").remove();
        
        // Transform data for heatmap
        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary', 'Thriller', 'Romance', 'Adventure', 'Crime', 'Sci-Fi'];
        
        // FIXED: Filter years to reduce density - show every 2 years instead of all
        const allYears = this.data.map(d => d.year);
        const years = allYears.filter((year, index) => index % 2 === 0 || year % 5 === 0 || [2001, 2008, 2020, 2022, 2023].includes(year));
        
        // Create heatmap data based on current metric
        this.heatmapData = [];
        this.data.forEach(yearData => {
            if (years.includes(yearData.year)) { // Only include filtered years
            genres.forEach(genre => {
                if (yearData[genre] !== undefined) {
                    let value;
                    switch(this.currentMetric) {
                        case "rating":
                            value = yearData[`${genre}Rating`] || yearData[`${genre}_rating`] || 0;
                            break;
                        case "votes":
                            value = yearData[`${genre}Votes`] || yearData[`${genre}_votes`] || 0;
                            break;
                        default: // count
                            value = yearData[genre];
                            break;
                    }
                    this.heatmapData.push({
                        year: yearData.year,
                        genre: genre,
                        value: value
                    });
                }
            });
            }
        });
        
        this.setupScales(years, genres);
        this.createAxes(years, genres);
        this.createHeatmap();
        this.addCrisisMarkers();
    }

    setupScales(years, genres) {
        this.xScale = d3.scaleBand()
            .range([0, this.width])
            .domain(years)
            .padding(0.05);

        this.yScale = d3.scaleBand()
            .range([this.height, 0])
            .domain(genres)
            .padding(0.05);

        const values = this.heatmapData.map(d => d.value);
        this.colorScale = d3.scaleSequential()
            .interpolator(this.getColorInterpolator())
            .domain(d3.extent(values));
    }

    getColorInterpolator() {
        switch(this.currentColorScheme) {
            case "reds":
                return d3.interpolateReds;
            case "viridis":
                return d3.interpolateViridis;
            default: // blues
                return d3.interpolateBlues;
        }
    }

    createAxes(years, genres) {
        // X Axis - FIXED: Better spacing and rotation for readability
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y Axis
        this.svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))
            .selectAll("text")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)");
    }

    createHeatmap() {
        this.svg.selectAll(".heatmap-rect")
            .data(this.heatmapData)
            .enter()
            .append("rect")
            .attr("class", "heatmap-rect")
            .attr("x", d => this.xScale(d.year))
            .attr("y", d => this.yScale(d.genre))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("fill", d => this.colorScale(d.value))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                // Get comprehensive data for this genre and year
                const crisisYears = [2001, 2008, 2020, 2022, 2023];
                const isCrisisYear = crisisYears.includes(d.year);
                
                // Get data for trend analysis - look for closest available years
                const availableYears = [...new Set(this.heatmapData.map(item => item.year))].sort((a, b) => a - b);
                const currentYearIndex = availableYears.indexOf(d.year);
                
                const previousYear = availableYears[currentYearIndex - 1];
                const nextYear = availableYears[currentYearIndex + 1];
                
                const previousData = this.heatmapData.find(item => item.year === previousYear && item.genre === d.genre);
                const nextData = this.heatmapData.find(item => item.year === nextYear && item.genre === d.genre);
                const previousValue = previousData ? previousData.value : 0;
                const nextValue = nextData ? nextData.value : 0;
                
                // Calculate trends with better logic
                const yearChange = previousValue > 0 ? ((d.value - previousValue) / previousValue) * 100 : 0;
                const nextYearChange = d.value > 0 && nextValue > 0 ? ((nextValue - d.value) / d.value) * 100 : 0;
                
                // Get total production for this year
                const yearData = this.heatmapData.filter(item => item.year === d.year);
                const totalMovies = yearData.reduce((sum, item) => sum + item.value, 0);
                const marketShare = totalMovies > 0 ? (d.value / totalMovies) * 100 : 0;
                
                // Crisis analysis
                const crisisImpact = isCrisisYear && previousData ? 
                    ((d.value - previousData.value) / previousData.value) * 100 : 0;
                
                // Get genre ranking for this year
                const genreRanking = yearData
                    .sort((a, b) => b.value - a.value)
                    .findIndex(item => item.genre === d.genre) + 1;
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale(d.value)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🔥 ${d.genre} - ${d.year}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>📊 ${this.getMetricLabel()} Data:</strong><br/>
                            <strong>Value:</strong> ${this.formatValue(d.value)}<br/>
                            <strong>Total Production:</strong> ${totalMovies.toLocaleString()}<br/>
                            <strong>Market Share:</strong> ${marketShare.toFixed(1)}%<br/>
                            <strong>Genre Ranking:</strong> #${genreRanking} of ${yearData.length}<br/><br/>
                            
                            <strong>📈 Trend Analysis:</strong><br/>
                            ${previousData ? `<strong>Previous Year (${previousYear}):</strong> ${this.formatValue(previousValue)}<br/>` : ''}
                            ${nextData ? `<strong>Next Year (${nextYear}):</strong> ${this.formatValue(nextValue)}<br/>` : ''}
                            <strong>Year Change:</strong> <span style="color: ${yearChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${yearChange >= 0 ? '+' : ''}${yearChange.toFixed(1)}%</span><br/>
                            ${nextData ? `<strong>Next Year Change:</strong> <span style="color: ${nextYearChange >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${nextYearChange >= 0 ? '+' : ''}${nextYearChange.toFixed(1)}%</span><br/>` : ''}<br/>
                            
                            ${isCrisisYear ? `
                            <strong>🔥 Crisis Impact:</strong><br/>
                            <span style="color: #e74c3c; font-weight: bold;">Crisis Year Impact: ${crisisImpact >= 0 ? '+' : ''}${crisisImpact.toFixed(1)}%</span><br/>
                            <span style="color: #e74c3c; font-weight: bold;">${crisisImpact < -15 ? 'Severe decline' : crisisImpact < -8 ? 'Moderate decline' : crisisImpact < 0 ? 'Slight decline' : 'Stable or growth'}</span>
                            ` : ''}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        this.createColorLegend();
    }

    createColorLegend() {
        const legendWidth = 250;
        const legendHeight = 25;
        
        const legend = this.svg.append("g")
            .attr("class", "color-legend")
            .attr("transform", `translate(${this.width - legendWidth - 30}, ${this.height + 50})`);

        // FIXED: Create proper gradient for legend
        const defs = this.svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        // Create gradient stops with proper colors based on current scheme
        const minValue = d3.min(this.heatmapData, d => d.value);
        const maxValue = d3.max(this.heatmapData, d => d.value);
        
        const colorInterpolator = this.getColorInterpolator();
        
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorInterpolator(0));

        linearGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", colorInterpolator(0.5));

        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorInterpolator(1));

        // Add legend title
        legend.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text(this.getMetricLabel());

        // Gradient rectangle with border
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("rx", 4)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .style("fill", "url(#legend-gradient)");

        // Add legend labels with better spacing and colors
        legend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 20)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("fill", "#2c3e50")
            .text(this.formatValue(minValue));

        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 20)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("fill", "#2c3e50")
            .text(this.formatValue(maxValue));
    }

    getMetricLabel() {
        switch(this.currentMetric) {
            case "rating":
                return "Average Rating";
            case "votes":
                return "Number of Votes";
            default:
                return "Number of Movies";
        }
    }

    formatValue(value) {
        if (value === undefined || value === null) {
            return "0";
        }
        if (this.currentMetric === "rating") {
            return value.toFixed(1);
        } else {
            return value.toLocaleString();
        }
    }

    updateMetric(metric) {
        this.currentMetric = metric;
        this.updateChart();
    }

    updateColorScheme(scheme) {
        this.currentColorScheme = scheme;
        this.updateChart();
    }

    getHebrewGenre(genre) {
        // Return English genre names directly
        return genre;
    }
} 