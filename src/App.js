'use client';

import React from 'react';
import { useState } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import PhylogenenticTree from './components/PhylogeneticTree/PhylogeneticTree';
import DiversityAnalysis from './components/DiversityAnalysis/DiversityAnalysis';
import ConservationPriority from './components/ConservationPriority/ConservationPriority';
import './styles/index.css';
import Logo from './assets/images/logo.svg';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'phylogenetic':
        return <PhylogenenticTree />;
      case 'diversity':
        return <DiversityAnalysis />;
      case 'conservation':
        return <ConservationPriority />;
      default:
        return <Dashboard />;
    }
  };

  const getViewTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      phylogenetic: 'Phylogenetic Analysis',
      diversity: 'Genetic Diversity',
      conservation: 'Conservation Priority'
    };
    return titles[currentView] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-4">
              <img src={Logo} alt="PhyloGeoVis" className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto sidebar-nav">
          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: "home", description: "Overview & Summary" },
              { id: "phylogenetic", label: "Phylogenetic Analysis", icon: "tree", description: "Evolutionary Analysis" },
              { id: "diversity", label: "Genetic Diversity", icon: "chart", description: "Diversity Metrics" },
              { id: "conservation", label: "Conservation Priority", icon: "shield", description: "Priority Analysis" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setSidebarOpen(false)
                }}
                className={`sidebar-item ${currentView === item.id ? "active" : ""}`}
              >
                <NavigationIcon
                  type={item.icon}
                  className={`mr-3 h-5 w-5 transition-colors ${currentView === item.id ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
                    }`}
                />
                <div className="text-left flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${currentView === item.id ? "text-green-600" : "text-gray-500"}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top bar - Mobile only */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h2 className="ml-4 text-xl font-semibold text-gray-900">
                  {getViewTitle()}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
}

const NavigationIcon = ({ type, className }) => {
  const icons = {
    home: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    tree: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-3m0 0l-3-3m3 3h8m-8 0V9a2 2 0 012-2h6a2 2 0 012 2v10" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    shield: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  };

  return icons[type] || icons.home;
};

export default App;