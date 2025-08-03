/**
 * Simple Working Collaboration Network
 */

class CollaborationNetwork2D {
    constructor() {
        this.networkData = null;
        this.minCollaborations = 10;
        this.collaborationType = 'all';
        this.initialized = false;
        this.nodeScale = 1.0;  // Add node scale property
        this.tooltipHideTimeout = null;  // For stable tooltip behavior
        
        this.colors = {
            'north_america': '#2E86AB',
            'western_europe': '#A23B72', 
            'northern_europe': '#F18F01',
            'eastern_europe': '#C73E1D',
            'asia_pacific': '#7209B7',
            'latin_america': '#F72585',
            'middle_east_africa': '#4361EE',
            'middle_east': '#4361EE',
            'africa': '#FF6B35',
            'south_asia': '#9D4EDD',
            'east_asia': '#F72585',
            'other': '#6C757D'
        };
    }
    
    getRegionColor(regionId) {
        return this.colors[regionId] || this.colors.other;
    }
    
    log(message) {
        console.log(`[CollaborationNetwork] ${message}`);
    }
    
    async init() {
        if (this.initialized) return;
        
        this.log("🌐 Starting collaboration network...");
        
        try {
            // Load data
            const response = await fetch('collaboration_network_data.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.networkData = await response.json();
            this.log("✅ Data loaded successfully");
            
            // Setup the visualization
            this.setupVisualization();
            this.initialized = true;
            
        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
            this.showError(error.message);
        }
    }
    
    setupVisualization() {
        // Clean up existing tooltip and timeouts
        if (this.tooltipHideTimeout) {
            clearTimeout(this.tooltipHideTimeout);
            this.tooltipHideTimeout = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Get container
        const container = document.getElementById('collaboration-network-container');
        if (!container) {
            this.log('❌ Container collaboration-network-container not found');
            throw new Error('Container collaboration-network-container not found');
        }
        
        this.log(`✅ Container found: ${container.clientWidth}x${container.clientHeight}`);
        
        // Hide loading
        const loading = document.getElementById('collaboration-loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Setup SVG
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const svg = d3.select('#collaboration-network-svg')
            .attr('width', width)
            .attr('height', height);
        
        svg.selectAll('*').remove(); // Clear
        
        // Get current network data
        const currentNetwork = this.networkData.networks[this.collaborationType];
        if (!currentNetwork) {
            throw new Error(`Network type '${this.collaborationType}' not found`);
        }
        
        // **AGGREGATE TO REGIONAL COMMUNITIES**
        const regionalData = this.aggregateByRegions(currentNetwork, this.minCollaborations);
        const nodes = regionalData.nodes;
        const links = regionalData.links;
        
        this.log(`🌍 Showing ${nodes.length} regions, ${links.length} regional links`);
        
        // Create simulation with MUCH MORE SPACING
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id)
                .distance(d => Math.max(120, 200 - (d.weight / 30)))  // Much longer distances
                .strength(0.6))
            .force('charge', d3.forceManyBody()
                .strength(d => -Math.max(400, d.totalCollaborations / 5)))  // MUCH stronger repulsion
            .force('center', d3.forceCenter(width / 2, height / 2).strength(0.2))
            .force('collision', d3.forceCollide()
                .radius(d => Math.max(40, Math.sqrt(d.totalCollaborations / 50) * this.nodeScale + 25))
                .strength(1.0));
        
        // Create links with MUCH BETTER differentiation
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', d => {
                if (d.weight > 500) return '#ffffff';      // Very strong = bright white
                if (d.weight > 200) return '#dddddd';      // Strong = light gray
                if (d.weight > 100) return '#aaaaaa';      // Medium = medium gray
                return '#777777';                          // Weak = dark gray
            })
            .attr('stroke-opacity', d => {
                if (d.weight > 500) return 0.9;           // Very strong = very visible
                if (d.weight > 200) return 0.8;           // Strong = visible
                if (d.weight > 100) return 0.6;           // Medium = medium
                return 0.4;                               // Weak = subtle
            })
            .attr('stroke-width', d => {
                if (d.weight > 500) return 8;             // Very strong = very thick
                if (d.weight > 200) return 5;             // Strong = thick
                if (d.weight > 100) return 3;             // Medium = medium
                return 1.5;                               // Weak = thin
            })
            .attr('filter', d => d.weight > 500 ? 'drop-shadow(0 0 4px #ffffff)' : null); // Glow for strongest
        
        // Create regional nodes (adjustable size)
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', d => Math.max(20, (Math.sqrt(d.totalCollaborations / 50) + 15) * this.nodeScale))
            .attr('fill', d => this.getRegionColor(d.id))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));
        
        // Store references for dynamic updates
        this.currentNodes = node;
        this.currentSimulation = simulation;
        
        // Add regional labels
        const label = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.name)  // Use region name instead of ID
            .attr('font-size', 12)
            .attr('font-weight', 'bold')
            .attr('fill', '#fff')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em');
        
        // Create rich tooltip for hover effects (only if it doesn't exist)
        if (!this.tooltip) {
            this.tooltip = d3.select('body')
                .append('div')
                .attr('class', 'collaboration-tooltip')
                .style('position', 'absolute')
                .style('visibility', 'hidden')
                .style('background', 'rgba(0, 0, 0, 0.95)')
                .style('color', 'white')
                .style('padding', '14px')
                .style('border-radius', '10px')
                .style('font-size', '13px')
                .style('font-family', 'Inter, sans-serif')
                .style('box-shadow', '0 6px 25px rgba(0,0,0,0.4)')
                .style('backdrop-filter', 'blur(12px)')
                .style('border', '2px solid rgba(255,255,255,0.15)')
                .style('max-width', '340px')
                .style('z-index', '10000')
                .style('pointer-events', 'none')
                .style('transition', 'all 0.2s ease-in-out');
        }

        // Add hover effects to nodes with improved stability
        node
            .on('mouseenter', (event, d) => {
                clearTimeout(this.tooltipHideTimeout);
                this.showTooltip(event, d);
            })
            .on('mousemove', (event, d) => {
                this.moveTooltip(event);
            })
            .on('mouseleave', () => {
                // Add slight delay before hiding to prevent flickering
                this.tooltipHideTimeout = setTimeout(() => {
                    this.hideTooltip();
                }, 150);
            });
        
        // Simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        // Setup controls and legend with slight delay to ensure DOM is ready
        setTimeout(() => {
            this.setupControls();
            this.createLegend();
        }, 100);
        
        this.log("✅ Visualization ready!");
    }
    
    aggregateByRegions(network, minCollab) {
        const regionNodes = new Map();
        const regionLinks = new Map();
        
        // Group countries by their community/region
        network.nodes.forEach(node => {
            const countryData = this.networkData.countries.find(c => c.id === node.id);
            if (!countryData) return;
            
            const regionId = countryData.community;
            const regionName = this.getRegionDisplayName(regionId);
            
            if (!regionNodes.has(regionId)) {
                regionNodes.set(regionId, {
                    id: regionId,
                    name: regionName,
                    totalCollaborations: 0,
                    countryCount: 0,
                    countries: []
                });
            }
            
            const region = regionNodes.get(regionId);
            region.totalCollaborations += node.totalCollaborations || 0;
            region.countryCount++;
            region.countries.push(countryData.countryName);
        });
        
        // Aggregate links between regions
        network.links.forEach(link => {
            const sourceCountry = this.networkData.countries.find(c => c.id === link.source);
            const targetCountry = this.networkData.countries.find(c => c.id === link.target);
            
            if (!sourceCountry || !targetCountry) return;
            
            const sourceRegion = sourceCountry.community;
            const targetRegion = targetCountry.community;
            
            // Skip intra-regional links for cleaner visualization
            if (sourceRegion === targetRegion) return;
            
            const linkId = [sourceRegion, targetRegion].sort().join('-');
            
            if (!regionLinks.has(linkId)) {
                regionLinks.set(linkId, {
                    source: sourceRegion,
                    target: targetRegion,
                    weight: 0
                });
            }
            
            regionLinks.get(linkId).weight += link.weight;
        });
        
        // Filter by minimum collaborations
        const filteredRegionLinks = Array.from(regionLinks.values())
            .filter(link => link.weight >= minCollab);
        
        const connectedRegions = new Set();
        filteredRegionLinks.forEach(link => {
            connectedRegions.add(link.source);
            connectedRegions.add(link.target);
        });
        
        const filteredRegionNodes = Array.from(regionNodes.values())
            .filter(region => connectedRegions.has(region.id) || region.totalCollaborations >= minCollab);
        
        return {
            nodes: filteredRegionNodes,
            links: filteredRegionLinks
        };
    }
    
    getRegionDisplayName(regionId) {
        const regionNames = {
            'north_america': 'North America',
            'western_europe': 'Western Europe', 
            'eastern_europe': 'Eastern Europe',
            'latin_america': 'Latin America',
            'middle_east': 'Middle East',
            'africa': 'Africa',
            'asia_pacific': 'Asia Pacific',
            'south_asia': 'South Asia',
            'east_asia': 'East Asia'
        };
        return regionNames[regionId] || regionId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    setupControls() {
        this.log("🎛️ Setting up controls...");
        
        // Collaboration type filter
        const filterSelect = document.getElementById('collaboration-filter');
        this.log(`🔍 Filter select element: ${filterSelect ? 'found' : 'null'}`);
        
        if (filterSelect && this.networkData && this.networkData.networks) {
            try {
                filterSelect.innerHTML = '';
                
                Object.keys(this.networkData.networks).forEach(networkType => {
                    const option = document.createElement('option');
                    option.value = networkType;
                    option.textContent = networkType.charAt(0).toUpperCase() + networkType.slice(1);
                    filterSelect.appendChild(option);
                });
                
                filterSelect.value = this.collaborationType;
                
                filterSelect.addEventListener('change', (e) => {
                    this.collaborationType = e.target.value;
                    this.log(`🔄 Switching to ${this.collaborationType}`);
                    this.setupVisualization();
                });
                
                this.log("✅ Filter controls setup complete");
            } catch (error) {
                this.log(`❌ Filter setup error: ${error.message}`);
            }
        }
        
        // Minimum collaborations
        const minCollabSlider = document.getElementById('min-collaborations');
        const minCollabValue = document.getElementById('min-collab-value');
        this.log(`🔍 Slider elements: ${minCollabSlider ? 'found' : 'null'}, ${minCollabValue ? 'found' : 'null'}`);
        
        if (minCollabSlider && minCollabValue) {
            try {
                minCollabSlider.value = this.minCollaborations;
                minCollabValue.textContent = `${this.minCollaborations}+`;
                
                minCollabSlider.addEventListener('input', (e) => {
                    this.minCollaborations = parseInt(e.target.value);
                    minCollabValue.textContent = `${this.minCollaborations}+`;
                    this.log(`🔄 Min collaborations: ${this.minCollaborations}`);
                    this.setupVisualization();
                });
                
                this.log("✅ Slider controls setup complete");
            } catch (error) {
                this.log(`❌ Slider setup error: ${error.message}`);
            }
        }
        
        // Node size slider
        const nodeSizeSlider = document.getElementById('node-size');
        const nodeSizeValue = document.getElementById('node-size-value');
        this.log(`🔍 Node size elements: ${nodeSizeSlider ? 'found' : 'null'}, ${nodeSizeValue ? 'found' : 'null'}`);
        
        if (nodeSizeSlider && nodeSizeValue) {
            try {
                nodeSizeSlider.value = this.nodeScale;
                nodeSizeValue.textContent = `${this.nodeScale}x`;
                
                nodeSizeSlider.addEventListener('input', (e) => {
                    this.nodeScale = parseFloat(e.target.value);
                    nodeSizeValue.textContent = `${this.nodeScale}x`;
                    this.log(`🔄 Node scale: ${this.nodeScale}x`);
                    this.updateNodeSizes();
                });
                
                this.log("✅ Node size controls setup complete");
            } catch (error) {
                this.log(`❌ Node size setup error: ${error.message}`);
            }
        }
    }
    
    updateNodeSizes() {
        if (!this.currentNodes || !this.currentSimulation) {
            this.log("⚠️ Cannot update node sizes - no active visualization");
            return;
        }
        
        // Update node radii
        this.currentNodes.attr('r', d => 
            Math.max(20, (Math.sqrt(d.totalCollaborations / 50) + 15) * this.nodeScale)
        );
        
        // Update collision radius in simulation
        this.currentSimulation.force('collision').radius(d => 
            Math.max(40, Math.sqrt(d.totalCollaborations / 50) * this.nodeScale + 25)
        );
        
        // Restart simulation briefly to adjust for new sizes
        this.currentSimulation.alpha(0.3).restart();
        
        this.log(`✅ Updated node sizes with scale: ${this.nodeScale}x`);
    }
    
    showTooltip(event, d) {
        if (!d || !this.tooltip) return;
        
        // Find top partner regions for this region from the aggregated data
        const regionalData = this.aggregateByRegions(this.networkData.networks[this.collaborationType], this.minCollaborations);
        const partnerConnections = regionalData.links
            .filter(link => (link.source === d.id || link.target === d.id))
            .map(link => {
                const partnerId = link.source === d.id ? link.target : link.source;
                const partnerRegion = regionalData.nodes.find(n => n.id === partnerId);
                return {
                    id: partnerId,
                    name: partnerRegion ? partnerRegion.name : this.getRegionDisplayName(partnerId),
                    weight: link.weight
                };
            })
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);

        // Build comprehensive tooltip
        let tooltipContent = `
            <div style="max-width: 320px;">
                <div style="background: ${this.getRegionColor(d.id)}; color: white; padding: 10px; margin: -12px -12px 15px -12px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center;">
                    🌍 ${d.name}
                </div>
                
                <div style="margin-bottom: 15px; text-align: center;">
                    <div style="font-size: 22px; font-weight: bold; color: ${this.getRegionColor(d.id)};">
                        ${d.totalCollaborations.toLocaleString()}
                    </div>
                    <div style="color: #ccc; font-size: 11px;">
                        Total Collaborations
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <strong>🗺️ Countries in Region:</strong> ${d.countryCount}<br/>
                    <div style="font-size: 11px; color: #aaa; margin-top: 4px;">
                        ${d.countries.slice(0, 5).join(', ')}${d.countries.length > 5 ? `, +${d.countries.length - 5} more` : ''}
                    </div>
                </div>
        `;

        // Partnership info
        if (partnerConnections.length > 0) {
            tooltipContent += `
                <div style="margin-bottom: 12px;">
                    <strong>🤝 Top Partnership Regions:</strong><br/>
            `;
            
            partnerConnections.slice(0, 3).forEach((partner, i) => {
                const percentage = ((partner.weight / d.totalCollaborations) * 100).toFixed(1);
                tooltipContent += `
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>${i + 1}. ${partner.name}</span>
                        <span style="color: #4fc3f7;">${partner.weight} (${percentage}%)</span>
                    </div>
                `;
            });
            tooltipContent += `</div>`;
        }

        // Collaboration strength indicator
        const strengthLevel = d.totalCollaborations > 1000 ? 'Very High' : 
                             d.totalCollaborations > 500 ? 'High' : 
                             d.totalCollaborations > 200 ? 'Medium' : 'Low';
        const strengthColor = d.totalCollaborations > 1000 ? '#4caf50' : 
                             d.totalCollaborations > 500 ? '#2196f3' : 
                             d.totalCollaborations > 200 ? '#ff9800' : '#f44336';
        
        tooltipContent += `
            <div style="padding: 8px; background: rgba(${strengthColor === '#4caf50' ? '76,175,80' : strengthColor === '#2196f3' ? '33,150,243' : strengthColor === '#ff9800' ? '255,152,0' : '244,67,54'}, 0.2); border-radius: 4px; text-align: center;">
                <strong style="color: ${strengthColor};">📊 ${strengthLevel} Collaboration Volume</strong>
            </div>
        `;

        tooltipContent += `</div>`;

        this.tooltip
            .html(tooltipContent)
            .style('visibility', 'visible')
            .style('opacity', '0')
            .transition()
            .duration(150)
            .style('opacity', '1');

        this.moveTooltip(event);
    }

    moveTooltip(event) {
        if (!this.tooltip || this.tooltip.style('visibility') === 'hidden') return;
        
        // Get tooltip size for positioning
        const tooltip = this.tooltip.node();
        if (!tooltip) return;
        
        const tooltipRect = tooltip.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let left = event.pageX + 20;
        let top = event.pageY - 15;
        
        // Enhanced edge detection and positioning
        if (left + tooltipRect.width + 20 > window.innerWidth) {
            left = event.pageX - tooltipRect.width - 20;
        }
        if (top + tooltipRect.height + 20 > window.innerHeight + scrollTop) {
            top = event.pageY - tooltipRect.height - 20;
        }
        
        // Ensure tooltip stays within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(scrollTop + 10, top);
        
        this.tooltip
            .style('left', left + 'px')
            .style('top', top + 'px');
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip
                .transition()
                .duration(100)
                .style('opacity', '0')
                .on('end', () => {
                    this.tooltip.style('visibility', 'hidden');
                });
        }
    }

    createLegend() {
        const legendContainer = document.getElementById('collaboration-legend');
        const legendContent = document.getElementById('collaboration-legend-content');
        
        if (!legendContainer || !legendContent) {
            this.log('⚠️ Legend containers not found');
            return;
        }

        // Show legend
        legendContainer.style.display = 'block';
        
        // Clear existing content
        legendContent.innerHTML = '';
        
        // Get all unique regions that are currently displayed
        const displayedRegions = new Set();
        const regionalData = this.aggregateByRegions(this.networkData.networks[this.collaborationType], this.minCollaborations);
        
        regionalData.nodes.forEach(node => {
            displayedRegions.add(node.id);
        });
        
        // Create legend items for displayed regions
        const sortedRegions = Array.from(displayedRegions).sort();
        
        sortedRegions.forEach(regionId => {
            const regionData = regionalData.nodes.find(n => n.id === regionId);
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${this.getRegionColor(regionId)};"></div>
                <span style="font-size: 12px;">
                    ${this.getRegionDisplayName(regionId)} 
                    <span style="color: #888;">(${regionData ? regionData.totalCollaborations.toLocaleString() : 0})</span>
                </span>
            `;
            legendContent.appendChild(legendItem);
        });
        
        this.log(`✅ Created legend with ${sortedRegions.length} regions`);
    }
    
    showError(message) {
        const loading = document.getElementById('collaboration-loading-indicator');
        if (loading) {
            loading.innerHTML = `
                <div style="color: #fff; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <p><strong>Failed to load collaboration network</strong></p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">${message}</p>
                    <button onclick="window.initCollaborationNetwork()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when called
window.initCollaborationNetwork = function() {
    console.log('🌐 NEW VERSION: Initializing collaboration network...');
    try {
        if (!window.collaborationNetwork) {
            window.collaborationNetwork = new CollaborationNetwork2D();
        }
        window.collaborationNetwork.init();
    } catch (error) {
        console.error('❌ Error initializing network:', error);
    }
};

// Add version info
console.log('📦 CollaborationNetwork v7.0 loaded - STABLE HOVER TOOLTIPS + LEGEND ONLY');