// src/services/dataService.js
// Data management service for PhyloGeoVis

import { 
  performMSA, 
  constructPhylogeneticTree, 
  calculateShannonIndex, 
  calculateSimpsonIndex,
  analyzeSelectionPressure,
  performPopulationViabilityAnalysis,
  processGeographicData
} from '../utils/dataProcessing';

/**
 * Mock genomic data for the three orangutan species
 */
const mockGenomicData = {
  'Pongo abelii': [
    {
      id: 'PA001',
      species: 'Pongo abelii',
      subspecies: 'Sumatran',
      location: 'Leuser National Park',
      coordinates: { lat: 3.5, lng: 97.5 },
      sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACG',
      mtDNA: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACG',
      populationSize: 120,
      geneticDiversity: 0.65,
      threatLevel: 0.8
    },
    {
      id: 'PA002', 
      species: 'Pongo abelii',
      subspecies: 'Sumatran',
      location: 'Gunung Leuser',
      coordinates: { lat: 3.7, lng: 97.6 },
      sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACG',
      mtDNA: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACG',
      populationSize: 95,
      geneticDiversity: 0.58,
      threatLevel: 0.7
    }
  ],
  'Pongo pygmaeus': [
    {
      id: 'PP001',
      species: 'Pongo pygmaeus',
      subspecies: 'P. p. pygmaeus',
      location: 'Kinabatangan',
      coordinates: { lat: 5.4, lng: 118.0 },
      sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACC',
      mtDNA: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACC',
      populationSize: 200,
      geneticDiversity: 0.72,
      threatLevel: 0.6
    },
    {
      id: 'PP002',
      species: 'Pongo pygmaeus', 
      subspecies: 'P. p. wurmbii',
      location: 'Tanjung Puting',
      coordinates: { lat: -2.7, lng: 111.9 },
      sequence: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACC',
      mtDNA: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTACC',
      populationSize: 180,
      geneticDiversity: 0.69,
      threatLevel: 0.5
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
      mtDNA: 'ATCGATCGATCGATCGTAGCTAGCTAGCTAGCTACGTACGTACGTACGTACGTACGTAGT',
      populationSize: 40,
      geneticDiversity: 0.45,
      threatLevel: 0.9
    }
  ]
};

/**
 * Mock geographic distribution data
 */
const mockGeographicData = [
  {
    location: 'Leuser National Park',
    coordinates: { lat: 3.5, lng: 97.5 },
    area: 1094692, // hectares
    forestCover: 0.85,
    fragmentation: 0.2,
    humanDisturbance: 0.3,
    species: ['Pongo abelii'],
    populationSize: 120,
    lastSurvey: '2024'
  },
  {
    location: 'Kinabatangan',
    coordinates: { lat: 5.4, lng: 118.0 },
    area: 26103,
    forestCover: 0.60,
    fragmentation: 0.6,
    humanDisturbance: 0.7,
    species: ['Pongo pygmaeus'],
    populationSize: 200,
    lastSurvey: '2024'
  },
  {
    location: 'Batang Toru',
    coordinates: { lat: 1.4, lng: 99.1 },
    area: 142000,
    forestCover: 0.75,
    fragmentation: 0.4,
    humanDisturbance: 0.5,
    species: ['Pongo tapanuliensis'],
    populationSize: 40,
    lastSurvey: '2024'
  }
];

/**
 * Data Service Class
 */
class DataService {
  constructor() {
    this.genomicData = mockGenomicData;
    this.geographicData = mockGeographicData;
    this.analysisCache = new Map();
  }

  /**
   * Get all genomic data
   * @returns {Object} All genomic data by species
   */
  getGenomicData() {
    return this.genomicData;
  }

  /**
   * Get genomic data for specific species
   * @param {String} species - Species name
   * @returns {Array} Genomic data for the species
   */
  getSpeciesData(species) {
    return this.genomicData[species] || [];
  }

  /**
   * Get all geographic data
   * @returns {Array} Geographic data
   */
  getGeographicData() {
    return this.geographicData;
  }

  /**
   * Get processed phylogenetic data
   * @returns {Promise<Object>} Phylogenetic analysis results
   */
  async getPhylogeneticData() {
    const cacheKey = 'phylogenetic_analysis';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      // Flatten all sequences
      const allSequences = [];
      Object.keys(this.genomicData).forEach(species => {
        this.genomicData[species].forEach(sample => {
          allSequences.push(sample);
        });
      });

      // Validate sequences
      if (allSequences.length === 0) {
        throw new Error('No sequences available for analysis');
      }

      // Perform Multiple Sequence Alignment
      const alignmentResult = performMSA(allSequences);
      
      // Construct Phylogenetic Tree with error handling
      let treeResult;
      try {
        treeResult = constructPhylogeneticTree(allSequences);
      } catch (treeError) {
        console.warn('Tree construction failed, using simplified tree:', treeError);
        // Fallback to simple tree structure
        treeResult = {
          tree: this.createSimpleTree(allSequences),
          distanceMatrix: [],
          bootstrapValues: Array(10).fill(75) // Default bootstrap values
        };
      }

      const result = {
        alignment: alignmentResult,
        tree: treeResult,
        species: Object.keys(this.genomicData),
        totalSamples: allSequences.length,
        lastUpdated: new Date().toISOString()
      };

      this.analysisCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error in phylogenetic analysis:', error);
      // Return fallback data
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
   * Create a simple fallback tree structure
   * @param {Array} sequences - Sequence data
   * @returns {Object} Simple tree structure
   */
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

  /**
   * Get diversity analysis data
   * @returns {Promise<Object>} Diversity analysis results
   */
  async getDiversityAnalysis() {
    const cacheKey = 'diversity_analysis';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const diversityData = {};

    Object.keys(this.genomicData).forEach(species => {
      const speciesData = this.genomicData[species];
      
      // Calculate genetic diversity measures
      const sequences = speciesData.map(sample => sample.sequence);
      const diversityValues = speciesData.map(sample => sample.geneticDiversity);
      
      // Calculate nucleotide frequencies for each position
      const nucleotideFreqs = calculateNucleotideFrequencies(sequences);
      
      diversityData[species] = {
        sampleSize: speciesData.length,
        shannonIndex: calculateShannonIndex(diversityValues),
        simpsonIndex: calculateSimpsonIndex(diversityValues),
        nucleotideFrequencies: nucleotideFreqs,
        averageGeneticDiversity: diversityValues.reduce((sum, val) => sum + val, 0) / diversityValues.length,
        selectionAnalysis: analyzeSelectionPressure(sequences[0]), // Use first sequence as representative
        conservationStatus: getConservationStatus(species),
        populationTrend: getPopulationTrend(species)
      };
    });

    const result = {
      bySpecies: diversityData,
      overallDiversity: calculateOverallDiversity(diversityData),
      recommendations: generateDiversityRecommendations(diversityData),
      lastUpdated: new Date().toISOString()
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get conservation priority analysis
   * @returns {Promise<Object>} Conservation priority results
   */
  async getConservationAnalysis() {
    const cacheKey = 'conservation_analysis';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    // Get genetic diversity data for each location
    const geneticData = [];
    Object.keys(this.genomicData).forEach(species => {
      this.genomicData[species].forEach(sample => {
        geneticData.push({
          location: sample.location,
          diversity: sample.geneticDiversity,
          species: sample.species,
          populationSize: sample.populationSize,
          threatLevel: sample.threatLevel
        });
      });
    });

    // Process geographic and genetic data together
    const spatialAnalysis = processGeographicData(this.geographicData, geneticData);

    // Perform population viability analysis for each species
    const viabilityAnalysis = {};
    Object.keys(this.genomicData).forEach(species => {
      const speciesData = this.genomicData[species];
      const totalPopulation = speciesData.reduce((sum, sample) => sum + sample.populationSize, 0);
      const avgGeneticDiversity = speciesData.reduce((sum, sample) => sum + sample.geneticDiversity, 0) / speciesData.length;
      
      viabilityAnalysis[species] = performPopulationViabilityAnalysis({
        initialSize: totalPopulation,
        growthRate: getSpeciesGrowthRate(species),
        carryingCapacity: getSpeciesCarryingCapacity(species),
        geneticDiversity: avgGeneticDiversity
      });
    });

    const result = {
      spatialAnalysis,
      viabilityAnalysis,
      priorityRanking: generatePriorityRanking(spatialAnalysis, viabilityAnalysis),
      conservationActions: generateConservationActions(viabilityAnalysis),
      lastUpdated: new Date().toISOString()
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get dashboard summary data
   * @returns {Promise<Object>} Dashboard summary
   */
  async getDashboardData() {
    const [phylogenetic, diversity, conservation] = await Promise.all([
      this.getPhylogeneticData(),
      this.getDiversityAnalysis(), 
      this.getConservationAnalysis()
    ]);

    return {
      summary: {
        totalSpecies: Object.keys(this.genomicData).length,
        totalSamples: phylogenetic.totalSamples,
        totalLocations: this.geographicData.length,
        criticalLocations: conservation.priorityRanking.filter(loc => loc.priority === 'critical').length
      },
      recentUpdates: [
        {
          type: 'phylogenetic',
          date: phylogenetic.lastUpdated,
          description: 'Phylogenetic analysis completed'
        },
        {
          type: 'diversity',
          date: diversity.lastUpdated,
          description: 'Diversity indices calculated'
        },
        {
          type: 'conservation',
          date: conservation.lastUpdated,
          description: 'Conservation priorities updated'
        }
      ],
      alerts: generateAlerts(conservation.viabilityAnalysis, diversity.bySpecies)
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }

  /**
   * Update genomic data
   * @param {String} species - Species name
   * @param {Array} newData - New genomic data
   */
  updateGenomicData(species, newData) {
    this.genomicData[species] = newData;
    this.clearCache();
  }

  /**
   * Add new sample
   * @param {String} species - Species name
   * @param {Object} sampleData - New sample data
   */
  addSample(species, sampleData) {
    if (!this.genomicData[species]) {
      this.genomicData[species] = [];
    }
    this.genomicData[species].push(sampleData);
    this.clearCache();
  }
}

// Helper functions

/**
 * Calculate nucleotide frequencies in sequences
 * @param {Array} sequences - Array of DNA sequences
 * @returns {Object} Nucleotide frequencies
 */
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

  // Convert to proportions
  Object.keys(frequencies).forEach(base => {
    frequencies[base] = frequencies[base] / totalBases;
  });

  return frequencies;
}

/**
 * Calculate overall diversity across all species
 * @param {Object} diversityData - Diversity data by species
 * @returns {Object} Overall diversity metrics
 */
function calculateOverallDiversity(diversityData) {
  const species = Object.keys(diversityData);
  
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

/**
 * Generate diversity-based recommendations
 * @param {Object} diversityData - Diversity data by species
 * @returns {Array} Recommendations
 */
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
  });

  return recommendations;
}

/**
 * Get conservation status for species
 * @param {String} species - Species name
 * @returns {String} Conservation status
 */
function getConservationStatus(species) {
  const statusMap = {
    'Pongo abelii': 'Critically Endangered',
    'Pongo pygmaeus': 'Critically Endangered', 
    'Pongo tapanuliensis': 'Critically Endangered'
  };
  return statusMap[species] || 'Unknown';
}

/**
 * Get population trend for species
 * @param {String} species - Species name
 * @returns {String} Population trend
 */
function getPopulationTrend(species) {
  const trendMap = {
    'Pongo abelii': 'Decreasing',
    'Pongo pygmaeus': 'Decreasing',
    'Pongo tapanuliensis': 'Decreasing'
  };
  return trendMap[species] || 'Unknown';
}

/**
 * Get species growth rate
 * @param {String} species - Species name
 * @returns {Number} Growth rate
 */
function getSpeciesGrowthRate(species) {
  const rateMap = {
    'Pongo abelii': 0.98, // Slight decline
    'Pongo pygmaeus': 0.985,
    'Pongo tapanuliensis': 0.97 // Steeper decline
  };
  return rateMap[species] || 1.0;
}

/**
 * Get species carrying capacity
 * @param {String} species - Species name  
 * @returns {Number} Carrying capacity
 */
function getSpeciesCarryingCapacity(species) {
  const capacityMap = {
    'Pongo abelii': 15000,
    'Pongo pygmaeus': 100000,
    'Pongo tapanuliensis': 1000
  };
  return capacityMap[species] || 10000;
}

/**
 * Generate priority ranking
 * @param {Object} spatialAnalysis - Spatial analysis results
 * @param {Object} viabilityAnalysis - Viability analysis results
 * @returns {Array} Priority ranking
 */
function generatePriorityRanking(spatialAnalysis, viabilityAnalysis) {
  const priorities = spatialAnalysis.priorityAreas.map(area => {
    const species = area.species[0]; // Assuming one species per area
    const viability = viabilityAnalysis[species];
    
    let priority = 'low';
    if (area.conservationPriority > 0.8 || viability.extinctionProbability > 0.5) {
      priority = 'critical';
    } else if (area.conservationPriority > 0.6 || viability.extinctionProbability > 0.2) {
      priority = 'high';
    } else if (area.conservationPriority > 0.4) {
      priority = 'medium';
    }

    return {
      ...area,
      priority,
      extinctionRisk: viability.extinctionProbability,
      urgency: calculateUrgency(area, viability)
    };
  });

  return priorities.sort((a, b) => b.urgency - a.urgency);
}

/**
 * Calculate urgency score
 * @param {Object} area - Area data
 * @param {Object} viability - Viability data
 * @returns {Number} Urgency score
 */
function calculateUrgency(area, viability) {
  return (
    area.conservationPriority * 0.4 +
    viability.extinctionProbability * 0.4 +
    (1 - area.habitatQuality) * 0.2
  );
}

/**
 * Generate conservation actions
 * @param {Object} viabilityAnalysis - Viability analysis results
 * @returns {Array} Conservation actions
 */
function generateConservationActions(viabilityAnalysis) {
  const actions = [];

  Object.keys(viabilityAnalysis).forEach(species => {
    const analysis = viabilityAnalysis[species];
    
    analysis.recommendedActions.forEach(rec => {
      actions.push({
        species,
        ...rec,
        timeline: getPriorityTimeline(rec.priority)
      });
    });
  });

  return actions.sort((a, b) => {
    const priorityOrder = { critical: 3, high: 2, medium: 1, ongoing: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get timeline for priority level
 * @param {String} priority - Priority level
 * @returns {String} Timeline
 */
function getPriorityTimeline(priority) {
  const timelineMap = {
    critical: 'Immediate (0-6 months)',
    high: 'Short-term (6-12 months)',
    medium: 'Medium-term (1-2 years)',
    ongoing: 'Long-term (ongoing)'
  };
  return timelineMap[priority] || 'To be determined';
}

/**
 * Generate alerts for dashboard
 * @param {Object} viabilityAnalysis - Viability analysis
 * @param {Object} diversityData - Diversity data
 * @returns {Array} Alert messages
 */
function generateAlerts(viabilityAnalysis, diversityData) {
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

  return alerts;
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;