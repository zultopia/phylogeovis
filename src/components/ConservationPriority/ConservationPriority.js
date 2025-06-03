// src/components/ConservationPriority/ConservationPriority.js
// Conservation priority analysis and visualization component with interactive color-coded map

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dataService from '../../services/dataService';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Priority locations data with coordinates and priority levels
const priorityLocations = [
  {
    id: 'leuser',
    name: 'Leuser National Park',
    coordinates: [3.7333, 97.4167],
    priority: 'critical',
    species: ['Pongo abelii'],
    populationSize: 14000,
    extinctionRisk: 0.85,
    geneticDiversity: 0.65,
    urgency: 0.89,
    threatLevel: 'high',
    area: 1094692,
    protectionStatus: 'World Heritage Site'
  },
  {
    id: 'batang-toru',
    name: 'Batang Toru Forest',
    coordinates: [1.4167, 99.2167],
    priority: 'critical',
    species: ['Pongo tapanuliensis'],
    populationSize: 800,
    extinctionRisk: 0.95,
    geneticDiversity: 0.45,
    urgency: 0.95,
    threatLevel: 'critical',
    area: 142000,
    protectionStatus: 'Protected Forest'
  },
  {
    id: 'kinabatangan',
    name: 'Kinabatangan Wildlife Sanctuary',
    coordinates: [5.4167, 118.0667],
    priority: 'high',
    species: ['Pongo pygmaeus'],
    populationSize: 1500,
    extinctionRisk: 0.65,
    geneticDiversity: 0.72,
    urgency: 0.72,
    threatLevel: 'high',
    area: 26103,
    protectionStatus: 'Wildlife Sanctuary'
  },
  {
    id: 'tanjung-puting',
    name: 'Tanjung Puting National Park',
    coordinates: [-2.7333, 111.9167],
    priority: 'medium',
    species: ['Pongo pygmaeus'],
    populationSize: 6000,
    extinctionRisk: 0.45,
    geneticDiversity: 0.78,
    urgency: 0.58,
    threatLevel: 'moderate',
    area: 415040,
    protectionStatus: 'National Park'
  },
  {
    id: 'sebangau',
    name: 'Sebangau National Park',
    coordinates: [-2.3333, 113.7667],
    priority: 'medium',
    species: ['Pongo pygmaeus'],
    populationSize: 2500,
    extinctionRisk: 0.55,
    geneticDiversity: 0.68,
    urgency: 0.62,
    threatLevel: 'moderate',
    area: 568700,
    protectionStatus: 'National Park'
  },
  {
    id: 'kutai',
    name: 'Kutai National Park',
    coordinates: [0.3167, 117.4167],
    priority: 'high',
    species: ['Pongo pygmaeus'],
    populationSize: 2000,
    extinctionRisk: 0.75,
    geneticDiversity: 0.62,
    urgency: 0.78,
    threatLevel: 'high',
    area: 198629,
    protectionStatus: 'National Park'
  }
];

// Priority Map Component with Color-Coded Zones
const PriorityMap = ({ selectedSpecies, showMetric, selectedLocation, onLocationSelect }) => {
  const mapRef = useRef(null);

  // Filter locations based on selected species
  const filteredLocations = selectedSpecies === 'all' 
    ? priorityLocations 
    : priorityLocations.filter(loc => loc.species.includes(selectedSpecies));

  // Custom marker icons based on priority
  const createPriorityIcon = (location) => {
    const priority = location.priority;
    let color, size;
    
    switch (priority) {
      case 'critical':
        color = '#EF4444';
        size = 30;
        break;
      case 'high':
        color = '#F97316';
        size = 25;
        break;
      case 'medium':
        color = '#EAB308';
        size = 22;
        break;
      case 'low':
        color = '#22C55E';
        size = 18;
        break;
      default:
        color = '#6B7280';
        size = 18;
    }

    return L.divIcon({
      className: 'custom-priority-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(8, size/4)}px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        z-index: 1000;
      " 
      onmouseover="this.style.transform='scale(1.15)'; this.style.zIndex='1001';" 
      onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1000';"
      onclick="this.style.transform='scale(0.95)';"
      >${Math.round(location.populationSize/1000)}K</div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  };

  // Get priority area radius for colored zones
  const getPriorityAreaRadius = (location) => {
    const baseRadius = Math.sqrt(location.area) * 0.8;
    return Math.max(baseRadius, 15000); // Minimum 15km radius for visibility
  };

  // Get priority zone color with opacity
  const getPriorityZoneColor = (location) => {
    const priority = location.priority;
    switch (priority) {
      case 'critical':
        return {
          color: '#DC2626',
          fillColor: '#EF4444',
          fillOpacity: 0.4,
          weight: 3
        };
      case 'high':
        return {
          color: '#EA580C',
          fillColor: '#F97316',
          fillOpacity: 0.35,
          weight: 2
        };
      case 'medium':
        return {
          color: '#CA8A04',
          fillColor: '#EAB308',
          fillOpacity: 0.3,
          weight: 2
        };
      case 'low':
        return {
          color: '#16A34A',
          fillColor: '#22C55E',
          fillOpacity: 0.25,
          weight: 2
        };
      default:
        return {
          color: '#4B5563',
          fillColor: '#6B7280',
          fillOpacity: 0.2,
          weight: 1
        };
    }
  };

  // Get circle radius based on metric (for secondary visualization)
  const getCircleRadius = (location) => {
    const baseRadius = Math.sqrt(location.area) * 0.3;
    switch (showMetric) {
      case 'population':
        return Math.sqrt(location.populationSize) * 30;
      case 'risk':
        return baseRadius * (location.extinctionRisk + 0.3);
      case 'diversity':
        return baseRadius * (location.geneticDiversity + 0.3);
      default:
        return baseRadius;
    }
  };

  // Get circle color based on metric
  const getCircleColor = (location) => {
    switch (showMetric) {
      case 'population':
        return location.populationSize > 5000 ? '#22C55E' : 
               location.populationSize > 2000 ? '#EAB308' : '#EF4444';
      case 'risk':
        return location.extinctionRisk > 0.7 ? '#EF4444' :
               location.extinctionRisk > 0.4 ? '#F97316' : '#22C55E';
      case 'diversity':
        return location.geneticDiversity > 0.7 ? '#22C55E' :
               location.geneticDiversity > 0.5 ? '#EAB308' : '#EF4444';
      default:
        return getPriorityZoneColor(location).fillColor;
    }
  };

  // Generate priority buffer zones around locations
  const generatePriorityZones = (location) => {
    const zoneStyle = getPriorityZoneColor(location);
    const mainRadius = getPriorityAreaRadius(location);
    
    // Create multiple concentric zones for visual effect
    const zones = [];
    
    // Main priority zone
    zones.push({
      center: location.coordinates,
      radius: mainRadius,
      style: {
        ...zoneStyle,
        dashArray: location.priority === 'critical' ? '10, 5' : null
      },
      zoneType: 'primary'
    });
    
    // Buffer zone (larger, more transparent)
    zones.push({
      center: location.coordinates,
      radius: mainRadius * 1.5,
      style: {
        color: zoneStyle.color,
        fillColor: zoneStyle.fillColor,
        fillOpacity: zoneStyle.fillOpacity * 0.3,
        weight: 1,
        dashArray: '5, 10'
      },
      zoneType: 'buffer'
    });
    
    return zones;
  };

  const indonesiaBounds = [[-11.0, 95.0], [6.0, 141.0]];

  return (
    <div className="relative h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        ref={mapRef}
        center={[-0.7893, 113.9213]}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        style={{ height: '100%', width: '100%' }}
        maxBounds={indonesiaBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
      >
        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Priority Zones - Color-coded areas showing conservation priority */}
        {filteredLocations.map(location => {
          const zones = generatePriorityZones(location);
          return zones.map((zone, zoneIndex) => (
            <Circle
              key={`priority-zone-${location.id}-${zoneIndex}`}
              center={zone.center}
              radius={zone.radius}
              pathOptions={zone.style}
              eventHandlers={{
                click: () => onLocationSelect(location),
                mouseover: (e) => {
                  e.target.setStyle({
                    ...zone.style,
                    fillOpacity: zone.style.fillOpacity * 1.5,
                    weight: zone.style.weight + 1
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle(zone.style);
                }
              }}
            />
          ));
        })}

        {/* Secondary metric circles (if different metric is selected) */}
        {showMetric !== 'priority' && filteredLocations.map(location => (
          <Circle
            key={`metric-circle-${location.id}`}
            center={location.coordinates}
            radius={getCircleRadius(location)}
            pathOptions={{
              color: getCircleColor(location),
              fillColor: getCircleColor(location),
              fillOpacity: 0.6,
              weight: 3,
              opacity: 1,
              dashArray: '8, 4'
            }}
          />
        ))}

        {/* Location markers */}
        {filteredLocations.map(location => (
          <Marker
            key={location.id}
            position={location.coordinates}
            icon={createPriorityIcon(location)}
            eventHandlers={{
              click: () => onLocationSelect(location)
            }}
          >
            <Popup 
              closeButton={false}
              className="priority-popup"
              maxWidth={320}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.protectionStatus}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    location.priority === 'critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                    location.priority === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                    location.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                    'bg-green-100 text-green-800 border border-green-300'
                  }`}>
                    {location.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Population</div>
                    <div className="font-bold text-blue-600 text-lg">{location.populationSize.toLocaleString()}</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Extinction Risk</div>
                    <div className={`font-bold text-lg ${
                      location.extinctionRisk > 0.7 ? 'text-red-600' :
                      location.extinctionRisk > 0.4 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {(location.extinctionRisk * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Genetic Diversity</div>
                    <div className="font-bold text-purple-600 text-lg">
                      {(location.geneticDiversity * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Urgency Score</div>
                    <div className="font-bold text-yellow-600 text-lg">
                      {(location.urgency * 100).toFixed(0)}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span><strong>Species:</strong> {location.species.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span><strong>Area:</strong> {(location.area/1000).toFixed(0)}K hectares</span>
                    <span><strong>Threat:</strong> <span className={`font-medium ${
                      location.threatLevel === 'critical' ? 'text-red-600' :
                      location.threatLevel === 'high' ? 'text-orange-600' :
                      location.threatLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                    }`}>{location.threatLevel}</span></span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          className="block w-10 h-10 bg-white hover:bg-gray-100 border-b border-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
          className="block w-10 h-10 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
        >
          −
        </button>
      </div>

      {/* Enhanced Legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Conservation Priority Zones</h4>
        <div className="space-y-2 text-xs mb-4">
          <div className="flex items-center">
            <div className="w-5 h-5 mr-3 rounded border-2 border-red-600 relative" 
                 style={{backgroundColor: '#EF4444', opacity: 0.4}}>
              <div className="absolute inset-0 border-2 border-red-600 rounded animate-pulse"></div>
            </div>
            <span className="text-gray-700"><strong>Critical Priority</strong> - Immediate action required</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-orange-400 opacity-40 border-2 border-orange-600 rounded mr-3"></div>
            <span className="text-gray-700"><strong>High Priority</strong> - Urgent conservation needed</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-yellow-400 opacity-30 border-2 border-yellow-600 rounded mr-3"></div>
            <span className="text-gray-700"><strong>Medium Priority</strong> - Regular monitoring</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-400 opacity-25 border-2 border-green-600 rounded mr-3"></div>
            <span className="text-gray-700"><strong>Low Priority</strong> - Stable population</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="text-xs text-gray-600 mb-2">
            <strong>Zone Types:</strong>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-gray-400 rounded mr-2"></div>
              <span>Core priority area</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border border-gray-400 border-dashed rounded mr-2"></div>
              <span>Buffer zone</span>
            </div>
          </div>
        </div>
        
        {showMetric !== 'priority' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <strong>Additional layer:</strong> {
                showMetric === 'population' ? 'Population density circles' :
                showMetric === 'risk' ? 'Extinction risk indicators' :
                showMetric === 'diversity' ? 'Genetic diversity zones' : 'Area coverage'
              }
            </div>
          </div>
        )}
      </div>

      {/* Metric Summary */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {filteredLocations.filter(l => l.priority === 'critical').length}
            </div>
            <div className="text-xs text-gray-600">Critical Zones</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {filteredLocations.filter(l => l.priority === 'high').length}
            </div>
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {filteredLocations.reduce((sum, l) => sum + l.populationSize, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Population</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {(filteredLocations.reduce((sum, l) => sum + l.area, 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-600">Total Area (ha)</div>
          </div>
        </div>
        
        {/* Priority zone coverage indicator */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Priority Coverage:</span>
            <div className="flex space-x-1">
              <div className="w-12 h-2 bg-red-400 rounded"></div>
              <div className="w-8 h-2 bg-orange-400 rounded"></div>
              <div className="w-6 h-2 bg-yellow-400 rounded"></div>
              <div className="w-4 h-2 bg-green-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConservationPriority = () => {
  const [conservationData, setConservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState(50);
  const [showMetric, setShowMetric] = useState('priority');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    loadConservationData();
  }, [timeHorizon]);

  const loadConservationData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getConservationAnalysis();
      setConservationData(data);
    } catch (error) {
      console.error('Error loading conservation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      critical: 'red',
      high: 'orange', 
      medium: 'yellow',
      low: 'green'
    };
    return colorMap[priority] || 'gray';
  };

  const getExtinctionRiskLevel = (probability) => {
    if (probability > 0.7) return { level: 'Critical', color: 'red' };
    if (probability > 0.4) return { level: 'High', color: 'orange' };
    if (probability > 0.2) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  };

  const renderPriorityMap = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Conservation Priority Map</h3>
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Metric
              </label>
              <select
                value={showMetric}
                onChange={(e) => setShowMetric(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="priority">Priority Level</option>
                <option value="population">Population Size</option>
                <option value="risk">Extinction Risk</option>
                <option value="diversity">Genetic Diversity</option>
              </select>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="mt-6 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>
        
        <PriorityMap
          selectedSpecies={selectedSpecies}
          showMetric={showMetric}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />
      </div>
    );
  };

  const renderViabilityAnalysis = () => {
    if (!conservationData?.viabilityAnalysis) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Population Viability Analysis</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.keys(conservationData.viabilityAnalysis).map(species => {
            const analysis = conservationData.viabilityAnalysis[species];
            const riskLevel = getExtinctionRiskLevel(analysis.extinctionProbability);
            
            return (
              <div key={species} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">{species}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded bg-${riskLevel.color}-100 text-${riskLevel.color}-800`}>
                    {riskLevel.level} Risk
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Extinction Probability ({timeHorizon} years)</span>
                      <span className={`text-lg font-bold text-${riskLevel.color}-600`}>
                        {(analysis.extinctionProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`bg-${riskLevel.color}-500 h-3 rounded-full`}
                        style={{width: `${analysis.extinctionProbability * 100}%`}}
                      ></div>
                    </div>
                  </div>

                  {/* Population trajectory chart placeholder */}
                  <div className="bg-gray-50 rounded p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Population Trajectory</h5>
                    <div className="h-24 bg-white rounded border flex items-center justify-center">
                      <div className="text-xs text-gray-500">Trajectory visualization</div>
                    </div>
                  </div>

                  {/* Recommended actions preview */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Top Recommendation</h5>
                    {analysis.recommendedActions.length > 0 && (
                      <div className={`p-3 rounded border-l-4 border-${getPriorityColor(analysis.recommendedActions[0].priority)}-500 bg-gray-50`}>
                        <div className="text-sm font-medium text-gray-900">
                          {analysis.recommendedActions[0].action}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {analysis.recommendedActions[0].rationale}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPriorityRanking = () => {
    if (!conservationData?.priorityRanking) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Area Ranking</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Species
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Genetic Diversity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extinction Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conservationData.priorityRanking.map((area, index) => (
                <tr key={index} className={index < 3 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {area.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {area.species ? area.species.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getPriorityColor(area.priority)}-100 text-${getPriorityColor(area.priority)}-800`}>
                      {area.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {area.populationSize || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{width: `${(area.geneticDiversity || 0) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {((area.geneticDiversity || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (area.extinctionRisk || 0) > 0.7 ? 'bg-red-500' :
                            (area.extinctionRisk || 0) > 0.4 ? 'bg-orange-500' :
                            (area.extinctionRisk || 0) > 0.2 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{width: `${(area.extinctionRisk || 0) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {((area.extinctionRisk || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(area.urgency || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConservationActions = () => {
    if (!conservationData?.conservationActions) return null;

    const actionsByPriority = conservationData.conservationActions.reduce((acc, action) => {
      if (!acc[action.priority]) acc[action.priority] = [];
      acc[action.priority].push(action);
      return acc;
    }, {});

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Conservation Actions</h3>
        
        <div className="space-y-6">
          {['critical', 'high', 'medium', 'ongoing'].map(priority => {
            const actions = actionsByPriority[priority] || [];
            if (actions.length === 0) return null;

            return (
              <div key={priority}>
                <h4 className={`text-md font-medium mb-3 text-${getPriorityColor(priority)}-700`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Actions
                </h4>
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div 
                      key={index}
                      className={`border-l-4 p-4 rounded bg-${getPriorityColor(priority)}-50 border-${getPriorityColor(priority)}-500`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{action.action}</h5>
                          <p className="text-sm text-gray-600 mt-1">{action.rationale}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">
                              <strong>Species:</strong> {action.species}
                            </span>
                            <span className="text-xs text-gray-500">
                              <strong>Timeline:</strong> {action.timeline}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded bg-${getPriorityColor(priority)}-100 text-${getPriorityColor(priority)}-800`}>
                          {priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCorridorRecommendations = () => {
    if (!conservationData?.spatialAnalysis?.corridorRecommendations) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Habitat Corridor Recommendations</h3>
        
        {conservationData.spatialAnalysis.corridorRecommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No corridor recommendations generated</p>
        ) : (
          <div className="space-y-4">
            {conservationData.spatialAnalysis.corridorRecommendations.map((corridor, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {corridor.from} ↔ {corridor.to}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Distance: {corridor.distance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Priority: {(corridor.priority * 100).toFixed(0)}%
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{width: `${corridor.priority * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!conservationData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load conservation data</p>
        <button 
          onClick={loadConservationData}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Controls */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="overview">Overview</option>
                <option value="viability">Population Viability</option>
                <option value="ranking">Priority Ranking</option>
                <option value="actions">Conservation Actions</option>
                <option value="corridors">Habitat Corridors</option>
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species Filter
              </label>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Species</option>
                <option value="Pongo abelii">Sumatran Orangutan</option>
                <option value="Pongo pygmaeus">Bornean Orangutan</option>
                <option value="Pongo tapanuliensis">Tapanuli Orangutan</option>
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Horizon (years)
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={25}>25 years</option>
                <option value={50}>50 years</option>
                <option value={100}>100 years</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={loadConservationData}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="space-y-4 lg:space-y-6">
          {renderPriorityMap()}
          {renderViabilityAnalysis()}
        </div>
      )}

      {selectedView === 'viability' && renderViabilityAnalysis()}
      {selectedView === 'ranking' && renderPriorityRanking()}
      {selectedView === 'actions' && renderConservationActions()}
      {selectedView === 'corridors' && renderCorridorRecommendations()}

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Location Details: {selectedLocation.name}</h3>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedLocation.populationSize.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Population Size</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{(selectedLocation.extinctionRisk * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Extinction Risk</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{(selectedLocation.geneticDiversity * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Genetic Diversity</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{(selectedLocation.urgency * 100).toFixed(0)}</div>
              <div className="text-sm text-gray-600">Urgency Score</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Conservation Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Protection Status:</span>
                  <span className="font-medium">{selectedLocation.protectionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Area:</span>
                  <span className="font-medium">{(selectedLocation.area / 1000).toFixed(0)}K hectares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threat Level:</span>
                  <span className={`font-medium ${
                    selectedLocation.threatLevel === 'critical' ? 'text-red-600' :
                    selectedLocation.threatLevel === 'high' ? 'text-orange-600' :
                    selectedLocation.threatLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedLocation.threatLevel}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Species Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Species:</span>
                  <span className="font-medium">{selectedLocation.species.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority Level:</span>
                  <span className={`font-medium ${
                    selectedLocation.priority === 'critical' ? 'text-red-600' :
                    selectedLocation.priority === 'high' ? 'text-orange-600' :
                    selectedLocation.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedLocation.priority.charAt(0).toUpperCase() + selectedLocation.priority.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-red-600">
            {conservationData.priorityRanking.filter(p => p.priority === 'critical').length}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Critical Areas</div>
        </div>
        
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-orange-600">
            {conservationData.conservationActions.filter(a => a.priority === 'critical').length}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Urgent Actions</div>
        </div>
        
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-blue-600">
            {conservationData.spatialAnalysis.corridorRecommendations?.length || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Corridor Opportunities</div>
        </div>
        
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-green-600">
            {Object.keys(conservationData.viabilityAnalysis).length}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Species Analyzed</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h4 className="text-sm lg:text-base font-medium text-gray-900 mb-2 sm:mb-0">Export Conservation Report</h4>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button 
              onClick={() => {
                const data = JSON.stringify(conservationData, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'conservation_analysis.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Download Report
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Print Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConservationPriority;