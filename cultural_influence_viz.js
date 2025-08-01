// Cultural Influence Flows Visualization
// Shows how cinematic influence travels between countries

class CulturalInfluenceFlow {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.width = 1200;
        this.height = 800;
        this.margin = { top: 40, right: 40, bottom: 40, left: 40 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        this.data = null;
        this.influenceFlows = null;
        
        this.init();
    }
    
    init() {
        // Create SVG
        this.svg = this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
        // Create main group
        this.g = this.svg
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
            
        // Create title
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('class', 'chart-title')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('🌊 Cultural Influence Flows');
    }
    
    // Calculate influence metrics between countries
    calculateInfluenceFlows(data, topN = 20) {
        console.log('🔄 Calculating cultural influence flows...');
        
        // Sort countries by influence strength (combination of votes, ratings, and movie count)
        const sortedCountries = data.democratic_diversity_data
            .map(country => ({
                ...country,
                influence_score: this.calculateInfluenceScore(country)
            }))
            .sort((a, b) => b.influence_score - a.influence_score)
            .slice(0, topN);
            
        console.log('📊 Top influencer countries:', sortedCountries.slice(0, 5).map(c => ({
            country: c.country,
            score: c.influence_score.toFixed(2)
        })));
        
        // Create flows between countries
        const flows = [];
        
        // Major influencers (producers) - top 8 countries
        const producers = sortedCountries.slice(0, 8);
        
        // Consumers - next 12 countries
        const consumers = sortedCountries.slice(8, 20);
        
        // Calculate influence flows from producers to consumers
        producers.forEach(producer => {
            consumers.forEach(consumer => {
                if (producer.country !== consumer.country) {
                    const flowStrength = this.calculateFlowStrength(producer, consumer);
                    const dominantGenre = this.getDominantGenre(producer);
                    
                    flows.push({
                        source: producer.country,
                        target: consumer.country,
                        value: flowStrength,
                        sourceData: producer,
                        targetData: consumer,
                        dominantGenre: dominantGenre,
                        genreColor: this.getGenreColor(dominantGenre)
                    });
                }
            });
        });
        
        // Sort by flow strength and take top flows
        flows.sort((a, b) => b.value - a.value);
        const topFlows = flows.slice(0, 50); // Top 50 flows
        
        console.log('🌊 Calculated flows:', topFlows.length);
        console.log('💪 Strongest flows:', topFlows.slice(0, 5));
        
        return {
            producers: producers,
            consumers: consumers,
            flows: topFlows,
            allCountries: sortedCountries
        };
    }
    
    // Calculate overall influence score for a country
    calculateInfluenceScore(country) {
        const movieCountWeight = 0.3;
        const avgVotesWeight = 0.4;
        const avgRatingWeight = 0.3;
        
        // Normalize values
        const normalizedMovies = Math.log(country.movie_count + 1) / 10;
        const normalizedVotes = Math.log(country.avg_votes + 1) / 10;
        const normalizedRating = country.avg_rating / 10;
        
        return (
            normalizedMovies * movieCountWeight +
            normalizedVotes * avgVotesWeight +
            normalizedRating * avgRatingWeight
        ) * 100;
    }
    
    // Calculate flow strength between two countries
    calculateFlowStrength(producer, consumer) {
        // Base strength on producer's influence and consumer's receptivity
        const producerStrength = producer.influence_score;
        const consumerReceptivity = Math.log(consumer.avg_votes + 1) / 5;
        
        // Genre similarity bonus
        const genreSimilarity = this.calculateGenreSimilarity(producer, consumer);
        
        // Language/regional bonus (simplified)
        const regionalBonus = this.getRegionalBonus(producer.country, consumer.country);
        
        return (producerStrength * consumerReceptivity * (1 + genreSimilarity) * regionalBonus) / 100;
    }
    
    // Calculate genre similarity between two countries
    calculateGenreSimilarity(country1, country2) {
        const genres1 = country1.genre_distribution;
        const genres2 = country2.genre_distribution;
        
        let similarity = 0;
        let totalGenres = 0;
        
        Object.keys(genres1).forEach(genre => {
            if (genres2[genre]) {
                const ratio1 = genres1[genre] / country1.movie_count;
                const ratio2 = genres2[genre] / country2.movie_count;
                similarity += Math.min(ratio1, ratio2);
                totalGenres++;
            }
        });
        
        return totalGenres > 0 ? similarity / totalGenres : 0;
    }
    
    // Get regional/language bonus
    getRegionalBonus(country1, country2) {
        const regionalGroups = {
            english: ['US', 'GB', 'CA', 'AU', 'IE'],
            european: ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PT'],
            asian: ['JP', 'KR', 'CN', 'IN'],
            latin: ['BR', 'MX', 'AR', 'ES'],
            nordic: ['SE', 'NO', 'DK', 'FI']
        };
        
        for (let group of Object.values(regionalGroups)) {
            if (group.includes(country1) && group.includes(country2)) {
                return 1.5; // Same region bonus
            }
        }
        return 1.0; // No bonus
    }
    
    // Get dominant genre for a country
    getDominantGenre(country) {
        const genres = Object.entries(country.genre_distribution);
        genres.sort((a, b) => b[1] - a[1]);
        return genres[0][0];
    }
    
    // Get color for genre
    getGenreColor(genre) {
        const genreColors = {
            'Drama': '#2E86AB',
            'Comedy': '#F24236', 
            'Documentary': '#F6AE2D',
            'Horror': '#551B8C',
            'Action': '#FF6B35',
            'Romance': '#FF1B8C',
            'Thriller': '#2F4858',
            'Crime': '#8B0000',
            'Sci-Fi': '#40E0D0',
            'Adventure': '#32CD32',
            'Fantasy': '#9932CC',
            'Animation': '#FF69B4',
            'Mystery': '#2F4F4F',
            'Biography': '#CD853F',
            'Family': '#87CEEB',
            'Sport': '#228B22',
            'Musical': '#FFD700',
            'War': '#8B4513',
            'History': '#A0522D',
            'Western': '#D2691E'
        };
        return genreColors[genre] || '#7f7f7f';
    }
    
    // Render the Sankey diagram
    renderSankey() {
        if (!this.influenceFlows) return;
        
        console.log('🎨 Rendering Sankey diagram...');
        
        // Clear previous visualization
        this.g.selectAll('*').remove();
        
        const { producers, consumers, flows } = this.influenceFlows;
        
        // Create nodes array
        const nodes = [
            ...producers.map(p => ({ 
                id: p.country, 
                type: 'producer', 
                data: p,
                name: getCountryName(p.country),
                x: 0 
            })),
            ...consumers.map(c => ({ 
                id: c.country, 
                type: 'consumer', 
                data: c,
                name: getCountryName(c.country),
                x: this.innerWidth 
            }))
        ];
        
        // Create links array
        const links = flows.map(flow => ({
            source: flow.source,
            target: flow.target,
            value: flow.value,
            color: flow.genreColor,
            dominantGenre: flow.dominantGenre
        }));
        
        // Create Sankey layout
        const sankey = d3.sankey()
            .nodeWidth(150)
            .nodePadding(20)
            .extent([[0, 0], [this.innerWidth, this.innerHeight]]);
        
        const sankeyData = sankey({
            nodes: nodes.map(d => ({ ...d })),
            links: links.map(d => ({ ...d }))
        });
        
        // Draw links (flows)
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(sankeyData.links)
            .enter().append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('stroke-opacity', 0.6)
            .attr('fill', 'none')
            .on('mouseover', this.showFlowTooltip.bind(this))
            .on('mouseout', this.hideTooltip.bind(this));
        
        // Draw nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('rect')
            .data(sankeyData.nodes)
            .enter().append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => d.type === 'producer' ? '#ff6b6b' : '#4ecdc4')
            .attr('stroke', '#333')
            .attr('stroke-width', 1)
            .on('mouseover', this.showNodeTooltip.bind(this))
            .on('mouseout', this.hideTooltip.bind(this));
        
        // Add node labels
        this.g.append('g')
            .attr('class', 'node-labels')
            .selectAll('text')
            .data(sankeyData.nodes)
            .enter().append('text')
            .attr('x', d => d.type === 'producer' ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y0 + d.y1) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.type === 'producer' ? 'start' : 'end')
            .attr('font-size', '12px')
            .attr('fill', '#333')
            .text(d => d.name);
        
        // Add legend
        this.addLegend();
        
        console.log('✅ Sankey diagram rendered');
    }
    
    // Show tooltip for flows
    showFlowTooltip(event, d) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'influence-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('pointer-events', 'none');
            
        tooltip.html(`
            <strong>${getCountryName(d.source.id)} → ${getCountryName(d.target.id)}</strong><br/>
            Flow Strength: ${d.value.toFixed(2)}<br/>
            Dominant Genre: ${d.dominantGenre}<br/>
            Producer Influence: ${d.source.data.influence_score?.toFixed(2) || 'N/A'}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }
    
    // Show tooltip for nodes
    showNodeTooltip(event, d) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'influence-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('pointer-events', 'none');
            
        const topGenres = getTopGenresForCountry(d.data, 3);
        const genreText = topGenres.map(g => `${g.genre} (${g.percentage}%)`).join('<br/>');
        
        tooltip.html(`
            <strong>${d.name}</strong><br/>
            Type: ${d.type === 'producer' ? 'Cultural Producer' : 'Cultural Consumer'}<br/>
            Movies: ${d.data.movie_count.toLocaleString()}<br/>
            Avg Rating: ${d.data.avg_rating.toFixed(2)}<br/>
            Avg Votes: ${d.data.avg_votes.toLocaleString()}<br/>
            Influence Score: ${d.data.influence_score?.toFixed(2) || 'N/A'}<br/>
            <br/>Top Genres:<br/>${genreText}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }
    
    // Hide tooltip
    hideTooltip() {
        d3.selectAll('.influence-tooltip').remove();
    }
    
    // Add legend
    addLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, ${this.height - 150})`);
        
        // Producer/Consumer legend
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#ff6b6b');
            
        legend.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '12px')
            .text('Cultural Producers (Influencers)');
            
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 25)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#4ecdc4');
            
        legend.append('text')
            .attr('x', 20)
            .attr('y', 37)
            .attr('font-size', '12px')
            .text('Cultural Consumers');
            
        // Flow thickness legend
        legend.append('text')
            .attr('x', 0)
            .attr('y', 60)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text('Flow Thickness = Influence Strength');
            
        legend.append('text')
            .attr('x', 0)
            .attr('y', 80)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text('Flow Color = Dominant Genre');
    }
    
    // Main render method
    async render() {
        try {
            console.log('🎬 Loading cultural influence visualization...');
            
            // Load data if not already loaded
            if (!window.GLOBAL_DATA) {
                this.data = await loadGlobalData();
            } else {
                this.data = window.GLOBAL_DATA;
            }
            
            // Calculate influence flows
            this.influenceFlows = this.calculateInfluenceFlows(this.data);
            
            // Render Sankey diagram
            this.renderSankey();
            
            console.log('✅ Cultural influence visualization ready!');
            
        } catch (error) {
            console.error('❌ Error rendering cultural influence:', error);
            this.container.append('div')
                .attr('class', 'error-message')
                .style('color', 'red')
                .style('text-align', 'center')
                .style('margin-top', '50px')
                .text('Error loading cultural influence data. Please check the console for details.');
        }
    }
}

// Export for global use
window.CulturalInfluenceFlow = CulturalInfluenceFlow;