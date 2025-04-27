import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/images/logo.svg';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div className="flex items-center py-4">
              <Link to="/" className="flex items-center">
                <img src={Logo} alt="PhyloGeoVis Logo" className="h-10 w-10 mr-2" />
                <span className="font-semibold text-xl text-green-800">PhyloGeoVis</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className="py-4 px-2 text-green-800 font-medium">Dashboard</Link>
              <Link to="/phylogenetic" className="py-4 px-2 text-gray-600 font-medium hover:text-green-800">Phylogenetic Tree</Link>
              <Link to="/diversity" className="py-4 px-2 text-gray-600 font-medium hover:text-green-800">Diversity Analysis</Link>
              <Link to="/conservation" className="py-4 px-2 text-gray-600 font-medium hover:text-green-800">Conservation Priority</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;