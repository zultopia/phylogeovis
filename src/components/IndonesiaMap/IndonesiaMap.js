// src/components/IndonesiaMap/IndonesiaMap.js
// Interactive map of Indonesia showing orangutan distribution and conservation data

import React, { useState, useEffect, useRef } from 'react';

const IndonesiaMap = ({ selectedSpecies = 'all', showHabitats = true, showThreats = false }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const mapRef = useRef(null);

  // Orangutan location data with coordinates and conservation info
  const orangutanLocations = [
    {
      id: 'leuser',
      name: 'Leuser National Park',
      province: 'Aceh & North Sumatra',
      coordinates: { x: 420, y: 180 }, // SVG coordinates
      species: ['Pongo abelii'],
      population: 14000,
      area: 1094692, // hectares
      threatLevel: 'high',
      habitatQuality: 0.85,
      connectivity: 0.7,
      protectionStatus: 'World Heritage Site',
      lastSurvey: '2024',
      trends: 'declining',
      majorThreats: ['Deforestation', 'Palm oil expansion', 'Human encroachment']
    },
    {
      id: 'batang-toru',
      name: 'Batang Toru',
      province: 'North Sumatra',
      coordinates: { x: 430, y: 200 },
      species: ['Pongo tapanuliensis'],
      population: 800,
      area: 142000,
      threatLevel: 'critical',
      habitatQuality: 0.75,
      connectivity: 0.4,
      protectionStatus: 'Protected Forest',
      lastSurvey: '2024',
      trends: 'declining',
      majorThreats: ['Hydroelectric project', 'Logging', 'Road construction']
    },
    {
      id: 'kinabatangan',
      name: 'Kinabatangan Wildlife Sanctuary',
      province: 'Sabah',
      coordinates: { x: 680, y: 280 },
      species: ['Pongo pygmaeus'],
      population: 1500,
      area: 26103,
      threatLevel: 'high',
      habitatQuality: 0.60,
      connectivity: 0.3,
      protectionStatus: 'Wildlife Sanctuary',
      lastSurvey: '2024',
      trends: 'stable',
      majorThreats: ['Fragmentation', 'Palm oil', 'Tourism pressure']
    },
    {
      id: 'tanjung-puting',
      name: 'Tanjung Puting National Park',
      province: 'Central Kalimantan',
      coordinates: { x: 620, y: 380 },
      species: ['Pongo pygmaeus'],
      population: 6000,
      area: 415040,
      threatLevel: 'moderate',
      habitatQuality: 0.78,
      connectivity: 0.6,
      protectionStatus: 'National Park',
      lastSurvey: '2024',
      trends: 'stable',
      majorThreats: ['Illegal logging', 'Mining', 'Fire']
    },
    {
      id: 'sebangau',
      name: 'Sebangau National Park',
      province: 'Central Kalimantan',
      coordinates: { x: 640, y: 390 },
      species: ['Pongo pygmaeus'],
      population: 2500,
      area: 568700,
      threatLevel: 'moderate',
      habitatQuality: 0.72,
      connectivity: 0.5,
      protectionStatus: 'National Park',
      lastSurvey: '2023',
      trends: 'declining',
      majorThreats: ['Peat fires', 'Drainage', 'Encroachment']
    },
    {
      id: 'kutai',
      name: 'Kutai National Park',
      province: 'East Kalimantan',
      coordinates: { x: 720, y: 320 },
      species: ['Pongo pygmaeus'],
      population: 2000,
      area: 198629,
      threatLevel: 'high',
      habitatQuality: 0.65,
      connectivity: 0.4,
      protectionStatus: 'National Park',
      lastSurvey: '2023',
      trends: 'declining',
      majorThreats: ['Coal mining', 'Logging', 'Infrastructure']
    }
  ];

  const getSpeciesColor = (species) => {
    if (species.includes('Pongo abelii')) return '#10B981'; // Green for Sumatran
    if (species.includes('Pongo tapanuliensis')) return '#F59E0B'; // Amber for Tapanuli
    if (species.includes('Pongo pygmaeus')) return '#3B82F6'; // Blue for Bornean
    return '#6B7280'; // Gray default
  };

  const getThreatColor = (level) => {
    switch(level) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'moderate': return '#EAB308';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const getMarkerSize = (population) => {
    if (population > 10000) return 12;
    if (population > 5000) return 10;
    if (population > 2000) return 8;
    if (population > 1000) return 6;
    return 4;
  };

  const filteredLocations = orangutanLocations.filter(location => {
    if (selectedSpecies === 'all') return true;
    return location.species.includes(selectedSpecies);
  });

  const handleLocationClick = (location) => {
    setSelectedLocation(selectedLocation?.id === location.id ? null : location);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-50 to-green-50 rounded-lg overflow-hidden relative">
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Orangutan Distribution in Indonesia</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Sumatran</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
            <span>Tapanuli</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Bornean</span>
          </div>
        </div>
      </div>

      {/* Map Statistics */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Population:</span>
            <span className="font-semibold">~104,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protected Areas:</span>
            <span className="font-semibold">6 Major Sites</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Conservation Status:</span>
            <span className="font-semibold text-red-600">Critical</span>
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <svg 
        ref={mapRef}
        viewBox="0 0 900 500" 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        {/* Indonesia Outline - Simplified */}
        <g stroke="#10B981" strokeWidth="2" fill="rgba(16, 185, 129, 0.1)">
          {/* Sumatra */}
          <path d="M 300 150 Q 350 120 400 140 Q 450 160 470 200 Q 480 250 460 300 Q 430 350 400 380 Q 370 400 340 390 Q 310 370 290 340 Q 270 300 280 250 Q 290 200 300 150 Z" />
          
          {/* Java */}
          <path d="M 480 400 Q 520 390 560 395 Q 600 400 640 410 Q 680 420 720 425 Q 760 430 800 435 Q 780 450 740 455 Q 700 460 660 455 Q 620 450 580 445 Q 540 440 500 430 Q 480 420 480 400 Z" />
          
          {/* Kalimantan/Borneo */}
          <path d="M 580 250 Q 620 230 660 240 Q 700 250 740 270 Q 780 290 800 330 Q 810 370 790 400 Q 770 420 740 430 Q 700 440 660 430 Q 620 420 590 400 Q 560 380 550 350 Q 540 320 550 290 Q 560 260 580 250 Z" />
          
          {/* Sulawesi */}
          <path d="M 750 280 Q 780 270 800 290 Q 820 310 810 340 Q 800 370 780 380 Q 760 390 740 380 Q 720 370 710 350 Q 700 330 710 310 Q 720 290 740 285 Q 750 280 750 280 Z" />
          
          {/* Papua (partial) */}
          <path d="M 820 320 Q 850 310 880 325 Q 890 345 880 365 Q 870 385 850 390 Q 830 395 810 385 Q 800 375 795 355 Q 790 335 800 325 Q 810 315 820 320 Z" />
        </g>

        {/* Habitat Areas */}
        {showHabitats && filteredLocations.map(location => (
          <circle
            key={`habitat-${location.id}`}
            cx={location.coordinates.x}
            cy={location.coordinates.y}
            r={Math.sqrt(location.area / 1000)}
            fill={getSpeciesColor(location.species)}
            fillOpacity="0.2"
            stroke={getSpeciesColor(location.species)}
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Population Markers */}
        {filteredLocations.map(location => (
          <g key={location.id}>
            {/* Marker */}
            <circle
              cx={location.coordinates.x}
              cy={location.coordinates.y}
              r={getMarkerSize(location.population)}
              fill={showThreats ? getThreatColor(location.threatLevel) : getSpeciesColor(location.species)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 hover:scale-110"
              onClick={() => handleLocationClick(location)}
              onMouseEnter={() => setHoveredLocation(location)}
              onMouseLeave={() => setHoveredLocation(null)}
            />
            
            {/* Population number */}
            <text
              x={location.coordinates.x}
              y={location.coordinates.y + getMarkerSize(location.population) + 15}
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-700"
            >
              {location.population.toLocaleString()}
            </text>
          </g>
        ))}

        {/* Connectivity Lines */}
        <g stroke="#6B7280" strokeWidth="1" strokeDasharray="3,3" opacity="0.5">
          <line x1="420" y1="180" x2="430" y2="200" /> {/* Leuser to Batang Toru */}
          <line x1="680" y1="280" x2="620" y2="380" /> {/* Kinabatangan to Tanjung Puting */}
          <line x1="620" y1="380" x2="640" y2="390" /> {/* Tanjung Puting to Sebangau */}
          <line x1="640" y1="390" x2="720" y2="320" /> {/* Sebangau to Kutai */}
        </g>

        {/* Island Labels */}
        <g className="text-sm font-semibold fill-gray-600">
          <text x="380" y="280" textAnchor="middle">SUMATRA</text>
          <text x="650" y="200" textAnchor="middle">KALIMANTAN</text>
          <text x="640" y="450" textAnchor="middle">JAVA</text>
          <text x="760" y="350" textAnchor="middle">SULAWESI</text>
          <text x="850" y="360" textAnchor="middle">PAPUA</text>
        </g>
      </svg>

      {/* Hover Tooltip */}
      {hoveredLocation && (
        <div className="absolute z-20 bg-gray-900 text-white p-3 rounded-lg shadow-xl pointer-events-none text-sm max-w-xs"
             style={{
               left: hoveredLocation.coordinates.x + 20,
               top: hoveredLocation.coordinates.y - 10
             }}>
          <div className="font-semibold">{hoveredLocation.name}</div>
          <div className="text-gray-300">{hoveredLocation.province}</div>
          <div className="mt-1">
            <div>Population: <span className="font-medium">{hoveredLocation.population.toLocaleString()}</span></div>
            <div>Status: <span className={`font-medium ${
              hoveredLocation.threatLevel === 'critical' ? 'text-red-400' :
              hoveredLocation.threatLevel === 'high' ? 'text-orange-400' :
              hoveredLocation.threatLevel === 'moderate' ? 'text-yellow-400' :
              'text-green-400'
            }`}>{hoveredLocation.threatLevel}</span></div>
          </div>
        </div>
      )}

      {/* Detailed Info Panel */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white rounded-lg shadow-xl p-4 max-h-48 overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-bold text-lg text-gray-900">{selectedLocation.name}</h4>
              <p className="text-gray-600">{selectedLocation.province}</p>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Population</div>
              <div className="text-lg font-bold text-blue-600">{selectedLocation.population.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Area (ha)</div>
              <div className="text-lg font-bold text-green-600">{selectedLocation.area.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Habitat Quality</div>
              <div className="text-lg font-bold text-purple-600">{(selectedLocation.habitatQuality * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Threat Level</div>
              <div className={`text-lg font-bold ${
                selectedLocation.threatLevel === 'critical' ? 'text-red-600' :
                selectedLocation.threatLevel === 'high' ? 'text-orange-600' :
                selectedLocation.threatLevel === 'moderate' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {selectedLocation.threatLevel.charAt(0).toUpperCase() + selectedLocation.threatLevel.slice(1)}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="font-medium text-gray-700 mb-2">Major Threats</div>
            <div className="flex flex-wrap gap-2">
              {selectedLocation.majorThreats.map((threat, index) => (
                <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {threat}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
            <span>Protection: {selectedLocation.protectionStatus}</span>
            <span>Last Survey: {selectedLocation.lastSurvey}</span>
            <span className={`font-medium ${
              selectedLocation.trends === 'declining' ? 'text-red-600' :
              selectedLocation.trends === 'stable' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              Trend: {selectedLocation.trends}
            </span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setSelectedLocation(null)}
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset View
          </button>
          <div className="text-xs text-gray-600 text-center">
            Click markers for details
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndonesiaMap;