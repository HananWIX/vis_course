// Chart Base Class
class BaseChart {
    constructor(selector, data, crisisData) {
        this.selector = selector;
        this.data = data;
        this.crisisData = crisisData;
        this.svg = null;
        this.margin = { top: 30, right: 250, bottom: 80, left: 140 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 550 - this.margin.top - this.margin.bottom;
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

    createLines() {
        const line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        genres.forEach(genre => {
            const data = this.data.map(d => ({
                year: d.year,
                value: d[genre],
                isCrisis: d.isCrisis
            }));

            // Create line path - Enhanced
            this.svg.append("path")
                .datum(data)
                .attr("class", `line-${genre}`)
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
                .attr("class", `dot-${genre}`)
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
                    this.showTooltip(event, 
                        `<div style="background: linear-gradient(135deg, ${this.colorScale(genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                            <h4 style="margin: 0 0 10px 0; font-size: 16px;">📈 ${genre}</h4>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <strong>Year:</strong> ${d.year}<br/>
                                <strong>Number of Movies:</strong> ${d.value.toLocaleString()}<br/>
                                ${d.isCrisis ? '<span style="color: #e74c3c; font-weight: bold;">🔥 Crisis Year</span>' : ''}
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
            this.svg.selectAll("path[class^='line-']").style("opacity", 0.8);
            this.svg.selectAll("circle[class^='dot-']").style("opacity", 1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 1);
        } else {
            // Hide all, then show selected
            this.svg.selectAll("path[class^='line-']").style("opacity", 0.1);
            this.svg.selectAll("circle[class^='dot-']").style("opacity", 0.1);
            this.svg.selectAll("g[class^='legend-']").style("opacity", 0.3);
            
            this.svg.select(`.line-${selectedGenre}`).style("opacity", 0.8);
            this.svg.selectAll(`.dot-${selectedGenre}`).style("opacity", 1);
            this.svg.select(`.legend-${selectedGenre}`).style("opacity", 1);
        }
    }

    getHebrewGenre(genre) {
        // Return English genre names directly
        return genre;
    }
}

// Bar Chart Class
class BarChart extends BaseChart {
    constructor(selector, data, crisisData) {
        super(selector, data, crisisData);
        this.currentCrisis = "2008";
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
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('before')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">📊 ${d.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Before Crisis:</strong> ${d.before.toLocaleString()}<br/>
                            <strong>Year:</strong> ${parseInt(this.currentCrisis) - 1}<br/>
                            <strong>Change:</strong> <span style="color: ${d.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.change > 0 ? '+' : ''}${d.change}%</span>
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
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('after')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">📊 ${d.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>After Crisis:</strong> ${d.after.toLocaleString()}<br/>
                            <strong>Year:</strong> ${parseInt(this.currentCrisis) + 1}<br/>
                            <strong>Change:</strong> <span style="color: ${d.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.change > 0 ? '+' : ''}${d.change}%</span>
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
        this.width = 1000 - this.margin.left - this.margin.right;
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
        
        if (this.showComparison) {
            this.createComparisonChart();
        } else {
            this.createSingleChart();
        }
    }

    createSingleChart() {
        const data = this.data[this.currentYear].map(d => ({
            genre: d.genre_en || d.genre,
            count: d.count,
            percentage: d.percentage
        }));
        
        // Center the pie chart
        const g = this.svg.append("g")
            .attr("transform", `translate(${this.width/2},${this.height/2})`);

        const pieData = this.pie(data);

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.genre))
            .range(data.map(d => this.genreColors[d.genre] || '#2c3e50'));

        // Create pie slices - Enhanced
        const slices = g.selectAll(".slice")
            .data(pieData)
            .enter()
            .append("g")
            .attr("class", "slice");

        slices.append("path")
            .attr("d", this.arc)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseenter", (event, d) => {
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${colorScale(d.data.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${d.data.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Number of Movies:</strong> ${d.data.count.toLocaleString()}<br/>
                            <strong>Percentage:</strong> ${d.data.percentage}%<br/>
                            <strong>Year:</strong> ${this.currentYear}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
            });

        // Add labels - Enhanced
        slices.append("text")
            .attr("transform", d => `translate(${this.labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "13px")
            .style("font-weight", "600")
            .style("fill", "white")
            .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.8)")
            .text(d => {
                if (!this.showPercentages) return '';
                if (this.displayMode === 'count') {
                    return d.data.count > 500 ? d.data.count.toLocaleString() : '';
                } else {
                    return d.data.percentage > 5 ? `${d.data.percentage}%` : '';
                }
            });

        // Add legend - Enhanced
        this.createPieLegend(g, data, colorScale);
        
        // Add title - Enhanced
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -this.radius - 20)
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("fill", "#333")
            .text(`Genre Distribution - ${this.currentYear}`);
        
        // Add event listener to remove highlight when clicking on empty space
        this.svg.on("click", (event) => {
            if (event.target === this.svg.node()) {
                this.removeHighlight();
            }
        });
    }

    createComparisonChart() {
        const currentYear = parseInt(this.currentYear);
        
        // נסה לקחת שנה אחת לפני ואחת אחרי
        let beforeYear = currentYear - 1;
        let afterYear = currentYear + 1;
        
        // בדוק אם השנים האלה קיימות בנתונים
        const availableYears = Object.keys(this.data).map(Number).sort((a, b) => a - b);
        
        // אם השנה הקודמת לא קיימת, קח את השנה הקודמת הזמינה
        if (!this.data[beforeYear]) {
            const currentIndex = availableYears.indexOf(currentYear);
            if (currentIndex > 0) {
                beforeYear = availableYears[currentIndex - 1];
            }
        }
        
        // אם השנה הבאה לא קיימת, קח את השנה הבאה הזמינה
        if (!this.data[afterYear]) {
            const currentIndex = availableYears.indexOf(currentYear);
            if (currentIndex < availableYears.length - 1) {
                afterYear = availableYears[currentIndex + 1];
            }
        }
        
        // בדוק אם הנתונים קיימים
        const beforeData = this.data[beforeYear] || [];
        const currentData = this.data[currentYear] || [];
        const afterData = this.data[afterYear] || [];
        
        // If there's not enough data, return to single chart
        if (beforeData.length === 0 || afterData.length === 0) {
            console.log(`Not enough data for comparison. Available years: ${Object.keys(this.data).join(', ')}`);
            this.showComparison = false;
            this.createSingleChart();
            
            // Show message to user
            const message = `Not enough data for comparison for ${currentYear}. Available years: ${Object.keys(this.data).join(', ')}`;
            alert(message);
            return;
        }
        
        // Create smaller radius for comparison
        const smallRadius = Math.max(80, this.radius * 0.7); // הגדל את הגרפים
        
        // Create color scale
        const allGenres = [...new Set([
            ...beforeData.map(d => d.genre_en || d.genre),
            ...currentData.map(d => d.genre_en || d.genre),
            ...afterData.map(d => d.genre_en || d.genre)
        ])];
        
        const colorScale = d3.scaleOrdinal()
            .domain(allGenres)
            .range(allGenres.map(genre => this.genreColors[genre] || '#2c3e50'));
        
        // Create pie generators for each year
        const pieBefore = d3.pie().value(d => d.count).sort(null);
        const pieCurrent = d3.pie().value(d => d.count).sort(null);
        const pieAfter = d3.pie().value(d => d.count).sort(null);
        
        const arcBefore = d3.arc().innerRadius(0).outerRadius(smallRadius);
        const arcCurrent = d3.arc().innerRadius(0).outerRadius(smallRadius);
        const arcAfter = d3.arc().innerRadius(0).outerRadius(smallRadius);
        
        // Position charts side by side - center the charts
        const centerX = this.width / 2;
        const chartSpacing = Math.max(350, this.width / 2.2); // Increase spacing between charts
        const chartY = Math.max(200, this.height/2 + 150); // Move charts down a bit
        
        // Before chart (left)
        const gBefore = this.svg.append("g")
            .attr("transform", `translate(${centerX - chartSpacing},${chartY})`);
        
        const beforeSlices = gBefore.selectAll(".slice")
            .data(pieBefore(beforeData))
            .enter()
            .append("g")
            .attr("class", "slice");
        
        beforeSlices.append("path")
            .attr("d", arcBefore)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("opacity", 0.8)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
        
        // Add labels to before chart - Enhanced
        beforeSlices.append("text")
            .attr("transform", d => `translate(${arcBefore.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "white")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
            .text(d => {
                if (!this.showPercentages) return '';
                if (this.displayMode === 'count') {
                    return d.data.count > 200 ? d.data.count.toLocaleString() : '';
                } else {
                    return d.data.percentage > 5 ? `${d.data.percentage}%` : '';
                }
            });
        
        // Current chart (center)
        const gCurrent = this.svg.append("g")
            .attr("transform", `translate(${centerX},${chartY})`);
        
        const currentSlices = gCurrent.selectAll(".slice")
            .data(pieCurrent(currentData))
            .enter()
            .append("g")
            .attr("class", "slice");
        
        currentSlices.append("path")
            .attr("d", arcCurrent)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .style("cursor", "pointer")
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");
        
        // Add labels to current chart - Enhanced
        currentSlices.append("text")
            .attr("transform", d => `translate(${arcCurrent.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "13px")
            .style("font-weight", "600")
            .style("fill", "white")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
            .text(d => {
                if (!this.showPercentages) return '';
                if (this.displayMode === 'count') {
                    return d.data.count > 200 ? d.data.count.toLocaleString() : '';
                } else {
                    return d.data.percentage > 5 ? `${d.data.percentage}%` : '';
                }
            });
        
        // After chart (right)
        const gAfter = this.svg.append("g")
            .attr("transform", `translate(${centerX + chartSpacing},${chartY})`);
        
        const afterSlices = gAfter.selectAll(".slice")
            .data(pieAfter(afterData))
            .enter()
            .append("g")
            .attr("class", "slice");
        
        afterSlices.append("path")
            .attr("d", arcAfter)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("opacity", 0.8)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
        
        // Add labels to after chart - Enhanced
        afterSlices.append("text")
            .attr("transform", d => `translate(${arcAfter.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "white")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
            .text(d => {
                if (!this.showPercentages) return '';
                if (this.displayMode === 'count') {
                    return d.data.count > 200 ? d.data.count.toLocaleString() : '';
                } else {
                    return d.data.percentage > 5 ? `${d.data.percentage}%` : '';
                }
            });
        
        // Add titles - Enhanced
        gBefore.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -smallRadius - 40)
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#666")
            .text(`Before (${beforeYear})`);
        
        gCurrent.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -smallRadius - 40)
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#333")
            .text(`Crisis Year (${currentYear})`);
        
        gAfter.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -smallRadius - 40)
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#666")
            .text(`After (${afterYear})`);
        
        // Add general title - Enhanced
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", Math.max(0, this.width / 2))
            .attr("y", 30)
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("fill", "#333")
            .text(`Genre Comparison Before, During, and After Crisis`);
        
        // Add explanation - Enhanced
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", Math.max(0, this.width / 2))
            .attr("y", 55)
            .style("font-size", "14px")
            .style("fill", "#666")
            .text(`Visual comparison of genre distribution - see how the crisis affected viewer preferences`);
        
        // Add arrows between charts - Enhanced
        this.createArrows(centerX, chartSpacing, chartY, smallRadius);
        
        // Add legend - Enhanced
        this.createComparisonLegend(allGenres, colorScale);
    }

    createArrows(centerX, chartSpacing, chartY, radius) {
        // Define the arrow - Enhanced
        this.svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#666");
        
        // Arrow from right to left (before -> crisis)
        const arrow1 = this.svg.append("g")
            .attr("class", "arrow");
        
        arrow1.append("line")
            .attr("x1", centerX - chartSpacing + radius + 30)
            .attr("y1", chartY)
            .attr("x2", centerX - 30)
            .attr("y2", chartY)
            .attr("stroke", "#666")
            .attr("stroke-width", 3)
            .attr("marker-end", "url(#arrowhead)");
        
        // Arrow from right to left (crisis -> after)
        const arrow2 = this.svg.append("g")
            .attr("class", "arrow");
        
        arrow2.append("line")
            .attr("x1", centerX + 30)
            .attr("y1", chartY)
            .attr("x2", centerX + chartSpacing - radius - 30)
            .attr("y2", chartY)
            .attr("stroke", "#666")
            .attr("stroke-width", 3)
            .attr("marker-end", "url(#arrowhead)");
    }

    createComparisonLegend(genres, colorScale) {
        console.log('🏷️ Creating comparison legend...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 200}, 50)`);

        // Split genres into 2 rows (less crowded)
        const itemsPerRow = Math.ceil(genres.length / 2);
        const rowHeight = 35; // Larger spacing between rows
        
        // Add legend title - Enhanced
        legend.append("text")
            .attr("x", 100)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("Genres");

        // Create legend items in 2 rows - Enhanced
        const genreNames = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        genres.forEach((genre, i) => {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            
            const legendItem = legend.append("g")
                .attr("class", `legend-${genre}`)
                .attr("transform", `translate(${col * 120 + 20}, ${row * rowHeight + 25})`)
                .style("cursor", "pointer")
                .on("click", () => this.toggleGenre(genre));

            // Text in the color of the genre - uniform style
            console.log(`PieChart Genre: ${genre}, Color: ${this.genreColors[genre]}`);
            legendItem.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("dominant-baseline", "middle")
                .attr("text-anchor", "start")
                .attr("fill", this.genreColors[genre])
                .attr("style", `fill: ${this.genreColors[genre]} !important; color: ${this.genreColors[genre]} !important; font-size: 16px; font-weight: 600; cursor: pointer;`)
                .text(genreNames[i]);
        });
        console.log('✅ Comparison legend created successfully');
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

        // Text in the color of the genre - uniform style
        const genreNames = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const hebrewGenres = {
            'Drama': 'Drama',
            'Action': 'Action', 
            'Comedy': 'Comedy',
            'Horror': 'Horror',
            'Documentary': 'Documentary',
            'Thriller': 'Thriller',
            'Romance': 'Romance',
            'Adventure': 'Adventure',
            'Crime': 'Crime',
            'Sci-Fi': 'Sci-Fi'
        };
        legendItems.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start")
            .attr("fill", d => {
                // Convert Hebrew genre to English for color lookup
                const englishGenre = this.hebrewToEnglish[d.genre] || d.genre;
                const color = this.genreColors[englishGenre];
                console.log(`PieLegend Genre: ${d.genre} -> ${englishGenre}, Color: ${color}`);
                return color || "#2c3e50"; // fallback color
            })
            .attr("style", d => {
                const englishGenre = this.hebrewToEnglish[d.genre] || d.genre;
                const color = this.genreColors[englishGenre] || "#2c3e50";
                console.log(`Setting color for ${d.genre}: ${color}`);
                return `fill: ${color} !important; color: ${color} !important; font-size: 16px; font-weight: 600; cursor: pointer;`;
            })
            .text(d => {
                // Use the Hebrew genre name directly
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
        this.displayMode = mode || 'percentage';
        this.updateChart();
    }

    toggleComparison() {
        this.showComparison = !this.showComparison;
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
            this.svg.selectAll(".dot").style("opacity", 0.7);
        } else {
            this.svg.selectAll(".dot")
                .style("opacity", d => d.genre_en === selectedGenre ? 0.7 : 0.1);
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
            .style("margin-bottom", "20px")
            .style("background", "rgba(255,255,255,0.1)")
            .style("border-radius", "15px")
            .style("padding", "20px")
            .style("backdrop-filter", "blur(10px)")
            .style("border", "2px solid rgba(255,255,255,0.2)");

        // Main title
        controlsDiv.append("h3")
            .style("color", "#2c3e50")
            .style("margin", "0 0 15px 0")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.9)")
            .text("🧠 Crisis Impact on Cinema Viewing Patterns");

        // Description
        controlsDiv.append("p")
            .style("color", "#34495e")
            .style("margin", "0 0 20px 0")
            .style("font-size", "16px")
            .style("line-height", "1.5")
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.8)")
            .text("Select a crisis and see how it affected movie production and viewing patterns");

        // Crisis selection buttons
        const crisisButtonsDiv = controlsDiv.append("div")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("gap", "10px")
            .style("margin-bottom", "20px")
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
                .style("padding", "12px 20px")
                .style("border", "none")
                .style("border-radius", "25px")
                .style("background", crisis.year === this.currentCrisis ? crisis.color : "rgba(255,255,255,0.2)")
                .style("color", "#2c3e50")
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .style("font-size", "16px")
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
            .style("gap", "10px")
            .style("flex-wrap", "wrap");

        const viewOptions = [
            { view: 'ratings', name: 'Movie Production', icon: '📊', color: '#3498db' },
            { view: 'preferences', name: 'Genre Trends', icon: '🎭', color: '#e74c3c' },
            { view: 'psychology', name: 'Crisis Impact', icon: '🧠', color: '#9b59b6' }
        ];

        viewOptions.forEach(view => {
            const button = viewButtonsDiv.append("button")
                .style("padding", "10px 16px")
                .style("border", "none")
                .style("border-radius", "20px")
                .style("background", view.view === this.currentView ? view.color : "rgba(255,255,255,0.2)")
                .style("color", "#2c3e50")
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .style("font-size", "14px")
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
        // Create data from lineChartData
        const data = this.data.lineChartData.map(d => ({
            year: d.year,
            total: d.total,
            isCrisis: d.isCrisis
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
            .domain([0, d3.max(data, d => d.total)])
            .range([this.height - 50, 50]);

        // Create area generator
        const area = d3.area()
            .x(d => xScale(d.year))
            .y0(this.height - 50)
            .y1(d => yScale(d.total))
            .curve(d3.curveMonotoneX);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.total))
            .curve(d3.curveMonotoneX);

        // Add area
        this.svg.append("path")
            .datum(data)
            .attr("fill", "url(#area-gradient)")
            .attr("d", area);

        // Add line
        this.svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add dots
        this.svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.total))
            .attr("r", d => d.isCrisis ? 6 : 4)
            .attr("fill", d => d.isCrisis ? "#e74c3c" : "#3498db")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseenter", (event, d) => {
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${d.isCrisis ? '#e74c3c' : '#3498db'}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">📊 ${d.year}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Total Movies:</strong> ${d.total.toLocaleString()}<br/>
                            ${d.isCrisis ? '<span style="color: #e74c3c; font-weight: bold;">🔥 Crisis Year</span>' : '<span style="color: #27ae60; font-weight: bold;">✓ Normal Year</span>'}
                        </div>
                    </div>`
                );
            })
            .on("mouseleave", () => {
                this.hideTooltip();
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
            .text("Total Movies");

        // Add gradient definition
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "area-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#3498db")
            .attr("stop-opacity", 0.8);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#3498db")
            .attr("stop-opacity", 0.1);
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
        const years = this.data.map(d => d.year);
        
        // Create heatmap data
        this.heatmapData = [];
        this.data.forEach(yearData => {
            genres.forEach(genre => {
                if (yearData[genre] !== undefined) {
                    this.heatmapData.push({
                        year: yearData.year,
                        genre: genre,
                        value: yearData[genre]
                    });
                }
            });
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
            .interpolator(d3.interpolateBlues)
            .domain(d3.extent(values));
    }

    createAxes(years, genres) {
        // X Axis
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale))
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
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text(d => d);
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
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale(d.value)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🔥 ${this.getHebrewGenre(d.genre)} - ${d.year}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>Number of Movies:</strong> ${this.formatValue(d.value)}<br/>
                            ${[2001, 2008, 2020, 2022, 2023].includes(d.year) ? '<span style="color: #e74c3c; font-weight: bold;">🔥 Crisis Year</span>' : ''}
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

        // Create gradient for legend
        const defs = this.svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .enter()
            .append("stop")
            .attr("offset", d => d * 100 + "%")
            .attr("stop-color", d => this.colorScale(d3.min(this.data, d => d[this.currentMetric]) + 
                d * (d3.max(this.data, d => d[this.currentMetric]) - d3.min(this.data, d => d[this.currentMetric]))));

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

        // Add legend labels with better spacing
        const minValue = d3.min(this.heatmapData, d => d.value);
        const maxValue = d3.max(this.heatmapData, d => d.value);

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
        return "Number of Movies";
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

    getHebrewGenre(genre) {
        // Return English genre names directly
        return genre;
    }
} 