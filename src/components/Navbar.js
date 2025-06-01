// src/components/Navbar/Navbar.js
// Navigation bar component for PhyloGeoVis

import React, { useState } from 'react';
import { Menu, X, Search, Bell, User } from 'lucide-react';
import Logo from '../assets/images/logo.svg';

const Navbar = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => {
  const [logoError, setLogoError] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'phylogenetic', label: 'Phylogenetic' },
    { id: 'diversity', label: 'Diversity' },
    { id: 'conservation', label: 'Conservation' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {/* Logo */}
              <div className="flex items-center ml-2 lg:ml-0">
                {!logoError ? (
                  <img
                    src={Logo}
                    alt="PhyloGeoVis Logo"
                    className="h-8 w-8"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PG</span>
                  </div>
                )}
                
                <span className="ml-2 text-xl font-bold text-gray-900">PhyloGeoVis</span>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search samples, locations..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-6 w-6" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button className="flex items-center text-sm rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;