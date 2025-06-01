// src/components/IndonesiaMap/IndonesiaMap.js
// Interactive map of Indonesia using Leaflet showing orangutan distribution and conservation data

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IndonesiaMap = ({ selectedSpecies = 'all', showHabitats = true, showThreats = false }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showStatistics, setShowStatistics] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [mapStyle, setMapStyle] = useState('street'); // 'street' or 'satellite'
  const mapRef = useRef(null);

  // Orangutan location data with real coordinates (lat, lng)
  const orangutanLocations = [
    {
      id: 'leuser',
      name: 'Leuser National Park',
      province: 'Aceh & North Sumatra',
      coordinates: [3.7333, 97.4167],
      species: ['Pongo abelii'],
      population: 14000,
      area: 1094692,
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
      coordinates: [1.4167, 99.2167],
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
      province: 'Sabah, Malaysia',
      coordinates: [5.4167, 118.0667],
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
      coordinates: [-2.7333, 111.9167],
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
      coordinates: [-2.3333, 113.7667],
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
      coordinates: [0.3167, 117.4167],
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

  // Custom marker icons for different species
  const createCustomIcon = (species, threatLevel = null, population = 0) => {
    let color;
    if (showThreats) {
      color = getThreatColor(threatLevel);
    } else {
      color = getSpeciesColor(species);
    }

    const size = getMarkerSize(population);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size/3)}px;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${Math.round(population/1000)}K</div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const getSpeciesColor = (species) => {
    if (species.includes('Pongo abelii')) return '#10B981';
    if (species.includes('Pongo tapanuliensis')) return '#F59E0B';
    if (species.includes('Pongo pygmaeus')) return '#3B82F6';
    return '#6B7280';
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
    if (population > 10000) return 50;
    if (population > 5000) return 40;
    if (population > 2000) return 32;
    if (population > 1000) return 26;
    return 20;
  };

  const getHabitatRadius = (area) => {
    return Math.sqrt(area) * 8;
  };

  const filteredLocations = orangutanLocations.filter(location => {
    if (selectedSpecies === 'all') return true;
    return location.species.includes(selectedSpecies);
  });

  const connectivityLines = [
    [[3.7333, 97.4167], [1.4167, 99.2167]],
    [[5.4167, 118.0667], [-2.7333, 111.9167]],
    [[-2.7333, 111.9167], [-2.3333, 113.7667]],
    [[-2.3333, 113.7667], [0.3167, 117.4167]]
  ];

  const indonesiaBounds = [[-11.0, 95.0], [6.0, 141.0]];

  // Statistics calculation
  const totalPopulation = filteredLocations.reduce((sum, loc) => sum + loc.population, 0);
  const criticalSites = filteredLocations.filter(loc => loc.threatLevel === 'critical').length;
  const highThreatSites = filteredLocations.filter(loc => loc.threatLevel === 'high').length;

  const resetMapView = () => {
    setSelectedLocation(null);
    if (mapRef.current) {
      mapRef.current.setView([-0.7893, 113.9213], 5);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-100 rounded-lg overflow-hidden">
      {/* Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start gap-4">
        {/* Left Side - Species Filter & Statistics Toggle */}
        <div className="flex flex-col gap-2">
          {/* Species Filter */}
          {selectedSpecies !== 'all' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedSpecies === 'Pongo abelii' ? 'bg-green-500' :
                  selectedSpecies === 'Pongo tapanuliensis' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {selectedSpecies === 'Pongo abelii' ? 'Sumatran Orangutan' :
                     selectedSpecies === 'Pongo tapanuliensis' ? 'Tapanuli Orangutan' :
                     selectedSpecies === 'Pongo pygmaeus' ? 'Bornean Orangutan' : selectedSpecies}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {filteredLocations.length} location(s) • {totalPopulation.toLocaleString()} individuals
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Panel */}
          {showStatistics && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Conservation Overview</h3>
                <button
                  onClick={() => setShowStatistics(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalPopulation.toLocaleString()}</div>
                  <div className="text-gray-600">Total Population</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{filteredLocations.length}</div>
                  <div className="text-gray-600">Protected Sites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{criticalSites}</div>
                  <div className="text-gray-600">Critical Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{highThreatSites}</div>
                  <div className="text-gray-600">High Threat</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Conservation Status:</span>
                  <span className="font-bold text-red-600 text-sm">Critically Endangered</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Legend & Controls */}
        <div className="flex flex-col gap-2">
          {/* Map Controls */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={resetMapView}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Reset View
                </button>
                <button
                  onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  {mapStyle === 'street' ? 'Satellite' : 'Street'}
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                >
                  {showStatistics ? 'Hide Stats' : 'Show Stats'}
                </button>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="flex-1 px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                >
                  {showLegend ? 'Hide Legend' : 'Show Legend'}
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">Species Legend</h4>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                  <span>Sumatran (P. abelii)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow"></div>
                  <span>Tapanuli (P. tapanuliensis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                  <span>Bornean (P. pygmaeus)</span>
                </div>
                
                {showThreats && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Threat Levels:</div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Critical</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Moderate</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={[-0.7893, 113.9213]}
        zoom={5}
        minZoom={4}
        maxZoom={15}
        style={{ height: '100%', width: '100%' }}
        maxBounds={indonesiaBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
      >
        {/* Base Map Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={mapStyle === 'satellite' ? 0.3 : 1}
        />

        {/* Satellite Layer */}
        {mapStyle === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={0.8}
          />
        )}

        {/* Habitat Areas */}
        {showHabitats && filteredLocations.map(location => (
          <Circle
            key={`habitat-${location.id}`}
            center={location.coordinates}
            radius={getHabitatRadius(location.area)}
            pathOptions={{
              color: getSpeciesColor(location.species),
              fillColor: getSpeciesColor(location.species),
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '8, 4'
            }}
          />
        ))}

        {/* Connectivity Lines */}
        {connectivityLines.map((line, index) => (
          <Polyline
            key={`connectivity-${index}`}
            positions={line}
            pathOptions={{
              color: '#6B7280',
              weight: 2,
              opacity: 0.6,
              dashArray: '10, 5'
            }}
          />
        ))}

        {/* Location Markers */}
        {filteredLocations.map(location => (
          <Marker
            key={location.id}
            position={location.coordinates}
            icon={createCustomIcon(location.species, location.threatLevel, location.population)}
            eventHandlers={{
              click: () => setSelectedLocation(location)
            }}
          >
            <Popup closeButton={false} autoPan={false} className="custom-popup">
              <div className="p-2">
                <div className="font-bold text-lg mb-1">{location.name}</div>
                <div className="text-gray-600 text-sm mb-2">{location.province}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium">Population:</div>
                    <div className="text-blue-600 font-bold">{location.population.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status:</div>
                    <div className={`font-bold ${
                      location.threatLevel === 'critical' ? 'text-red-600' :
                      location.threatLevel === 'high' ? 'text-orange-600' :
                      location.threatLevel === 'moderate' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {location.threatLevel.charAt(0).toUpperCase() + location.threatLevel.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Detailed Info Panel - Bottom */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    selectedLocation.species.includes('Pongo abelii') ? 'bg-green-500' :
                    selectedLocation.species.includes('Pongo tapanuliensis') ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`}>
                    {Math.round(selectedLocation.population/1000)}K
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">{selectedLocation.name}</h4>
                    <p className="text-gray-600">{selectedLocation.province}</p>
                    <p className="text-sm text-gray-500">{selectedLocation.protectionStatus}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedLocation.population.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Population</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedLocation.area.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Area (ha)</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{(selectedLocation.habitatQuality * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Habitat Quality</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    selectedLocation.threatLevel === 'critical' ? 'text-red-600' :
                    selectedLocation.threatLevel === 'high' ? 'text-orange-600' :
                    selectedLocation.threatLevel === 'moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedLocation.threatLevel.charAt(0).toUpperCase() + selectedLocation.threatLevel.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">Threat Level</div>
                </div>
              </div>
              
              {/* Threats */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-900 mb-2">Major Threats</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation.majorThreats.map((threat, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-200">
                      {threat}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Footer Info */}
              <div className="flex flex-wrap justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-200">
                <span>Last Survey: <span className="font-medium">{selectedLocation.lastSurvey}</span></span>
                <span className={`font-medium ${
                  selectedLocation.trends === 'declining' ? 'text-red-600' :
                  selectedLocation.trends === 'stable' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  Trend: {selectedLocation.trends}
                </span>
                <span>Connectivity: <span className="font-medium">{(selectedLocation.connectivity * 100).toFixed(0)}%</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[1000]">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
            className="block w-10 h-10 bg-white hover:bg-gray-100 border-b border-gray-200 items-center justify-center text-gray-700 font-bold text-lg transition-colors"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
            className="block w-10 h-10 bg-white hover:bg-gray-100 items-center justify-center text-gray-700 font-bold text-lg transition-colors"
          >
            −
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs text-gray-600 max-w-40">
        <div className="text-center">
          <div className="font-medium mb-1">Navigation</div>
          <div>Click markers for details</div>
          <div>Drag to pan • Scroll to zoom</div>
        </div>
      </div>
    </div>
  );
};

export default IndonesiaMap;