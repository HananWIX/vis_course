// Main Application Class - Enhanced
class IMDbVisualization {
    constructor() {
        this.data = null;
        this.charts = {};
        this.insights = {};
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            console.log('🎬 מתחיל ויזואליזציה של נתוני IMDb...');
            this.showLoadingState();
            await this.loadData();
            this.createCharts();
            this.setupEventListeners();
            this.generateInsights();
            this.updateStatistics();
            this.hideLoadingIndicator();
            this.animateElements();
            console.log('✅ ויזואליזציה הושלמה בהצלחה!');
        } catch (error) {
            console.error('❌ שגיאה באתחול הפרויקט:', error);
            this.showError('שגיאה בטעינת הנתונים. אנא רענן את הדף.');
        }
    }

    showLoadingState() {
        this.isLoading = true;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        
        // הוסף מצב טעינה לכל הגרפים
        document.querySelectorAll('.chart').forEach(chart => {
            chart.classList.add('loading');
        });
    }

    async loadData() {
        try {
            console.log('📊 טוען נתוני IMDb...');
            // טעינת הנתונים מהמשתנה הגלובלי
            if (typeof DATA === 'undefined') {
                throw new Error('קובץ הנתונים לא נטען. וודא שקובץ data.js קיים.');
            }
            this.data = DATA;
            console.log('📈 נתונים נטענו בהצלחה:', {
                movies: this.data.metadata.totalMovies,
                ratings: this.data.metadata.totalRatings,
                records: this.data.metadata.mergedRecords
            });
        } catch (error) {
            console.error('💥 שגיאה בטעינת נתונים:', error);
            throw error;
        }
    }

    createCharts() {
        console.log('🎨 יוצר גרפים...');
        
        try {
            // Line Chart - מגמות לאורך זמן
            this.charts.lineChart = new LineChart(
                '#lineChart', 
                this.data.lineChartData, 
                this.data.crisisData
            );
            console.log('✓ גרף קווי נוצר');

            // Bar Chart - השוואת משברים
            this.charts.barChart = new BarChart(
                '#barChart', 
                this.data.barChartData, 
                this.data.crisisData
            );
            console.log('✓ גרף עמודות נוצר');

            // Pie Chart - חלוקת ז'אנרים
            this.charts.pieChart = new PieChart(
                '#pieChart', 
                this.data.pieChartData, 
                this.data.crisisData
            );
            console.log('✓ גרף עוגה נוצר');

            // DNA Chart - DNA הקולנוע
            if (typeof CinemaDNAChart !== 'undefined') {
                this.charts.dnaChart = new CinemaDNAChart(
                    '#dnaChart', 
                    this.data, 
                    this.data.crisisData
                );
                console.log('✓ גרף DNA נוצר');
            }

            // Area Chart - ניתוח השפעת משברים
            this.charts.areaChart = new AreaChart(
                '#areaChart', 
                this.data, 
                this.data.crisisData
            );
            console.log('✓ גרף ניתוח משברים נוצר');

            // Heatmap Chart - מפת חום
            this.charts.heatmapChart = new HeatmapChart(
                '#heatmapChart', 
                this.data.heatmapData, 
                this.data.crisisData
            );
            console.log('✓ מפת חום נוצרה');

        } catch (error) {
            console.error('💥 שגיאה ביצירת גרפים:', error);
            throw error;
        }
    }

    setupEventListeners() {
        console.log('🔧 מגדיר מאזיני אירועים...');

        // Navigation
        this.setupNavigation();

        // Chart Controls
        this.setupChartControls();

        // Window resize - Enhanced
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 500));
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Smooth scroll to section
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Add animation to the target section
                    targetElement.classList.add('bounce-in');
                    setTimeout(() => {
                        targetElement.classList.remove('bounce-in');
                    }, 800);
                }
            });
        });

        // Intersection Observer for navigation highlighting - Enhanced
        const sections = document.querySelectorAll('.chart-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    const activeLink = document.querySelector(`[href="#${id}"]`);
                    if (activeLink) {
                        navLinks.forEach(l => l.classList.remove('active'));
                        activeLink.classList.add('active');
                    }
                }
            });
        }, { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' });

        sections.forEach(section => observer.observe(section));
    }

    setupChartControls() {
        // Line Chart Controls - Enhanced
        const genreFilter = document.getElementById('genreFilter');
        if (genreFilter && this.charts.lineChart) {
            genreFilter.addEventListener('change', (e) => {
                this.charts.lineChart.filterByGenre(e.target.value);
                this.updateLineChartInsights(e.target.value);
            });
        }

        // Bar Chart Controls - Enhanced
        const crisisSelect = document.getElementById('crisisSelect');
        if (crisisSelect && this.charts.barChart) {
            crisisSelect.addEventListener('change', (e) => {
                this.charts.barChart.updateCrisis(e.target.value);
                this.updateBarChartInsights(e.target.value);
            });
        }

        // Pie Chart Controls - Enhanced
        const crisisYear = document.getElementById('crisisYear');
        if (crisisYear && this.charts.pieChart) {
            crisisYear.addEventListener('change', (e) => {
                this.charts.pieChart.updateYear(e.target.value);
                this.updatePieChartInsights(e.target.value);
            });
        }

        // Pie Chart Display Mode - Enhanced
        const pieMode = document.getElementById('pieMode');
        if (pieMode && this.charts.pieChart) {
            pieMode.addEventListener('change', (e) => {
                this.charts.pieChart.updateDisplayMode(e.target.value);
                this.updatePieChartInsights(this.charts.pieChart.currentYear);
            });
        }

        // Pie Chart Comparison - Enhanced
        const pieComparison = document.getElementById('pieComparison');
        if (pieComparison && this.charts.pieChart) {
            pieComparison.addEventListener('click', () => {
                this.charts.pieChart.toggleComparison();
                const btn = pieComparison;
                if (this.charts.pieChart.showComparison) {
                    btn.textContent = 'הצג גרף בודד';
                    btn.style.background = '#e74c3c';
                } else {
                    btn.textContent = 'הצג השוואה לפני/אחרי';
                    btn.style.background = '#3498db';
                }
            });
        }

        // Pie Chart Show Percentages - Enhanced
        const pieShowPercentages = document.getElementById('pieShowPercentages');
        if (pieShowPercentages && this.charts.pieChart) {
            pieShowPercentages.addEventListener('change', (e) => {
                this.charts.pieChart.showPercentages = e.target.checked;
                this.charts.pieChart.updateChart();
            });
        }

        // Heatmap Controls - Enhanced
        const heatmapMetric = document.getElementById('heatmapMetric');
        if (heatmapMetric && this.charts.heatmapChart) {
            heatmapMetric.addEventListener('change', (e) => {
                this.charts.heatmapChart.updateMetric(e.target.value);
                this.updateHeatmapInsights(e.target.value);
            });
        }
    }

    generateInsights() {
        console.log('🧠 מפיק תובנות מהנתונים...');
        
        this.updateLineChartInsights('all');
        this.updateBarChartInsights('2008');
        this.updatePieChartInsights('2008');

        this.updateAreaChartInsights();
        this.updateHeatmapInsights('count');
        this.updateSummaryInsights();
    }

    updateLineChartInsights(selectedGenre) {
        const insightsList = document.getElementById('lineInsightsList');
        if (!insightsList) return;

        let insights = [];

        if (selectedGenre === 'all') {
            // General trends
            const crisisYears = this.data.crisisData.crisisYears;
            insights = [
                `מגמת הסרטים כללית: עלייה מתמדת מ-2000 עד 2024`,
                `שנות משבר מזוהות: ${crisisYears.join(', ')}`,
                `דרמה היא הז'אנר הדומיננטי ברוב השנים`,
                `עלייה חדה בדוקומנטריים מאז 2015`,
                `ז'אנר האימה מראה צמיחה יציבה`
            ];
        } else {
            // Genre-specific insights
            const genreData = this.data.lineChartData.map(d => ({
                year: d.year,
                value: d[selectedGenre],
                isCrisis: d.isCrisis
            }));

            const crisisYearData = genreData.filter(d => d.isCrisis);
            const avgCrisis = crisisYearData.reduce((sum, d) => sum + d.value, 0) / crisisYearData.length;
            const avgNormal = genreData.filter(d => !d.isCrisis).reduce((sum, d) => sum + d.value, 0) / genreData.filter(d => !d.isCrisis).length;
            
            const trend = avgCrisis > avgNormal ? 'עלייה' : 'ירידה';
            const percentage = Math.abs(((avgCrisis - avgNormal) / avgNormal) * 100).toFixed(1);

            insights = [
                `${this.data.genreMapping[selectedGenre]}: ${trend} של ${percentage}% בשנות משבר`,
                `ממוצע בשנות משבר: ${Math.round(avgCrisis)} סרטים`,
                `ממוצע בשנים רגילות: ${Math.round(avgNormal)} סרטים`,
                `השנה עם הפקה הגבוהה ביותר: ${genreData.reduce((max, d) => d.value > max.value ? d : max).year}`,
                `מגמה כללית: ${this.calculateTrend(genreData)}`
            ];
        }

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateBarChartInsights(crisis) {
        const insightsList = document.getElementById('barInsightsList');
        if (!insightsList) return;

        const data = this.data.barChartData[crisis];
        const increasedGenres = data.filter(d => d.change > 0);
        const decreasedGenres = data.filter(d => d.change < 0);
        const mostIncrease = data.reduce((max, d) => d.change > max.change ? d : max);
        const mostDecrease = data.reduce((min, d) => d.change < min.change ? d : min);

        const insights = [
            `משבר ${crisis}: ${increasedGenres.length} ז'אנרים עלו, ${decreasedGenres.length} ירדו`,
            `העלייה הגדולה ביותר: ${mostIncrease.genre} (+${mostIncrease.change}%)`,
            `הירידה הגדולה ביותר: ${mostDecrease.genre} (${mostDecrease.change}%)`,
            `שינוי ממוצע: ${(data.reduce((sum, d) => sum + Math.abs(d.change), 0) / data.length).toFixed(1)}%`,
            this.getCrisisInsight(crisis)
        ];

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    getCrisisInsight(crisis) {
        const insights = {
            '2001': 'פיגועי 11 בספטמבר הובילו לעלייה בסרטי פעולה ומותחנים',
            '2008': 'המשבר הכלכלי הוביל לעלייה בדרמות ואימה',
            '2020': 'COVID-19 הוביל לעלייה בקומדיות ודוקומנטריים',
            '2022': 'מלחמת רוסיה-אוקראינה השפיעה על הפקת סרטי מלחמה ודרמות',
            '2023': 'התקפת 7 באוקטובר השפיעה על תעשיית הקולנוע בישראל'
        };
        return insights[crisis] || 'משבר זה השפיע על דפוסי הפקת הסרטים';
    }

    getPieChartCrisisInsight(year) {
        const insights = {
            '2001': 'בעת פיגועי 11/9, סרטי פעולה ומותחנים גברו',
            '2008': 'בעת משבר כלכלי, דרמות ואימה היו פופולריים',
            '2020': 'בעת COVID-19, קומדיות סייעו להתמודדות',
            '2022': 'בעת מלחמת אוקראינה, דוקומנטריים הציגו את המציאות',
            '2023': 'בעת התקפת 7/10, הקולנוע הישראלי התרכז בסרטי דרמה'
        };
        return insights[year] || 'משבר זה השפיע על העדפות הז\'אנרים';
    }

    updatePieChartInsights(year) {
        const insightsList = document.getElementById('pieInsightsList');
        if (!insightsList) return;

        const data = this.data.pieChartData[year];
        const dominant = data[0]; // First item (highest percentage)
        const totalMovies = data.reduce((sum, d) => sum + d.count, 0);

        const insights = [
            `שנת ${year}: סך הכל ${totalMovies.toLocaleString()} סרטים`,
            `הז'אנר הדומיננטי: ${dominant.genre} (${dominant.percentage}%)`,
            `שלושת הז'אנרים המובילים מכילים ${data.slice(0, 3).reduce((sum, d) => sum + d.percentage, 0).toFixed(1)}% מהסרטים`,
            `גיוון ז'אנרים: ${data.length} ז'אנרים שונים`,
            this.getPieChartCrisisInsight(year)
        ];

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateAreaChartInsights() {
        const insightsList = document.getElementById('areaInsightsList');
        if (!insightsList) return;

        const data = this.data.areaChartData;
        const growth = ((data[data.length-1].count - data[0].count) / data[0].count * 100).toFixed(1);
        const crisisImpact2008 = this.calculateCrisisImpact(data, 2008);
        const crisisImpact2020 = this.calculateCrisisImpact(data, 2020);

        const insights = [
            `צמיחה כוללת: ${growth}% מ-2000 עד 2024`,
            `פיק הפקה: ${data.reduce((max, d) => d.count > max.count ? d : max).year} עם ${data.reduce((max, d) => d.count > max.count ? d : max).count.toLocaleString()} סרטים`,
            `השפעת משבר 2008: ${crisisImpact2008}% שינוי`,
            `השפעת משבר 2020: ${crisisImpact2020}% שינוי`,
            `מגמה עיקרית: עלייה מתמדת עם טבילות קצרות במשברים`
        ];

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateHeatmapInsights(metric) {
        const insightsList = document.getElementById('heatmapInsightsList');
        if (!insightsList) return;

        const data = this.data.heatmapData;
        const metricLabel = this.getMetricLabel(metric);
        
        // Find the hottest spots
        const maxValue = Math.max(...data.map(d => d[metric]));
        const hotSpot = data.find(d => d[metric] === maxValue);
        
        // Crisis years analysis
        const crisisData = data.filter(d => this.data.crisisData.crisisYears.includes(d.year));
        const normalData = data.filter(d => !this.data.crisisData.crisisYears.includes(d.year));
        
        const avgCrisis = crisisData.reduce((sum, d) => sum + d[metric], 0) / crisisData.length;
        const avgNormal = normalData.reduce((sum, d) => sum + d[metric], 0) / normalData.length;

        const insights = [
            `${metricLabel}: הערך הגבוה ביותר - ${hotSpot.genre} ב-${hotSpot.year}`,
            `ממוצע בשנות משבר: ${avgCrisis.toFixed(metric === 'rating' ? 1 : 0)}`,
            `ממוצע בשנים רגילות: ${avgNormal.toFixed(metric === 'rating' ? 1 : 0)}`,
            `השוני בין משבר לרגיל: ${((avgCrisis/avgNormal - 1) * 100).toFixed(1)}%`,
            `דפוס זמני: ${this.identifyPattern(data, metric)}`
        ];

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    updateSummaryInsights() {
        // Main Findings
        const mainFindings = document.getElementById('mainFindings');
        if (mainFindings) {
            mainFindings.innerHTML = [
                'דרמה היא הז\'אנר הדומיננטי בכל התקופה',
                'עלייה משמעותית בדוקומנטריים מאז 2015',
                'קומדיות משמשות כמנגנון התמודדות במשברים',
                'איכות הסרטים נשמרת יציבה לאורך השנים',
                'השפעת הטכנולוגיה הדיגיטלית על עלייה בהפקות'
            ].map(finding => `<li>${finding}</li>`).join('');
        }

        // Crisis Impact
        const crisisImpact = document.getElementById('crisisImpact');
        if (crisisImpact) {
            crisisImpact.innerHTML = [
                'משבר 2008: עלייה בדרמות ואימה (+20-25%)',
                'COVID-19: פריחה של קומדיות ודוקומנטריים (+30-40%)',
                'ירידה זמנית בסרטי פעולה במשברים',
                'החלמה מהירה של התעשייה אחרי כל משבר',
                'שינוי בהעדפות הצרכנים לתכנים נחמדים'
            ].map(impact => `<li>${impact}</li>`).join('');
        }
    }

    updateStatistics() {
        if (!this.data || !this.data.metadata) return;

        const totalMovies = document.getElementById('totalMovies');
        const totalRatings = document.getElementById('totalRatings');
        const totalGenres = document.getElementById('totalGenres');

        if (totalMovies) {
            this.animateNumber(totalMovies, this.data.metadata.totalMovies);
        }
        if (totalRatings) {
            this.animateNumber(totalRatings, this.data.metadata.totalRatings);
        }
        if (totalGenres) {
            this.animateNumber(totalGenres, this.data.metadata.genres.length);
        }
    }

    // Utility Methods - Enhanced
    calculateTrend(data) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        
        const avgFirst = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
        
        return avgSecond > avgFirst ? 'עלייה' : 'ירידה';
    }

    calculateCrisisImpact(data, crisisYear) {
        const before = data.find(d => d.year === crisisYear - 1);
        const crisis = data.find(d => d.year === crisisYear);
        const after = data.find(d => d.year === crisisYear + 1);
        
        if (!before || !crisis || !after) return 'N/A';
        
        const impactStart = ((crisis.count - before.count) / before.count * 100);
        const recovery = ((after.count - crisis.count) / crisis.count * 100);
        
        return `${impactStart.toFixed(1)}% (התאוששות: ${recovery.toFixed(1)}%)`;
    }

    getMetricLabel(metric) {
        switch(metric) {
            case 'count': return 'מספר סרטים';
            case 'rating': return 'דירוג ממוצע';
            case 'votes': return 'מספר הצבעות';
            default: return metric;
        }
    }

    identifyPattern(data, metric) {
        // Simple pattern identification
        const recentData = data.filter(d => d.year >= 2015);
        const trend = this.calculateTrend(recentData.map(d => ({value: d[metric]})));
        return `${trend} בשנים האחרונות`;
    }

    animateNumber(element, target) {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (target - start) * this.easeOutCubic(progress));
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    hideLoadingIndicator() {
        this.isLoading = false;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
        
        // הסר מצב טעינה מכל הגרפים
        document.querySelectorAll('.chart').forEach(chart => {
            chart.classList.remove('loading');
        });
    }

    showError(message) {
        const header = document.querySelector('.header');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #e74c3c;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        header.appendChild(errorDiv);
    }

    animateElements() {
        // Add fade-in animation to chart sections - Enhanced
        const sections = document.querySelectorAll('.chart-section');
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('fade-in');
            }, index * 300);
        });
    }

    handleResize() {
        // Recreate charts on window resize for responsive design - Enhanced
        if (this.isLoading) return; // Don't resize while loading
        
        console.log('📱 מתאים לגודל מסך חדש...');
        
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.createCharts();
        }, 300);
    }
}

// Initialize application when DOM is loaded - Enhanced
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 מתחיל אפליקציית ויזואליזציה...');
    new IMDbVisualization();
});

// Global error handler - Enhanced
window.addEventListener('error', (event) => {
    console.error('💥 שגיאה גלובלית:', event.error);
});

// Service Worker for offline capability (optional) - Enhanced
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('📱 Service Worker נרשם בהצלחה');
            })
            .catch((registrationError) => {
                console.log('❌ Service Worker נכשל:', registrationError);
            });
    });
} 