// src/config/gbifConfig.js
// Configuration settings for GBIF API integration

export const GBIF_CONFIG = {
  // GBIF API Configuration
  API: {
    BASE_URL: 'https://api.gbif.org/v1',
    RATE_LIMIT_DELAY: 100, // milliseconds between requests
    REQUEST_TIMEOUT: 30000, // 30 seconds timeout
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second initial retry delay
  },

  // Orangutan Species Configuration
  SPECIES: {
    'Pongo abelii': {
      taxonKey: 5707420,
      commonName: 'Sumatran Orangutan',
      iucnStatus: 'Critically Endangered',
      estimatedPopulation: 14000,
      primaryHabitat: 'Tropical rainforest',
      countries: ['ID'], // Indonesia
      conservationPriority: 'critical'
    },
    'Pongo pygmaeus': {
      taxonKey: 5219532,
      commonName: 'Bornean Orangutan',
      iucnStatus: 'Critically Endangered',
      estimatedPopulation: 104000,
      primaryHabitat: 'Tropical rainforest',
      countries: ['ID', 'MY'], // Indonesia, Malaysia
      conservationPriority: 'critical'
    },
    'Pongo tapanuliensis': {
      taxonKey: 9311132,
      commonName: 'Tapanuli Orangutan',
      iucnStatus: 'Critically Endangered',
      estimatedPopulation: 800,
      primaryHabitat: 'Montane forest',
      countries: ['ID'], // Indonesia
      conservationPriority: 'critical'
    }
  },

  // Search Parameters
  SEARCH_PARAMS: {
    // Geographic bounds for orangutan habitats (Indonesia & Malaysia)
    GEOGRAPHIC_BOUNDS: {
      INDONESIA: 'POLYGON((95.0 -11.0, 141.0 -11.0, 141.0 6.0, 95.0 6.0, 95.0 -11.0))',
      MALAYSIA: 'POLYGON((99.0 1.0, 119.5 1.0, 119.5 7.5, 99.0 7.5, 99.0 1.0))',
      COMBINED: 'POLYGON((95.0 -11.0, 141.0 -11.0, 141.0 7.5, 99.0 7.5, 99.0 1.0, 95.0 1.0, 95.0 -11.0))'
    },
    
    // Data quality filters
    QUALITY_FILTERS: {
      hasCoordinate: true,
      hasGeospatialIssue: false,
      occurrenceStatus: 'PRESENT',
      basisOfRecord: ['HUMAN_OBSERVATION', 'OBSERVATION', 'MACHINE_OBSERVATION'],
      coordinateUncertaintyInMeters: 10000, // max 10km uncertainty
    },

    // Temporal filters
    TEMPORAL_FILTERS: {
      minYear: 1980, // Only data from 1980 onwards
      maxYear: new Date().getFullYear(),
      recentYears: 5 // For recent trend analysis
    },

    // Pagination
    PAGINATION: {
      limit: 300, // Records per request
      maxRecords: 2000, // Maximum records per species
      offset: 0
    }
  },

  // Conservation Areas Configuration
  CONSERVATION_AREAS: {
    'Leuser National Park': {
      geometry: 'POLYGON((96.5 2.5, 98.5 2.5, 98.5 4.5, 96.5 4.5, 96.5 2.5))',
      area: 1094692, // hectares
      established: 1980,
      protectionStatus: 'World Heritage Site',
      primarySpecies: 'Pongo abelii',
      threats: ['deforestation', 'palm_oil', 'human_encroachment'],
      center: [3.5, 97.5],
      country: 'Indonesia',
      province: 'Aceh'
    },
    'Batang Toru Forest': {
      geometry: 'POLYGON((98.5 0.5, 100.0 0.5, 100.0 2.5, 98.5 2.5, 98.5 0.5))',
      area: 142000,
      established: 2018,
      protectionStatus: 'Protected Forest',
      primarySpecies: 'Pongo tapanuliensis',
      threats: ['mining', 'infrastructure', 'fragmentation'],
      center: [1.4, 99.1],
      country: 'Indonesia',
      province: 'North Sumatra'
    },
    'Kinabatangan Wildlife Sanctuary': {
      geometry: 'POLYGON((117.5 5.0, 118.5 5.0, 118.5 6.0, 117.5 6.0, 117.5 5.0))',
      area: 26103,
      established: 2005,
      protectionStatus: 'Wildlife Sanctuary',
      primarySpecies: 'Pongo pygmaeus',
      threats: ['palm_oil', 'logging', 'river_pollution'],
      center: [5.4, 118.0],
      country: 'Malaysia',
      province: 'Sabah'
    },
    'Tanjung Puting National Park': {
      geometry: 'POLYGON((111.0 -3.5, 112.5 -3.5, 112.5 -2.0, 111.0 -2.0, 111.0 -3.5))',
      area: 415040,
      established: 1982,
      protectionStatus: 'National Park',
      primarySpecies: 'Pongo pygmaeus',
      threats: ['illegal_logging', 'gold_mining', 'fires'],
      center: [-2.7, 111.9],
      country: 'Indonesia',
      province: 'Central Kalimantan'
    },
    'Sebangau National Park': {
      geometry: 'POLYGON((113.0 -3.0, 114.5 -3.0, 114.5 -1.5, 113.0 -1.5, 113.0 -3.0))',
      area: 568700,
      established: 2004,
      protectionStatus: 'National Park',
      primarySpecies: 'Pongo pygmaeus',
      threats: ['peat_fires', 'illegal_logging', 'conversion'],
      center: [-2.3, 113.7],
      country: 'Indonesia',
      province: 'Central Kalimantan'
    },
    'Kutai National Park': {
      geometry: 'POLYGON((116.5 -0.5, 118.0 -0.5, 118.0 1.0, 116.5 1.0, 116.5 -0.5))',
      area: 198629,
      established: 1982,
      protectionStatus: 'National Park',
      primarySpecies: 'Pongo pygmaeus',
      threats: ['mining', 'logging', 'encroachment'],
      center: [0.3, 117.4],
      country: 'Indonesia',
      province: 'East Kalimantan'
    }
  },

  // Analysis Parameters
  ANALYSIS: {
    // Population estimation parameters
    POPULATION_ESTIMATION: {
      densityMultiplier: 0.5, // Conservative estimation
      areaConversionFactor: 100, // hectares to km²
      occurrenceToPopulationRatio: 10, // 1 occurrence ≈ 10 individuals
      minViablePopulation: 500,
      criticalPopulationThreshold: 1000
    },

    // Genetic diversity estimation
    GENETIC_DIVERSITY: {
      spatialDispersionWeight: 0.6,
      temporalStabilityWeight: 0.4,
      minSamplesForReliability: 10,
      diversityThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8
      }
    },

    // Extinction risk calculation
    EXTINCTION_RISK: {
      populationWeight: 0.4,
      geneticWeight: 0.3,
      threatWeight: 0.3,
      riskThresholds: {
        low: 0.2,
        medium: 0.5,
        high: 0.7,
        critical: 0.9
      }
    },

    // Priority calculation weights
    PRIORITY_WEIGHTS: {
      extinctionRisk: 0.4,
      geneticDiversity: 0.25,
      populationSize: 0.2,
      habitatQuality: 0.15
    }
  },

  // Cache Configuration
  CACHE: {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    speciesTTL: 12 * 60 * 60 * 1000, // 12 hours
    analysisTTL: 6 * 60 * 60 * 1000, // 6 hours
    maxCacheSize: 100, // Maximum cached items
    compressionEnabled: true
  },

  // Error Handling
  ERROR_HANDLING: {
    maxRetries: 3,
    retryDelays: [1000, 2000, 5000], // Progressive delays
    fallbackToMockData: true,
    logErrors: true,
    userFriendlyMessages: {
      networkError: 'Unable to connect to GBIF. Using cached data.',
      rateLimitError: 'Too many requests. Please wait and try again.',
      dataError: 'Invalid data received. Using fallback data.',
      parseError: 'Error processing data. Some features may be limited.'
    }
  },

  // Data Validation Rules
  VALIDATION: {
    coordinates: {
      minLatitude: -15,
      maxLatitude: 10,
      minLongitude: 90,
      maxLongitude: 145
    },
    dates: {
      minYear: 1800,
      maxYear: new Date().getFullYear() + 1
    },
    quality: {
      minOccurrencesPerSpecies: 5,
      maxCoordinateUncertainty: 10000,
      requiredFields: ['decimalLatitude', 'decimalLongitude', 'species', 'year']
    }
  },

  // UI Configuration
  UI: {
    map: {
      defaultCenter: [-0.7893, 113.9213], // Indonesia center
      defaultZoom: 5,
      minZoom: 4,
      maxZoom: 15,
      bounds: [[-15, 90], [10, 145]]
    },
    colors: {
      critical: '#EF4444',
      high: '#F97316',
      medium: '#EAB308',
      low: '#22C55E',
      unknown: '#6B7280'
    },
    markers: {
      sizes: {
        critical: 30,
        high: 25,
        medium: 22,
        low: 18
      }
    }
  }
};

// Helper functions for configuration access
export const getSpeciesConfig = (speciesName) => {
  return GBIF_CONFIG.SPECIES[speciesName] || null;
};

export const getConservationAreaConfig = (areaName) => {
  return GBIF_CONFIG.CONSERVATION_AREAS[areaName] || null;
};

export const getAllSpeciesKeys = () => {
  return Object.keys(GBIF_CONFIG.SPECIES);
};

export const getAllTaxonKeys = () => {
  return Object.values(GBIF_CONFIG.SPECIES).map(species => species.taxonKey);
};

export const getSearchParams = (customParams = {}) => {
  return {
    ...GBIF_CONFIG.SEARCH_PARAMS.QUALITY_FILTERS,
    ...GBIF_CONFIG.SEARCH_PARAMS.TEMPORAL_FILTERS,
    ...customParams
  };
};

export const getAnalysisConfig = () => {
  return GBIF_CONFIG.ANALYSIS;
};

export const getCacheConfig = () => {
  return GBIF_CONFIG.CACHE;
};

export const getErrorConfig = () => {
  return GBIF_CONFIG.ERROR_HANDLING;
};

export const getValidationConfig = () => {
  return GBIF_CONFIG.VALIDATION;
};

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const envOverrides = {
    development: {
      API: {
        ...GBIF_CONFIG.API,
        RATE_LIMIT_DELAY: 200, // Slower in development
      },
      SEARCH_PARAMS: {
        ...GBIF_CONFIG.SEARCH_PARAMS,
        PAGINATION: {
          ...GBIF_CONFIG.SEARCH_PARAMS.PAGINATION,
          limit: 100, // Smaller batches in development
          maxRecords: 500
        }
      },
      ERROR_HANDLING: {
        ...GBIF_CONFIG.ERROR_HANDLING,
        logErrors: true,
        fallbackToMockData: true
      }
    },
    production: {
      API: {
        ...GBIF_CONFIG.API,
        RATE_LIMIT_DELAY: 50, // Faster in production
      },
      ERROR_HANDLING: {
        ...GBIF_CONFIG.ERROR_HANDLING,
        logErrors: false, // Disable console logging in production
        fallbackToMockData: false
      }
    }
  };

  return {
    ...GBIF_CONFIG,
    ...envOverrides[env]
  };
};

export default GBIF_CONFIG;