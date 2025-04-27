// This file will handle data fetching and processing

// Function to fetch GeoJSON data
export const fetchGeoData = async () => {
    try {
      const response = await fetch('/data/orangutan_distribution.geojson');
      return await response.json();
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      return null;
    }
  };
  
  // Function to fetch phylogenetic data
  export const fetchPhylogeneticData = async () => {
    try {
      const response = await fetch('/data/phylogenetic_data.json');
      return await response.json();
    } catch (error) {
      console.error('Error fetching phylogenetic data:', error);
      return null;
    }
  };
  
  // Function to fetch diversity metrics
  export const fetchDiversityMetrics = async () => {
    try {
      const response = await fetch('/data/diversity_metrics.json');
      return await response.json();
    } catch (error) {
      console.error('Error fetching diversity metrics:', error);
      return null;
    }
  };