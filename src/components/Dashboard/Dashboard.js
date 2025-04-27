import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import abeliiImage from '../../assets/images/abelii.svg';
import pygmaeusImage from '../../assets/images/pygmaeus.jpg';

// Sample population trend data
const populationTrendData = [
  { year: '2015', count: 14500 },
  { year: '2016', count: 14100 },
  { year: '2017', count: 13800 },
  { year: '2018', count: 13400 },
  { year: '2019', count: 13000 },
  { year: '2020', count: 12600 },
  { year: '2021', count: 12200 },
  { year: '2022', count: 11900 },
  { year: '2023', count: 11600 },
  { year: '2024', count: 11400 },
];

// Sample orangutan species data with updated image sources
const orangutanSpecies = [
  {
    id: 'pongo-abelii',
    name: 'Pongo Abelii',
    commonName: 'Sumatran Orangutan',
    population: 14000,
    conservationStatus: 'Critically Endangered',
    estimatedWildPopulation: 13800,
    geneticDiversityLevel: 0.82,
    highestDiversityRegion: 'North Sumatra',
    image: abeliiImage, // Using imported image
    coordinates: { x: 100, y: 120 }
  },
  {
    id: 'pongo-pygmaeus',
    name: 'Pongo Pygmaeus',
    commonName: 'Bornean Orangutan',
    population: 104700,
    conservationStatus: 'Critically Endangered',
    estimatedWildPopulation: 104000,
    geneticDiversityLevel: 0.76,
    highestDiversityRegion: 'Central Kalimantan',
    image: pygmaeusImage, // Using imported image
    coordinates: { x: 280, y: 200 }
  },
  {
    id: 'pongo-tapanuliensis',
    name: 'Pongo Tapanuliensis',
    commonName: 'Tapanuli Orangutan',
    population: 800,
    conservationStatus: 'Critically Endangered',
    estimatedWildPopulation: 760,
    geneticDiversityLevel: 0.58,
    highestDiversityRegion: 'Batang Toru Forest',
    image: '/api/placeholder/270/330', // No specific image provided for this species
    coordinates: { x: 70, y: 150 }
  }
];

// SVG Map regions with conservation data
const mapRegions = [
  {
    id: 'sumatra',
    name: 'Sumatra',
    species: 'Pongo abelii',
    geneticDiversity: 'High',
    conservationPriority: 'Critical',
    path: 'M60,80 L120,80 L140,200 L40,240 L20,130 Z',
    center: { x: 80, y: 160 },
    color: '#8B0000'  // Critical - dark red
  },
  {
    id: 'borneo',
    name: 'Borneo',
    species: 'Pongo pygmaeus',
    geneticDiversity: 'Medium',
    conservationPriority: 'High',
    path: 'M200,140 L300,120 L340,220 L280,280 L180,260 Z',
    center: { x: 260, y: 200 },
    color: '#FFA500'  // High - orange
  },
  {
    id: 'tapanuli',
    name: 'Tapanuli',
    species: 'Pongo tapanuliensis',
    geneticDiversity: 'Low',
    conservationPriority: 'Extreme',
    path: 'M90,140 L110,140 L110,160 L90,160 Z',
    center: { x: 100, y: 150 },
    color: '#FF0000'  // Extreme - red
  }
];

// Indonesia outline for map context
const indonesiaOutline = 'M10,100 L40,80 L100,60 L180,80 L220,100 L280,110 L340,120 L380,150 L400,200 L380,250 L340,280 L280,300 L220,290 L180,280 L100,260 L60,240 L30,200 L20,150 Z';

const Dashboard = () => {
  const [selectedSpecies, setSelectedSpecies] = useState(orangutanSpecies[0]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    geneticDiversity: true,
    conservationPriority: true,
    habitatCoverage: false
  });
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleMapLayer = (layer) => {
    setMapLayers({
      ...mapLayers,
      [layer]: !mapLayers[layer]
    });
  };

  const handleRegionHover = (region, event) => {
    // Skip tooltip on mobile as it might interfere with touch events
    if (isMobile) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setTooltip({
      visible: true,
      content: `
        ${region.name}
        Species: ${region.species}
        Genetic Diversity: ${region.geneticDiversity}
        Conservation Priority: ${region.conservationPriority}
      `,
      x: x,
      y: y
    });
  };

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
    const speciesId = region.species.toLowerCase().replace(' ', '-');
    const species = orangutanSpecies.find(s => s.id === speciesId);
    if (species) {
      setSelectedSpecies(species);
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with KPIs */}
      <div className="bg-green-800 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-2">PhyloGeoVis Dashboard</h1>
          <p className="text-xs md:text-sm">Computational Phylogenomics and Geospatial Visualization for Orangutan Conservation</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-3 md:mt-4">
            <div className="bg-green-700 p-2 md:p-3 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold">Total Population</h3>
              <p className="text-xl md:text-3xl font-bold">{orangutanSpecies.reduce((acc, species) => acc + species.population, 0).toLocaleString()}</p>
              <p className="text-xs opacity-80">Across all species</p>
            </div>
            <div className="bg-green-700 p-2 md:p-3 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold">Species Count</h3>
              <p className="text-xl md:text-3xl font-bold">{orangutanSpecies.length}</p>
              <p className="text-xs opacity-80">All critically endangered</p>
            </div>
            <div className="bg-green-700 p-2 md:p-3 rounded-lg sm:col-span-2 md:col-span-1">
              <h3 className="text-base md:text-lg font-semibold">Avg. Genetic Diversity</h3>
              <p className="text-xl md:text-3xl font-bold">{(orangutanSpecies.reduce((acc, species) => acc + species.geneticDiversityLevel, 0) / orangutanSpecies.length).toFixed(2)}</p>
              <p className="text-xs opacity-80">Index (0-1 scale)</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-grow p-2 md:p-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row h-full gap-4">
          {/* Map section */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-3 md:p-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Geographic Distribution</h2>
              <div className="flex flex-wrap gap-1 md:gap-2">
                <button 
                  className={`px-2 py-1 text-xs rounded ${mapLayers.geneticDiversity ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => toggleMapLayer('geneticDiversity')}
                >
                  Genetic Diversity
                </button>
                <button 
                  className={`px-2 py-1 text-xs rounded ${mapLayers.conservationPriority ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => toggleMapLayer('conservationPriority')}
                >
                  Conservation Priority
                </button>
                <button 
                  className={`px-2 py-1 text-xs rounded ${mapLayers.habitatCoverage ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => toggleMapLayer('habitatCoverage')}
                >
                  Habitat Coverage
                </button>
              </div>
            </div>
            
            <div className="h-64 sm:h-80 md:h-96 bg-gray-100 rounded relative overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 450 350">
                {/* Indonesia outline */}
                <path d={indonesiaOutline} fill="#f0f0f0" stroke="#cccccc" strokeWidth="1" />
                
                {/* Map regions */}
                {mapRegions.map(region => (
                  <path 
                    key={region.id}
                    d={region.path}
                    fill={region.color}
                    stroke="white"
                    strokeWidth="1"
                    opacity={0.7}
                    onMouseMove={(e) => handleRegionHover(region, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleRegionClick(region)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
                
                {/* Place names */}
                {mapRegions.map(region => (
                  <text 
                    key={`text-${region.id}`}
                    x={region.center.x} 
                    y={region.center.y}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {region.name}
                  </text>
                ))}
                
                {/* Map Legend - Hide on very small screens */}
                <g transform="translate(320, 20)" className={isMobile ? "hidden sm:block" : ""}>
                  <rect x="0" y="0" width="120" height="80" fill="rgba(255,255,255,0.8)" rx="4" />
                  <text x="60" y="15" textAnchor="middle" fontWeight="bold" fontSize="10">Conservation Priority</text>
                  
                  <rect x="10" y="25" width="15" height="10" fill="#FF0000" />
                  <text x="30" y="35" fontSize="9" textAnchor="start">Extreme</text>
                  
                  <rect x="10" y="40" width="15" height="10" fill="#8B0000" />
                  <text x="30" y="50" fontSize="9" textAnchor="start">Critical</text>
                  
                  <rect x="10" y="55" width="15" height="10" fill="#FFA500" />
                  <text x="30" y="65" fontSize="9" textAnchor="start">High</text>
                  
                  <rect x="10" y="70" width="15" height="10" fill="#90EE90" />
                  <text x="30" y="80" fontSize="9" textAnchor="start">Medium/Low</text>
                </g>
              </svg>
              
              {/* Tooltip - only visible on non-mobile */}
              {tooltip.visible && !isMobile && (
                <div 
                  className="absolute bg-white p-2 rounded shadow-md text-xs border border-gray-200 z-10 max-w-xs"
                  style={{ 
                    left: `${tooltip.x + 10}px`, 
                    top: `${tooltip.y + 10}px`,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {tooltip.content}
                </div>
              )}
            </div>
            
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
              Click on a region to view detailed species information. Darker colors indicate higher conservation priority areas.
            </div>
          </div>
          
          {/* Species Info and Charts */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3 md:gap-4 mt-4 lg:mt-0">
            {/* Species Info Card */}
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <img 
                  src={selectedSpecies.image} 
                  alt={selectedSpecies.commonName} 
                  className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border-4 border-green-600"
                />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">{selectedSpecies.name}</h2>
                  <p className="text-xs md:text-sm text-gray-600">{selectedSpecies.commonName}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 md:py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    {selectedSpecies.conservationStatus}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Population Size</p>
                  <p className="text-base md:text-lg font-semibold">{selectedSpecies.population.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Wild Population</p>
                  <p className="text-base md:text-lg font-semibold">{selectedSpecies.estimatedWildPopulation.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Genetic Diversity Index</p>
                  <p className="text-base md:text-lg font-semibold">{selectedSpecies.geneticDiversityLevel}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">High Diversity Region</p>
                  <p className="text-base md:text-lg font-semibold">{selectedSpecies.highestDiversityRegion}</p>
                </div>
              </div>
            </div>
            
            {/* Population Trend Chart */}
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 flex-grow">
              <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Population Trend (10 Years)</h2>
              <div className="h-40 md:h-48 lg:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={populationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#4C7D58" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 md:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="font-semibold">Overall Trend:</span> 21.4% Decline
                </div>
                <button className="text-xs md:text-sm text-green-600 hover:text-green-800">
                  View Full Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action footer */}
      <div className="bg-gray-100 p-3 md:p-4 border-t border-gray-200 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex gap-2 mb-3 md:mb-0">
            <button className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-1.5 md:py-2 text-sm rounded shadow">
              Download Report
            </button>
            <button className="bg-white border border-green-600 text-green-600 hover:bg-green-50 px-3 md:px-4 py-1.5 md:py-2 text-sm rounded shadow">
              Export Data
            </button>
          </div>
          <div className="text-xs md:text-sm text-gray-600">
            Last updated: April 27, 2025 • Data source: NCBI GenBank, GBIF
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;