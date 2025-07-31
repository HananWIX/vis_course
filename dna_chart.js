// DNA of Cinema Chart - גרף DNA של הקולנוע
class CinemaDNAChart {
    constructor(selector, data, crisisData) {
        this.selector = selector;
        this.data = data;
        this.crisisData = crisisData;
        this.margin = { top: 50, right: 50, bottom: 80, left: 100 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;
        this.currentCrisis = 2020;
        this.animationDuration = 1500;
        
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
            'Sci-Fi': '#9c27b0'
        };
        
        this.init();
    }

    init() {
        this.createContainer();
        this.setupScales();
        this.createTitle();
        this.createControls();
        this.createLegend();
        this.updateVisualization();
    }

    createContainer() {
        // נקה קונטיינר קיים
        const containerElement = d3.select(this.selector);
        if (containerElement.empty()) {
            console.error('Container not found:', this.selector);
            return;
        }
        
        containerElement.selectAll("*").remove();
        
        // 1. הארכת הרקע הסגול - ודא ש-this.container כולל min-height גדול מספיק (למשל 1000px) ושכל האלמנטים הפנימיים לא שוברים את הרקע.
        this.container = containerElement
            .style("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .style("border-radius", "15px")
            .style("padding", "20px")
            .style("box-shadow", "0 10px 30px rgba(0,0,0,0.3)")
            .style("min-height", "1000px")
            .style("backdrop-filter", "blur(10px)");

        this.svg = this.container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.bottom + this.margin.top)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
            
        console.log('DNA Chart container created successfully');
    }

    setupScales() {
        this.genres = ['Drama', 'Action', 'Comedy', 'Horror', 'Documentary'];
        
        this.xScale = d3.scaleBand()
            .domain(['לפני המשבר', 'אחרי המשבר'])
            .range([0, this.width])
            .padding(0.3);

        this.yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height, 0]);

        this.radiusScale = d3.scaleSqrt()
            .domain([0, 100])
            .range([0, 40]);
    }

    createTitle() {
        this.container.append("div")
            .style("text-align", "center")
            .style("margin-bottom", "20px")
            .html(`
                <h2 style="color: white; font-size: 28px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    🧬 DNA הקולנוע: איך משברים משנים את הקולנוע?
                </h2>
                <p style="color: #f0f0f0; font-size: 16px; margin: 10px 0;">
                    בחר משבר וראה איך הוא שינה את הרכב הז'אנרים בקולנוע העולמי<br>
                    <strong>נתונים אמיתיים מ-IMDb:</strong> 327,674 סרטים (2000-2024) 🎬
                </p>
                <div style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 15px; margin-top: 15px; border: 2px solid rgba(255,255,255,0.2);">
                    <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">המשברים שנחקרו:</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; color: #2c3e50; font-weight: bold;">
                        <div style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">🗽 <strong>2001:</strong> פיגועי 11 בספטמבר</div>
                        <div style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">💰 <strong>2008:</strong> משבר כלכלי עולמי</div>
                        <div style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">🦠 <strong>2020:</strong> מגפת COVID-19</div>
                        <div style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">⚔️ <strong>2022:</strong> מלחמת רוסיה-אוקראינה</div>
                        <div style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">🇮🇱 <strong>2023:</strong> התקפת 7 באוקטובר</div>
                    </div>
                </div>
            `);
    }

    createControls() {
        const controlsDiv = this.container.append("div")
            .style("position", "absolute")
            .style("top", "30px")
            .style("right", "30px")
            .style("z-index", "10");

        const select = controlsDiv.append("select")
            .style("background", "white")
            .style("border-radius", "25px")
            .style("box-shadow", "0 4px 15px rgba(0,0,0,0.15)")
            .style("padding", "10px 20px")
            .style("font-size", "16px")
            .style("border", "none")
            .style("cursor", "pointer");

        this.crisisData.crisisYears.forEach(year => {
            select.append("option")
                .attr("value", year)
                .property("selected", year === this.currentCrisis)
                .text(`${year} - ${this.crisisData.crisisNames[year]}`);
        });

        select.on("change", (event) => {
            this.currentCrisis = +event.target.value;
            console.log('Selected crisis year:', this.currentCrisis);
            this.updateVisualization();
        });
    }

    createLegend() {
        console.log('🏷️ יוצר מקרא DNA...');
        // כותרת למקרא
        const legendDiv = this.container.append("div")
            .style("position", "absolute")
            .style("top", "40px")
            .style("left", "40px")
            .style("z-index", "10")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "flex-start")
            .style("background", "rgba(255,255,255,0.2)")
            .style("backdrop-filter", "blur(10px)")
            .style("border-radius", "20px")
            .style("padding", "15px 20px")
            .style("box-shadow", "0 8px 25px rgba(0,0,0,0.15)")
            .style("font-size", "13px")
            .style("max-width", "200px")
            .style("border", "1px solid rgba(255,255,255,0.3)");

        legendDiv.append("h3")
            .style("color", "#2c3e50")
            .style("text-align", "center")
            .style("margin", "0 0 20px 0")
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
            .text("🎭 ז'אנרים בקולנוע");

        // מיכל לפריטי המקרא
        const legendItemsContainer = legendDiv.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "10px")
            .style("width", "100%")
            .style("max-width", "180px");

        this.genres.forEach(genre => {
            const item = legendItemsContainer.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("justify-content", "flex-start")
                .style("padding", "10px 15px")
                .style("background", "rgba(255,255,255,0.15)")
                .style("border-radius", "12px")
                .style("border", "1px solid rgba(255,255,255,0.2)")
                .style("transition", "all 0.3s ease")
                .style("cursor", "pointer")
                .style("min-width", "160px")
                .on("mouseover", function() {
                    d3.select(this)
                        .style("background", "rgba(255,255,255,0.25)")
                        .style("transform", "translateX(-5px)")
                        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("background", "rgba(255,255,255,0.15)")
                        .style("transform", "translateX(0)")
                        .style("box-shadow", "none");
                })
                .on("click", () => this.toggleGenre(genre));

            // טקסט ז'אנר בצבע של הז'אנר - uniform style
            console.log(`DNA Chart Genre: ${genre}, Color: ${this.genreColors[genre]}`);
            item.append("span")
                .attr("style", `color: ${this.genreColors[genre]} !important; font-weight: 600; font-size: 16px; text-align: center; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);`)
                .text(this.getHebrewGenre(genre));
        });
        console.log('✅ מקרא DNA נוצר בהצלחה');
    }

    toggleGenre(selectedGenre) {
        const isVisible = this.legendDiv.select(`.legend-item-${selectedGenre}`).style("opacity") !== "0.5";
        
        if (isVisible) {
            // Hide genre
            this.legendDiv.select(`.legend-item-${selectedGenre}`).style("opacity", 0.5);
            this.svg.selectAll(`.dna-node`).style("opacity", 0.3);
        } else {
            // Show genre
            this.legendDiv.select(`.legend-item-${selectedGenre}`).style("opacity", 1);
            this.svg.selectAll(`.dna-node`).style("opacity", 0.8);
        }
    }

    updateVisualization() {
        // נקה את ה-SVG לפני ציור מחדש
        this.svg.selectAll("*").remove();
        console.log('Updating DNA visualization for crisis:', this.currentCrisis);
        const beforeAfterData = this.calculateBeforeAfterData();
        
        if (!beforeAfterData) {
            this.showErrorMessage();
            return;
        }
        
        this.createDNAVisualization(beforeAfterData);
        // this.createChangeMetrics(beforeAfterData); // הוסר
        this.animateDNAChange(beforeAfterData);
    }

    showErrorMessage() {
        if (!this.svg) return;
        
        this.svg.selectAll("*").remove();
        
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "18px")
            .text("אין נתונים זמינים לתקופה זו");
    }

    calculateBeforeAfterData() {
        const crisisYear = this.currentCrisis;
        const beforeYear = crisisYear - 1;
        const afterYear = crisisYear + 1;

        console.log('Calculating data for crisis:', crisisYear, 'Before:', beforeYear, 'After:', afterYear);
        
        if (!this.data || !this.data.lineChartData) {
            console.error('No line chart data available');
            return null;
        }

        const beforeData = this.data.lineChartData.find(d => d.year === beforeYear);
        const afterData = this.data.lineChartData.find(d => d.year === afterYear);

        console.log('Before data found:', !!beforeData, 'After data found:', !!afterData);
        
        if (!beforeData || !afterData) {
            console.warn('Missing data for years:', beforeYear, afterYear);
            return null;
        }

        const result = {
            before: {},
            after: {},
            changes: {},
            totalChange: 0
        };

        let totalBefore = 0, totalAfter = 0;

        this.genres.forEach(genre => {
            totalBefore += beforeData[genre] || 0;
            totalAfter += afterData[genre] || 0;
        });

        this.genres.forEach(genre => {
            const beforeCount = beforeData[genre] || 0;
            const afterCount = afterData[genre] || 0;
            
            result.before[genre] = totalBefore > 0 ? (beforeCount / totalBefore) * 100 : 0;
            result.after[genre] = totalAfter > 0 ? (afterCount / totalAfter) * 100 : 0;
            result.changes[genre] = result.after[genre] - result.before[genre];
        });

        result.totalChange = this.genres.reduce((sum, genre) => 
            sum + Math.abs(result.changes[genre]), 0) / 2;

        return result;
    }

    createDNAVisualization(data) {
        if (!data) return;

        // נקה הדמיה קיימת
        this.svg.selectAll(".dna-group").remove();

        const periods = ['before', 'after'];
        const periodNames = ['לפני המשבר', 'אחרי המשבר'];

        periods.forEach((period, periodIndex) => {
            const group = this.svg.append("g")
                .attr("class", "dna-group")
                .attr("transform", `translate(${this.xScale(periodNames[periodIndex]) + this.xScale.bandwidth()/2}, 0)`);

            // רקע מעגלי לתקופה
            group.append("circle")
                .attr("cx", 0)
                .attr("cy", this.height/2)
                .attr("r", 80)
                .attr("fill", period === 'before' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)')
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5");

            // כותרת תקופה
            group.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "18px")
                .attr("font-weight", "bold")
                .text(periodNames[periodIndex]);

            // DNA הליקס של ז'אנרים
            this.createDNAHelix(group, data[period], period);
        });

        // חץ מעבר
        this.createTransitionArrow();
    }

    createDNAHelix(group, genreData, period) {
        const helixRadius = 60;
        const helixHeight = 200;
        const startY = this.height/2 - helixHeight/2;

        this.genres.forEach((genre, i) => {
            const percentage = genreData[genre];
            const angle = (i / this.genres.length) * 2 * Math.PI;
            const x = Math.cos(angle) * helixRadius;
            const y = startY + (i / this.genres.length) * helixHeight;

            // נקודת DNA
            const bubble = group.append("g")
                .attr("class", `dna-bubble-${genre}`)
                .attr("transform", `translate(${x}, ${y})`);

            bubble.append("circle")
                .attr("r", 0)
                .attr("fill", this.genreColors[genre])
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))")
                .style("cursor", "default")
                .style("transition", "all 0.3s ease")
                .transition()
                .duration(this.animationDuration)
                .delay(i * 100)
                .attr("r", this.radiusScale(percentage));

            // טקסט אחוז
            bubble.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("fill", "white")
                .attr("font-weight", "bold")
                .attr("font-size", "10px")
                .style("opacity", 0)
                .transition()
                .duration(this.animationDuration)
                .delay(i * 100 + 500)
                .style("opacity", 1)
                .text(`${percentage.toFixed(1)}%`);

            // תווית ז'אנר
            bubble.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "3em")
                .attr("fill", "white")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .style("opacity", 0)
                .transition()
                .duration(this.animationDuration)
                .delay(i * 100 + 700)
                .style("opacity", 1)
                .text(this.getHebrewGenre(genre));

            // קו חיבור לספירל
            if (i < this.genres.length - 1) {
                const nextAngle = ((i + 1) / this.genres.length) * 2 * Math.PI;
                const nextX = Math.cos(nextAngle) * helixRadius;
                const nextY = startY + ((i + 1) / this.genres.length) * helixHeight;

                group.append("path")
                    .attr("d", `M ${x} ${y} Q 0 ${(y + nextY)/2} ${nextX} ${nextY}`)
                    .attr("stroke", "rgba(255,255,255,0.3)")
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .style("stroke-dasharray", "1000")
                    .style("stroke-dashoffset", "1000")
                    .transition()
                    .duration(this.animationDuration)
                    .delay(i * 100 + 300)
                    .style("stroke-dashoffset", "0");
            }
        });
    }

    createTransitionArrow() {
        const arrowGroup = this.svg.append("g")
            .attr("class", "transition-arrow")
            .attr("transform", `translate(${this.width/2}, ${this.height/2})`);

        // חץ מעבר
        arrowGroup.append("path")
            .attr("d", "M -30 0 L 30 0 M 20 -10 L 30 0 L 20 10")
            .attr("stroke", "#FFD700")
            .attr("stroke-width", 4)
            .attr("fill", "none")
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))")
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(1000)
            .style("opacity", 1);

        // טקסט משבר
        arrowGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-20px")
            .attr("fill", "#FFD700")
            .attr("font-weight", "bold")
            .attr("font-size", "14px")
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(1200)
            .style("opacity", 1)
            .text(`משבר ${this.currentCrisis}`);
    }

    createChangeMetrics(data) {
        if (!data) return;

        // הסר מדדים קיימים
        d3.select(this.selector).select(".change-metrics").remove();

        const metricsDiv = d3.select(this.selector).append("div")
            .attr("class", "change-metrics")
            .style("background", "rgba(255,255,255,0.1)")
            .style("border-radius", "15px")
            .style("padding", "20px")
            .style("margin-top", "20px")
            .style("backdrop-filter", "blur(10px)");

        // כותרת עם הסבר
        metricsDiv.append("h3")
            .style("color", "white")
            .style("text-align", "center")
            .style("margin-top", "0")
            .style("margin-bottom", "10px")
            .text(`📊 מדד עוצמת השינוי: ${data.totalChange.toFixed(1)}%`);

        // הסבר על המדד
        metricsDiv.append("p")
            .style("color", "#e0e0e0")
            .style("text-align", "center")
            .style("font-size", "14px")
            .style("margin-bottom", "20px")
            .style("line-height", "1.5")
            .html(`
                המדד מחושב על סמך השינוי באחוזים של כל ז'אנר בין השנה שלפני המשבר לשנה שאחריו.<br>
                <strong>מדד גבוה</strong> = שינוי דרמטי בטעמי הקהל | <strong>מדד נמוך</strong> = יציבות יחסית
            `);

        const changesGrid = metricsDiv.append("div")
            .style("display", "grid")
            .style("grid-template-columns", "repeat(auto-fit, minmax(200px, 1fr))")
            .style("gap", "15px")
            .style("margin-top", "20px");

        this.genres.forEach(genre => {
            const change = data.changes[genre];
            const changeItem = changesGrid.append("div")
                .style("background", "rgba(255,255,255,0.1)")
                .style("border-radius", "10px")
                .style("padding", "15px")
                .style("text-align", "center")
                .style("border-left", `4px solid ${this.genreColors[genre]}`);

            changeItem.append("div")
                .style("color", "white")
                .style("font-weight", "bold")
                .style("margin-bottom", "5px")
                .text(this.getHebrewGenre(genre));

            changeItem.append("div")
                .style("color", change > 0 ? "#2ecc71" : change < 0 ? "#e74c3c" : "#95a5a6")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .text(`${change > 0 ? '+' : ''}${change.toFixed(1)}%`);

            changeItem.append("div")
                .style("color", "#bdc3c7")
                .style("font-size", "12px")
                .text(change > 0 ? "עלייה" : change < 0 ? "ירידה" : "ללא שינוי");
        });

        // הוספת הסבר ספציפי למשבר
        const crisisExplanation = this.getCrisisExplanation(this.currentCrisis);
        if (crisisExplanation) {
            metricsDiv.append("div")
                .style("background", "rgba(255,215,0,0.1)")
                .style("border", "2px solid #FFD700")
                .style("border-radius", "10px")
                .style("padding", "15px")
                .style("margin-top", "20px")
                .style("color", "white")
                .html(`
                                         <h4 style="color: #FFD700; margin: 0 0 10px 0; text-align: center;">💡 הסבר המשבר</h4>
                     ${crisisExplanation}
                 `);
         }
    }

    animateDNAChange(data) {
        // אנימציית פרטיקלים להדגשת שינוי
        setTimeout(() => {
            this.createChangeParticles(data);
        }, 2000);
    }

    createChangeParticles(data) {
        const particles = this.svg.selectAll(".change-particle")
            .data(this.genres.filter(genre => Math.abs(data.changes[genre]) > 2))
            .enter()
            .append("circle")
            .attr("class", "change-particle")
            .attr("cx", this.width/2)
            .attr("cy", this.height/2)
            .attr("r", 3)
            .attr("fill", genre => this.genreColors[genre])
            .style("opacity", 0);

        particles.transition()
            .duration(1000)
            .style("opacity", 0.8)
            .attr("r", 8)
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .attr("r", 20)
            .remove();
    }

    getCrisisExplanation(year) {
        const explanations = {
            2001: `
                <p><strong>פיגועי 11 בספטמבר (2001):</strong> אירוע שזעזע את העולם ושינה את התודעה הקולנועית.</p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li><strong>🎬 סרטי פעולה:</strong> גדלו כתגובה לחוויית הטרור</li>
                    <li><strong>🎭 דרמות:</strong> ביטאו את הטראומה הלאומית</li>
                    <li><strong>🔍 מותחנים:</strong> עלייה בסרטי ריגול וביטחון</li>
                </ul>
            `,
            2008: `
                <p><strong>המשבר הכלכלי העולמי (2008):</strong> קריסת הבנקים שזעזעה את הכלכלה העולמית.</p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li><strong>🎭 דרמות:</strong> עלייה חדה - הציבור חיפש השתקפות של המציאות הקשה</li>
                    <li><strong>😱 אימה:</strong> גידול בסרטי אימה כביטוי לחרדות כלכליות</li>
                    <li><strong>📚 דוקומנטריים:</strong> עלייה בחיפוש אחר הבנת המשבר</li>
                </ul>
            `,
            2020: `
                <p><strong>מגפת COVID-19 (2020):</strong> סגרים עולמיים ושינוי בהרגלי הצפייה.</p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li><strong>😂 קומדיות:</strong> עלייה דרמטית - הציבור חיפש בריחה ושמחה</li>
                    <li><strong>📚 דוקומנטריים:</strong> צמיחה עקב זמן פנוי ברצון להבין את המגפה</li>
                    <li><strong>🏠 צפייה ביתית:</strong> שינוי מהותי בהרגלי הצריכה</li>
                </ul>
            `,
            2022: `
                <p><strong>מלחמת רוסיה-אוקראינה (2022):</strong> המלחמה הגדולה באירופה מאז מלחמת העולם השנייה.</p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li><strong>🎭 דרמות:</strong> עלייה בסרטים המתארים מלחמה וסבל</li>
                    <li><strong>📚 דוקומנטריים:</strong> ביקוש לתיעוד אמיתי של האירועים</li>
                    <li><strong>🎬 הפקות מקומיות:</strong> השפעה על תעשיית הקולנוע האירופית</li>
                </ul>
            `,
            2023: `
                <p><strong>התקפת 7 באוקטובר (2023):</strong> טרור המוני שזעזע את ישראל והעולם.</p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li><strong>🇮🇱 קולנוע ישראלי:</strong> השפעה מיידית על התכנון וההפקה</li>
                    <li><strong>🎭 דרמות:</strong> עלייה בעיסוק בנושאים של טראומה וחוסן</li>
                    <li><strong>📚 דוקומנטריים:</strong> תיעוד האירועים וההתמודדות</li>
                </ul>
            `
        };
        return explanations[year] || null;
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