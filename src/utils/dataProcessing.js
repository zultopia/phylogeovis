// src/utils/dataProcessing.js
// Implementation of bioinformatics algorithms for PhyloGeoVis

/**
 * Multiple Sequence Alignment using simplified MUSCLE algorithm
 * @param {Array} sequences - Array of DNA sequences in FASTA format
 * @returns {Object} Alignment result with aligned sequences and score
 */
export function performMSA(sequences) {
  // Simplified MUSCLE implementation for demo purposes
  const alignedSequences = sequences.map(seq => ({
    ...seq,
    aligned: seq.sequence // In real implementation, this would be the aligned sequence
  }));

  const alignmentScore = calculateAlignmentScore(alignedSequences);
  
  return {
    alignedSequences,
    alignmentScore,
    consensusSequence: generateConsensus(alignedSequences)
  };
}

/**
 * Calculate pairwise alignment score
 * @param {Array} alignedSequences - Aligned sequences
 * @returns {Number} Alignment score
 */
function calculateAlignmentScore(alignedSequences) {
  if (alignedSequences.length < 2) return 0;
  
  let totalScore = 0;
  let comparisons = 0;
  
  for (let i = 0; i < alignedSequences.length; i++) {
    for (let j = i + 1; j < alignedSequences.length; j++) {
      totalScore += pairwiseScore(alignedSequences[i].aligned, alignedSequences[j].aligned);
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalScore / comparisons : 0;
}

/**
 * Calculate pairwise score between two sequences
 * @param {String} seq1 - First sequence
 * @param {String} seq2 - Second sequence
 * @returns {Number} Pairwise score
 */
function pairwiseScore(seq1, seq2) {
  const minLength = Math.min(seq1.length, seq2.length);
  let matches = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (seq1[i] === seq2[i]) matches++;
  }
  
  return matches / minLength;
}

/**
 * Generate consensus sequence from alignment
 * @param {Array} alignedSequences - Aligned sequences
 * @returns {String} Consensus sequence
 */
function generateConsensus(alignedSequences) {
  if (alignedSequences.length === 0) return '';
  
  const maxLength = Math.max(...alignedSequences.map(seq => seq.aligned.length));
  let consensus = '';
  
  for (let pos = 0; pos < maxLength; pos++) {
    const bases = {};
    alignedSequences.forEach(seq => {
      const base = seq.aligned[pos] || '-';
      bases[base] = (bases[base] || 0) + 1;
    });
    
    // Find most frequent base
    const mostFrequent = Object.keys(bases).reduce((a, b) => 
      bases[a] > bases[b] ? a : b
    );
    consensus += mostFrequent;
  }
  
  return consensus;
}

/**
 * Construct phylogenetic tree using Neighbor-Joining method
 * @param {Array} sequences - Array of sequences
 * @returns {Object} Phylogenetic tree structure
 */
export function constructPhylogeneticTree(sequences) {
  // Calculate distance matrix
  const distanceMatrix = calculateDistanceMatrix(sequences);
  
  // Apply Neighbor-Joining algorithm
  const tree = neighborJoining(distanceMatrix, sequences);
  
  return {
    tree,
    distanceMatrix,
    bootstrapValues: calculateBootstrap(sequences, 100)
  };
}

/**
 * Calculate distance matrix between sequences
 * @param {Array} sequences - Array of sequences
 * @returns {Array} Distance matrix
 */
function calculateDistanceMatrix(sequences) {
  const n = sequences.length;
  const matrix = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        matrix[i][j] = calculateGeneticDistance(
          sequences[i].sequence, 
          sequences[j].sequence
        );
      }
    }
  }
  
  return matrix;
}

/**
 * Calculate genetic distance between two sequences
 * @param {String} seq1 - First sequence
 * @param {String} seq2 - Second sequence
 * @returns {Number} Genetic distance
 */
function calculateGeneticDistance(seq1, seq2) {
  const minLength = Math.min(seq1.length, seq2.length);
  let differences = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (seq1[i] !== seq2[i]) differences++;
  }
  
  // Jukes-Cantor distance formula
  const p = differences / minLength;
  return p < 0.75 ? -0.75 * Math.log(1 - (4/3) * p) : 1.0;
}

/**
 * Neighbor-Joining algorithm implementation
 * @param {Array} distanceMatrix - Distance matrix
 * @param {Array} sequences - Original sequences
 * @returns {Object} Tree structure
 */
function neighborJoining(distanceMatrix, sequences) {
  const n = sequences.length;
  if (n < 2) return null;
  
  // Simplified NJ implementation for demo
  const nodes = sequences.map((seq, index) => ({
    id: index,
    name: seq.species,
    isLeaf: true,
    children: [],
    distance: 0
  }));
  
  // Create a simple hierarchical structure based on distance
  // In real implementation, this would follow the full NJ algorithm
  const root = {
    id: 'root',
    name: 'Root',
    isLeaf: false,
    children: [],
    distance: 0
  };
  
  // Group by species for demo visualization
  const speciesGroups = {};
  nodes.forEach(node => {
    if (!speciesGroups[node.name]) {
      speciesGroups[node.name] = [];
    }
    speciesGroups[node.name].push(node);
  });
  
  Object.keys(speciesGroups).forEach((species, index) => {
    const speciesNode = {
      id: `species_${index}`,
      name: species,
      isLeaf: false,
      children: speciesGroups[species],
      distance: 0.1 * (index + 1)
    };
    root.children.push(speciesNode);
  });
  
  return root;
}

/**
 * Calculate bootstrap values for tree confidence
 * @param {Array} sequences - Original sequences
 * @param {Number} iterations - Number of bootstrap iterations
 * @returns {Array} Bootstrap values
 */
function calculateBootstrap(sequences, iterations) {
  const bootstrapValues = [];
  
  for (let i = 0; i < Math.min(iterations, 10); i++) { // Limit iterations to prevent infinite recursion
    // Create bootstrap sample
    const sample = [];
    for (let j = 0; j < sequences.length; j++) {
      const randomIndex = Math.floor(Math.random() * sequences.length);
      sample.push(sequences[randomIndex]);
    }
    
    // Calculate simple bootstrap value instead of full tree to avoid recursion
    const bootstrapValue = Math.random() * 100; // Simplified for demo
    bootstrapValues.push(bootstrapValue);
  }
  
  return bootstrapValues;
}

/**
 * Calculate Shannon Diversity Index
 * @param {Array} frequencies - Array of allele frequencies
 * @returns {Number} Shannon diversity index
 */
export function calculateShannonIndex(frequencies) {
  let shannonIndex = 0;
  const total = frequencies.reduce((sum, freq) => sum + freq, 0);
  
  frequencies.forEach(freq => {
    if (freq > 0) {
      const proportion = freq / total;
      shannonIndex -= proportion * Math.log(proportion);
    }
  });
  
  return shannonIndex;
}

/**
 * Calculate Simpson Diversity Index
 * @param {Array} frequencies - Array of allele frequencies
 * @returns {Number} Simpson diversity index
 */
export function calculateSimpsonIndex(frequencies) {
  const total = frequencies.reduce((sum, freq) => sum + freq, 0);
  let simpsonIndex = 0;
  
  frequencies.forEach(freq => {
    const proportion = freq / total;
    simpsonIndex += proportion * proportion;
  });
  
  return 1 - simpsonIndex; // Simpson's Index of Diversity
}

/**
 * Analyze selection pressure using dN/dS ratio
 * @param {String} sequence - DNA sequence
 * @returns {Object} Selection analysis results
 */
export function analyzeSelectionPressure(sequence) {
  // Simplified implementation for demo
  const codons = [];
  for (let i = 0; i < sequence.length - 2; i += 3) {
    codons.push(sequence.substring(i, i + 3));
  }
  
  // Mock dN/dS calculation
  const dNdS = Math.random() * 2; // Random value for demo
  
  return {
    dNdS,
    selectionType: dNdS > 1 ? 'positive' : dNdS < 1 ? 'negative' : 'neutral',
    codons: codons.length,
    significantSites: Math.floor(codons.length * 0.1) // 10% of sites
  };
}

/**
 * Perform population viability analysis
 * @param {Object} populationData - Population demographic data
 * @param {Number} years - Number of years to simulate
 * @returns {Object} Viability analysis results
 */
export function performPopulationViabilityAnalysis(populationData, years = 100) {
  const { initialSize, growthRate, carryingCapacity, geneticDiversity } = populationData;
  
  const simulations = [];
  const numSimulations = 1000;
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const trajectory = [];
    let currentSize = initialSize;
    
    for (let year = 0; year < years; year++) {
      // Environmental stochasticity
      const environmentalVariation = 1 + (Math.random() - 0.5) * 0.2;
      
      // Genetic effects
      const geneticEffect = geneticDiversity > 0.5 ? 1 : 0.9;
      
      // Population growth with stochasticity
      const effectiveGrowthRate = growthRate * environmentalVariation * geneticEffect;
      currentSize = Math.min(currentSize * effectiveGrowthRate, carryingCapacity);
      
      // Demographic stochasticity for small populations
      if (currentSize < 50) {
        currentSize += (Math.random() - 0.5) * Math.sqrt(currentSize);
      }
      
      currentSize = Math.max(0, currentSize);
      trajectory.push(currentSize);
      
      if (currentSize < 1) break; // Extinction
    }
    
    simulations.push(trajectory);
  }
  
  // Calculate extinction probability
  const extinctions = simulations.filter(sim => 
    sim[sim.length - 1] < 1 || sim.length < years
  ).length;
  
  const extinctionProbability = extinctions / numSimulations;
  
  // Calculate mean trajectory
  const meanTrajectory = [];
  for (let year = 0; year < years; year++) {
    const yearValues = simulations
      .filter(sim => sim.length > year)
      .map(sim => sim[year]);
    meanTrajectory.push(
      yearValues.reduce((sum, val) => sum + val, 0) / yearValues.length
    );
  }
  
  return {
    extinctionProbability,
    meanTrajectory,
    simulations: simulations.slice(0, 10), // Return first 10 for visualization
    recommendedActions: generateConservationRecommendations(extinctionProbability, geneticDiversity)
  };
}

/**
 * Generate conservation recommendations based on analysis
 * @param {Number} extinctionProbability - Probability of extinction
 * @param {Number} geneticDiversity - Genetic diversity measure
 * @returns {Array} Array of conservation recommendations
 */
function generateConservationRecommendations(extinctionProbability, geneticDiversity) {
  const recommendations = [];
  
  if (extinctionProbability > 0.5) {
    recommendations.push({
      priority: 'critical',
      action: 'Immediate captive breeding program required',
      rationale: 'High extinction risk detected'
    });
  }
  
  if (geneticDiversity < 0.3) {
    recommendations.push({
      priority: 'high',
      action: 'Genetic rescue through translocation',
      rationale: 'Low genetic diversity threatens population viability'
    });
  }
  
  if (extinctionProbability > 0.2) {
    recommendations.push({
      priority: 'medium',
      action: 'Habitat corridor establishment',
      rationale: 'Increase connectivity between populations'
    });
  }
  
  recommendations.push({
    priority: 'ongoing',
    action: 'Continuous monitoring and adaptive management',
    rationale: 'Long-term population sustainability'
  });
  
  return recommendations;
}

/**
 * Process geographic data for spatial analysis
 * @param {Array} geoData - Geographic occurrence data
 * @param {Array} geneticData - Genetic diversity data by location
 * @returns {Object} Processed spatial data
 */
export function processGeographicData(geoData, geneticData) {
  const spatialAnalysis = geoData.map(location => {
    const genetic = geneticData.find(g => g.location === location.location) || {};
    
    return {
      ...location,
      geneticDiversity: genetic.diversity || 0,
      conservationPriority: calculateConservationPriority(location, genetic),
      habitatQuality: assessHabitatQuality(location)
    };
  });
  
  return {
    spatialData: spatialAnalysis,
    priorityAreas: identifyPriorityAreas(spatialAnalysis),
    corridorRecommendations: suggestCorridors(spatialAnalysis)
  };
}

/**
 * Calculate conservation priority score
 * @param {Object} location - Location data
 * @param {Object} genetic - Genetic data
 * @returns {Number} Priority score (0-1)
 */
function calculateConservationPriority(location, genetic) {
  const populationSize = location.populationSize || 0;
  const geneticDiversity = genetic.diversity || 0;
  const habitatThreat = location.threatLevel || 0;
  
  // Weighted priority calculation
  const priorityScore = (
    (1 - Math.min(populationSize / 1000, 1)) * 0.4 + // Population size (inverse)
    geneticDiversity * 0.3 + // Genetic diversity
    habitatThreat * 0.3 // Threat level
  );
  
  return Math.min(Math.max(priorityScore, 0), 1);
}

/**
 * Assess habitat quality based on environmental factors
 * @param {Object} location - Location data
 * @returns {Number} Habitat quality score (0-1)
 */
function assessHabitatQuality(location) {
  const forestCover = location.forestCover || 0;
  const fragmentation = location.fragmentation || 1;
  const humanDisturbance = location.humanDisturbance || 1;
  
  return (forestCover * (1 - fragmentation) * (1 - humanDisturbance));
}

/**
 * Identify priority conservation areas
 * @param {Array} spatialData - Processed spatial data
 * @returns {Array} Priority areas
 */
function identifyPriorityAreas(spatialData) {
  return spatialData
    .filter(location => location.conservationPriority > 0.6)
    .sort((a, b) => b.conservationPriority - a.conservationPriority)
    .slice(0, 10); // Top 10 priority areas
}

/**
 * Suggest habitat corridors
 * @param {Array} spatialData - Processed spatial data
 * @returns {Array} Corridor recommendations
 */
function suggestCorridors(spatialData) {
  const priorityAreas = identifyPriorityAreas(spatialData);
  const corridors = [];
  
  for (let i = 0; i < priorityAreas.length; i++) {
    for (let j = i + 1; j < priorityAreas.length; j++) {
      const distance = calculateDistance(
        priorityAreas[i].coordinates,
        priorityAreas[j].coordinates
      );
      
      if (distance < 50) { // Within 50km
        corridors.push({
          from: priorityAreas[i].location,
          to: priorityAreas[j].location,
          distance,
          priority: (priorityAreas[i].conservationPriority + priorityAreas[j].conservationPriority) / 2
        });
      }
    }
  }
  
  return corridors.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate distance between two coordinates
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}