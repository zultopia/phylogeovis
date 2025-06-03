// src/utils/dataValidation.js
// Data validation and quality assessment utilities for GBIF data

import { getValidationConfig, getSpeciesConfig } from '../config/gbifConfig';

/**
 * Data Quality Assessment Class
 */
export class DataQualityAssessment {
  constructor() {
    this.validationConfig = getValidationConfig();
    this.qualityMetrics = {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0,
      errors: []
    };
  }

  /**
   * Validate a single GBIF occurrence record
   * @param {Object} occurrence - GBIF occurrence record
   * @returns {Object} Validation result
   */
  validateOccurrence(occurrence) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      quality: 'excellent'
    };

    // Check required fields
    const requiredFields = this.validationConfig.quality.requiredFields;
    requiredFields.forEach(field => {
      if (!occurrence[field] && occurrence[field] !== 0) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    });

    // Validate coordinates
    if (occurrence.decimalLatitude && occurrence.decimalLongitude) {
      const coordValidation = this.validateCoordinates(
        occurrence.decimalLatitude,
        occurrence.decimalLongitude
      );
      if (!coordValidation.isValid) {
        result.errors.push(...coordValidation.errors);
        result.isValid = false;
      }
      result.warnings.push(...coordValidation.warnings);
    }

    // Validate date
    if (occurrence.year) {
      const dateValidation = this.validateDate(occurrence.year);
      if (!dateValidation.isValid) {
        result.errors.push(...dateValidation.errors);
        result.isValid = false;
      }
      result.warnings.push(...dateValidation.warnings);
    }

    // Validate species information
    if (occurrence.species || occurrence.scientificName) {
      const speciesValidation = this.validateSpecies(occurrence);
      if (!speciesValidation.isValid) {
        result.warnings.push(...speciesValidation.warnings);
      }
    }

    // Check coordinate uncertainty
    if (occurrence.coordinateUncertaintyInMeters) {
      if (occurrence.coordinateUncertaintyInMeters > this.validationConfig.quality.maxCoordinateUncertainty) {
        result.warnings.push(
          `High coordinate uncertainty: ${occurrence.coordinateUncertaintyInMeters}m`
        );
      }
    }

    // Determine overall quality
    result.quality = this.calculateRecordQuality(result, occurrence);

    return result;
  }

  /**
   * Validate coordinates
   * @param {number} latitude - Latitude value
   * @param {number} longitude - Longitude value
   * @returns {Object} Validation result
   */
  validateCoordinates(latitude, longitude) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const coords = this.validationConfig.coordinates;

    // Check if coordinates are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      result.errors.push('Coordinates must be numeric values');
      result.isValid = false;
      return result;
    }

    // Check latitude range
    if (latitude < coords.minLatitude || latitude > coords.maxLatitude) {
      result.errors.push(
        `Latitude ${latitude} is outside valid range (${coords.minLatitude} to ${coords.maxLatitude})`
      );
      result.isValid = false;
    }

    // Check longitude range
    if (longitude < coords.minLongitude || longitude > coords.maxLongitude) {
      result.errors.push(
        `Longitude ${longitude} is outside valid range (${coords.minLongitude} to ${coords.maxLongitude})`
      );
      result.isValid = false;
    }

    // Check for suspicious coordinates (0,0) or exact integers
    if (latitude === 0 && longitude === 0) {
      result.warnings.push('Coordinates are (0,0) - may be default/placeholder values');
    }

    if (latitude % 1 === 0 && longitude % 1 === 0) {
      result.warnings.push('Coordinates are exact integers - may lack precision');
    }

    return result;
  }

  /**
   * Validate date information
   * @param {number} year - Year value
   * @returns {Object} Validation result
   */
  validateDate(year) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const dates = this.validationConfig.dates;
    const currentYear = new Date().getFullYear();

    if (typeof year !== 'number') {
      result.errors.push('Year must be a numeric value');
      result.isValid = false;
      return result;
    }

    if (year < dates.minYear || year > dates.maxYear) {
      result.errors.push(
        `Year ${year} is outside valid range (${dates.minYear} to ${dates.maxYear})`
      );
      result.isValid = false;
    }

    // Warn about very old records
    if (year < 1980) {
      result.warnings.push('Very old record - data quality may be limited');
    }

    // Warn about future dates
    if (year > currentYear) {
      result.warnings.push('Future date detected - may be an error');
    }

    return result;
  }

  /**
   * Validate species information
   * @param {Object} occurrence - Occurrence record
   * @returns {Object} Validation result
   */
  validateSpecies(occurrence) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const speciesName = occurrence.species || occurrence.scientificName;
    
    if (!speciesName) {
      result.warnings.push('No species name provided');
      return result;
    }

    // Check if it's a known orangutan species
    const speciesConfig = getSpeciesConfig(speciesName);
    if (!speciesConfig && speciesName.includes('Pongo')) {
      result.warnings.push(`Unknown Pongo species: ${speciesName}`);
    }

    // Check for hybrid or subspecies designations
    if (speciesName.includes('×') || speciesName.includes('hybrid')) {
      result.warnings.push('Hybrid specimen detected');
    }

    return result;
  }

  /**
   * Calculate overall quality score for a record
   * @param {Object} validationResult - Validation result
   * @param {Object} occurrence - Original occurrence record
   * @returns {string} Quality assessment
   */
  calculateRecordQuality(validationResult, occurrence) {
    let score = 100;

    // Deduct points for errors and warnings
    score -= validationResult.errors.length * 25;
    score -= validationResult.warnings.length * 10;

    // Bonus points for additional data
    if (occurrence.recordedBy) score += 5;
    if (occurrence.institutionCode) score += 5;
    if (occurrence.locality) score += 5;
    if (occurrence.habitat) score += 5;
    if (occurrence.eventDate) score += 5;
    if (occurrence.coordinateUncertaintyInMeters && 
        occurrence.coordinateUncertaintyInMeters < 1000) score += 10;

    // Determine quality category
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'very_poor';
  }

  /**
   * Validate an entire dataset
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Dataset validation summary
   */
  validateDataset(occurrences) {
    const summary = {
      totalRecords: occurrences.length,
      validRecords: 0,
      invalidRecords: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        very_poor: 0
      },
      commonErrors: {},
      commonWarnings: {},
      overallQuality: 'unknown',
      recommendations: []
    };

    const allErrors = [];
    const allWarnings = [];

    occurrences.forEach(occurrence => {
      const validation = this.validateOccurrence(occurrence);
      
      if (validation.isValid) {
        summary.validRecords++;
      } else {
        summary.invalidRecords++;
      }

      summary.qualityDistribution[validation.quality]++;
      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);
    });

    // Count common errors and warnings
    summary.commonErrors = this.countOccurrences(allErrors);
    summary.commonWarnings = this.countOccurrences(allWarnings);

    // Calculate overall quality
    summary.overallQuality = this.calculateDatasetQuality(summary);

    // Generate recommendations
    summary.recommendations = this.generateRecommendations(summary);

    return summary;
  }

  /**
   * Count occurrences of errors/warnings
   * @param {Array} items - Array of error/warning messages
   * @returns {Object} Counts by message
   */
  countOccurrences(items) {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate overall dataset quality
   * @param {Object} summary - Dataset summary
   * @returns {string} Overall quality assessment
   */
  calculateDatasetQuality(summary) {
    const total = summary.totalRecords;
    if (total === 0) return 'no_data';

    const excellentPercent = (summary.qualityDistribution.excellent / total) * 100;
    const goodPercent = (summary.qualityDistribution.good / total) * 100;
    const validPercent = (summary.validRecords / total) * 100;

    if (validPercent < 50) return 'poor';
    if (excellentPercent > 60) return 'excellent';
    if (excellentPercent + goodPercent > 70) return 'good';
    if (validPercent > 80) return 'fair';
    return 'poor';
  }

  /**
   * Generate data quality recommendations
   * @param {Object} summary - Dataset summary
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(summary) {
    const recommendations = [];

    // Check for common issues
    if (summary.commonErrors['Missing required field: decimalLatitude'] > 0) {
      recommendations.push({
        type: 'error',
        message: 'Many records are missing coordinates',
        action: 'Filter out records without coordinates or use spatial interpolation'
      });
    }

    if (summary.commonWarnings['High coordinate uncertainty'] > summary.totalRecords * 0.3) {
      recommendations.push({
        type: 'warning',
        message: 'High proportion of records have poor coordinate precision',
        action: 'Consider filtering records with uncertainty > 1km for fine-scale analysis'
      });
    }

    if (summary.qualityDistribution.poor + summary.qualityDistribution.very_poor > summary.totalRecords * 0.4) {
      recommendations.push({
        type: 'quality',
        message: 'Large proportion of low-quality records',
        action: 'Consider additional data cleaning or seeking higher quality datasets'
      });
    }

    if (summary.totalRecords < this.validationConfig.quality.minOccurrencesPerSpecies) {
      recommendations.push({
        type: 'sample_size',
        message: 'Insufficient data for reliable analysis',
        action: 'Expand search criteria or combine with other data sources'
      });
    }

    return recommendations;
  }

  /**
   * Filter dataset based on quality criteria
   * @param {Array} occurrences - Array of occurrence records
   * @param {Object} criteria - Filtering criteria
   * @returns {Array} Filtered occurrences
   */
  filterByQuality(occurrences, criteria = {}) {
    const defaults = {
      minQuality: 'fair',
      requireCoordinates: true,
      maxCoordinateUncertainty: 10000,
      minYear: 1980,
      removeInvalid: true
    };

    const config = { ...defaults, ...criteria };
    const qualityOrder = ['very_poor', 'poor', 'fair', 'good', 'excellent'];
    const minQualityIndex = qualityOrder.indexOf(config.minQuality);

    return occurrences.filter(occurrence => {
      const validation = this.validateOccurrence(occurrence);

      // Remove invalid records if requested
      if (config.removeInvalid && !validation.isValid) {
        return false;
      }

      // Check quality threshold
      const qualityIndex = qualityOrder.indexOf(validation.quality);
      if (qualityIndex < minQualityIndex) {
        return false;
      }

      // Check coordinates requirement
      if (config.requireCoordinates && 
          (!occurrence.decimalLatitude || !occurrence.decimalLongitude)) {
        return false;
      }

      // Check coordinate uncertainty
      if (occurrence.coordinateUncertaintyInMeters > config.maxCoordinateUncertainty) {
        return false;
      }

      // Check year requirement
      if (occurrence.year && occurrence.year < config.minYear) {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate quality report
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Comprehensive quality report
   */
  generateQualityReport(occurrences) {
    const validation = this.validateDataset(occurrences);
    
    return {
      summary: validation,
      temporalCoverage: this.analyzeTemporalCoverage(occurrences),
      spatialCoverage: this.analyzeSpatialCoverage(occurrences),
      taxonomicCoverage: this.analyzeTaxonomicCoverage(occurrences),
      dataProviders: this.analyzeDataProviders(occurrences),
      qualityMetrics: this.calculateDetailedMetrics(occurrences, validation)
    };
  }

  /**
   * Analyze temporal coverage of the dataset
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Temporal analysis
   */
  analyzeTemporalCoverage(occurrences) {
    const years = occurrences
      .map(occ => occ.year)
      .filter(year => year && !isNaN(year))
      .sort((a, b) => a - b);

    if (years.length === 0) {
      return { coverage: 'none', recommendations: ['No temporal data available'] };
    }

    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const span = maxYear - minYear;
    const currentYear = new Date().getFullYear();
    const recentData = years.filter(year => year >= currentYear - 5).length;

    return {
      minYear,
      maxYear,
      span,
      totalRecordsWithDates: years.length,
      recentRecords: recentData,
      coverage: span > 20 ? 'excellent' : span > 10 ? 'good' : 'limited',
      gaps: this.identifyTemporalGaps(years),
      recommendations: this.generateTemporalRecommendations(years, currentYear)
    };
  }

  /**
   * Analyze spatial coverage of the dataset
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Spatial analysis
   */
  analyzeSpatialCoverage(occurrences) {
    const coordRecords = occurrences.filter(
      occ => occ.decimalLatitude && occ.decimalLongitude
    );

    if (coordRecords.length === 0) {
      return { coverage: 'none', recommendations: ['No spatial data available'] };
    }

    const lats = coordRecords.map(occ => occ.decimalLatitude);
    const lngs = coordRecords.map(occ => occ.decimalLongitude);

    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };

    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    return {
      bounds,
      range: { latitude: latRange, longitude: lngRange },
      totalRecordsWithCoords: coordRecords.length,
      coverage: latRange > 5 && lngRange > 5 ? 'excellent' : 'limited',
      density: this.calculateSpatialDensity(coordRecords),
      clusters: this.identifySpatialClusters(coordRecords)
    };
  }

  /**
   * Analyze taxonomic coverage
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Taxonomic analysis
   */
  analyzeTaxonomicCoverage(occurrences) {
    const species = {};
    
    occurrences.forEach(occ => {
      const speciesName = occ.species || occ.scientificName || 'Unknown';
      if (!species[speciesName]) {
        species[speciesName] = 0;
      }
      species[speciesName]++;
    });

    return {
      speciesCount: Object.keys(species).length,
      speciesDistribution: species,
      dominantSpecies: Object.keys(species).reduce((a, b) => 
        species[a] > species[b] ? a : b
      ),
      coverage: Object.keys(species).length >= 3 ? 'complete' : 'partial'
    };
  }

  /**
   * Analyze data providers
   * @param {Array} occurrences - Array of occurrence records
   * @returns {Object} Provider analysis
   */
  analyzeDataProviders(occurrences) {
    const institutions = {};
    
    occurrences.forEach(occ => {
      const institution = occ.institutionCode || 'Unknown';
      if (!institutions[institution]) {
        institutions[institution] = 0;
      }
      institutions[institution]++;
    });

    return {
      institutionCount: Object.keys(institutions).length,
      institutionDistribution: institutions,
      diversity: Object.keys(institutions).length > 5 ? 'high' : 'low'
    };
  }

  /**
   * Calculate detailed quality metrics
   * @param {Array} occurrences - Array of occurrence records
   * @param {Object} validation - Validation summary
   * @returns {Object} Detailed metrics
   */
  calculateDetailedMetrics(occurrences, validation) {
    return {
      completeness: {
        coordinates: occurrences.filter(occ => 
          occ.decimalLatitude && occ.decimalLongitude).length / occurrences.length,
        dates: occurrences.filter(occ => occ.year).length / occurrences.length,
        species: occurrences.filter(occ => 
          occ.species || occ.scientificName).length / occurrences.length,
        locality: occurrences.filter(occ => occ.locality).length / occurrences.length
      },
      accuracy: {
        validRecordsRatio: validation.validRecords / validation.totalRecords,
        highQualityRatio: (validation.qualityDistribution.excellent + 
          validation.qualityDistribution.good) / validation.totalRecords,
        lowUncertaintyRatio: occurrences.filter(occ => 
          occ.coordinateUncertaintyInMeters && 
          occ.coordinateUncertaintyInMeters < 1000).length / occurrences.length
      }
    };
  }

  // Additional helper methods
  identifyTemporalGaps(years) {
    const gaps = [];
    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i-1] > 5) {
        gaps.push({ start: years[i-1], end: years[i], duration: years[i] - years[i-1] });
      }
    }
    return gaps;
  }

  generateTemporalRecommendations(years, currentYear) {
    const recommendations = [];
    const recentData = years.filter(year => year >= currentYear - 5).length;
    const oldData = years.filter(year => year < 1990).length;

    if (recentData < years.length * 0.2) {
      recommendations.push('Consider supplementing with more recent observations');
    }

    if (oldData > years.length * 0.5) {
      recommendations.push('Large proportion of old data - verify current relevance');
    }

    return recommendations;
  }

  calculateSpatialDensity(coordRecords) {
    // Simple spatial density calculation
    const totalArea = this.calculateBoundingBoxArea(coordRecords);
    return coordRecords.length / totalArea;
  }

  calculateBoundingBoxArea(coordRecords) {
    const lats = coordRecords.map(occ => occ.decimalLatitude);
    const lngs = coordRecords.map(occ => occ.decimalLongitude);
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    
    return latRange * lngRange; // Simplified area calculation
  }

  identifySpatialClusters(coordRecords) {
    // Simple clustering based on distance
    const clusters = [];
    const processed = new Set();
    
    coordRecords.forEach((record, index) => {
      if (processed.has(index)) return;
      
      const cluster = [record];
      processed.add(index);
      
      coordRecords.forEach((other, otherIndex) => {
        if (processed.has(otherIndex)) return;
        
        const distance = this.calculateDistance(
          record.decimalLatitude, record.decimalLongitude,
          other.decimalLatitude, other.decimalLongitude
        );
        
        if (distance < 0.1) { // Within ~10km
          cluster.push(other);
          processed.add(otherIndex);
        }
      });
      
      if (cluster.length > 1) {
        clusters.push({
          size: cluster.length,
          center: this.calculateClusterCenter(cluster)
        });
      }
    });
    
    return clusters;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateClusterCenter(cluster) {
    const avgLat = cluster.reduce((sum, record) => sum + record.decimalLatitude, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, record) => sum + record.decimalLongitude, 0) / cluster.length;
    return { latitude: avgLat, longitude: avgLng };
  }
}

// Create singleton instance
export const dataQualityAssessment = new DataQualityAssessment();

// Export utility functions
export const validateOccurrence = (occurrence) => {
  return dataQualityAssessment.validateOccurrence(occurrence);
};

export const validateDataset = (occurrences) => {
  return dataQualityAssessment.validateDataset(occurrences);
};

export const filterByQuality = (occurrences, criteria) => {
  return dataQualityAssessment.filterByQuality(occurrences, criteria);
};

export const generateQualityReport = (occurrences) => {
  return dataQualityAssessment.generateQualityReport(occurrences);
};

export default DataQualityAssessment;