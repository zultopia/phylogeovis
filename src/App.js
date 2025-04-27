import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import PhylogeneticTree from './components/PhylogeneticTree/PhylogeneticTree';
import DiversityAnalysis from './components/DiversityAnalysis/DiversityAnalysis';
import ConservationPriority from './components/ConservationPriority/ConservationPriority';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/phylogenetic" element={<PhylogeneticTree />} />
            <Route path="/diversity" element={<DiversityAnalysis />} />
            <Route path="/conservation" element={<ConservationPriority />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;