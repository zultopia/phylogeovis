// src/components/Dashboard/Dashboard.js
// Main dashboard component for PhyloGeoVis

import React, { useState, useEffect } from 'react';
import dataService from '../../services/dataService';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSpecies, setSelectedSpecies] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100'; 
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img src="/src/assets/images/logo.svg" alt="PhyloGeoVis" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PhyloGeoVis</h1>
                <p className="text-sm text-gray-600">Orangutan Conservation Prioritization</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Species</option>
                <option value="Pongo abelii">Sumatran Orangutan</option>
                <option value="Pongo pygmaeus">Bornean Orangutan</option>
                <option value="Pongo tapanuliensis">Tapanuli Orangutan</option>
              </select>
              <button 
                onClick={loadDashboardData}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'phylogenetic', label: 'Phylogenetic Analysis' },
              { id: 'diversity', label: 'Genetic Diversity' },
              { id: 'conservation', label: 'Conservation Priority' },
              { id: 'map', label: 'Geographic Distribution' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Species
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.summary.totalSpecies}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">D</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Samples Analyzed
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.summary.totalSamples}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">L</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Study Locations
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.summary.totalLocations}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Critical Areas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData.summary.criticalLocations}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Section */}
            {dashboardData.alerts && dashboardData.alerts.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Conservation Alerts
                  </h3>
                  <div className="space-y-3">
                    {dashboardData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`border-l-4 p-4 rounded ${getAlertColor(alert.type)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm mt-1">{alert.value}</p>
                          </div>
                          <span className="text-xs font-medium bg-white bg-opacity-50 px-2 py-1 rounded">
                            {alert.species}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Updates */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Analysis Updates
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {dashboardData.recentUpdates.map((update, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== dashboardData.recentUpdates.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-xs font-bold">
                                  {update.type.charAt(0).toUpperCase()}
                                </span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{update.description}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {new Date(update.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setSelectedView('phylogenetic')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">View Phylogenetic Tree</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Explore evolutionary relationships between orangutan species
                    </p>
                  </button>
                  
                  <button 
                    onClick={() => setSelectedView('diversity')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">Analyze Genetic Diversity</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Compare diversity indices across populations
                    </p>
                  </button>
                  
                  <button 
                    onClick={() => setSelectedView('conservation')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">Conservation Priorities</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Identify critical areas needing immediate action
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'phylogenetic' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Phylogenetic Analysis</h2>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-gray-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Phylogenetic Tree Visualization</p>
              <p className="text-gray-600 mb-4">
                Interactive phylogenetic tree showing evolutionary relationships between orangutan species
              </p>
              <div className="bg-yellow-100 border border-yellow-400 rounded-md p-4 text-yellow-800 text-sm">
                <p><strong>Note:</strong> Detailed phylogenetic tree component would be implemented here</p>
                <p>Features: Interactive tree, bootstrap values, branch lengths, species grouping</p>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'diversity' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Genetic Diversity Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shannon Diversity Index</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pongo abelii</span>
                    <span className="text-sm font-medium">0.65</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                <div className="bg-blue-100 border border-blue-400 rounded-md p-3 text-blue-800 text-xs mt-4">
                  Detailed diversity analysis charts would be displayed here
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Selection Pressure Analysis</h3>
                <div className="text-center py-8">
                  <div className="text-3xl font-bold text-gray-400 mb-2">dN/dS</div>
                  <p className="text-gray-600 text-sm">
                    Ratio analysis to identify genomic regions under selection
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'conservation' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Conservation Priority Areas</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Threat Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataService.getGeographicData().map((location, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {location.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {location.species.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            location.populationSize < 50 ? getPriorityColor('critical') :
                            location.populationSize < 100 ? getPriorityColor('high') :
                            getPriorityColor('medium')
                          }`}>
                            {location.populationSize < 50 ? 'Critical' :
                             location.populationSize < 100 ? 'High' : 'Medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {location.populationSize}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  location.humanDisturbance > 0.7 ? 'bg-red-500' :
                                  location.humanDisturbance > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{width: `${location.humanDisturbance * 100}%`}}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {(location.humanDisturbance * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'map' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Geographic Distribution</h2>
            <div className="bg-gray-100 rounded-lg p-8 text-center min-h-96">
              <div className="text-gray-600 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Interactive Map</p>
              <p className="text-gray-600 mb-4">
                Geographic distribution of orangutan populations with genetic diversity overlay
              </p>
              <div className="bg-green-100 border border-green-400 rounded-md p-4 text-green-800 text-sm">
                <p><strong>Map Features:</strong></p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Population locations with size indicators</li>
                  <li>• Genetic diversity heat map overlay</li>
                  <li>• Habitat corridors and connectivity analysis</li>
                  <li>• Conservation priority zones</li>
                  <li>• Threat assessment layers</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;