// src/components/ConservationPriority/ConservationPriority.js
// Conservation priority analysis and visualization component

import React, { useState, useEffect } from 'react';
import dataService from '../../services/dataService';

const ConservationPriority = () => {
  const [conservationData, setConservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState(50);

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
    if (!conservationData?.spatialAnalysis?.priorityAreas) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conservation Priority Map</h3>
        <div className="bg-gray-100 rounded-lg p-8 text-center min-h-96 relative">
          {/* Map placeholder */}
          <div className="text-gray-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Interactive Priority Map</p>
          <p className="text-gray-600 mb-4">
            Geographic visualization of conservation priorities with genetic diversity overlay
          </p>
          
          {/* Map legend */}
          <div className="absolute top-4 right-4 bg-white p-3 rounded border shadow-sm">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Priority Levels</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                <span>High</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span>Low</span>
              </div>
            </div>
          </div>

          {/* Priority areas overlay */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded border shadow-sm">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Stats</h4>
            <div className="text-xs space-y-1">
              <div>Critical areas: {conservationData.priorityRanking.filter(p => p.priority === 'critical').length}</div>
              <div>High priority: {conservationData.priorityRanking.filter(p => p.priority === 'high').length}</div>
              <div>Corridors needed: {conservationData.spatialAnalysis.corridorRecommendations?.length || 0}</div>
            </div>
          </div>
        </div>
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