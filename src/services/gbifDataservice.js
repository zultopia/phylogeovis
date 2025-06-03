// src/services/gbifDataService.js
// Enhanced GBIF service with individual occurrence point mapping and density analysis

const GBIF_BASE_URL = 'https://api.gbif.org/v1';

// Orangutan species taxon keys from GBIF
const ORANGUTAN_SPECIES = {
  'Pongo abelii': 5707420,        // Sumatran Orangutan
  'Pongo pygmaeus': 5219532,      // Bornean Orangutan  
  'Pongo tapanuliensis': 9311132  // Tapanuli Orangutan
};

// Configuration constants
const CONFIG = {
  RATE_LIMIT_DELAY: 100,
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_RECORDS_PER_SPECIES: 2000,
  RECORDS_PER_REQUEST: 300,
  MIN_YEAR: 1980,
  MAX_COORDINATE_UNCERTAINTY: 50000, // Increased for more data
  
  // Individual point analysis configuration
  DENSITY_ANALYSIS_RADIUS: 25,     // Analyze density within 25km radius
  HIGH_DENSITY_THRESHOLD: 20,      // 20+ points = high density area
  MEDIUM_DENSITY_THRESHOLD: 10,    // 10-19 points = medium density
  LOW_DENSITY_THRESHOLD: 3,        // 3-9 points = low density
  SINGLE_OCCURRENCE_RADIUS: 5,     // 5km radius for single occurrences
  
  // Priority calculation based on density
  DENSITY_WEIGHTS: {
    very_high: 1.0,   // 50+ occurrences
    high: 0.8,        // 20-49 occurrences  
    medium: 0.6,      // 10-19 occurrences
    low: 0.4,         // 3-9 occurrences
    very_low: 0.2     // 1-2 occurrences
  }
};

class GBIFDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastError = null;
  }

  /**
   * Fetch all orangutan data with individual occurrence points
   * @returns {Promise<Object>} Processed data with individual points and density analysis
   */
  async fetchOrangutanData() {
    const cacheKey = 'orangutan_individual_points_data';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('Returning cached individual points data');
      return cached;
    }

    const startTime = Date.now();
    
    try {
      console.log('🌍 Starting GBIF data fetch with individual point mapping...');
      
      const allSpeciesData = {};
      const allIndividualPoints = [];
      
      // Fetch data for each orangutan species
      for (const [speciesName, taxonKey] of Object.entries(ORANGUTAN_SPECIES)) {
        console.log(`🔍 Fetching ${speciesName}...`);
        const occurrences = await this.fetchSpeciesOccurrences(speciesName, taxonKey);
        allSpeciesData[speciesName] = occurrences;
        
        // Process individual points with metadata
        const speciesPoints = this.processIndividualPoints(occurrences, speciesName);
        allIndividualPoints.push(...speciesPoints);
        
        console.log(`✅ Processed ${speciesPoints.length} individual points for ${speciesName}`);
      }

      // Perform density analysis on all points
      const densityAnalysis = this.performDensityAnalysis(allIndividualPoints);
      
      // Generate conservation areas based on density clusters
      const conservationAreas = this.generateDensityBasedAreas(densityAnalysis);
      
      // Process the complete dataset
      const processedData = this.processCompleteDataset(
        allSpeciesData, 
        allIndividualPoints, 
        densityAnalysis, 
        conservationAreas
      );
      
      // Cache the processed data
      this.setCache(cacheKey, processedData);
      
      const responseTime = Date.now() - startTime;
      console.log(`🎉 Individual point mapping complete in ${responseTime}ms`);
      console.log(`📍 Total individual points: ${allIndividualPoints.length}`);
      console.log(`🏞️ Density-based areas: ${conservationAreas.length}`);
      console.log(`📊 Density clusters: ${densityAnalysis.clusters.length}`);
      
      return processedData;
      
    } catch (error) {
      console.error('💥 Critical error in individual point mapping:', error);
      this.lastError = error;
      this.errorCount++;
      throw new Error(`Failed to fetch orangutan data: ${error.message}`);
    }
  }

  /**
   * Fetch occurrence records for a specific orangutan species
   * @param {string} speciesName - Scientific name of the species
   * @param {number} taxonKey - GBIF taxon key for the species
   * @returns {Promise<Array>} Array of occurrence records
   */
  async fetchSpeciesOccurrences(speciesName, taxonKey) {
    const occurrences = [];
    let offset = 0;
    const limit = CONFIG.RECORDS_PER_REQUEST;
    
    try {
      while (offset < CONFIG.MAX_RECORDS_PER_SPECIES) {
        const url = this.buildGBIFUrl(taxonKey, limit, offset);
        
        // Rate limiting delay
        if (this.requestCount > 0) {
          await this.delay(CONFIG.RATE_LIMIT_DELAY);
        }
        
        const response = await this.makeRequest(url);
        const data = await response.json();
        this.requestCount++;
        
        if (!data.results || data.results.length === 0) {
          console.log(`ℹ️ No more results for ${speciesName} at offset ${offset}`);
          break;
        }

        // Filter and validate occurrences
        const validOccurrences = this.filterValidOccurrences(data.results, speciesName);
        occurrences.push(...validOccurrences);
        
        console.log(`📍 Fetched ${validOccurrences.length}/${data.results.length} valid occurrences for ${speciesName} (offset: ${offset})`);
        
        offset += limit;
        
        // Break if we got fewer results than requested (last page)
        if (data.results.length < limit) {
          break;
        }
      }

      console.log(`✅ Total valid occurrences for ${speciesName}: ${occurrences.length}`);
      return occurrences;
      
    } catch (error) {
      console.error(`💥 Error fetching ${speciesName} occurrences:`, error);
      return [];
    }
  }

  /**
   * Build GBIF API URL with filters
   */
  buildGBIFUrl(taxonKey, limit, offset) {
    const params = new URLSearchParams({
      taxonKey: taxonKey,
      hasCoordinate: 'true',
      hasGeospatialIssue: 'false',
      year: `${CONFIG.MIN_YEAR},${new Date().getFullYear()}`,
      occurrenceStatus: 'PRESENT',
      country: 'ID', // Indonesia and Malaysia
      limit: limit,
      offset: offset
    });

    return `${GBIF_BASE_URL}/occurrence/search?${params.toString()}`;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhyloGeoVis/1.0 (Conservation Research)'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`GBIF API error: ${response.status} ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Filter and validate GBIF occurrence records
   */
  filterValidOccurrences(rawOccurrences, speciesName) {
    return rawOccurrences.filter(occ => {
      // Must have valid coordinates
      if (!occ.decimalLatitude || !occ.decimalLongitude) {
        return false;
      }
      
      // Check coordinate bounds (Indonesia and Malaysia region)
      if (occ.decimalLatitude < -15 || occ.decimalLatitude > 10 ||
          occ.decimalLongitude < 90 || occ.decimalLongitude > 145) {
        return false;
      }
      
      // Check coordinate uncertainty
      if (occ.coordinateUncertaintyInMeters && 
          occ.coordinateUncertaintyInMeters > CONFIG.MAX_COORDINATE_UNCERTAINTY) {
        return false;
      }
      
      // Must have reasonable year
      if (occ.year && (occ.year < CONFIG.MIN_YEAR || occ.year > new Date().getFullYear())) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Process individual occurrence points with metadata
   * @param {Array} occurrences - Raw occurrence data
   * @param {string} speciesName - Species name
   * @returns {Array} Processed individual points
   */
  processIndividualPoints(occurrences, speciesName) {
    return occurrences.map((occ, index) => {
      const point = {
        id: `${speciesName.replace(' ', '_')}_${occ.key || index}`,
        species: speciesName,
        coordinates: {
          lat: occ.decimalLatitude,
          lng: occ.decimalLongitude
        },
        gbifKey: occ.key,
        year: occ.year,
        month: occ.month,
        day: occ.day,
        eventDate: occ.eventDate,
        locality: occ.locality,
        stateProvince: occ.stateProvince,
        country: occ.country,
        recordedBy: occ.recordedBy,
        institutionCode: occ.institutionCode,
        collectionCode: occ.collectionCode,
        basisOfRecord: occ.basisOfRecord,
        coordinateUncertaintyInMeters: occ.coordinateUncertaintyInMeters,
        
        // Calculate individual point metadata
        dataQuality: this.assessPointQuality(occ),
        recency: this.calculateRecency(occ.year),
        precision: this.calculatePrecision(occ.coordinateUncertaintyInMeters),
        
        // Will be filled by density analysis
        densityCategory: null,
        nearbyPointsCount: 0,
        conservationPriority: null,
        clusterAssignment: null
      };

      return point;
    });
  }

  /**
   * Assess quality of individual occurrence point
   * @param {Object} occurrence - GBIF occurrence record
   * @returns {string} Quality assessment
   */
  assessPointQuality(occurrence) {
    let score = 0;

    // Coordinate precision
    if (occurrence.coordinateUncertaintyInMeters) {
      if (occurrence.coordinateUncertaintyInMeters < 100) score += 25;
      else if (occurrence.coordinateUncertaintyInMeters < 1000) score += 20;
      else if (occurrence.coordinateUncertaintyInMeters < 5000) score += 15;
      else if (occurrence.coordinateUncertaintyInMeters < 10000) score += 10;
    } else {
      score += 10; // Default if no uncertainty data
    }

    // Data completeness
    if (occurrence.locality) score += 15;
    if (occurrence.eventDate) score += 15;
    if (occurrence.recordedBy) score += 10;
    if (occurrence.institutionCode) score += 10;
    if (occurrence.basisOfRecord === 'HUMAN_OBSERVATION') score += 15;

    // Temporal quality
    if (occurrence.year) {
      const age = new Date().getFullYear() - occurrence.year;
      if (age <= 5) score += 20;
      else if (age <= 10) score += 15;
      else if (age <= 20) score += 10;
      else score += 5;
    }

    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    if (score >= 25) return 'poor';
    return 'very_poor';
  }

  /**
   * Calculate recency score based on observation year
   * @param {number} year - Observation year
   * @returns {number} Recency score (0-1)
   */
  calculateRecency(year) {
    if (!year) return 0;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    if (age <= 2) return 1.0;      // Very recent
    if (age <= 5) return 0.8;      // Recent
    if (age <= 10) return 0.6;     // Moderate
    if (age <= 20) return 0.4;     // Old
    return 0.2;                    // Very old
  }

  /**
   * Calculate precision score based on coordinate uncertainty
   * @param {number} uncertainty - Coordinate uncertainty in meters
   * @returns {number} Precision score (0-1)
   */
  calculatePrecision(uncertainty) {
    if (!uncertainty) return 0.5; // Default if unknown
    
    if (uncertainty <= 100) return 1.0;       // Very precise
    if (uncertainty <= 1000) return 0.8;      // Precise
    if (uncertainty <= 5000) return 0.6;      // Moderate
    if (uncertainty <= 10000) return 0.4;     // Low precision
    if (uncertainty <= 25000) return 0.2;     // Very low precision
    return 0.1;                               // Extremely low precision
  }

  /**
   * Perform density analysis on all individual points
   * @param {Array} allPoints - All individual occurrence points
   * @returns {Object} Density analysis results
   */
  performDensityAnalysis(allPoints) {
    console.log('🧮 Performing density analysis on individual points...');
    
    const densityData = {
      totalPoints: allPoints.length,
      densityMap: new Map(),
      clusters: [],
      densityCategories: {
        very_high: [],
        high: [],
        medium: [],
        low: [],
        very_low: []
      },
      speciesDistribution: {}
    };

    // Calculate density for each point
    allPoints.forEach((point, index) => {
      const nearbyPoints = this.findNearbyPoints(point, allPoints, CONFIG.DENSITY_ANALYSIS_RADIUS);
      const densityCount = nearbyPoints.length;
      
      // Update point with density information
      point.nearbyPointsCount = densityCount;
      point.densityCategory = this.categorizeByDensity(densityCount);
      
      // Add to density categories
      densityData.densityCategories[point.densityCategory].push(point);
      
      // Store in density map
      const key = `${point.coordinates.lat.toFixed(4)}_${point.coordinates.lng.toFixed(4)}`;
      densityData.densityMap.set(key, {
        point,
        density: densityCount,
        nearbyPoints
      });

      if (index % 100 === 0) {
        console.log(`   Processed ${index + 1}/${allPoints.length} points for density analysis`);
      }
    });

    // Generate density clusters
    densityData.clusters = this.generateDensityClusters(allPoints);

    // Calculate species distribution
    Object.keys(ORANGUTAN_SPECIES).forEach(species => {
      const speciesPoints = allPoints.filter(p => p.species === species);
      densityData.speciesDistribution[species] = {
        totalPoints: speciesPoints.length,
        densityCategories: {
          very_high: speciesPoints.filter(p => p.densityCategory === 'very_high').length,
          high: speciesPoints.filter(p => p.densityCategory === 'high').length,
          medium: speciesPoints.filter(p => p.densityCategory === 'medium').length,
          low: speciesPoints.filter(p => p.densityCategory === 'low').length,
          very_low: speciesPoints.filter(p => p.densityCategory === 'very_low').length,
        }
      };
    });

    console.log(`✅ Density analysis complete:`);
    console.log(`   Very High Density: ${densityData.densityCategories.very_high.length} points`);
    console.log(`   High Density: ${densityData.densityCategories.high.length} points`);
    console.log(`   Medium Density: ${densityData.densityCategories.medium.length} points`);
    console.log(`   Low Density: ${densityData.densityCategories.low.length} points`);
    console.log(`   Very Low Density: ${densityData.densityCategories.very_low.length} points`);

    return densityData;
  }

  /**
   * Find nearby points within specified radius
   * @param {Object} centerPoint - Center point for search
   * @param {Array} allPoints - All points to search through
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Array} Array of nearby points
   */
  findNearbyPoints(centerPoint, allPoints, radiusKm) {
    return allPoints.filter(point => {
      if (point.id === centerPoint.id) return false; // Exclude self
      
      const distance = this.calculateDistance(
        centerPoint.coordinates.lat, centerPoint.coordinates.lng,
        point.coordinates.lat, point.coordinates.lng
      );
      
      return distance <= radiusKm;
    });
  }

  /**
   * Categorize point by density
   * @param {number} nearbyCount - Number of nearby points
   * @returns {string} Density category
   */
  categorizeByDensity(nearbyCount) {
    if (nearbyCount >= 50) return 'very_high';
    if (nearbyCount >= 20) return 'high';
    if (nearbyCount >= 10) return 'medium';
    if (nearbyCount >= 3) return 'low';
    return 'very_low';
  }

  /**
   * Generate density clusters from points
   * @param {Array} allPoints - All individual points
   * @returns {Array} Array of density clusters
   */
  generateDensityClusters(allPoints) {
    console.log('🔗 Generating density clusters...');
    
    const clusters = [];
    const processed = new Set();
    const clusterRadius = 15; // 15km radius for clustering
    
    // Sort points by density (highest first)
    const sortedPoints = [...allPoints].sort((a, b) => b.nearbyPointsCount - a.nearbyPointsCount);
    
    sortedPoints.forEach((point, index) => {
      if (processed.has(point.id)) return;
      
      // Only create clusters for medium+ density points
      if (point.nearbyPointsCount < CONFIG.LOW_DENSITY_THRESHOLD) return;
      
      const cluster = {
        id: `density_cluster_${clusters.length + 1}`,
        centerPoint: point,
        points: [point],
        species: [point.species],
        bounds: {
          north: point.coordinates.lat,
          south: point.coordinates.lat,
          east: point.coordinates.lng,
          west: point.coordinates.lng
        },
        densityLevel: point.densityCategory,
        totalDensity: point.nearbyPointsCount
      };
      
      processed.add(point.id);
      
      // Find all points within cluster radius
      allPoints.forEach(otherPoint => {
        if (processed.has(otherPoint.id)) return;
        
        const distance = this.calculateDistance(
          point.coordinates.lat, point.coordinates.lng,
          otherPoint.coordinates.lat, otherPoint.coordinates.lng
        );
        
        if (distance <= clusterRadius) {
          cluster.points.push(otherPoint);
          processed.add(otherPoint.id);
          
          // Update cluster species list
          if (!cluster.species.includes(otherPoint.species)) {
            cluster.species.push(otherPoint.species);
          }
          
          // Update bounds
          cluster.bounds.north = Math.max(cluster.bounds.north, otherPoint.coordinates.lat);
          cluster.bounds.south = Math.min(cluster.bounds.south, otherPoint.coordinates.lat);
          cluster.bounds.east = Math.max(cluster.bounds.east, otherPoint.coordinates.lng);
          cluster.bounds.west = Math.min(cluster.bounds.west, otherPoint.coordinates.lng);
          
          // Update total density
          cluster.totalDensity += otherPoint.nearbyPointsCount;
        }
      });
      
      // Calculate cluster center from all points
      const centerLat = cluster.points.reduce((sum, p) => sum + p.coordinates.lat, 0) / cluster.points.length;
      const centerLng = cluster.points.reduce((sum, p) => sum + p.coordinates.lng, 0) / cluster.points.length;
      
      cluster.center = { lat: centerLat, lng: centerLng };
      cluster.avgDensity = cluster.totalDensity / cluster.points.length;
      
      // Assign cluster to all points
      cluster.points.forEach(p => {
        p.clusterAssignment = cluster.id;
      });
      
      clusters.push(cluster);
    });
    
    console.log(`   Generated ${clusters.length} density clusters`);
    return clusters;
  }

  /**
   * Generate conservation areas based on density analysis
   * @param {Object} densityAnalysis - Density analysis results
   * @returns {Array} Density-based conservation areas
   */
  generateDensityBasedAreas(densityAnalysis) {
    console.log('🏞️ Generating density-based conservation areas...');
    
    const conservationAreas = [];
    
    // Process density clusters into conservation areas
    densityAnalysis.clusters.forEach((cluster, index) => {
      const area = this.createConservationAreaFromDensityCluster(cluster, index);
      if (area) {
        conservationAreas.push(area);
      }
    });
    
    // Process high-value isolated points
    const isolatedHighValuePoints = densityAnalysis.densityCategories.medium
      .concat(densityAnalysis.densityCategories.low)
      .filter(point => !point.clusterAssignment);
    
    isolatedHighValuePoints.forEach((point, index) => {
      const area = this.createConservationAreaFromIsolatedPoint(point, index);
      if (area) {
        conservationAreas.push(area);
      }
    });
    
    console.log(`✅ Generated ${conservationAreas.length} density-based conservation areas`);
    return conservationAreas;
  }

  /**
   * Create conservation area from density cluster
   * @param {Object} cluster - Density cluster
   * @param {number} index - Cluster index
   * @returns {Object} Conservation area
   */
  createConservationAreaFromDensityCluster(cluster, index) {
    const bufferedBounds = this.addBufferToBounds(cluster.bounds, 5); // 5km buffer
    const areaSizeHectares = this.calculateAreaSize(bufferedBounds);
    
    // Generate area name based on cluster characteristics
    const areaName = this.generateClusterAreaName(cluster, index);
    
    return {
      id: `density_area_${index + 1}`,
      name: areaName,
      type: 'density_cluster',
      center: [cluster.center.lat, cluster.center.lng],
      bounds: bufferedBounds,
      geometry: this.boundsToPolygon(bufferedBounds),
      area: areaSizeHectares,
      species: cluster.species,
      
      // Density-specific properties
      clusterInfo: {
        totalPoints: cluster.points.length,
        avgDensity: cluster.avgDensity,
        densityLevel: cluster.densityLevel,
        dominantSpecies: this.getDominantSpecies(cluster.points)
      },
      
      // Conservation metrics based on density
      populationSize: this.estimatePopulationFromDensity(cluster),
      geneticDiversity: this.estimateGeneticDiversityFromDensity(cluster),
      extinctionRisk: this.calculateExtinctionRiskFromDensity(cluster),
      priority: this.calculatePriorityFromDensity(cluster),
      urgency: this.calculateUrgencyFromDensity(cluster),
      
      // Additional metadata
      countries: [...new Set(cluster.points.map(p => p.country))],
      provinces: [...new Set(cluster.points.map(p => p.stateProvince).filter(p => p))],
      localities: [...new Set(cluster.points.map(p => p.locality).filter(l => l))].slice(0, 5),
      temporalCoverage: this.calculateTemporalCoverage(cluster.points),
      dataQuality: this.assessClusterDataQuality(cluster.points),
      protectionStatus: 'Unassessed', // Will be determined by overlay with protected areas
      establishedYear: null
    };
  }

  /**
   * Create conservation area from isolated point
   * @param {Object} point - Isolated occurrence point
   * @param {number} index - Point index
   * @returns {Object|null} Conservation area or null if not significant
   */
  createConservationAreaFromIsolatedPoint(point, index) {
    // Only create areas for points with some significance
    if (point.densityCategory === 'very_low' && point.dataQuality === 'poor') {
      return null;
    }
    
    const radius = CONFIG.SINGLE_OCCURRENCE_RADIUS;
    const bounds = {
      north: point.coordinates.lat + (radius / 111),
      south: point.coordinates.lat - (radius / 111),
      east: point.coordinates.lng + (radius / (111 * Math.cos(point.coordinates.lat * Math.PI / 180))),
      west: point.coordinates.lng - (radius / (111 * Math.cos(point.coordinates.lat * Math.PI / 180)))
    };
    
    const areaSizeHectares = this.calculateAreaSize(bounds);
    
    return {
      id: `isolated_area_${index + 1}`,
      name: `${point.species.split(' ')[1]} Isolated Habitat ${index + 1}`,
      type: 'isolated_point',
      center: [point.coordinates.lat, point.coordinates.lng],
      bounds: bounds,
      geometry: this.boundsToPolygon(bounds),
      area: areaSizeHectares,
      species: [point.species],
      
      // Single point properties
      pointInfo: {
        totalPoints: 1,
        dataQuality: point.dataQuality,
        recency: point.recency,
        precision: point.precision,
        originalPoint: point
      },
      
      // Conservative estimates for isolated points
      populationSize: this.estimatePopulationFromSinglePoint(point),
      geneticDiversity: 0.3, // Low for isolated populations
      extinctionRisk: 0.8,   // High for isolated populations
      priority: 'medium',    // Medium priority for monitoring
      urgency: 0.6,
      
      // Metadata
      countries: [point.country],
      provinces: point.stateProvince ? [point.stateProvince] : [],
      localities: point.locality ? [point.locality] : [],
      temporalCoverage: { minYear: point.year, maxYear: point.year, span: 0 },
      dataQuality: point.dataQuality,
      protectionStatus: 'Unprotected',
      establishedYear: null
    };
  }

  /**
   * Generate area name for density cluster
   * @param {Object} cluster - Density cluster
   * @param {number} index - Cluster index
   * @returns {string} Generated area name
   */
  generateClusterAreaName(cluster, index) {
    const dominantSpecies = this.getDominantSpecies(cluster.points);
    const localities = [...new Set(cluster.points.map(p => p.locality).filter(l => l))];
    
    if (localities.length > 0) {
      const commonLocality = localities[0].split(',')[0].trim();
      if (cluster.species.length > 1) {
        return `${commonLocality} Multi-species Habitat`;
      } else {
        return `${commonLocality} ${dominantSpecies.split(' ')[1]} Habitat`;
      }
    }
    
    const densityLevel = cluster.densityLevel.replace('_', ' ');
    if (cluster.species.length > 1) {
      return `Multi-species ${densityLevel} Density Area ${index + 1}`;
    } else {
      return `${dominantSpecies.split(' ')[1]} ${densityLevel} Density Area ${index + 1}`;
    }
  }

  /**
   * Get dominant species in a cluster
   * @param {Array} points - Array of points
   * @returns {string} Dominant species name
   */
  getDominantSpecies(points) {
    const speciesCount = {};
    points.forEach(point => {
      speciesCount[point.species] = (speciesCount[point.species] || 0) + 1;
    });
    
    return Object.keys(speciesCount).reduce((a, b) => 
      speciesCount[a] > speciesCount[b] ? a : b
    );
  }

  /**
   * Estimate population from density cluster
   * @param {Object} cluster - Density cluster
   * @returns {number} Estimated population
   */
  estimatePopulationFromDensity(cluster) {
    const baseMultiplier = 8; // Conservative: 1 observation ≈ 8 individuals
    const densityMultipliers = {
      very_high: 1.2,
      high: 1.0,
      medium: 0.8,
      low: 0.6,
      very_low: 0.4
    };
    
    const multiplier = densityMultipliers[cluster.densityLevel] || 1.0;
    return Math.round(cluster.points.length * baseMultiplier * multiplier);
  }

  /**
   * Estimate genetic diversity from density
   * @param {Object} cluster - Density cluster
   * @returns {number} Genetic diversity estimate (0-1)
   */
  estimateGeneticDiversityFromDensity(cluster) {
    const baseValue = 0.5;
    const densityBonus = {
      very_high: 0.3,
      high: 0.2,
      medium: 0.1,
      low: 0.0,
      very_low: -0.1
    };
    
    const speciesBonus = (cluster.species.length - 1) * 0.1; // Multi-species bonus
    const spatialSpread = this.calculateSpatialSpread(cluster.points) / 50; // Normalize
    
    return Math.min(
      baseValue + densityBonus[cluster.densityLevel] + speciesBonus + spatialSpread,
      0.9
    );
  }

  /**
   * Calculate extinction risk from density
   * @param {Object} cluster - Density cluster
   * @returns {number} Extinction risk (0-1)
   */
  calculateExtinctionRiskFromDensity(cluster) {
    const populationSize = this.estimatePopulationFromDensity(cluster);
    const densityRisk = {
      very_high: 0.1,
      high: 0.2,
      medium: 0.4,
      low: 0.6,
      very_low: 0.8
    };
    
    let risk = densityRisk[cluster.densityLevel];
    
    // Adjust based on population size
    if (populationSize < 50) risk += 0.2;
    else if (populationSize < 100) risk += 0.1;
    
    // Adjust based on species richness
    if (cluster.species.length > 1) risk -= 0.1;
    
    return Math.max(0.05, Math.min(risk, 0.95));
  }

  /**
   * Calculate priority from density
   * @param {Object} cluster - Density cluster
   * @returns {string} Priority level
   */
  calculatePriorityFromDensity(cluster) {
    const extinctionRisk = this.calculateExtinctionRiskFromDensity(cluster);
    const densityWeight = CONFIG.DENSITY_WEIGHTS[cluster.densityLevel];
    
    const priorityScore = extinctionRisk * 0.6 + (1 - densityWeight) * 0.4;
    
    if (priorityScore > 0.7) return 'critical';
    if (priorityScore > 0.5) return 'high';
    if (priorityScore > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Calculate urgency from density
   * @param {Object} cluster - Density cluster
   * @returns {number} Urgency score (0-1)
   */
  calculateUrgencyFromDensity(cluster) {
    const extinctionRisk = this.calculateExtinctionRiskFromDensity(cluster);
    const densityWeight = CONFIG.DENSITY_WEIGHTS[cluster.densityLevel];
    const populationSize = this.estimatePopulationFromDensity(cluster);
    
    let urgency = extinctionRisk * 0.5 + (1 - densityWeight) * 0.3;
    
    // Add urgency for small populations
    if (populationSize < 100) urgency += 0.2;
    else if (populationSize < 200) urgency += 0.1;
    
    return Math.max(0.1, Math.min(urgency, 1.0));
  }

  /**
   * Estimate population from single isolated point
   * @param {Object} point - Single occurrence point
   * @returns {number} Estimated population
   */
  estimatePopulationFromSinglePoint(point) {
    const baseEstimate = 15; // Conservative estimate for isolated observation
    
    // Adjust based on data quality
    const qualityMultipliers = {
      excellent: 1.5,
      good: 1.2,
      fair: 1.0,
      poor: 0.8,
      very_poor: 0.5
    };
    
    return Math.round(baseEstimate * (qualityMultipliers[point.dataQuality] || 1.0));
  }

  /**
   * Calculate spatial spread of points in cluster
   * @param {Array} points - Array of points
   * @returns {number} Spatial spread in km
   */
  calculateSpatialSpread(points) {
    if (points.length < 2) return 0;
    
    const coords = points.map(p => [p.coordinates.lat, p.coordinates.lng]);
    const centroid = [
      coords.reduce((sum, c) => sum + c[0], 0) / coords.length,
      coords.reduce((sum, c) => sum + c[1], 0) / coords.length
    ];
    
    const distances = coords.map(coord => 
      this.calculateDistance(coord[0], coord[1], centroid[0], centroid[1])
    );
    
    return Math.max(...distances);
  }

  /**
   * Calculate temporal coverage for points
   * @param {Array} points - Array of points
   * @returns {Object} Temporal coverage information
   */
  calculateTemporalCoverage(points) {
    const years = points.map(p => p.year).filter(year => year && !isNaN(year));
    if (years.length === 0) return { span: 0, coverage: 'none' };

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const span = maxYear - minYear;

    return {
      minYear,
      maxYear,
      span,
      coverage: span > 15 ? 'excellent' : span > 8 ? 'good' : span > 3 ? 'fair' : 'poor'
    };
  }

  /**
   * Assess data quality for cluster of points
   * @param {Array} points - Array of points
   * @returns {string} Overall data quality assessment
   */
  assessClusterDataQuality(points) {
    if (points.length === 0) return 'no_data';
    
    const qualityScores = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
      very_poor: 0
    };
    
    const avgScore = points.reduce((sum, point) => 
      sum + qualityScores[point.dataQuality], 0
    ) / points.length;
    
    if (avgScore >= 3.5) return 'excellent';
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'fair';
    if (avgScore >= 0.5) return 'poor';
    return 'very_poor';
  }

  /**
   * Process complete dataset with all components
   * @param {Object} allSpeciesData - Raw species data
   * @param {Array} allIndividualPoints - All individual points
   * @param {Object} densityAnalysis - Density analysis results
   * @param {Array} conservationAreas - Conservation areas
   * @returns {Object} Complete processed dataset
   */
  processCompleteDataset(allSpeciesData, allIndividualPoints, densityAnalysis, conservationAreas) {
    console.log('🔄 Processing complete dataset...');
    
    // Create genomic data structure (compatible with existing system)
    const genomicData = {};
    Object.keys(allSpeciesData).forEach(species => {
      genomicData[species] = this.createGenomicDataSamples(species, allSpeciesData[species]);
    });

    // Generate enhanced conservation location data
    const conservationLocations = conservationAreas.map(area => {
      return this.createDetailedLocationData(area);
    });

    // Generate analysis components
    const priorityRanking = this.generatePriorityRanking(conservationLocations);
    const conservationActions = this.generateConservationActions(conservationLocations);
    const viabilityAnalysis = this.generateViabilityAnalysis(genomicData, conservationLocations);
    const spatialAnalysis = this.generateSpatialAnalysis(conservationLocations, densityAnalysis);

    const processedData = {
      // Individual point data (NEW)
      individualPoints: allIndividualPoints,
      densityAnalysis: densityAnalysis,
      
      // Traditional structure (for compatibility)
      conservationLocations,
      genomicData,
      spatialAnalysis,
      priorityRanking,
      conservationActions,
      viabilityAnalysis,
      
      // Metadata
      totalOccurrences: allIndividualPoints.length,
      speciesCount: Object.keys(allSpeciesData).length,
      locationCount: conservationLocations.length,
      lastUpdated: new Date().toISOString(),
      dataSource: 'GBIF_Individual_Points',
      gbifIntegrated: true,
      isDynamic: true,
      hasIndividualPoints: true,
      
      // Processing metrics
      processingMetrics: {
        individualPointsProcessed: allIndividualPoints.length,
        densityClustersGenerated: densityAnalysis.clusters.length,
        conservationAreasGenerated: conservationAreas.length,
        densityAnalysisRadius: CONFIG.DENSITY_ANALYSIS_RADIUS,
        averagePointsPerArea: conservationLocations.length > 0 ? 
          allIndividualPoints.length / conservationLocations.length : 0
      }
    };

    console.log('✅ Complete dataset processing finished');
    return processedData;
  }

  // Include utility methods from previous implementation...
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  addBufferToBounds(bounds, bufferKm) {
    const latBuffer = bufferKm / 111;
    const lngBuffer = bufferKm / (111 * Math.cos(bounds.north * Math.PI / 180));
    
    return {
      north: bounds.north + latBuffer,
      south: bounds.south - latBuffer,
      east: bounds.east + lngBuffer,
      west: bounds.west - lngBuffer
    };
  }

  calculateAreaSize(bounds) {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const avgLat = (bounds.north + bounds.south) / 2;
    const latKm = latDiff * 111;
    const lngKm = lngDiff * 111 * Math.cos(avgLat * Math.PI / 180);
    const areaKm2 = latKm * lngKm;
    return Math.round(areaKm2 * 100);
  }

  boundsToPolygon(bounds) {
    return `POLYGON((${bounds.west} ${bounds.south}, ${bounds.east} ${bounds.south}, ${bounds.east} ${bounds.north}, ${bounds.west} ${bounds.north}, ${bounds.west} ${bounds.south}))`;
  }

  createDetailedLocationData(area) {
    return {
      id: area.id,
      name: area.name,
      coordinates: area.center,
      priority: area.priority,
      species: area.species,
      populationSize: area.populationSize,
      extinctionRisk: area.extinctionRisk,
      geneticDiversity: area.geneticDiversity,
      urgency: area.urgency,
      threatLevel: this.getThreatLevelName(area.extinctionRisk),
      area: area.area,
      protectionStatus: area.protectionStatus,
      totalOccurrences: area.clusterInfo?.totalPoints || area.pointInfo?.totalPoints || 1,
      lastSurvey: area.temporalCoverage?.maxYear?.toString() || 'Unknown',
      observationDensity: (area.clusterInfo?.totalPoints || 1) / (area.area / 1000),
      speciesRichness: area.species.length,
      temporalCoverage: area.temporalCoverage,
      dataQuality: area.dataQuality,
      establishedYear: area.establishedYear,
      country: area.countries?.[0] || 'Unknown',
      province: area.provinces?.[0] || 'Unknown',
      localities: area.localities || [],
      geometry: area.geometry,
      bounds: area.bounds,
      type: area.type,
      
      // Individual point specific data
      individualPointsData: area.clusterInfo || area.pointInfo || null
    };
  }

  getThreatLevelName(extinctionRisk) {
    if (extinctionRisk > 0.7) return 'critical';
    if (extinctionRisk > 0.5) return 'high';
    if (extinctionRisk > 0.3) return 'moderate';
    return 'low';
  }

  // Include remaining compatibility methods...
  createGenomicDataSamples(species, occurrences) {
    const selectedOccurrences = occurrences.slice(0, 50);
    return selectedOccurrences.map((occ, index) => ({
      id: `${species.split(' ')[1]}_${String(index + 1).padStart(3, '0')}`,
      species,
      subspecies: this.getSubspecies(species),
      location: occ.locality || occ.stateProvince || 'Unknown',
      coordinates: { lat: occ.decimalLatitude, lng: occ.decimalLongitude },
      sequence: this.generateMockSequence(),
      mtDNA: this.generateMockSequence(),
      populationSize: Math.floor(Math.random() * 150) + 50,
      geneticDiversity: Math.random() * 0.4 + 0.4,
      threatLevel: Math.random() * 0.6 + 0.3,
      observationDate: occ.eventDate,
      recordedBy: occ.recordedBy,
      institutionCode: occ.institutionCode,
      year: occ.year,
      gbifKey: occ.key
    }));
  }

  getSubspecies(species) {
    const subspeciesMap = {
      'Pongo abelii': 'Sumatran',
      'Pongo pygmaeus': 'Bornean',
      'Pongo tapanuliensis': 'Tapanuli'
    };
    return subspeciesMap[species] || 'Unknown';
  }

  generateMockSequence() {
    const bases = ['A', 'T', 'C', 'G'];
    let sequence = '';
    for (let i = 0; i < 60; i++) {
      sequence += bases[Math.floor(Math.random() * 4)];
    }
    return sequence;
  }

  generatePriorityRanking(locations) {
    return locations
      .map(location => ({
        location: location.name,
        species: location.species,
        priority: location.priority,
        populationSize: location.populationSize,
        geneticDiversity: location.geneticDiversity,
        extinctionRisk: location.extinctionRisk,
        urgency: location.urgency,
        totalOccurrences: location.totalOccurrences,
        observationDensity: location.observationDensity,
        type: location.type
      }))
      .sort((a, b) => b.urgency - a.urgency);
  }

  generateConservationActions(locations) {
    const actions = [];
    locations.forEach(location => {
      if (location.extinctionRisk > 0.7) {
        actions.push({
          priority: 'critical',
          action: `Emergency intervention for ${location.name}`,
          rationale: `High extinction risk: ${(location.extinctionRisk * 100).toFixed(1)}%`,
          species: location.species.join(', '),
          location: location.name,
          type: location.type
        });
      }
    });
    return actions.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, ongoing: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  generateViabilityAnalysis(genomicData, locations) {
    const analysis = {};
    Object.keys(genomicData).forEach(species => {
      const speciesLocations = locations.filter(loc => loc.species.includes(species));
      const totalPopulation = speciesLocations.reduce((sum, loc) => sum + loc.populationSize, 0);
      const avgGeneticDiversity = speciesLocations.length > 0 ?
        speciesLocations.reduce((sum, loc) => sum + loc.geneticDiversity, 0) / speciesLocations.length : 0;
      const maxExtinctionRisk = speciesLocations.length > 0 ?
        Math.max(...speciesLocations.map(loc => loc.extinctionRisk)) : 1;

      analysis[species] = {
        extinctionProbability: maxExtinctionRisk,
        totalPopulation,
        locationCount: speciesLocations.length,
        averageGeneticDiversity: avgGeneticDiversity,
        recommendedActions: [{
          priority: 'ongoing',
          action: `Monitor ${species} individual occurrence points`,
          rationale: 'Continuous assessment based on individual point analysis'
        }]
      };
    });
    return analysis;
  }

  generateSpatialAnalysis(locations, densityAnalysis) {
    return {
      priorityAreas: locations,
      corridorRecommendations: [],
      habitatConnectivity: { averageConnectivity: 0.5 },
      isDynamic: true,
      hasIndividualPoints: true,
      densityAnalysis: densityAnalysis,
      generationMethod: 'individual_point_density_analysis'
    };
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Individual points GBIF data cache cleared');
  }
}

// Create and export singleton instance
const gbifDataService = new GBIFDataService();
export default gbifDataService;