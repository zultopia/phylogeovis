// src/components/DiversityAnalysis/DiversityAnalysis.js
// Genetic diversity analysis visualization component

import React, { useState, useEffect } from 'react';
import dataService from '../../services/dataService';

const DiversityAnalysis = () => {
  const [diversityData, setDiversityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('shannon');
  const [showComparison, setShowComparison] = useState(true);

  useEffect(() => {
    loadDiversityData();
  }, []);

  const loadDiversityData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getDiversityAnalysis();
      setDiversityData(data);
    } catch (error) {
      console.error('Error loading diversity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesColor = (species) => {
    const colorMap = {
      'Pongo abelii': 'green',
      'Pongo pygmaeus': 'blue',
      'Pongo tapanuliensis': 'yellow'
    };
    return colorMap[species] || 'gray';
  };

  const getDiversityLevel = (value, metric) => {
    const thresholds = {
      shannon: { low: 0.3, medium: 0.6 },
      simpson: { low: 0.4, medium: 0.7 }
    };
    
    const threshold = thresholds[metric] || thresholds.shannon;
    
    if (value < threshold.low) return { level: 'Low', color: 'red' };
    if (value < threshold.medium) return { level: 'Medium', color: 'yellow' };
    return { level: 'High', color: 'green' };
  };

  const renderDiversityChart = (speciesName, data) => {
    const shannonLevel = getDiversityLevel(data.shannonIndex, 'shannon');
    const simpsonLevel = getDiversityLevel(data.simpsonIndex, 'simpson');
    
    return (
      <div key={speciesName} className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{speciesName}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getSpeciesColor(speciesName)}-100 text-${getSpeciesColor(speciesName)}-800`}>
            {data.conservationStatus}
          </span>
        </div>
        
        <div className="space-y-4">
          {/* Shannon Index */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Shannon Index</span>
              <span className={`text-sm font-bold text-${shannonLevel.color}-600`}>
                {data.shannonIndex.toFixed(3)} ({shannonLevel.level})
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${shannonLevel.color}-500 h-3 rounded-full transition-all duration-300`}
                style={{width: `${Math.min(data.shannonIndex * 50, 100)}%`}}
              ></div>
            </div>
          </div>

          {/* Simpson Index */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Simpson Index</span>
              <span className={`text-sm font-bold text-${simpsonLevel.color}-600`}>
                {data.simpsonIndex.toFixed(3)} ({simpsonLevel.level})
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${simpsonLevel.color}-500 h-3 rounded-full transition-all duration-300`}
                style={{width: `${data.simpsonIndex * 100}%`}}
              ></div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{data.sampleSize}</div>
              <div className="text-xs text-gray-500">Samples</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {(data.averageGeneticDiversity * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Avg. Diversity</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNucleotideFrequencies = (speciesName, frequencies) => {
    const nucleotides = ['A', 'T', 'C', 'G'];
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-md font-medium text-gray-900 mb-3">{speciesName} - Nucleotide Composition</h4>
        <div className="space-y-2">
          {nucleotides.map((nucleotide, index) => (
            <div key={nucleotide} className="flex items-center">
              <span className="w-4 text-sm font-medium text-gray-700">{nucleotide}</span>
              <div className="flex-1 mx-3 bg-gray-200 rounded-full h-4">
                <div 
                  className={`${colors[index]} h-4 rounded-full transition-all duration-300`}
                  style={{width: `${(frequencies[nucleotide] * 100).toFixed(1)}%`}}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {(frequencies[nucleotide] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectionAnalysis = (speciesName, analysis) => {
    const selectionColor = analysis.selectionType === 'positive' ? 'green' : 
                          analysis.selectionType === 'negative' ? 'red' : 'gray';
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-md font-medium text-gray-900 mb-3">{speciesName} - Selection Pressure</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">dN/dS Ratio</span>
            <span className={`text-lg font-bold text-${selectionColor}-600`}>
              {analysis.dNdS.toFixed(3)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Selection Type</span>
            <span className={`px-2 py-1 text-xs font-medium rounded bg-${selectionColor}-100 text-${selectionColor}-800`}>
              {analysis.selectionType}
            </span>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            {analysis.codons} codons analyzed, {analysis.significantSites} significant sites
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonChart = () => {
    if (!diversityData) return null;
    
    const species = Object.keys(diversityData.bySpecies);
    const metric = selectedMetric === 'shannon' ? 'shannonIndex' : 'simpsonIndex';
    
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Species Comparison - {selectedMetric === 'shannon' ? 'Shannon' : 'Simpson'} Index
        </h3>
        <div className="space-y-4">
          {species.map(speciesName => {
            const value = diversityData.bySpecies[speciesName][metric];
            const level = getDiversityLevel(value, selectedMetric);
            const percentage = selectedMetric === 'shannon' ? (value * 50) : (value * 100);
            
            return (
              <div key={speciesName}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{speciesName}</span>
                  <span className={`text-sm font-bold text-${level.color}-600`}>
                    {value.toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`bg-${getSpeciesColor(speciesName)}-500 h-4 rounded-full transition-all duration-300`}
                    style={{width: `${Math.min(percentage, 100)}%`}}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall Statistics */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {diversityData.overallDiversity.averageShannonIndex.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">Avg. Shannon</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {diversityData.overallDiversity.averageSimpsonIndex.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">Avg. Simpson</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {diversityData.overallDiversity.speciesCount}
              </div>
              <div className="text-xs text-gray-500">Species</div>
            </div>
          </div>
        </div>
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

  if (!diversityData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load diversity data</p>
        <button 
          onClick={loadDiversityData}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const species = Object.keys(diversityData.bySpecies);
  const filteredSpecies = selectedSpecies === 'all' ? species : [selectedSpecies];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Controls */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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
                {species.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diversity Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="shannon">Shannon Index</option>
                <option value="simpson">Simpson Index</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show comparison</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={loadDiversityData}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Species Comparison Chart */}
      {showComparison && renderComparisonChart()}

      {/* Individual Species Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredSpecies.map(speciesName => 
          renderDiversityChart(speciesName, diversityData.bySpecies[speciesName])
        )}
      </div>

      {/* Nucleotide Composition Analysis */}
      <div>
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Nucleotide Composition Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filteredSpecies.map(speciesName => 
            renderNucleotideFrequencies(
              speciesName, 
              diversityData.bySpecies[speciesName].nucleotideFrequencies
            )
          )}
        </div>
      </div>

      {/* Selection Pressure Analysis */}
      <div>
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Selection Pressure Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filteredSpecies.map(speciesName => 
            renderSelectionAnalysis(
              speciesName, 
              diversityData.bySpecies[speciesName].selectionAnalysis
            )
          )}
        </div>
      </div>

      {/* Recommendations */}
      {diversityData.recommendations && diversityData.recommendations.length > 0 && (
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4">Conservation Recommendations</h3>
          <div className="space-y-3">
            {diversityData.recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`border-l-4 p-3 lg:p-4 rounded ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm lg:text-base">{rec.action}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  </div>
                  <div className="flex flex-col items-end mt-2 sm:mt-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-xs text-gray-500 mt-1">{rec.species}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="bg-gray-50 p-4 lg:p-6 rounded-lg">
        <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Key Findings</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Highest diversity: {diversityData.overallDiversity.mostDiverse}</li>
              <li>• Lowest diversity: {diversityData.overallDiversity.leastDiverse}</li>
              <li>• Average Shannon Index: {diversityData.overallDiversity.averageShannonIndex.toFixed(3)}</li>
              <li>• Average Simpson Index: {diversityData.overallDiversity.averageSimpsonIndex.toFixed(3)}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conservation Implications</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Genetic rescue may be needed for low-diversity populations</li>
              <li>• Selection pressure analysis identifies adaptive potential</li>
              <li>• Nucleotide composition reveals evolutionary patterns</li>
              <li>• Diversity indices guide breeding program priorities</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h4 className="text-sm lg:text-base font-medium text-gray-900 mb-2 sm:mb-0">Export Analysis Data</h4>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button 
              onClick={() => {
                const data = JSON.stringify(diversityData, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'diversity_analysis.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Download JSON
            </button>
            <button 
              onClick={() => {
                let csv = 'Species,Shannon Index,Simpson Index,Sample Size,Avg Genetic Diversity\n';
                Object.keys(diversityData.bySpecies).forEach(species => {
                  const data = diversityData.bySpecies[species];
                  csv += `${species},${data.shannonIndex},${data.simpsonIndex},${data.sampleSize},${data.averageGeneticDiversity}\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'diversity_analysis.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiversityAnalysis;