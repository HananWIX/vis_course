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
            console.log('🎬 Starting IMDb data visualization...');
            this.showLoadingState();
            await this.loadData();
            this.createCharts();
            this.setupEventListeners();
            this.generateInsights();
            this.updateStatistics();
            this.hideLoadingIndicator();
            this.animateElements();
            console.log('✅ Visualization completed successfully!');
        } catch (error) {
            console.error('❌ Error initializing project:', error);
            this.showError('Error loading data. Please refresh the page.');
        }
    }

    showLoadingState() {
        this.isLoading = true;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        
        // Add loading state to all charts
        document.querySelectorAll('.chart').forEach(chart => {
            chart.classList.add('loading');
        });
    }

    async loadData() {
        try {
            console.log('📊 Loading IMDb data...');
            // Load data from global variable
            if (typeof DATA === 'undefined') {
                throw new Error('Data file not loaded. Make sure data.js file exists.');
            }
            this.data = DATA;
            console.log('📈 Data loaded successfully:', {
                movies: this.data.metadata.totalMovies,
                ratings: this.data.metadata.totalRatings,
                records: this.data.metadata.mergedRecords
            });
        } catch (error) {
            console.error('💥 Error loading data:', error);
            throw error;
        }
    }

    createCharts() {
        console.log('🎨 Creating charts...');
        
        try {
            // Line Chart - trends over time
            this.charts.lineChart = new LineChart(
                '#lineChart', 
                this.data.lineChartData, 
                this.data.crisisData
            );
            console.log('✓ Line chart created');

            // Bar Chart - crisis comparison
            this.charts.barChart = new BarChart(
                '#barChart', 
                this.data.barChartData, 
                this.data.crisisData
            );
            console.log('✓ Bar chart created');

            // Pie Chart - genre distribution
            this.charts.pieChart = new PieChart(
                '#pieChart', 
                this.data.pieChartData, 
                this.data.crisisData
            );
            console.log('✓ Pie chart created');

            // DNA Chart - Cinema DNA
            if (typeof CinemaDNAChart !== 'undefined') {
                this.charts.dnaChart = new CinemaDNAChart(
                    '#dnaChart', 
                    this.data, 
                    this.data.crisisData
                );
                console.log('✓ DNA chart created');
            }

            // Area Chart - crisis impact analysis
            this.charts.areaChart = new AreaChart(
                '#areaChart', 
                this.data, 
                this.data.crisisData
            );
            console.log('✓ Crisis analysis chart created');

            // Heatmap Chart - heatmap
            this.charts.heatmapChart = new HeatmapChart(
                '#heatmapChart', 
                this.data.heatmapData, 
                this.data.crisisData
            );
            console.log('✓ Heatmap created');

            // Ensure loading state is removed from all charts after creation
            setTimeout(() => {
                document.querySelectorAll('.chart').forEach(chart => {
                    if (chart.classList.contains('loading')) {
                        chart.classList.remove('loading');
                        console.log('✓ Removed loading state from', chart.id);
                    }
                });
            }, 100);

        } catch (error) {
            console.error('💥 Error creating charts:', error);
            throw error;
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

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
                    btn.textContent = 'Show Single Chart';
                    btn.style.background = '#e74c3c';
                } else {
                    btn.textContent = 'Show Before/After Comparison';
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
        console.log('🧠 Generating insights from data...');
        
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
                `Overall movie trend: Steady increase from 2000 to 2024`,
                `Crisis years identified: ${crisisYears.join(', ')}`,
                `Drama is the dominant genre in most years`,
                `Sharp increase in documentaries since 2015`,
                `Horror genre shows steady growth`
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
            
            const trend = avgCrisis > avgNormal ? 'increase' : 'decrease';
            const percentage = Math.abs(((avgCrisis - avgNormal) / avgNormal) * 100).toFixed(1);

            insights = [
                `${this.data.genreMapping[selectedGenre]}: ${trend} of ${percentage}% in crisis years`,
                `Average in crisis years: ${Math.round(avgCrisis)} movies`,
                `Average in normal years: ${Math.round(avgNormal)} movies`,
                `Year with highest production: ${genreData.reduce((max, d) => d.value > max.value ? d : max).year}`,
                `Overall trend: ${this.calculateTrend(genreData)}`
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
            `Crisis ${crisis}: ${increasedGenres.length} genres increased, ${decreasedGenres.length} decreased`,
            `Biggest increase: ${mostIncrease.genre} (+${mostIncrease.change}%)`,
            `Biggest decrease: ${mostDecrease.genre} (${mostDecrease.change}%)`,
            `Average change: ${(data.reduce((sum, d) => sum + Math.abs(d.change), 0) / data.length).toFixed(1)}%`,
            this.getCrisisInsight(crisis)
        ];

        insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }

    getCrisisInsight(crisis) {
        const insights = {
            '2001': 'September 11 attacks led to increase in action and thriller movies',
            '2008': 'Economic crisis led to increase in dramas and horror movies',
            '2020': 'COVID-19 led to increase in comedies and documentaries',
            '2022': 'מלחמת רוסיה-אוקראינה השפיעה על הפקת סרטי מלחמה ודרמות',
            '2023': 'התקפת 7 באוקטובר השפיעה על תעשיית הקולנוע בישראל'
        };
        return insights[crisis] || 'משבר זה השפיע על דפוסי הפקת הסרטים';
    }

    getPieChartCrisisInsight(year) {
        const insights = {
            '2001': 'During 9/11 attacks, action and thriller movies increased',
            '2008': 'During economic crisis, dramas and horror were popular',
            '2020': 'During COVID-19, comedies helped with coping',
            '2022': 'During Ukraine war, documentaries showed reality',
            '2023': 'During October 7 attack, Israeli cinema focused on dramas'
        };
        return insights[year] || 'This crisis affected genre preferences';
    }

    updatePieChartInsights(year) {
        const insightsList = document.getElementById('pieInsightsList');
        if (!insightsList) return;

        const data = this.data.pieChartData[year];
        const dominant = data[0]; // First item (highest percentage)
        const totalMovies = data.reduce((sum, d) => sum + d.count, 0);

        const insights = [
            `Year ${year}: Total ${totalMovies.toLocaleString()} movies`,
            `Dominant genre: ${dominant.genre} (${dominant.percentage}%)`,
            `Top three genres contain ${data.slice(0, 3).reduce((sum, d) => sum + d.percentage, 0).toFixed(1)}% of movies`,
            `Genre diversity: ${data.length} different genres`,
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
            `Overall growth: ${growth}% from 2000 to 2024`,
            `Production peak: ${data.reduce((max, d) => d.count > max.count ? d : max).year} with ${data.reduce((max, d) => d.count > max.count ? d : max).count.toLocaleString()} movies`,
            `2008 crisis impact: ${crisisImpact2008}% change`,
            `2020 crisis impact: ${crisisImpact2020}% change`,
            `Main trend: Steady increase with short dips during crises`
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
                'Drama is the dominant genre throughout the period',
                'Significant increase in documentaries since 2015',
                'Comedies serve as a coping mechanism during crises',
                'Movie quality remains stable over the years',
                'Digital technology impact on increased production'
            ].map(finding => `<li>${finding}</li>`).join('');
        }

        // Crisis Impact
        const crisisImpact = document.getElementById('crisisImpact');
        if (crisisImpact) {
            crisisImpact.innerHTML = [
                '2008 crisis: Increase in dramas and horror (+20-25%)',
                'COVID-19: Boom in comedies and documentaries (+30-40%)',
                'Temporary decline in action movies during crises',
                'Quick industry recovery after each crisis',
                'Shift in consumer preferences to feel-good content'
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
        
        return avgSecond > avgFirst ? 'increase' : 'decrease';
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
            case 'count': return 'Number of movies';
            case 'rating': return 'Average rating';
            case 'votes': return 'Number of votes';
            default: return metric;
        }
    }

    identifyPattern(data, metric) {
        // Simple pattern identification
        const recentData = data.filter(d => d.year >= 2015);
        const trend = this.calculateTrend(recentData.map(d => ({value: d[metric]})));
        return `${trend} in recent years`;
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
        
        // Remove loading state from all charts
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
        
        console.log('📱 Adapting to new screen size...');
        
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.createCharts();
        }, 300);
    }
}

// Initialize application when DOM is loaded - Enhanced
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting visualization application...');
    new IMDbVisualization();
});

// Global error handler - Enhanced
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
});

// Service Worker for offline capability (optional) - Enhanced
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('📱 Service Worker registered successfully');
            })
            .catch((registrationError) => {
                console.log('❌ Service Worker failed:', registrationError);
            });
    });
} 