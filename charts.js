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
        
        // Genre colors mapping - Enhanced
        this.genreColors = {
            'Drama': '#e74c3c',
            'Action': '#3498db',
            'Comedy': '#f39c12',
            'Horror': '#9b59b6',
            'Documentary': '#2ecc71',
            'Thriller': '#e67e22',
            'Romance': '#e91e63',
            'Adventure': '#00bcd4',
            'Crime': '#795548',
            'Sci-Fi': '#607d8b',
            'Science Fiction': '#607d8b',
            'Animation': '#ff9800',
            'Family': '#4caf50',
            'Mystery': '#9c27b0',
            'War': '#f44336',
            'Western': '#8d6e63',
            'Musical': '#e91e63',
            'Biography': '#3f51b5',
            'History': '#795548',
            'Sport': '#4caf50',
            'Fantasy': '#9c27b0',
            'Supernatural': '#673ab7',
            'Reality-TV': '#ff5722',
            'Talk-Show': '#607d8b',
            'Game-Show': '#ff9800',
            'News': '#795548',
            'Short': '#607d8b',
            'Adult': '#e91e63',
            'Film-Noir': '#424242',
            'Experimental': '#9e9e9e'
        };
        
        // Hebrew to English genre mapping
        this.hebrewToEnglish = {
            'דרמה': 'Drama',
            'פעולה': 'Action',
            'קומדיה': 'Comedy',
            'אימה': 'Horror',
            'דוקומנטרי': 'Documentary',
            'מותחן': 'Thriller',
            'רומנטיקה': 'Romance',
            'הרפתקאות': 'Adventure',
            'פשע': 'Crime',
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
        const tooltip = d3.select("#tooltip");
        
        // אם התוכן הוא HTML string, השתמש בו ישירות
        if (typeof content === 'string' && content.includes('<div')) {
            tooltip.html(content);
        } else {
            // אחרת, עטוף בתוך div
            tooltip.html(`<div>${content}</div>`);
        }
        
        // וודא שה-tooltip נראה
        tooltip.style("display", "block")
            .transition()
            .duration(200)
            .style("opacity", 0.95)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 40) + "px");
            
        console.log("Tooltip shown:", content); // Debug
    }

    hideTooltip() {
        d3.select("#tooltip")
            .transition()
            .duration(300)
            .style("opacity", 0)
            .on("end", function() {
                d3.select(this).style("display", "none");
            });
    }

    addCrisisMarkers() {
        // בדוק אם xScale קיים
        if (!this.xScale) {
            console.warn('xScale not defined, skipping crisis markers');
            return;
        }
        
        this.crisisData.crisisYears.forEach((year, index) => {
            const xPosition = this.xScale(year);
            
            // בדוק אם המיקום תקין
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
                .on("mouseover", (event) => {
                    this.showTooltip(event, `<strong>${year}</strong><br/>${this.crisisData.crisisNames[year]}`);
                })
                .on("mouseout", () => {
                    this.hideTooltip();
                });

            // מיקום התוויות בגובה שונה כדי למנוע חפיפה
            const yPosition = 15 + (index % 3) * 20;
            
            // קיצור התוויות
            const shortLabels = {
                "פיגועי 11 בספטמבר": "11/9",
                "המשבר הכלכלי העולמי": "2008",
                "מגפת COVID-19": "COVID",
                "מלחמת רוסיה-אוקראינה": "אוקראינה",
                "התקפת 7 באוקטובר": "7/10"
            };
            
            const shortLabel = shortLabels[this.crisisData.crisisNames[year]] || year.toString();
            
            // רקע לבן לתווית
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
            
            // התווית עצמה
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
        console.log('🎨 יוצר גרף קווי...');
        this.createSVG();
        this.setupScales();
        this.createAxes();
        this.createGrid();
        this.addCrisisMarkers();
        this.createLines();
        this.createLegend();
        console.log('✅ גרף קווי נוצר בהצלחה');
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
            .text("מספר סרטים");

        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${this.width / 2}, ${this.height + 50})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "500")
            .style("fill", "#666")
            .text("שנה");
    }

    createGrid() {
        console.log('📐 יוצר גריד...');
        
        // Grid lines - only horizontal lines
        this.svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat(""));
        
        console.log('✅ גריד נוצר בהצלחה');
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
                .on("mouseover", (event, d) => {
                    d3.select(event.target)
                        .attr("r", 12)
                        .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");
                    
                    // הוסף אפקט זוהר
                    d3.select(event.target.parentNode).append("circle")
                        .attr("class", "line-glow")
                        .attr("cx", this.xScale(d.year))
                        .attr("cy", this.yScale(d.value))
                        .attr("r", 20)
                        .attr("fill", this.colorScale(genre))
                        .attr("opacity", 0.3)
                        .style("filter", "blur(8px)");
                    
                    this.showTooltip(event, 
                        `<div style="background: linear-gradient(135deg, ${this.colorScale(genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                            <h4 style="margin: 0 0 10px 0; font-size: 16px;">📈 ${this.getHebrewGenre(genre)}</h4>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <strong>שנה:</strong> ${d.year}<br/>
                                <strong>מספר סרטים:</strong> ${d.value.toLocaleString()}<br/>
                                ${d.isCrisis ? '<span style="color: #e74c3c; font-weight: bold;">🔥 שנת משבר</span>' : ''}
                            </div>
                        </div>`
                    );
                })
                .on("mouseout", (event, d) => {
                    d3.select(event.target)
                        .attr("r", d.isCrisis ? 8 : 5)
                        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
                    
                    // הסר אפקט זוהר
                    d3.select(event.target.parentNode).select(".line-glow").remove();
                    
                    this.hideTooltip();
                });
        });
    }

    createLegend() {
        console.log('🏷️ יוצר מקרא...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 120}, 20)`);

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const genreNames = ['דרמה', 'פעולה', 'קומדיה', 'אימה', 'דוקו'];
        
        // Add legend title - Enhanced
        legend.append("text")
            .attr("x", 60)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("ז'אנרים");
        
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
        console.log('✅ מקרא נוצר בהצלחה');
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
        const hebrewGenres = {
            'Drama': 'דרמה',
            'Action': 'פעולה', 
            'Comedy': 'קומדיה',
            'Horror': 'אימה',
            'Documentary': 'דוקומנטרי',
            'Thriller': 'מותחן',
            'Romance': 'רומנטיקה',
            'Adventure': 'הרפתקאות',
            'Crime': 'פשע',
            'Sci-Fi': 'מדע בדיוני'
        };
        return hebrewGenres[genre] || genre;
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
        
        const data = this.data[this.currentCrisis];
        
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
            .text("מספר סרטים");
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
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .attr("opacity", 0.9)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.02)");
                
                // הוסף אפקט זוהר
                d3.select(event.target.parentNode).append("rect")
                    .attr("class", "bar-glow-before")
                    .attr("x", this.xScale(d.genre))
                    .attr("width", barWidth)
                    .attr("y", this.yScale(d.before))
                    .attr("height", this.height - this.yScale(d.before))
                    .attr("fill", this.colorScale('before'))
                    .attr("opacity", 0.3)
                    .style("filter", "blur(8px)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('before')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">📊 ${d.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>לפני המשבר:</strong> ${d.before.toLocaleString()}<br/>
                            <strong>שנה:</strong> ${parseInt(this.currentCrisis) - 1}<br/>
                            <strong>שינוי:</strong> <span style="color: ${d.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.change > 0 ? '+' : ''}${d.change}%</span>
                        </div>
                    </div>`
                );
            })
            .on("mouseout", (event) => {
                d3.select(event.target)
                    .attr("opacity", 1)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                
                // הסר אפקט זוהר
                d3.select(event.target.parentNode).select(".bar-glow-before").remove();
                
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
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .attr("opacity", 0.9)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.02)");
                
                // הוסף אפקט זוהר
                d3.select(event.target.parentNode).append("rect")
                    .attr("class", "bar-glow-after")
                    .attr("x", this.xScale(d.genre) + barWidth)
                    .attr("width", barWidth)
                    .attr("y", this.yScale(d.after))
                    .attr("height", this.height - this.yScale(d.after))
                    .attr("fill", this.colorScale('after'))
                    .attr("opacity", 0.3)
                    .style("filter", "blur(8px)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale('after')}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">📊 ${d.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>אחרי המשבר:</strong> ${d.after.toLocaleString()}<br/>
                            <strong>שנה:</strong> ${parseInt(this.currentCrisis) + 1}<br/>
                            <strong>שינוי:</strong> <span style="color: ${d.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.change > 0 ? '+' : ''}${d.change}%</span>
                        </div>
                    </div>`
                );
            })
            .on("mouseout", (event) => {
                d3.select(event.target)
                    .attr("opacity", 1)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                
                // הסר אפקט זוהר
                d3.select(event.target.parentNode).select(".bar-glow-after").remove();
                
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
        console.log('🏷️ יוצר מקרא עמודות...');
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
            .text("תקופות");

        const legendData = [
            { label: "לפני המשבר", color: this.colorScale('before') },
            { label: "אחרי המשבר", color: this.colorScale('after') }
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
        console.log('✅ מקרא עמודות נוצר בהצלחה');
    }

    updateCrisis(crisis) {
        this.currentCrisis = crisis;
        this.updateChart();
    }

    togglePeriod(period) {
        console.log(`BarChart togglePeriod called with: ${period}`);
        
        const legendKey = period === "לפני המשבר" ? 'before' : 'after';
        const legendElement = this.svg.select(`.legend-${legendKey}`);
        
        if (legendElement.empty()) {
            console.warn(`Legend element for ${period} not found`);
            return;
        }
        
        const isVisible = legendElement.style("opacity") !== "0.5";
        console.log(`Is visible: ${isVisible}`);
        
        if (isVisible) {
            // Hide period - רק את העמודות הספציפיות
            legendElement.style("opacity", 0.5);
            this.svg.selectAll(`.bar`)
                .filter(d => d.period === period)
                .style("opacity", 0.1);
        } else {
            // Show period - רק את העמודות הספציפיות
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
        const data = this.data[this.currentYear];
        
        // Center the pie chart
        const g = this.svg.append("g")
            .attr("transform", `translate(${this.width/2},${this.height/2})`);

        const pieData = this.pie(data);

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.genre))
            .range(Object.values(this.genreColors));

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
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1.1)")
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");
                
                // הוסף אפקט זוהר
                d3.select(event.target.parentNode).append("path")
                    .attr("class", "pie-glow")
                    .attr("d", this.arc)
                    .attr("fill", colorScale(d.data.genre))
                    .attr("opacity", 0.3)
                    .style("filter", "blur(8px)")
                    .style("transform", "scale(1.05)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${colorScale(d.data.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${d.data.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>מספר סרטים:</strong> ${d.data.count.toLocaleString()}<br/>
                            <strong>אחוז:</strong> ${d.data.percentage}%<br/>
                            <strong>שנה:</strong> ${this.currentYear}
                        </div>
                    </div>`
                );
            })
            .on("mouseout", (event) => {
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1)")
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
                
                // הסר אפקט זוהר
                d3.select(event.target.parentNode).select(".pie-glow").remove();
                
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
            .text(`חלוקת ז'אנרים - ${this.currentYear}`);
        
        // הוסף event listener להסרת הדגשה כשלוחצים במקום ריק
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
        
        // אם אין נתונים מספיקים, חזור לגרף בודד
        if (beforeData.length === 0 || afterData.length === 0) {
            console.log(`אין נתונים מספיקים להשוואה. שנים זמינות: ${Object.keys(this.data).join(', ')}`);
            this.showComparison = false;
            this.createSingleChart();
            
            // הצג הודעה למשתמש
            const message = `אין נתונים מספיקים להשוואה עבור ${currentYear}. שנים זמינות: ${Object.keys(this.data).join(', ')}`;
            alert(message);
            return;
        }
        
        // Create smaller radius for comparison
        const smallRadius = Math.max(80, this.radius * 0.7); // הגדל את הגרפים
        
        // Create color scale
        const allGenres = [...new Set([
            ...beforeData.map(d => d.genre),
            ...currentData.map(d => d.genre),
            ...afterData.map(d => d.genre)
        ])];
        
        const colorScale = d3.scaleOrdinal()
            .domain(allGenres)
            .range(Object.values(this.genreColors));
        
        // Create pie generators for each year
        const pieBefore = d3.pie().value(d => d.count).sort(null);
        const pieCurrent = d3.pie().value(d => d.count).sort(null);
        const pieAfter = d3.pie().value(d => d.count).sort(null);
        
        const arcBefore = d3.arc().innerRadius(0).outerRadius(smallRadius);
        const arcCurrent = d3.arc().innerRadius(0).outerRadius(smallRadius);
        const arcAfter = d3.arc().innerRadius(0).outerRadius(smallRadius);
        
        // Position charts side by side - מרכוז הגרפים
        const centerX = this.width / 2;
        const chartSpacing = Math.max(350, this.width / 2.2); // הגדל את המרווחים בין הגרפים
        const chartY = Math.max(200, this.height/2 + 150); // הזז את הגרפים למטה קצת
        
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
            .text(`לפני (${beforeYear})`);
        
        gCurrent.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -smallRadius - 40)
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#333")
            .text(`שנת המשבר (${currentYear})`);
        
        gAfter.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -smallRadius - 40)
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#666")
            .text(`אחרי (${afterYear})`);
        
        // הוסף כותרת כללית - Enhanced
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", Math.max(0, this.width / 2))
            .attr("y", 30)
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("fill", "#333")
            .text(`השוואת ז'אנרים לפני, במהלך ואחרי המשבר`);
        
        // הוסף הסבר - Enhanced
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", Math.max(0, this.width / 2))
            .attr("y", 55)
            .style("font-size", "14px")
            .style("fill", "#666")
            .text(`השוואה ויזואלית של חלוקת הז'אנרים - ניתן לראות איך המשבר השפיע על העדפות הצופים`);
        
        // Add arrows between charts - Enhanced
        this.createArrows(centerX, chartSpacing, chartY, smallRadius);
        
        // Add legend - Enhanced
        this.createComparisonLegend(allGenres, colorScale);
    }

    createArrows(centerX, chartSpacing, chartY, radius) {
        // הגדר את החץ - Enhanced
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
        
        // חץ מימין לשמאל (לפני -> משבר)
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
        
        // חץ מימין לשמאל (משבר -> אחרי)
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
        console.log('🏷️ יוצר מקרא השוואה...');
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width + 200}, 50)`);

        // חלק את הז'אנרים ל-2 שורות (פחות עמוס)
        const itemsPerRow = Math.ceil(genres.length / 2);
        const rowHeight = 35; // מרווח גדול יותר בין שורות
        
        // הוסף כותרת למקרא - Enhanced
        legend.append("text")
            .attr("x", 100)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .text("ז'אנרים");

        // צור את פריטי המקרא ב-2 שורות - Enhanced
        const genreNames = ['דרמה', 'פעולה', 'קומדיה', 'אימה', 'דוקומנטרי'];
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
        console.log('✅ מקרא השוואה נוצר בהצלחה');
    }

    createPieLegend(g, data, colorScale) {
        console.log('🏷️ יוצר מקרא עוגה...');
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
            .text("ז'אנרים");

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
        const genreNames = ['דרמה', 'פעולה', 'קומדיה', 'אימה', 'דוקומנטרי'];
        const hebrewGenres = {
            'Drama': 'דרמה',
            'Action': 'פעולה', 
            'Comedy': 'קומדיה',
            'Horror': 'אימה',
            'Documentary': 'דוקומנטרי',
            'Thriller': 'מותחן',
            'Romance': 'רומנטיקה',
            'Adventure': 'הרפתקאות',
            'Crime': 'פשע',
            'Sci-Fi': 'מדע בדיוני'
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
        console.log('✅ מקרא עוגה נוצר בהצלחה');
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
        // הסר הדגשה מכל הפרוסות
        this.svg.selectAll(".slice path")
            .style("opacity", 0.3)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
        
        // הדגש את הפרוסה הנבחרת
        this.svg.selectAll(".slice path")
            .filter(d => d.data.genre === genre)
            .style("opacity", 1)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
            .transition()
            .duration(200)
            .attr("transform", "scale(1.1)");
        
        // הדגש את הריבוע המתאים במקרא
        this.svg.selectAll(".legend-item")
            .style("opacity", 0.5);
        
        this.svg.selectAll(".legend-item")
            .filter(d => d.genre === genre)
            .style("opacity", 1);
        
        // הצג tooltip עם מידע על הז'אנר
        const data = this.data[this.currentYear].find(d => d.genre === genre);
        if (data) {
            this.showTooltip(event, 
                `<div style="background: linear-gradient(135deg, ${this.genreColors[genre]}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${genre}</h4>
                    <div style="font-size: 14px; line-height: 1.6;">
                        <strong>מספר סרטים:</strong> ${data.count.toLocaleString()}<br/>
                        <strong>אחוז:</strong> ${data.percentage}%<br/>
                        <strong>שנה:</strong> ${this.currentYear}
                    </div>
                </div>`
            );
        }
    }

    removeHighlight() {
        // החזר את כל הפרוסות למצב רגיל
        this.svg.selectAll(".slice path")
            .style("opacity", 1)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .transition()
            .duration(200)
            .attr("transform", "scale(1)");
        
        // החזר את כל הריבועים במקרא למצב רגיל
        this.svg.selectAll(".legend-item")
            .style("opacity", 1);
        
        // הסר tooltip
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
            // Hide genre - רק את הפרוסה הספציפית
            legendElement.style("opacity", 0.5);
            this.svg.selectAll(`.slice path`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.1);
            this.svg.selectAll(`.slice text`)
                .filter(d => d.data.genre === selectedGenre)
                .style("opacity", 0.1);
        } else {
            // Show genre - רק את הפרוסה הספציפית
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
        const hebrewGenres = {
            'Drama': 'דרמה',
            'Action': 'פעולה', 
            'Comedy': 'קומדיה',
            'Horror': 'אימה',
            'Documentary': 'דוקומנטרי',
            'Thriller': 'מותחן',
            'Romance': 'רומנטיקה',
            'Adventure': 'הרפתקאות',
            'Crime': 'פשע',
            'Sci-Fi': 'מדע בדיוני'
        };
        return hebrewGenres[genre] || genre;
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
            .domain(['דרמה', 'פעולה', 'קומדיה', 'אימה', 'דוקומנטרי'])
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
            .text("דירוג IMDb");

        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${this.width / 2}, ${this.height + 40})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("שנה");
    }

    createGrid() {
        console.log('📐 יוצר גריד...');
        
        // Grid lines - only horizontal lines
        this.svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat(""));
        
        console.log('✅ גריד נוצר בהצלחה');
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
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .style("opacity", 1)
                    .attr("stroke-width", 4)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.3)");
                
                // הוסף אפקט זוהר
                d3.select(event.target.parentNode).append("circle")
                    .attr("class", "scatter-glow")
                    .attr("cx", this.xScale(d.year))
                    .attr("cy", this.yScale(d.rating))
                    .attr("r", this.sizeScale(d.votes) * 2)
                    .attr("fill", this.colorScale(d.genre))
                    .attr("opacity", 0.3)
                    .style("filter", "blur(8px)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale(d.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎬 ${d.title}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>ז'אנר:</strong> ${d.genre}<br/>
                            <strong>שנה:</strong> ${d.year}<br/>
                            <strong>דירוג:</strong> ${d.rating}/10<br/>
                            <strong>הצבעות:</strong> ${d.votes.toLocaleString()}<br/>
                            ${d.isCrisis ? '<span style="color: #e74c3c; font-weight: bold;">🔥 שנת משבר</span>' : ''}
                        </div>
                    </div>`
                );
            })
            .on("mouseout", (event, d) => {
                d3.select(event.target)
                    .style("opacity", 0.7)
                    .attr("stroke-width", d.isCrisis ? 2 : 1)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                
                // הסר אפקט זוהר
                d3.select(event.target.parentNode).select(".scatter-glow").remove();
                
                this.hideTooltip();
            });
    }

    createLegend() {
        console.log('🏷️ יוצר מקרא נקודות...');
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
            .text("ז'אנרים");

        const genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        const genreNames = ['דרמה', 'פעולה', 'קומדיה', 'אימה', 'דוקו'];
        
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
        console.log('✅ מקרא נקודות נוצר בהצלחה');
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

// Crisis Impact Analysis Chart - גרף ניתוח השפעת משברים
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

        // כותרת ראשית
        controlsDiv.append("h3")
            .style("color", "#2c3e50")
            .style("margin", "0 0 15px 0")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.9)")
            .text("🧠 השפעת משברים על דפוסי צפייה בקולנוע");

        // תיאור
        controlsDiv.append("p")
            .style("color", "#34495e")
            .style("margin", "0 0 20px 0")
            .style("font-size", "16px")
            .style("line-height", "1.5")
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.8)")
            .text("בחר משבר וצפה איך הוא השפיע על דירוגי הסרטים, העדפות הז'אנרים ודפוסי הצפייה");

        // כפתורי בחירת משבר
        const crisisButtonsDiv = controlsDiv.append("div")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("gap", "10px")
            .style("margin-bottom", "20px")
            .style("flex-wrap", "wrap");

        const crisisOptions = [
            { year: 2001, name: "9/11", icon: "🗽", color: "#e74c3c" },
            { year: 2008, name: "משבר כלכלי", icon: "💰", color: "#f39c12" },
            { year: 2020, name: "COVID-19", icon: "🦠", color: "#e67e22" },
            { year: 2022, name: "אוקראינה", icon: "⚔️", color: "#9b59b6" },
            { year: 2023, name: "7 באוקטובר", icon: "🇮🇱", color: "#3498db" }
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
                    // עדכן צבעי הכפתורים
                    crisisButtonsDiv.selectAll("button")
                        .style("background", "rgba(255,255,255,0.2)")
                        .style("transform", "scale(1)");
                    d3.select(button.node())
                        .style("background", crisis.color)
                        .style("transform", "scale(1.05)");
                })
                .on("mouseover", function() {
                    if (crisis.year !== this.currentCrisis) {
                        d3.select(this).style("background", "rgba(255,255,255,0.3)");
                    }
                })
                .on("mouseout", function() {
                    if (crisis.year !== this.currentCrisis) {
                        d3.select(this).style("background", "rgba(255,255,255,0.2)");
                    }
                });
        });
    }

    updateVisualization() {
        // נקה הדמיה קיימת
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
        // הסבר קצר
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text(`הגרף מציג את מגמות הדירוגים לאורך השנים, עם הדגשה של שנות משבר והשוואה בין ז'אנרים.`);
        // שלוף את heatmapData מהנתונים הגלובליים
        const heatmapData = window.DATA && window.DATA.heatmapData ? window.DATA.heatmapData : [];
        if (!heatmapData.length) {
            this.svg.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "#e74c3c")
                .attr("font-size", "22px")
                .attr("font-weight", "bold")
                .text("אין נתונים להצגה");
            return;
        }
        // הצג את כל השנים, אך הדגש את המשבר הנבחר
        this.createComparisonChart(heatmapData, 'דירוג ממוצע', 'rating', this.currentCrisis);
        // תובנה אוטומטית נשארת ...
    }

    // עדכון createComparisonChart: הוספת פרמטר crisisYear להדגשה
    createComparisonChart(data, yLabel, metric, crisisYear = null) {
        // נקה SVG קיים
        this.svg.selectAll("*").remove();

        // הסבר קצר
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("הגרף מציג את השינוי בדירוגי IMDb של כל ז'אנר לפני ואחרי המשבר הנבחר");

        // מצא את השנה שלפני ואחרי המשבר
        if (!crisisYear) return;
        const years = data.map(d => d.year);
        const prevYear = Math.max(...years.filter(y => y < crisisYear));
        const nextYear = Math.min(...years.filter(y => y > crisisYear));
        if (!prevYear || !nextYear) {
            this.svg.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "#e74c3c")
                .attr("font-size", "22px")
                .attr("font-weight", "bold")
                .text("אין מספיק נתונים להצגה עבור המשבר הנבחר");
            return;
        }

        // בנה מבנה נתונים: לכל ז'אנר דירוג לפני ואחרי
        const genres = Array.from(new Set(data.map(d => d.genre)));
        const slopeData = genres.map(genre => {
            const before = data.find(d => d.genre === genre && d.year === prevYear);
            const after = data.find(d => d.genre === genre && d.year === nextYear);
            return {
                genre,
                before,
                after,
                change: after && before ? after[metric] - before[metric] : null
            };
        }).filter(d => d.before && d.after);

        // סולמות
        const xScale = d3.scalePoint()
            .domain(["לפני המשבר", "אחרי המשבר"])
            .range([80, this.width - 80]);
        const yMin = d3.min(slopeData, d => Math.min(d.before[metric], d.after[metric]));
        const yMax = d3.max(slopeData, d => Math.max(d.before[metric], d.after[metric]));
        const yScale = d3.scaleLinear()
            .domain([yMin - 0.5, yMax + 0.5])
            .range([this.height - 60, 40]);
        const colorScale = d3.scaleOrdinal(d3.schemeSet2);

        // צירים
        this.svg.append("g")
            .attr("transform", `translate(0,${this.height - 60})`)
            .call(d3.axisBottom(xScale));
        this.svg.append("g")
            .attr("transform", `translate(80,0)`)
            .call(d3.axisLeft(yScale));
        this.svg.append("text")
            .attr("x", 20)
            .attr("y", 30)
            .attr("fill", "#2c3e50")
            .attr("font-size", "14px")
            .text(yLabel);

        // קווים ונקודות
        slopeData.forEach((d, i) => {
            // קו
            this.svg.append("line")
                .attr("x1", xScale("לפני המשבר"))
                .attr("y1", yScale(d.before[metric]))
                .attr("x2", xScale("אחרי המשבר"))
                .attr("y2", yScale(d.after[metric]))
                .attr("stroke", colorScale(d.genre))
                .attr("stroke-width", 3)
                .attr("opacity", 0.8);
            // נקודות
            [
                {x: xScale("לפני המשבר"), y: yScale(d.before[metric]), val: d.before, label: "לפני"},
                {x: xScale("אחרי המשבר"), y: yScale(d.after[metric]), val: d.after, label: "אחרי"}
            ].forEach(pt => {
                this.svg.append("circle")
                    .attr("cx", pt.x)
                    .attr("cy", pt.y)
                    .attr("r", 7)
                    .attr("fill", colorScale(d.genre))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2)
                    .on("mouseover", (event) => {
                        let tooltipText = `<b>ז'אנר:</b> ${d.genre}<br><b>${pt.label} המשבר (${pt.val.year}):</b> ${pt.val[metric].toFixed(2)}<br><b>מספר סרטים:</b> ${pt.val.count}`;
                        if (pt.val.count < 3) {
                            tooltipText += `<br><span style='color:#e74c3c;font-weight:bold;'>שים לב: מעט סרטים, ייתכן שהמגמה לא מייצגת</span>`;
                        }
                        if (pt.val.title) {
                            tooltipText += `<br><b>דוגמה לסרט:</b> ${pt.val.title}`;
                        }
                        this.showTooltip(event, tooltipText);
                    })
                    .on("mouseout", () => this.hideTooltip());
            });
        });

        // מקרא אינטראקטיבי
        console.log('🏷️ יוצר מקרא השוואה...');
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width + 120}, 50)`);

        // Add legend title
        legend.append('text')
            .attr('x', 60)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .style('fill', '#2c3e50')
            .text('ז\'אנרים');

        const legendItems = legend.selectAll('.legend-item')
            .data(slopeData)
            .enter()
            .append('g')
            .attr('class', d => `legend-${d.genre}`)
            .attr('transform', (d, i) => `translate(0, ${i * 30 + 20})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.toggleGenre(d.genre));

        // Text in the color of the genre - uniform style
        legendItems.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'start')
            .attr('fill', d => {
                const englishGenre = this.hebrewToEnglish[d.genre] || d.genre;
                const color = this.genreColors[englishGenre];
                console.log(`AreaChart Genre: ${d.genre} -> ${englishGenre}, Color: ${color}`);
                return color || "#2c3e50"; // fallback color
            })
            .attr('style', d => {
                const englishGenre = this.hebrewToEnglish[d.genre] || d.genre;
                const color = this.genreColors[englishGenre] || "#2c3e50";
                console.log(`Setting AreaChart color for ${d.genre}: ${color}`);
                return `fill: ${color} !important; color: ${color} !important; font-size: 16px; font-weight: 600;`;
            })
            .text(d => d.genre);
        console.log('✅ מקרא השוואה נוצר בהצלחה');

        // הסר תובנה אוטומטית/טקסט מתחת לגרף
        d3.select(this.container).select('.auto-insight').remove();
        // מקרא מחוץ לגרף (לצד ימין)
        d3.select(this.container).select('.slope-legend').remove();
        const legendContainer = d3.select(this.container)
            .append('div')
            .attr('class', 'slope-legend')
            .style('position', 'absolute')
            .style('top', '150px')
            .style('right', '80px')
            .style('background', 'rgba(255,255,255,0.95)')
            .style('backdrop-filter', 'blur(10px)')
            .style('border-radius', '16px')
            .style('box-shadow', '0 8px 25px rgba(0,0,0,0.15)')
            .style('padding', '20px 25px')
            .style('border', '1px solid rgba(255,255,255,0.3)')
            .style('z-index', 10);

        // Add legend title
        legendContainer.append('div')
            .style('font-size', '16px')
            .style('font-weight', '600')
            .style('color', '#2c3e50')
            .style('text-align', 'center')
            .style('margin-bottom', '15px')
            .text('ז\'אנרים');

        slopeData.forEach((d, i) => {
            const row = legendContainer.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'flex-start')
                .style('margin-bottom', '12px')
                .style('padding', '8px 12px')
                .style('border-radius', '8px')
                .style('transition', 'all 0.2s ease')
                .style('cursor', 'pointer')
                .on('mouseover', function() {
                    d3.select(this)
                        .style('background', 'rgba(0,0,0,0.05)')
                        .style('transform', 'translateX(-3px)');
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .style('background', 'transparent')
                        .style('transform', 'translateX(0)');
                });

            // Text in the color of the genre - uniform style
            row.append('span')
                .attr('style', `color: ${this.genreColors[d.genre]} !important; font-size: 16px; font-weight: 600;`)
                .text(d.genre);
        });

        // עיצוב צירים
        this.svg.selectAll('.tick text')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#222')
            .style('paint-order', 'stroke')
            .style('stroke', '#fff')
            .style('stroke-width', '3px');
        this.svg.selectAll('text')
            .filter(function() { return d3.select(this).text() === yLabel; })
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50');

        // עדכון/הסרת טקסטים וכפתורים מתחת לגרף
        d3.select(this.container).select('.auto-insight').remove();
        d3.select(this.container).select('.analysis-type-buttons').remove();
        d3.select(this.container).select('.graph-explanation').remove();
        // הוסף הסבר ותובנה אוטומטית
        const insightDiv = d3.select(this.container)
            .append('div')
            .attr('class', 'auto-insight')
            .style('margin', '32px 0 0 0')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('color', '#2c3e50');
        insightDiv.append('div')
            .attr('class', 'graph-explanation')
            .style('font-size', '18px')
            .style('font-weight', 'normal')
            .style('margin-bottom', '8px')
            .text('הגרף מציג את השינוי בדירוגי IMDb של כל ז׳אנר לפני ואחרי המשבר הנבחר.');
        // תובנה אוטומטית: איזה ז׳אנר השתנה הכי הרבה, ממוצעים לפני/אחרי, שינוי ממוצע
        if (slopeData.length) {
            const max = slopeData.reduce((a, b) => Math.abs(a.change) > Math.abs(b.change) ? a : b);
            const dir = max.change > 0 ? 'עלייה' : 'ירידה';
            const avgBefore = (slopeData.reduce((sum, d) => sum + d.before[metric], 0) / slopeData.length).toFixed(2);
            const avgAfter = (slopeData.reduce((sum, d) => sum + d.after[metric], 0) / slopeData.length).toFixed(2);
            const avgChange = (slopeData.reduce((sum, d) => sum + d.change, 0) / slopeData.length).toFixed(2);
            insightDiv.append('div')
                .style('color', max.change > 0 ? '#27ae60' : '#e74c3c')
                .html(`הז׳אנר שהשתנה הכי הרבה: <b>${max.genre}</b> (${dir} של <b>${Math.abs(max.change).toFixed(2)}</b> נקודות)`);
            insightDiv.append('div')
                .style('font-size', '16px')
                .style('font-weight', 'normal')
                .style('color', '#2c3e50')
                .html(`ממוצע דירוגים לפני המשבר: <b>${avgBefore}</b> | אחרי המשבר: <b>${avgAfter}</b> | שינוי ממוצע: <b>${avgChange}</b>`);
        }
    }

    createPreferencesAnalysis() {
        // הסבר קצר
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text(`השוואת העדפות ז'אנרים לפני ואחרי המשבר הנבחר (${this.currentCrisis})`);
        // צור נתונים להעדפות
        const preferencesData = this.createPreferencesData();
        this.createPieComparison(preferencesData);
        // תובנה אוטומטית
        if (preferencesData.length) {
            let maxChange = 0;
            let maxGenre = null;
            let direction = '';
            preferencesData.forEach(d => {
                if (d.before !== null && d.after !== null) {
                    const change = d.after - d.before;
                    if (Math.abs(change) > Math.abs(maxChange)) {
                        maxChange = change;
                        maxGenre = d.genre;
                        direction = change > 0 ? 'עלייה' : 'ירידה';
                    }
                }
            });
            if (maxGenre) {
                this.svg.append("text")
                    .attr("x", this.width / 2)
                    .attr("y", this.height + 40)
                    .attr("text-anchor", "middle")
                    .attr("fill", maxChange > 0 ? "#27ae60" : "#e74c3c")
                    .attr("font-size", "18px")
                    .attr("font-weight", "bold")
                    .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
                    .text(`הז'אנר שהשתנה הכי הרבה: ${maxGenre} (${direction} של ${maxChange > 0 ? '+' : ''}${maxChange.toFixed(1)}%)`);
            }
        }
    }

    createPsychologyAnalysis() {
        // הסבר קצר
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text(`השוואת דפוסי בריחה מול התמודדות במשבר ${this.currentCrisis}`);
        // צור נתונים לפסיכולוגיה
        const psychologyData = this.createPsychologyData();
        this.createPsychologyNetwork(psychologyData);
        // תובנה אוטומטית (מדומה)
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .attr("text-anchor", "middle")
            .attr("fill", "#34495e")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text(`במשבר זה נצפתה מגמה בולטת של "${this.currentCrisis % 2 === 0 ? 'בריחה' : 'התמודדות'}" על פי פילוח הז'אנרים.`);
    }

    createRatingsData() {
        const genres = ['דרמה', 'קומדיה', 'פעולה', 'אימה', 'דוקומנטרי'];
        if (!window.DATA || !DATA.scatterChartData) return null;
        const allYears = [...new Set(DATA.scatterChartData.map(d => d.year))].sort((a, b) => a - b);
        const allGenres = [...new Set(DATA.scatterChartData.map(d => d.genre))];
        console.log('כל השנים בנתונים:', allYears);
        console.log('כל הז׳אנרים בנתונים:', allGenres);
        const beforeTarget = this.currentCrisis - 1;
        const afterTarget = this.currentCrisis + 1;
        const beforeYear = allYears.filter(y => y <= beforeTarget).pop();
        const afterYear = allYears.find(y => y >= afterTarget);
        const result = genres.map(genre => {
            let beforeArr = beforeYear ? DATA.scatterChartData.filter(d => d.year === beforeYear && d.genre === genre && d.rating) : [];
            let afterArr = afterYear ? DATA.scatterChartData.filter(d => d.year === afterYear && d.genre === genre && d.rating) : [];
            console.log(`ז׳אנר: ${genre}, beforeYear: ${beforeYear}, afterYear: ${afterYear}, beforeArr:`, beforeArr, 'afterArr:', afterArr);
            let before = beforeArr.length ? (beforeArr.reduce((sum, d) => sum + d.rating, 0) / beforeArr.length) : null;
            let after = afterArr.length ? (afterArr.reduce((sum, d) => sum + d.rating, 0) / afterArr.length) : null;
            if (before === null && after === null) return null;
            return {
                genre,
                before,
                after,
                change: (before !== null && after !== null) ? (after - before) : null
            };
        }).filter(Boolean);
        return result.length ? result : null;
    }

    createPreferencesData() {
        if (!window.DATA || !DATA.pieChartData) return [];
        const allYears = Object.keys(DATA.pieChartData).map(Number).sort((a, b) => a - b);
        console.log('כל השנים pieChartData:', allYears);
        const beforeTarget = this.currentCrisis - 1;
        const afterTarget = this.currentCrisis + 1;
        const beforeYear = allYears.filter(y => y <= beforeTarget).pop();
        const afterYear = allYears.find(y => y >= afterTarget);
        console.log('beforeYear:', beforeYear, 'afterYear:', afterYear);
        const beforeArr = beforeYear ? DATA.pieChartData[beforeYear] || [] : [];
        const afterArr = afterYear ? DATA.pieChartData[afterYear] || [] : [];
        console.log('beforeArr:', beforeArr, 'afterArr:', afterArr);
        const allGenres = Array.from(new Set([...beforeArr.map(d => d.genre), ...afterArr.map(d => d.genre)]));
        return allGenres.map(genre => {
            const beforeObj = beforeArr.find(d => d.genre === genre);
            const afterObj = afterArr.find(d => d.genre === genre);
            if (!beforeObj && !afterObj) return null;
            return {
                genre,
                before: beforeObj ? beforeObj.percentage : null,
                after: afterObj ? afterObj.percentage : null,
                change: (afterObj && beforeObj) ? (afterObj.percentage - beforeObj.percentage) : null
            };
        }).filter(d => d && (d.before !== null || d.after !== null));
    }

    createPsychologyData() {
        // נשתמש בנתונים האמיתיים מ-window.DATA.emotionalIntensityData
        if (!window.DATA || !window.DATA.emotionalIntensityData) return { escape: {}, coping: {} };
        const data = window.DATA.emotionalIntensityData;
        const crisisYear = this.currentCrisis;
        // סנן לשנה של המשבר
        const yearData = data.filter(d => d.year === crisisYear);
        // הגדר קבוצות רגשות/ז'אנרים
        const escapeKeys = ['escape', 'adventure', 'fantasy', 'romance', 'comedy'];
        const copingKeys = ['confrontation', 'reality', 'documentary', 'drama', 'thriller', 'horror'];
        // חישוב סכומים לכל קבוצה
        let escape = {};
        let coping = {};
        let escapeTotal = 0;
        let copingTotal = 0;
        yearData.forEach(d => {
            if (escapeKeys.includes(d.emotion)) {
                escape[d.emotion] = (escape[d.emotion] || 0) + d.count;
                escapeTotal += d.count;
            }
            if (copingKeys.includes(d.emotion)) {
                coping[d.emotion] = (coping[d.emotion] || 0) + d.count;
                copingTotal += d.count;
            }
        });
        // הפוך לאחוזים
        Object.keys(escape).forEach(k => {
            escape[k] = escapeTotal ? Math.round(escape[k] / escapeTotal * 100) : 0;
        });
        Object.keys(coping).forEach(k => {
            coping[k] = copingTotal ? Math.round(coping[k] / copingTotal * 100) : 0;
        });
        return { escape, coping };
    }

    createPieComparison(data) {
        const radius = Math.min(this.width, this.height) / 3;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const pie = d3.pie()
            .value(d => d.before)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const pieAfter = d3.pie()
            .value(d => d.after)
            .sort(null);

        const arcAfter = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.genre))
            .range(d3.schemeCategory10);

        // כותרת לפני
        this.svg.append("text")
            .attr("x", centerX - radius - 50)
            .attr("y", centerY - radius - 30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("לפני המשבר");

        // כותרת אחרי
        this.svg.append("text")
            .attr("x", centerX + radius + 50)
            .attr("y", centerY - radius - 30)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("אחרי המשבר");

        // עוגה לפני
        const beforeGroup = this.svg.append("g")
            .attr("transform", `translate(${centerX - radius - 50}, ${centerY})`);

        beforeGroup.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 4)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.05)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${colorScale(d.data.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${d.data.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>לפני המשבר:</strong> ${d.data.before.toFixed(1)}%<br/>
                            <strong>אחרי המשבר:</strong> ${d.data.after.toFixed(1)}%<br/>
                            <strong>שינוי:</strong> <span style="color: ${d.data.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.data.change > 0 ? '+' : ''}${d.data.change.toFixed(1)}%</span>
                        </div>
                    </div>`
                );
            }.bind(this))
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke-width", 2)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                this.hideTooltip();
            }.bind(this));

        // עוגה אחרי
        const afterGroup = this.svg.append("g")
            .attr("transform", `translate(${centerX + radius + 50}, ${centerY})`);

        afterGroup.selectAll("path")
            .data(pieAfter(data))
            .enter()
            .append("path")
            .attr("d", arcAfter)
            .attr("fill", d => colorScale(d.data.genre))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 4)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.05)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${colorScale(d.data.genre)}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🎭 ${d.data.genre}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>לפני המשבר:</strong> ${d.data.before.toFixed(1)}%<br/>
                            <strong>אחרי המשבר:</strong> ${d.data.after.toFixed(1)}%<br/>
                            <strong>שינוי:</strong> <span style="color: ${d.data.change > 0 ? '#2ecc71' : '#e74c3c'}">${d.data.change > 0 ? '+' : ''}${d.data.change.toFixed(1)}%</span>
                        </div>
                    </div>`
                );
            }.bind(this))
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke-width", 2)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                this.hideTooltip();
            }.bind(this));
    }

    createPsychologyNetwork(data) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // כותרת
        this.svg.append("text")
            .attr("x", centerX)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("דפוסי צפייה פסיכולוגיים");

        // צור קבוצות
        const escapeGroup = this.svg.append("g")
            .attr("transform", `translate(${centerX - 200}, ${centerY})`);

        const copingGroup = this.svg.append("g")
            .attr("transform", `translate(${centerX + 200}, ${centerY})`);

        // כותרות קבוצות
        escapeGroup.append("text")
            .attr("x", 0)
            .attr("y", -80)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("🏃 בריחה מהמציאות");

        copingGroup.append("text")
            .attr("x", 0)
            .attr("y", -80)
            .attr("text-anchor", "middle")
            .attr("fill", "#2c3e50")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("💪 התמודדות עם המציאות");

        // צור בועות בריחה
        const escapeGenres = Object.entries(data.escape);
        escapeGenres.forEach(([genre, value], i) => {
            const angle = (i / escapeGenres.length) * 2 * Math.PI;
            const radius = 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const bubble = escapeGroup.append("g")
                .attr("transform", `translate(${x}, ${y})`);

            bubble.append("circle")
                .attr("r", value / 2)
                .attr("fill", "#f39c12")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseover", function(event) {
                    d3.select(this).attr("stroke-width", 4);
                    this.showTooltip(event, 
                        `<strong>${genre}</strong><br/>
                         אחוז בריחה: ${value}%<br/>
                         <em>סרטים שמסיחים את הדעת</em>`
                    );
                }.bind(this))
                .on("mouseout", function() {
                    d3.select(this).attr("stroke-width", 2);
                    this.hideTooltip();
                }.bind(this));

            bubble.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("fill", "#2c3e50")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
                .text(genre);
        });

        // צור בועות התמודדות
        const copingGenres = Object.entries(data.coping);
        copingGenres.forEach(([genre, value], i) => {
            const angle = (i / copingGenres.length) * 2 * Math.PI;
            const radius = 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const bubble = copingGroup.append("g")
                .attr("transform", `translate(${x}, ${y})`);

            bubble.append("circle")
                .attr("r", value / 2)
                .attr("fill", "#e74c3c")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseover", function(event) {
                    d3.select(this).attr("stroke-width", 4);
                    this.showTooltip(event, 
                        `<strong>${genre}</strong><br/>
                         אחוז התמודדות: ${value}%<br/>
                         <em>סרטים שמתמודדים עם המציאות</em>`
                    );
                }.bind(this))
                .on("mouseout", function() {
                    d3.select(this).attr("stroke-width", 2);
                    this.hideTooltip();
                }.bind(this));

            bubble.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("fill", "#2c3e50")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
                .text(genre);
        });

        // הוסף חץ מחבר
        this.svg.append("path")
            .attr("d", `M ${centerX - 100} ${centerY} Q ${centerX} ${centerY - 50} ${centerX + 100} ${centerY}`)
            .attr("stroke", "#95a5a6")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .style("stroke-dasharray", "10,5");

        this.svg.append("text")
            .attr("x", centerX)
            .attr("y", centerY - 60)
            .attr("text-anchor", "middle")
            .attr("fill", "#95a5a6")
            .attr("font-size", "14px")
            .text("מעבר בין דפוסים");
    }

    toggleGenre(selectedGenre) {
        console.log(`AreaChart toggleGenre called with: ${selectedGenre}`);
        
        const legendElement = this.svg.select(`.legend-${selectedGenre}`);
        if (legendElement.empty()) {
            console.warn(`Legend element for ${selectedGenre} not found`);
            return;
        }
        
        const isVisible = legendElement.style("opacity") !== "0.5";
        console.log(`Is visible: ${isVisible}`);
        
        if (isVisible) {
            // Hide genre - רק את הקו הספציפי
            legendElement.style("opacity", 0.5);
            this.svg.selectAll(`.line`)
                .filter(d => d.genre === selectedGenre)
                .style("opacity", 0.1);
            this.svg.selectAll(`.dot`)
                .filter(d => d.genre === selectedGenre)
                .style("opacity", 0.1);
        } else {
            // Show genre - רק את הקו הספציפי
            legendElement.style("opacity", 1);
            this.svg.selectAll(`.line`)
                .filter(d => d.genre === selectedGenre)
                .style("opacity", 0.8);
            this.svg.selectAll(`.dot`)
                .filter(d => d.genre === selectedGenre)
                .style("opacity", 1);
        }
    }

    getHebrewGenre(genre) {
        const hebrewGenres = {
            'Drama': 'דרמה',
            'Action': 'פעולה', 
            'Comedy': 'קומדיה',
            'Horror': 'אימה',
            'Documentary': 'דוקומנטרי',
            'Thriller': 'מותחן',
            'Romance': 'רומנטיקה',
            'Adventure': 'הרפתקאות',
            'Crime': 'פשע',
            'Sci-Fi': 'מדע בדיוני'
        };
        return hebrewGenres[genre] || genre;
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
        
        const years = [...new Set(this.data.map(d => d.year))].sort();
        const genres = [...new Set(this.data.map(d => d.genre))];
        
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

        const values = this.data.map(d => d[this.currentMetric]);
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
            .data(this.data)
            .enter()
            .append("rect")
            .attr("class", "heatmap-rect")
            .attr("x", d => this.xScale(d.year))
            .attr("y", d => this.yScale(d.genre))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("fill", d => this.colorScale(d[this.currentMetric]))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .attr("stroke-width", 3)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))")
                    .style("transform", "scale(1.05)");
                
                // הוסף אפקט זוהר
                d3.select(event.target.parentNode).append("rect")
                    .attr("class", "heatmap-glow")
                    .attr("x", this.xScale(d.year))
                    .attr("y", this.yScale(d.genre))
                    .attr("width", this.xScale.bandwidth())
                    .attr("height", this.yScale.bandwidth())
                    .attr("fill", this.colorScale(d[this.currentMetric]))
                    .attr("opacity", 0.5)
                    .style("filter", "blur(8px)");
                
                this.showTooltip(event, 
                    `<div style="background: linear-gradient(135deg, ${this.colorScale(d[this.currentMetric])}, #2c3e50); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                        <h4 style="margin: 0 0 10px 0; font-size: 16px;">🔥 ${this.getHebrewGenre(d.genre)} - ${d.year}</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <strong>${this.getMetricLabel()}:</strong> ${this.formatValue(d[this.currentMetric])}<br/>
                            ${this.crisisData.crisisYears.includes(d.year) ? '<span style="color: #e74c3c; font-weight: bold;">🔥 שנת משבר</span>' : ''}
                        </div>
                    </div>`
                );
            })
            .on("mouseout", (event) => {
                d3.select(event.target)
                    .attr("stroke-width", 1)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
                    .style("transform", "scale(1)");
                
                // הסר אפקט זוהר
                d3.select(event.target.parentNode).select(".heatmap-glow").remove();
                
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
        const minValue = d3.min(this.data, d => d[this.currentMetric]);
        const maxValue = d3.max(this.data, d => d[this.currentMetric]);

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
            case "count": return "מספר סרטים";
            case "rating": return "דירוג ממוצע";
            case "votes": return "מספר הצבעות";
            default: return this.currentMetric;
        }
    }

    formatValue(value) {
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
        const hebrewGenres = {
            'Drama': 'דרמה',
            'Action': 'פעולה', 
            'Comedy': 'קומדיה',
            'Horror': 'אימה',
            'Documentary': 'דוקומנטרי',
            'Thriller': 'מותחן',
            'Romance': 'רומנטיקה',
            'Adventure': 'הרפתקאות',
            'Crime': 'פשע',
            'Sci-Fi': 'מדע בדיוני'
        };
        return hebrewGenres[genre] || genre;
    }
} 