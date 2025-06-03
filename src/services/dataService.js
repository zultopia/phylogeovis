// src/services/dataService.js
// Updated main data service to handle individual GBIF points integration

import { 
  performMSA, 
  constructPhylogeneticTree, 
  calculateShannonIndex, 
  calculateSimpsonIndex,
  analyzeSelectionPressure,
  performPopulationViabilityAnalysis,
  processGeographicData
} from '../utils/dataProcessing';

import gbifDataService from './gbifDataservice';

/**
 * Enhanced Data Service Class with Individual Points Integration
 */
class DataService {
  constructor() {
    this.genomicData = {};
    this.geographicData = [];
    this.individualPointsData = null;
    this.densityAnalysisData = null;
    this.conservationData = null;
    this.analysisCache = new Map();
    this.isLoading = false;
    this.lastUpdated = null;
    this.hasIndividualPoints = false;
  }

  /**
   * Initialize data from GBIF API with individual points
   * @returns {Promise<boolean>} Success status
   */
  async initializeData() {
    if (this.isLoading) return false;
    
    try {
      this.isLoading = true;
      console.log('Initializing individual points data from GBIF...');
      
      const gbifData = await gbifDataService.fetchOrangutanData();
      
      // Update internal data structures with individual points
      this.genomicData = gbifData.genomicData;
      this.geographicData = gbifData.conservationLocations;
      this.individualPointsData = gbifData.individualPoints;
      this.densityAnalysisData = gbifData.densityAnalysis;
      this.conservationData = {
        spatialAnalysis: gbifData.spatialAnalysis,
        viabilityAnalysis: gbifData.viabilityAnalysis,
        priorityRanking: gbifData.priorityRanking,
        conservationActions: gbifData.conservationActions
      };
      
      this.lastUpdated = gbifData.lastUpdated;
      this.hasIndividualPoints = Boolean(gbifData.hasIndividualPoints);
      
      // Clear cache to force recomputation with new data
      this.clearCache();
      
      console.log('Individual points GBIF data initialization complete:', {
        species: Object.keys(this.genomicData).length,
        locations: this.geographicData.length,
        individualPoints: this.individualPointsData?.length || 0,
        densityClusters: this.densityAnalysisData?.clusters?.length || 0,
        totalOccurrences: gbifData.totalOccurrences
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize individual points GBIF data:', error);
      // Fall back to mock data if GBIF fails
      await this.initializeMockData();
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fallback to mock data if GBIF is unavailable
   */
  async initializeMockData() {
    console.log('Falling back to mock data...');
    
    // Create mock individual points data
    const mockIndividualPoints = [
      {
        id: 'mock_abelii_001',
        species: 'Pongo abelii',
        coordinates: { lat: 3.6469, lng: 97.7632 },
        densityCategory: 'high',
        nearbyPointsCount: 25,
        dataQuality: 'good',
        year: 2024,
        country: 'Indonesia',
        locality: 'Leuser National Park'
      },
      {
        id: 'mock_pygmaeus_001',
        species: 'Pongo pygmaeus',
        coordinates: { lat: 5.3065, lng: 118.3945 },
        densityCategory: 'medium',
        nearbyPointsCount: 15,
        dataQuality: 'fair',
        year: 2024,
        country: 'Malaysia',
        locality: 'Kinabatangan'
      },
      {
        id: 'mock_tapanuliensis_001',
        species: 'Pongo tapanuliensis',
        coordinates: { lat: 1.6020, lng: 99.0526 },
        densityCategory: 'low',
        nearbyPointsCount: 5,
        dataQuality: 'excellent',
        year: 2022,
        country: 'Indonesia',
        locality: 'Batang Toru'
      }
    ];

    // Mock density analysis
    const mockDensityAnalysis = {
      totalPoints: mockIndividualPoints.length,
      densityCategories: {
        very_high: [],
        high: mockIndividualPoints.filter(p => p.densityCategory === 'high'),
        medium: mockIndividualPoints.filter(p => p.densityCategory === 'medium'),
        low: mockIndividualPoints.filter(p => p.densityCategory === 'low'),
        very_low: []
      },
      clusters: [
        {
          id: 'mock_cluster_1',
          center: { lat: 3.6469, lng: 97.7632 },
          points: mockIndividualPoints.filter(p => p.species === 'Pongo abelii'),
          densityLevel: 'high',
          species: ['Pongo abelii']
        }
      ],
      speciesDistribution: {
        'Pongo abelii': { totalPoints: 1, densityCategories: { high: 1, medium: 0, low: 0, very_low: 0, very_high: 0 }},
        'Pongo pygmaeus': { totalPoints: 1, densityCategories: { high: 0, medium: 1, low: 0, very_low: 0, very_high: 0 }},
        'Pongo tapanuliensis': { totalPoints: 1, densityCategories: { high: 0, medium: 0, low: 1, very_low: 0, very_high: 0 }}
      }
    };

    this.individualPointsData = mockIndividualPoints;
    this.densityAnalysisData = mockDensityAnalysis;
    this.hasIndividualPoints = true;
    this.lastUpdated = new Date().toISOString();

    // Initialize basic structures
    this.genomicData = {
      'Pongo abelii': [
        {
          id: 'PA001',
          species: 'Pongo abelii',
          subspecies: 'Sumatran',
          location: 'Leuser National Park',
          coordinates: { lat: 3.5, lng: 97.5 },
          sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACG',
          populationSize: 120,
          geneticDiversity: 0.65,
          threatLevel: 0.8
        }
      ],
      'Pongo pygmaeus': [
        {
          id: 'PP001',
          species: 'Pongo pygmaeus',
          subspecies: 'Bornean',
          location: 'Kinabatangan',
          coordinates: { lat: 5.4, lng: 118.0 },
          sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACC',
          populationSize: 200,
          geneticDiversity: 0.72,
          threatLevel: 0.6
        }
      ],
      'Pongo tapanuliensis': [
        {
          id: 'PT001',
          species: 'Pongo tapanuliensis',
          subspecies: 'Tapanuli',
          location: 'Batang Toru',
          coordinates: { lat: 1.4, lng: 99.1 },
          sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTAGT',
          populationSize: 40,
          geneticDiversity: 0.45,
          threatLevel: 0.9
        }
      ]
    };

    this.geographicData = [
      {
        id: 'leuser',
        name: 'Leuser National Park',
        coordinates: [3.5, 97.5],
        priority: 'critical',
        species: ['Pongo abelii'],
        populationSize: 14000,
        extinctionRisk: 0.85,
        geneticDiversity: 0.65,
        urgency: 0.89,
        threatLevel: 'high',
        area: 1094692,
        protectionStatus: 'World Heritage Site',
        type: 'mock_area',
        totalOccurrences: 1
      }
    ];
  }

  /**
   * Get all genomic data
   * @returns {Promise<Object>} All genomic data by species
   */
  async getGenomicData() {
    if (Object.keys(this.genomicData).length === 0) {
      await this.initializeData();
    }
    return this.genomicData;
  }

  /**
   * Get individual points data
   * @returns {Promise<Array>} Individual occurrence points
   */
  async getIndividualPointsData() {
    if (!this.individualPointsData) {
      await this.initializeData();
    }
    return this.individualPointsData || [];
  }

  /**
   * Get density analysis data
   * @returns {Promise<Object>} Density analysis results
   */
  async getDensityAnalysisData() {
    if (!this.densityAnalysisData) {
      await this.initializeData();
    }
    return this.densityAnalysisData || {};
  }

  /**
   * Get individual points filtered by species
   * @param {string} species - Species name to filter by
   * @returns {Promise<Array>} Filtered individual points
   */
  async getSpeciesIndividualPoints(species) {
    const allPoints = await this.getIndividualPointsData();
    if (species === 'all') return allPoints;
    return allPoints.filter(point => point.species === species);
  }

  /**
   * Get points by density category
   * @param {string} densityCategory - Density category to filter by
   * @returns {Promise<Array>} Points in specified density category
   */
  async getPointsByDensity(densityCategory) {
    const densityData = await this.getDensityAnalysisData();
    return densityData.densityCategories?.[densityCategory] || [];
  }

  /**
   * Get conservation analysis with individual points integration
   * @returns {Promise<Object>} Enhanced conservation analysis results
   */
  async getConservationAnalysis() {
    const cacheKey = 'conservation_analysis_with_points';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    // If we already have processed conservation data from GBIF, enhance it
    if (this.conservationData && this.hasIndividualPoints) {
      const result = {
        ...this.conservationData,
        // Add individual points data
        individualPoints: this.individualPointsData,
        densityAnalysis: this.densityAnalysisData,
        hasIndividualPoints: this.hasIndividualPoints,
        conservationLocations: this.geographicData,
        genomicData: this.genomicData,
        dataSource: 'GBIF_Individual_Points',
        lastUpdated: this.lastUpdated,
        gbifIntegrated: true,
        
        // Enhanced metrics
        enhancedMetrics: {
          totalIndividualPoints: this.individualPointsData?.length || 0,
          densityClusters: this.densityAnalysisData?.clusters?.length || 0,
          highDensityPoints: (this.densityAnalysisData?.densityCategories?.very_high?.length || 0) + 
                            (this.densityAnalysisData?.densityCategories?.high?.length || 0),
          isolatedPoints: this.densityAnalysisData?.densityCategories?.very_low?.length || 0,
          speciesPointDistribution: this.calculateSpeciesPointDistribution()
        }
      };
      
      this.analysisCache.set(cacheKey, result);
      return result;
    }

    // Otherwise, initialize data first
    await this.initializeData();
    
    if (this.conservationData && this.hasIndividualPoints) {
      const result = {
        ...this.conservationData,
        individualPoints: this.individualPointsData,
        densityAnalysis: this.densityAnalysisData,
        hasIndividualPoints: this.hasIndividualPoints,
        conservationLocations: this.geographicData,
        genomicData: this.genomicData,
        dataSource: 'GBIF_Individual_Points',
        lastUpdated: this.lastUpdated,
        gbifIntegrated: true,
        enhancedMetrics: {
          totalIndividualPoints: this.individualPointsData?.length || 0,
          densityClusters: this.densityAnalysisData?.clusters?.length || 0,
          highDensityPoints: (this.densityAnalysisData?.densityCategories?.very_high?.length || 0) + 
                            (this.densityAnalysisData?.densityCategories?.high?.length || 0),
          isolatedPoints: this.densityAnalysisData?.densityCategories?.very_low?.length || 0,
          speciesPointDistribution: this.calculateSpeciesPointDistribution()
        }
      };
      
      this.analysisCache.set(cacheKey, result);
      return result;
    }

    // Fallback to basic analysis if GBIF data unavailable
    const genomicData = await this.getGenomicData();

    const result = {
      spatialAnalysis: {
        priorityAreas: this.geographicData,
        corridorRecommendations: []
      },
      viabilityAnalysis: this.generateBasicViabilityAnalysis(genomicData),
      priorityRanking: this.geographicData.sort((a, b) => (b.urgency || 0) - (a.urgency || 0)),
      conservationActions: this.generateBasicConservationActions(this.geographicData),
      individualPoints: this.individualPointsData || [],
      densityAnalysis: this.densityAnalysisData || {},
      hasIndividualPoints: this.hasIndividualPoints,
      conservationLocations: this.geographicData,
      genomicData: genomicData,
      dataSource: 'Fallback',
      lastUpdated: new Date().toISOString(),
      gbifIntegrated: false,
      enhancedMetrics: {
        totalIndividualPoints: this.individualPointsData?.length || 0,
        densityClusters: this.densityAnalysisData?.clusters?.length || 0,
        highDensityPoints: 0,
        isolatedPoints: 0,
        speciesPointDistribution: {}
      }
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate species point distribution for metrics
   * @returns {Object} Species distribution metrics
   */
  calculateSpeciesPointDistribution() {
    if (!this.densityAnalysisData?.speciesDistribution) return {};
    
    const distribution = {};
    Object.entries(this.densityAnalysisData.speciesDistribution).forEach(([species, data]) => {
      distribution[species] = {
        totalPoints: data.totalPoints,
        highDensityRatio: (data.densityCategories.very_high + data.densityCategories.high) / data.totalPoints,
        isolatedRatio: data.densityCategories.very_low / data.totalPoints,
        avgDensityCategory: this.calculateAvgDensityCategory(data.densityCategories)
      };
    });
    
    return distribution;
  }

  /**
   * Calculate average density category for species
   * @param {Object} densityCategories - Density categories count
   * @returns {string} Average density category
   */
  calculateAvgDensityCategory(densityCategories) {
    const weights = { very_high: 5, high: 4, medium: 3, low: 2, very_low: 1 };
    const totalPoints = Object.values(densityCategories).reduce((sum, count) => sum + count, 0);
    
    if (totalPoints === 0) return 'unknown';
    
    const weightedSum = Object.entries(densityCategories).reduce((sum, [category, count]) => {
      return sum + (weights[category] * count);
    }, 0);
    
    const avgWeight = weightedSum / totalPoints;
    
    if (avgWeight >= 4.5) return 'very_high';
    if (avgWeight >= 3.5) return 'high';
    if (avgWeight >= 2.5) return 'medium';
    if (avgWeight >= 1.5) return 'low';
    return 'very_low';
  }

  /**
   * Get enhanced dashboard data with individual points
   * @returns {Promise<Object>} Enhanced dashboard summary
   */
  async getDashboardData() {
    const [phylogenetic, diversity, conservation] = await Promise.all([
      this.getPhylogeneticData(),
      this.getDiversityAnalysis(), 
      this.getConservationAnalysis()
    ]);

    const genomicData = await this.getGenomicData();
    const individualPoints = await this.getIndividualPointsData();
    const densityAnalysis = await this.getDensityAnalysisData();

    return {
      summary: {
        totalSpecies: Object.keys(genomicData).length,
        totalSamples: phylogenetic.totalSamples,
        totalLocations: this.geographicData.length,
        criticalLocations: conservation.priorityRanking.filter(loc => loc.priority === 'critical').length,
        gbifIntegrated: Boolean(this.lastUpdated),
        dataSource: this.lastUpdated ? 'GBIF_Individual_Points' : 'Mock Data',
        totalGBIFOccurrences: diversity.totalGBIFRecords || 0,
        
        // Individual points metrics
        totalIndividualPoints: individualPoints.length,
        highDensityPoints: (densityAnalysis.densityCategories?.very_high?.length || 0) + 
                          (densityAnalysis.densityCategories?.high?.length || 0),
        densityClusters: densityAnalysis.clusters?.length || 0,
        isolatedPoints: densityAnalysis.densityCategories?.very_low?.length || 0
      },
      recentUpdates: [
        {
          type: 'gbif_points_sync',
          date: this.lastUpdated || new Date().toISOString(),
          description: this.lastUpdated ? 
            `Individual points data synchronized (${individualPoints.length} points)` : 
            'Using mock data (GBIF unavailable)'
        },
        {
          type: 'density_analysis',
          date: this.lastUpdated || new Date().toISOString(),
          description: `Density analysis completed (${densityAnalysis.clusters?.length || 0} clusters)`
        },
        {
          type: 'phylogenetic',
          date: phylogenetic.lastUpdated,
          description: 'Phylogenetic analysis completed'
        },
        {
          type: 'conservation',
          date: conservation.lastUpdated,
          description: 'Conservation priorities updated'
        }
      ],
      alerts: generateAlerts(conservation.viabilityAnalysis, diversity.bySpecies, densityAnalysis),
      dataQuality: this.assessOverallDataQuality(),
      
      // Individual points specific data
      pointsAnalysis: {
        speciesDistribution: densityAnalysis.speciesDistribution || {},
        densityDistribution: {
          very_high: densityAnalysis.densityCategories?.very_high?.length || 0,
          high: densityAnalysis.densityCategories?.high?.length || 0,
          medium: densityAnalysis.densityCategories?.medium?.length || 0,
          low: densityAnalysis.densityCategories?.low?.length || 0,
          very_low: densityAnalysis.densityCategories?.very_low?.length || 0
        },
        qualityDistribution: this.calculateQualityDistribution(individualPoints)
      }
    };
  }

  /**
   * Calculate quality distribution of individual points
   * @param {Array} points - Individual points
   * @returns {Object} Quality distribution
   */
  calculateQualityDistribution(points) {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0, very_poor: 0 };
    
    points.forEach(point => {
      if (point.dataQuality && distribution.hasOwnProperty(point.dataQuality)) {
        distribution[point.dataQuality]++;
      }
    });
    
    return distribution;
  }

  /**
   * Force refresh data from GBIF with individual points
   * @returns {Promise<boolean>} Success status
   */
  async refreshFromGBIF() {
    this.clearCache();
    gbifDataService.clearCache();
    
    const success = await this.initializeData();
    if (success) {
      console.log('Successfully refreshed individual points data from GBIF');
    } else {
      console.log('GBIF refresh failed, using fallback data');
    }
    
    return success;
  }

  /**
   * Get points within specific geographic bounds
   * @param {Object} bounds - Geographic bounds {north, south, east, west}
   * @returns {Promise<Array>} Points within bounds
   */
  async getPointsInBounds(bounds) {
    const allPoints = await this.getIndividualPointsData();
    
    return allPoints.filter(point => {
      const lat = point.coordinates.lat;
      const lng = point.coordinates.lng;
      
      return lat >= bounds.south && lat <= bounds.north &&
             lng >= bounds.west && lng <= bounds.east;
    });
  }

  /**
   * Search points by text query
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching points
   */
  async searchPoints(query) {
    const allPoints = await this.getIndividualPointsData();
    const searchQuery = query.toLowerCase();
    
    return allPoints.filter(point => {
      return point.species.toLowerCase().includes(searchQuery) ||
             (point.locality && point.locality.toLowerCase().includes(searchQuery)) ||
             (point.stateProvince && point.stateProvince.toLowerCase().includes(searchQuery)) ||
             (point.country && point.country.toLowerCase().includes(searchQuery));
    });
  }

  /**
   * Get statistics for specific area
   * @param {Object} bounds - Area bounds
   * @returns {Promise<Object>} Area statistics
   */
  async getAreaStatistics(bounds) {
    const pointsInArea = await this.getPointsInBounds(bounds);
    
    const speciesCount = {};
    const densityCount = {};
    const qualityCount = {};
    
    pointsInArea.forEach(point => {
      // Species distribution
      speciesCount[point.species] = (speciesCount[point.species] || 0) + 1;
      
      // Density distribution
      densityCount[point.densityCategory] = (densityCount[point.densityCategory] || 0) + 1;
      
      // Quality distribution
      qualityCount[point.dataQuality] = (qualityCount[point.dataQuality] || 0) + 1;
    });
    
    return {
      totalPoints: pointsInArea.length,
      speciesDistribution: speciesCount,
      densityDistribution: densityCount,
      qualityDistribution: qualityCount,
      avgNearbyPoints: pointsInArea.length > 0 ? 
        pointsInArea.reduce((sum, p) => sum + p.nearbyPointsCount, 0) / pointsInArea.length : 0,
      bounds: bounds
    };
  }

  // Include existing utility methods...
  
  /**
   * Get processed phylogenetic data with GBIF integration
   * @returns {Promise<Object>} Phylogenetic analysis results
   */
  async getPhylogeneticData() {
    const cacheKey = 'phylogenetic_analysis';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const genomicData = await this.getGenomicData();
      
      const allSequences = [];
      Object.keys(genomicData).forEach(species => {
        genomicData[species].forEach(sample => {
          allSequences.push(sample);
        });
      });

      if (allSequences.length === 0) {
        throw new Error('No sequences available for analysis');
      }

      const alignmentResult = performMSA(allSequences);
      
      let treeResult;
      try {
        treeResult = constructPhylogeneticTree(allSequences);
      } catch (treeError) {
        console.warn('Tree construction failed, using simplified tree:', treeError);
        treeResult = {
          tree: this.createSimpleTree(allSequences),
          distanceMatrix: [],
          bootstrapValues: Array(10).fill(75)
        };
      }

      const result = {
        alignment: alignmentResult,
        tree: treeResult,
        species: Object.keys(genomicData),
        totalSamples: allSequences.length,
        dataSource: this.lastUpdated ? 'GBIF + Analysis' : 'Mock Data',
        lastUpdated: this.lastUpdated || new Date().toISOString(),
        gbifIntegrated: Boolean(this.lastUpdated),
        hasIndividualPoints: this.hasIndividualPoints
      };

      this.analysisCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error in phylogenetic analysis:', error);
      return {
        alignment: { alignedSequences: [], alignmentScore: 0, consensusSequence: '' },
        tree: { tree: this.createSimpleTree([]), distanceMatrix: [], bootstrapValues: [] },
        species: Object.keys(this.genomicData),
        totalSamples: 0,
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Enhanced diversity analysis with individual points data
   * @returns {Promise<Object>} Diversity analysis results
   */
  async getDiversityAnalysis() {
    const cacheKey = 'diversity_analysis';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const genomicData = await this.getGenomicData();
    const individualPoints = await this.getIndividualPointsData();
    const diversityData = {};

    Object.keys(genomicData).forEach(species => {
      const speciesData = genomicData[species];
      const speciesPoints = individualPoints.filter(p => p.species === species);
      
      if (speciesData.length === 0) {
        diversityData[species] = {
          sampleSize: 0,
          shannonIndex: 0,
          simpsonIndex: 0,
          averageGeneticDiversity: 0,
          conservationStatus: getConservationStatus(species),
          populationTrend: getPopulationTrend(species),
          dataQuality: 'insufficient',
          individualPointsCount: speciesPoints.length,
          spatialDistribution: { range: 0, clusters: 0 }
        };
        return;
      }
      
      const sequences = speciesData.map(sample => sample.sequence);
      const diversityValues = speciesData.map(sample => sample.geneticDiversity);
      
      const nucleotideFreqs = calculateNucleotideFrequencies(sequences);
      
      diversityData[species] = {
        sampleSize: speciesData.length,
        shannonIndex: calculateShannonIndex(diversityValues),
        simpsonIndex: calculateSimpsonIndex(diversityValues),
        nucleotideFrequencies: nucleotideFreqs,
        averageGeneticDiversity: diversityValues.reduce((sum, val) => sum + val, 0) / diversityValues.length,
        selectionAnalysis: analyzeSelectionPressure(sequences[0]),
        conservationStatus: getConservationStatus(species),
        populationTrend: getPopulationTrend(species),
        spatialDistribution: calculateSpatialDistribution(speciesData),
        dataQuality: this.assessDataQuality(speciesData),
        gbifSampleSize: speciesData.length,
        
        // Individual points specific metrics
        individualPointsCount: speciesPoints.length,
        densityDistribution: this.calculateSpeciesDensityDistribution(speciesPoints),
        qualityDistribution: this.calculateQualityDistribution(speciesPoints),
        spatialSpread: this.calculateSpatialSpread(speciesPoints)
      };
    });

    const result = {
      bySpecies: diversityData,
      overallDiversity: calculateOverallDiversity(diversityData),
      recommendations: generateDiversityRecommendations(diversityData),
      dataSource: this.lastUpdated ? 'GBIF' : 'Mock',
      lastUpdated: this.lastUpdated || new Date().toISOString(),
      totalGBIFRecords: Object.values(genomicData).reduce((sum, species) => sum + species.length, 0),
      hasIndividualPoints: this.hasIndividualPoints,
      totalIndividualPoints: individualPoints.length
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate species density distribution
   * @param {Array} speciesPoints - Points for specific species
   * @returns {Object} Density distribution
   */
  calculateSpeciesDensityDistribution(speciesPoints) {
    const distribution = { very_high: 0, high: 0, medium: 0, low: 0, very_low: 0 };
    
    speciesPoints.forEach(point => {
      if (point.densityCategory && distribution.hasOwnProperty(point.densityCategory)) {
        distribution[point.densityCategory]++;
      }
    });
    
    return distribution;
  }

  /**
   * Calculate spatial spread of species points
   * @param {Array} speciesPoints - Points for specific species
   * @returns {number} Spatial spread in km
   */
  calculateSpatialSpread(speciesPoints) {
    if (speciesPoints.length < 2) return 0;
    
    const coords = speciesPoints.map(p => [p.coordinates.lat, p.coordinates.lng]);
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
   * Calculate distance between two coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
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

  // Include remaining utility methods from previous implementation...
  
  assessDataQuality(speciesData) {
    if (speciesData.length === 0) return 'insufficient';
    if (speciesData.length < 5) return 'poor';
    if (speciesData.length < 15) return 'fair';
    if (speciesData.length < 30) return 'good';
    return 'excellent';
  }

  assessOverallDataQuality() {
    const genomicData = this.genomicData;
    const totalSamples = Object.values(genomicData).reduce((sum, species) => sum + species.length, 0);
    const speciesCount = Object.keys(genomicData).length;
    
    return {
      totalSamples,
      speciesCount,
      averageSamplesPerSpecies: speciesCount > 0 ? totalSamples / speciesCount : 0,
      gbifIntegrated: Boolean(this.lastUpdated),
      hasIndividualPoints: this.hasIndividualPoints,
      totalIndividualPoints: this.individualPointsData?.length || 0,
      lastUpdate: this.lastUpdated,
      quality: totalSamples > 50 ? 'high' : totalSamples > 20 ? 'medium' : 'low'
    };
  }

  generateBasicViabilityAnalysis(genomicData) {
    const analysis = {};
    
    Object.keys(genomicData).forEach(species => {
      const speciesData = genomicData[species];
      const totalPopulation = speciesData.reduce((sum, sample) => sum + (sample.populationSize || 0), 0);
      const avgGeneticDiversity = speciesData.length > 0 ? 
        speciesData.reduce((sum, sample) => sum + (sample.geneticDiversity || 0), 0) / speciesData.length : 0;
      
      analysis[species] = {
        extinctionProbability: this.calculateBasicExtinctionRisk(totalPopulation, avgGeneticDiversity),
        totalPopulation,
        averageGeneticDiversity: avgGeneticDiversity,
        sampleSize: speciesData.length,
        recommendedActions: this.generateBasicRecommendations(species, totalPopulation, avgGeneticDiversity)
      };
    });
    
    return analysis;
  }

  calculateBasicExtinctionRisk(population, geneticDiversity) {
    const populationRisk = population < 1000 ? 0.8 : population < 5000 ? 0.5 : 0.2;
    const geneticRisk = geneticDiversity < 0.5 ? 0.7 : 0.3;
    return Math.min((populationRisk + geneticRisk) / 2, 1);
  }

  generateBasicRecommendations(species, population, geneticDiversity) {
    const recommendations = [];
    
    if (population < 1000) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate population protection',
        rationale: `${species} population critically low`
      });
    }
    
    if (geneticDiversity < 0.5) {
      recommendations.push({
        priority: 'high',
        action: 'Genetic diversity conservation',
        rationale: 'Low genetic diversity detected'
      });
    }
    
    recommendations.push({
      priority: 'ongoing',
      action: 'Continuous monitoring',
      rationale: 'Regular population assessment needed'
    });
    
    return recommendations;
  }

  generateBasicConservationActions(geographicData) {
    const actions = [];
    
    geographicData.forEach(location => {
      if (location.priority === 'critical') {
        actions.push({
          priority: 'critical',
          action: `Emergency protection for ${location.name}`,
          rationale: 'Critical conservation priority area',
          species: location.species?.join(', ') || 'Multiple species',
          timeline: 'Immediate'
        });
      }
    });
    
    return actions;
  }

  createSimpleTree(sequences) {
    const speciesGroups = {};
    
    sequences.forEach(seq => {
      if (!speciesGroups[seq.species]) {
        speciesGroups[seq.species] = [];
      }
      speciesGroups[seq.species].push({
        id: seq.id,
        name: `${seq.species} (${seq.id})`,
        isLeaf: true,
        distance: Math.random() * 0.1
      });
    });

    const root = {
      id: 'root',
      name: 'Root',
      isLeaf: false,
      children: [],
      distance: 0
    };

    Object.keys(speciesGroups).forEach((species, index) => {
      const speciesNode = {
        id: `species_${index}`,
        name: species,
        isLeaf: false,
        children: speciesGroups[species],
        distance: 0.05 * (index + 1)
      };
      root.children.push(speciesNode);
    });

    return root;
  }

  clearCache() {
    this.analysisCache.clear();
  }

  isDataLoading() {
    return this.isLoading;
  }

  getLastUpdate() {
    return this.lastUpdated;
  }

  isGBIFIntegrated() {
    return Boolean(this.lastUpdated);
  }

  hasIndividualPointsData() {
    return this.hasIndividualPoints;
  }
}

// Helper functions
function calculateNucleotideFrequencies(sequences) {
  const frequencies = { A: 0, T: 0, C: 0, G: 0 };
  let totalBases = 0;

  sequences.forEach(sequence => {
    for (let base of sequence) {
      if (frequencies.hasOwnProperty(base)) {
        frequencies[base]++;
        totalBases++;
      }
    }
  });

  Object.keys(frequencies).forEach(base => {
    frequencies[base] = frequencies[base] / totalBases;
  });

  return frequencies;
}

function calculateSpatialDistribution(speciesData) {
  if (speciesData.length === 0) return { range: 0, clusters: 0 };
  
  const coords = speciesData.map(sample => sample.coordinates);
  const latRange = Math.max(...coords.map(c => c.lat)) - Math.min(...coords.map(c => c.lat));
  const lngRange = Math.max(...coords.map(c => c.lng)) - Math.min(...coords.map(c => c.lng));
  
  return {
    range: Math.sqrt(latRange * latRange + lngRange * lngRange),
    clusters: Math.ceil(speciesData.length / 5)
  };
}

function calculateOverallDiversity(diversityData) {
  const species = Object.keys(diversityData);
  if (species.length === 0) return { averageShannonIndex: 0, averageSimpsonIndex: 0, speciesCount: 0 };
  
  const avgShannon = species.reduce((sum, sp) => sum + diversityData[sp].shannonIndex, 0) / species.length;
  const avgSimpson = species.reduce((sum, sp) => sum + diversityData[sp].simpsonIndex, 0) / species.length;
  
  return {
    averageShannonIndex: avgShannon,
    averageSimpsonIndex: avgSimpson,
    speciesCount: species.length,
    mostDiverse: species.reduce((max, sp) => 
      diversityData[sp].shannonIndex > diversityData[max].shannonIndex ? sp : max
    ),
    leastDiverse: species.reduce((min, sp) => 
      diversityData[sp].shannonIndex < diversityData[min].shannonIndex ? sp : min
    )
  };
}

function generateDiversityRecommendations(diversityData) {
  const recommendations = [];

  Object.keys(diversityData).forEach(species => {
    const data = diversityData[species];
    
    if (data.shannonIndex < 0.5) {
      recommendations.push({
        species,
        priority: 'high',
        action: 'Genetic rescue program',
        reason: 'Low genetic diversity detected'
      });
    }
    
    if (data.sampleSize < 10) {
      recommendations.push({
        species,
        priority: 'medium',
        action: 'Increase sampling effort',
        reason: 'Insufficient genetic sampling'
      });
    }

    // Individual points specific recommendations
    if (data.individualPointsCount > 0 && data.individualPointsCount < 20) {
      recommendations.push({
        species,
        priority: 'medium',
        action: 'Expand occurrence monitoring',
        reason: 'Limited individual point observations'
      });
    }
  });

  return recommendations;
}

function getConservationStatus(species) {
  const statusMap = {
    'Pongo abelii': 'Critically Endangered',
    'Pongo pygmaeus': 'Critically Endangered', 
    'Pongo tapanuliensis': 'Critically Endangered'
  };
  return statusMap[species] || 'Unknown';
}

function getPopulationTrend(species) {
  const trendMap = {
    'Pongo abelii': 'Decreasing',
    'Pongo pygmaeus': 'Decreasing',
    'Pongo tapanuliensis': 'Decreasing'
  };
  return trendMap[species] || 'Unknown';
}

function generateAlerts(viabilityAnalysis, diversityData, densityAnalysis) {
  const alerts = [];

  Object.keys(viabilityAnalysis).forEach(species => {
    const viability = viabilityAnalysis[species];
    const diversity = diversityData[species];

    if (viability.extinctionProbability > 0.5) {
      alerts.push({
        type: 'critical',
        species,
        message: `High extinction risk detected for ${species}`,
        value: `${(viability.extinctionProbability * 100).toFixed(1)}% extinction probability`
      });
    }

    if (diversity.shannonIndex < 0.3) {
      alerts.push({
        type: 'warning',
        species,
        message: `Low genetic diversity in ${species}`,
        value: `Shannon Index: ${diversity.shannonIndex.toFixed(3)}`
      });
    }
  });

  // Individual points specific alerts
  if (densityAnalysis.densityCategories) {
    const isolatedPoints = densityAnalysis.densityCategories.very_low?.length || 0;
    const totalPoints = Object.values(densityAnalysis.densityCategories).reduce((sum, arr) => sum + arr.length, 0);
    
    if (isolatedPoints > totalPoints * 0.3) {
      alerts.push({
        type: 'warning',
        species: 'All',
        message: 'High proportion of isolated occurrence points',
        value: `${isolatedPoints}/${totalPoints} points are isolated`
      });
    }
  }

  return alerts;
}

const dataService = new DataService();
export default dataService;