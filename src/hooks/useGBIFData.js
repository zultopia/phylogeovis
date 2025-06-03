// src/hooks/useGBIFData.js
// Custom React hook for managing GBIF data integration

import { useState, useEffect, useCallback, useRef } from 'react';
import dataService from '../services/dataService';
import { generateQualityReport } from '../utils/dataValidation';

/**
 * Custom hook for GBIF data management
 * Provides comprehensive state management for GBIF data integration
 */
export const useGBIFData = (options = {}) => {
  const {
    autoRefresh = true,           // Auto-refresh on mount
    refreshInterval = null,       // Auto-refresh interval (ms)
    enableQualityReport = true,   // Generate quality reports
    fallbackEnabled = true,       // Enable fallback to mock data
    minQuality = 'fair',          // Minimum data quality threshold
    onError = null,               // Error callback
    onSuccess = null,             // Success callback
    onStatusChange = null         // Status change callback
  } = options;

  // Core state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error, fallback
  
  // GBIF-specific state
  const [gbifStatus, setGbifStatus] = useState('checking'); // checking, connected, fallback, error
  const [dataSource, setDataSource] = useState('unknown');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    recordCount: 0,
    qualityScore: 0,
    cacheHit: false
  });

  // Refs for cleanup and intervals
  const refreshIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Update status and trigger callbacks
   */
  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus);
    setGbifStatus(newStatus === 'fallback' ? 'fallback' : 
                 newStatus === 'error' ? 'error' : 
                 newStatus === 'success' ? 'connected' : 'checking');
    
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }, [onStatusChange]);

  /**
   * Load conservation data with GBIF integration
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    updateStatus('loading');
    
    const startTime = Date.now();

    try {
      // Check if we need to refresh GBIF data
      if (forceRefresh || !dataService.isGBIFIntegrated()) {
        const gbifSuccess = await dataService.refreshFromGBIF();
        if (!gbifSuccess && !fallbackEnabled) {
          throw new Error('GBIF data unavailable and fallback disabled');
        }
      }

      // Get conservation analysis
      const conservationData = await dataService.getConservationAnalysis();
      
      if (controller.signal.aborted) return;

      // Generate quality report if enabled
      let qualityData = null;
      if (enableQualityReport && conservationData.genomicData) {
        const allOccurrences = Object.values(conservationData.genomicData).flat();
        qualityData = generateQualityReport(allOccurrences);
      }

      // Calculate metrics
      const loadTime = Date.now() - startTime;
      const recordCount = conservationData.totalOccurrences || 0;
      const qualityScore = qualityData?.summary?.overallQuality === 'excellent' ? 100 :
                          qualityData?.summary?.overallQuality === 'good' ? 80 :
                          qualityData?.summary?.overallQuality === 'fair' ? 60 : 40;

      // Update state
      setData(conservationData);
      setDataSource(conservationData.dataSource || 'unknown');
      setLastUpdated(conservationData.lastUpdated);
      setQualityReport(qualityData);
      setMetrics({
        loadTime,
        recordCount,
        qualityScore,
        cacheHit: loadTime < 100 // Heuristic for cache hit
      });

      updateStatus(conservationData.gbifIntegrated ? 'success' : 'fallback');
      
      if (onSuccess) {
        onSuccess(conservationData);
      }

    } catch (err) {
      if (controller.signal.aborted) return;
      
      console.error('Error loading GBIF data:', err);
      setError(err.message);
      updateStatus('error');
      
      if (onError) {
        onError(err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [forceRefresh, fallbackEnabled, enableQualityReport, onSuccess, onError, updateStatus]);

  /**
   * Refresh data from GBIF
   */
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  /**
   * Get specific species data
   */
  const getSpeciesData = useCallback(async (speciesName) => {
    if (!data?.genomicData) return null;
    return data.genomicData[speciesName] || [];
  }, [data]);

  /**
   * Get conservation priority for a location
   */
  const getLocationPriority = useCallback((locationName) => {
    if (!data?.spatialAnalysis?.priorityAreas) return null;
    return data.spatialAnalysis.priorityAreas.find(
      area => area.name === locationName || area.location === locationName
    );
  }, [data]);

  /**
   * Filter data by quality
   */
  const getQualityFilteredData = useCallback((speciesName, qualityLevel = minQuality) => {
    if (!data?.genomicData?.[speciesName]) return [];
    
    const occurrences = data.genomicData[speciesName];
    // Simple quality filtering - you can enhance this with the validation utilities
    return occurrences.filter(occ => {
      if (!occ.geneticDiversity) return false;
      
      switch (qualityLevel) {
        case 'excellent': return occ.geneticDiversity > 0.8;
        case 'good': return occ.geneticDiversity > 0.6;
        case 'fair': return occ.geneticDiversity > 0.4;
        case 'poor': return occ.geneticDiversity > 0.2;
        default: return true;
      }
    });
  }, [data, minQuality]);

  /**
   * Get data freshness info
   */
  const getDataFreshness = useCallback(() => {
    if (!lastUpdated) return null;
    
    const now = new Date();
    const updated = new Date(lastUpdated);
    const ageMs = now - updated;
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = Math.floor(ageHours / 24);
    
    return {
      lastUpdated,
      ageMs,
      ageHours,
      ageDays,
      isStale: ageHours > 24,
      isFresh: ageHours < 6,
      humanReadable: ageDays > 0 ? `${ageDays} day(s) ago` : 
                    ageHours > 0 ? `${ageHours} hour(s) ago` : 
                    'Just updated'
    };
  }, [lastUpdated]);

  /**
   * Setup auto-refresh interval
   */
  const setupAutoRefresh = useCallback(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (!loading) {
          loadData(false); // Don't force refresh on interval
        }
      }, refreshInterval);
    }
  }, [refreshInterval, loading, loadData]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Initialize data loading
  useEffect(() => {
    if (autoRefresh) {
      loadData(false);
    }
    
    // Setup auto-refresh interval
    setupAutoRefresh();
    
    // Cleanup on unmount
    return cleanup;
  }, [autoRefresh, setupAutoRefresh, cleanup, loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Return hook interface
  return {
    // Core data
    data,
    loading,
    error,
    status,
    
    // GBIF-specific
    gbifStatus,
    dataSource,
    lastUpdated,
    qualityReport,
    metrics,
    
    // Actions
    refresh,
    loadData,
    
    // Data accessors
    getSpeciesData,
    getLocationPriority,
    getQualityFilteredData,
    getDataFreshness,
    
    // State queries
    isLoading: loading,
    isError: status === 'error',
    isSuccess: status === 'success',
    isFallback: status === 'fallback',
    isGBIFConnected: gbifStatus === 'connected',
    hasData: data !== null,
    
    // Computed values
    speciesCount: data ? Object.keys(data.genomicData || {}).length : 0,
    locationCount: data?.spatialAnalysis?.priorityAreas?.length || 0,
    criticalAreas: data?.priorityRanking?.filter(area => area.priority === 'critical').length || 0,
    
    // Utils
    cleanup
  };
};

/**
 * Hook for specific species data
 */
export const useSpeciesData = (speciesName, options = {}) => {
  const gbifData = useGBIFData(options);
  const [speciesData, setSpeciesData] = useState(null);
  
  useEffect(() => {
    if (gbifData.data?.genomicData?.[speciesName]) {
      setSpeciesData(gbifData.data.genomicData[speciesName]);
    } else {
      setSpeciesData(null);
    }
  }, [gbifData.data, speciesName]);
  
  return {
    ...gbifData,
    speciesData,
    occurrenceCount: speciesData?.length || 0,
    hasSpeciesData: speciesData !== null && speciesData.length > 0
  };
};

/**
 * Hook for conservation priority areas
 */
export const useConservationPriorities = (options = {}) => {
  const gbifData = useGBIFData(options);
  const [priorityAreas, setPriorityAreas] = useState([]);
  const [criticalAreas, setCriticalAreas] = useState([]);
  
  useEffect(() => {
    if (gbifData.data?.spatialAnalysis?.priorityAreas) {
      const areas = gbifData.data.spatialAnalysis.priorityAreas;
      setPriorityAreas(areas);
      setCriticalAreas(areas.filter(area => area.priority === 'critical'));
    }
  }, [gbifData.data]);
  
  return {
    ...gbifData,
    priorityAreas,
    criticalAreas,
    hasCriticalAreas: criticalAreas.length > 0,
    totalAreas: priorityAreas.length,
    criticalCount: criticalAreas.length
  };
};

/**
 * Hook for data quality monitoring
 */
export const useDataQuality = (options = {}) => {
  const gbifData = useGBIFData({ enableQualityReport: true, ...options });
  const [qualityMetrics, setQualityMetrics] = useState(null);
  
  useEffect(() => {
    if (gbifData.qualityReport) {
      const summary = gbifData.qualityReport.summary;
      setQualityMetrics({
        overallQuality: summary.overallQuality,
        validRecordsRatio: summary.validRecords / summary.totalRecords,
        qualityDistribution: summary.qualityDistribution,
        commonIssues: Object.keys(summary.commonErrors).slice(0, 3),
        recommendations: summary.recommendations.slice(0, 5),
        dataCompleteness: gbifData.qualityReport.qualityMetrics?.completeness,
        temporalCoverage: gbifData.qualityReport.temporalCoverage,
        spatialCoverage: gbifData.qualityReport.spatialCoverage
      });
    }
  }, [gbifData.qualityReport]);
  
  return {
    ...gbifData,
    qualityMetrics,
    hasQualityData: qualityMetrics !== null,
    isHighQuality: qualityMetrics?.overallQuality === 'excellent' || qualityMetrics?.overallQuality === 'good',
    needsImprovement: qualityMetrics?.validRecordsRatio < 0.8
  };
};

/**
 * Hook for caching and performance monitoring
 */
export const useGBIFPerformance = () => {
  const [performance, setPerformance] = useState({
    cacheHitRatio: 0,
    averageLoadTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
    lastError: null
  });
  
  useEffect(() => {
    // Mock performance data - replace with actual metrics from your services
    const updatePerformance = () => {
      setPerformance({
        cacheHitRatio: 0.75, // 75% cache hit rate
        averageLoadTime: 1500, // 1.5 seconds average
        apiResponseTime: 800, // 800ms API response
        errorRate: 0.05, // 5% error rate
        lastError: dataService.getLastError?.() || null
      });
    };
    
    updatePerformance();
    const interval = setInterval(updatePerformance, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return performance;
};

/**
 * Utility function to create a pre-configured hook for specific use cases
 */
export const createGBIFHook = (defaultOptions) => {
  return (customOptions = {}) => {
    return useGBIFData({ ...defaultOptions, ...customOptions });
  };
};

// Pre-configured hooks for common use cases
export const useRealtimeGBIF = createGBIFHook({
  autoRefresh: true,
  refreshInterval: 300000, // 5 minutes
  enableQualityReport: true,
  fallbackEnabled: false
});

export const useCachedGBIF = createGBIFHook({
  autoRefresh: false,
  refreshInterval: null,
  enableQualityReport: false,
  fallbackEnabled: true
});

export const useHighQualityGBIF = createGBIFHook({
  autoRefresh: true,
  enableQualityReport: true,
  minQuality: 'good',
  fallbackEnabled: false
});

export default useGBIFData;