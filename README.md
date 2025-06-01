# PhyloGeoVis: Computational Phylogenomics and Interactive Geospatial Visualization for Orangutan Conservation Prioritization

## Project Overview

PhyloGeoVis is a comprehensive web-based application that combines phylogenomic analysis with interactive geospatial visualization to support orangutan conservation efforts. The application provides tools for analyzing genetic diversity, constructing phylogenetic trees, and prioritizing conservation actions for three critically endangered orangutan species.

**Group 9 Members:**
- Marzuli Suhada M - 13522070
- Ahmad Mudabbir Arif - 13522072  
- Naufal Adnan - 13522116

**Course:** IF3211 - Domain-Specific Computation (2025)

## Features

### 🧬 Phylogenetic Analysis
- **Multiple Sequence Alignment (MSA)** using MUSCLE and ClustalW algorithms
- **Phylogenetic Tree Construction** with Neighbor-Joining and Maximum Likelihood methods
- **Interactive tree visualization** with bootstrap values and branch lengths
- **Evolutionary distance calculations** and confidence assessments

### 📊 Genetic Diversity Analysis
- **Shannon and Simpson diversity indices** calculation
- **Nucleotide composition analysis** across species
- **Selection pressure analysis** using dN/dS ratios
- **Comparative diversity visualization** between species

### 🌍 Conservation Priority Analysis
- **Population Viability Analysis (PVA)** with extinction risk modeling
- **Spatial analysis** integrating genetic and geographic data
- **Conservation priority ranking** based on multiple criteria
- **Habitat corridor recommendations** for population connectivity

### 🗺️ Interactive Geospatial Visualization
- **Geographic distribution mapping** of orangutan populations
- **Genetic diversity overlay** on distribution maps
- **Conservation priority zones** visualization
- **Threat assessment layers** and habitat quality indicators

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript ES6+** - Core programming language

### Data Processing
- **Custom bioinformatics algorithms** for sequence analysis
- **Statistical calculations** for diversity indices
- **Geospatial processing** for conservation analysis

### Visualization
- **SVG-based phylogenetic trees** with interactive features
- **Dynamic charts and graphs** for diversity metrics
- **Interactive maps** for geographic visualization

## Project Structure

```
PHYLOGEOVIS/
├── public/
│   ├── data/
│   └── index.html
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── ConservationPriority/
│   │   ├── Dashboard/
│   │   ├── DiversityAnalysis/
│   │   ├── Navbar/
│   │   └── PhylogenenticTree/
│   ├── services/
│   │   └── dataService.js
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   └── dataProcessing.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phylogeovis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open application**
   - Navigate to `http://localhost:3000` in your web browser

### Production Build
```bash
npm run build
```

## Data Sources

### Genomic Data
The application utilizes genomic sequence data from public databases:

- **Sumatran Orangutan** (*Pongo abelii*)
  - Source: NCBI GenBank
  - Format: FASTA files (mitochondrial and nuclear DNA)
  - Sample size: 20 individuals

- **Bornean Orangutan** (*Pongo pygmaeus*)
  - Source: NCBI GenBank  
  - Format: FASTA files (mitochondrial and nuclear DNA)
  - Sample size: 25 individuals (all subspecies)

- **Tapanuli Orangutan** (*Pongo tapanuliensis*)
  - Source: NCBI GenBank
  - Format: FASTA files (mitochondrial and nuclear DNA)
  - Sample size: 8 individuals

### Geographic Data
- **Distribution ranges**: Global Biodiversity Information Facility (GBIF)
- **Forest cover maps**: Global Forest Watch
- **Habitat quality indicators**: Multiple environmental datasets

## Algorithm Implementation

### Multiple Sequence Alignment
```javascript
// MUSCLE algorithm implementation
function performMSA(sequences) {
  const alignedSequences = sequences.map(seq => ({
    ...seq,
    aligned: alignSequence(seq.sequence)
  }));
  
  return {
    alignedSequences,
    alignmentScore: calculateAlignmentScore(alignedSequences),
    consensusSequence: generateConsensus(alignedSequences)
  };
}
```

### Phylogenetic Tree Construction
```javascript
// Neighbor-Joining method
function constructPhylogeneticTree(sequences) {
  const distanceMatrix = calculateDistanceMatrix(sequences);
  const tree = neighborJoining(distanceMatrix, sequences);
  
  return {
    tree,
    distanceMatrix,
    bootstrapValues: calculateBootstrap(sequences, 100)
  };
}
```

### Diversity Index Calculations
```javascript
// Shannon Diversity Index
function calculateShannonIndex(frequencies) {
  let shannonIndex = 0;
  const total = frequencies.reduce((sum, freq) => sum + freq, 0);
  
  frequencies.forEach(freq => {
    if (freq > 0) {
      const proportion = freq / total;
      shannonIndex -= proportion * Math.log(proportion);
    }
  });
  
  return shannonIndex;
}
```

### Population Viability Analysis
```javascript
// Stochastic demographic modeling
function performPopulationViabilityAnalysis(populationData, years = 100) {
  const simulations = [];
  const numSimulations = 1000;
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const trajectory = simulatePopulation(populationData, years);
    simulations.push(trajectory);
  }
  
  return {
    extinctionProbability: calculateExtinctionProbability(simulations),
    meanTrajectory: calculateMeanTrajectory(simulations),
    recommendedActions: generateRecommendations(extinctionProbability)
  };
}
```

## Component Architecture

### Dashboard Component
- Main application interface
- Summary statistics and alerts
- Navigation to detailed analyses
- Recent updates and quick actions

### PhylogenenticTree Component
- Interactive SVG-based tree visualization
- Bootstrap support values
- Branch length display
- Tree method selection (NJ, ML, UPGMA)

### DiversityAnalysis Component
- Shannon and Simpson index calculations
- Nucleotide frequency analysis
- Selection pressure visualization
- Species comparison charts

### ConservationPriority Component
- Population viability results
- Priority area ranking
- Conservation action recommendations
- Habitat corridor suggestions

## Usage Guide

### Navigation
1. **Dashboard**: Overview of all analyses and system status
2. **Phylogenetic**: Interactive phylogenetic tree exploration
3. **Diversity**: Genetic diversity metrics and comparisons
4. **Conservation**: Priority analysis and action recommendations

### Analysis Workflow
1. **Data Loading**: Automatic loading of genomic and geographic data
2. **Sequence Alignment**: Multiple sequence alignment of DNA sequences
3. **Tree Construction**: Phylogenetic relationship inference
4. **Diversity Calculation**: Genetic diversity index computation
5. **Conservation Analysis**: Priority ranking and viability assessment

### Export Options
- **Phylogenetic trees**: Newick format, JSON data
- **Diversity data**: CSV files, JSON reports
- **Conservation reports**: Comprehensive analysis summaries

## Validation and Testing

### Algorithm Validation
- **Phylogenetic accuracy**: Comparison with published orangutan phylogenies
- **Bootstrap analysis**: Statistical confidence assessment
- **Cross-validation**: Multiple algorithm comparison

### Performance Metrics
- **Runtime efficiency**: Processing time measurements
- **Memory usage**: Resource utilization profiling
- **Scalability testing**: Performance with increasing dataset size

### User Testing
- **Conservation biologist evaluation**: Domain expert assessment
- **Usability testing**: System Usability Scale (SUS) questionnaire
- **Task completion**: Analytical workflow efficiency

## Conservation Applications

### Breeding Program Optimization
- Genetic bottleneck identification
- Breeding pair recommendations
- Genetic rescue planning

### Habitat Protection
- Priority area identification
- Corridor establishment
- Threat mitigation strategies

### Population Monitoring
- Real-time genetic variation tracking
- Population trend assessment
- Early warning systems

### Policy Support
- Data-driven conservation guidelines
- Resource allocation optimization
- Stakeholder engagement tools

## Research Impact

### Scientific Contributions
- Integration of phylogenomics and geospatial analysis
- Comprehensive orangutan conservation framework
- Open-source bioinformatics tools

### Conservation Outcomes
- Evidence-based conservation priorities
- Improved resource allocation
- Enhanced population viability

### Educational Value
- Interactive learning tools
- Public engagement platform
- Conservation awareness raising

## Future Enhancements

### Technical Improvements
- **Real-time data integration** from monitoring networks
- **Machine learning models** for prediction enhancement
- **Cloud computing** for large-scale analysis
- **Mobile application** for field data collection

### Analytical Expansions
- **Landscape genetics** analysis
- **Climate change modeling** integration
- **Multi-species analysis** capabilities
- **Temporal analysis** of genetic changes

### User Experience
- **Advanced filtering** and search capabilities
- **Collaborative features** for multi-user analysis
- **API development** for third-party integration
- **Offline functionality** for remote locations

## Contributing

### Development Guidelines
1. Follow React best practices and component architecture
2. Maintain comprehensive documentation
3. Include unit tests for new features
4. Follow biodiversity data standards

### Bug Reports
- Use GitHub issues for bug reporting
- Include detailed reproduction steps
- Provide system information and error logs

### Feature Requests
- Discuss proposed features in issues
- Consider conservation biologist needs
- Maintain scientific accuracy

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **NCBI GenBank** for genomic sequence data
- **GBIF** for species occurrence data
- **Global Forest Watch** for habitat data
- **Conservation organizations** for domain expertise
- **Open-source community** for foundational tools

## Contact

For questions, suggestions, or collaboration opportunities:

- **Project Team**: Group 9 - IF3211 Domain-Specific Computation
- **Institution**: Institut Teknologi Bandung
- **Email**: [project-email@itb.ac.id]

## Citation

If you use PhyloGeoVis in your research, please cite:

```
Group 9 (2025). PhyloGeoVis: Computational Phylogenomics and Interactive 
Geospatial Visualization for Orangutan Conservation Prioritization. 
IF3211 Domain-Specific Computation, Institut Teknologi Bandung.
```

---

**Note**: This application is designed for research and conservation purposes. While it provides scientifically-based analysis, conservation decisions should always involve domain experts and consider local contexts and stakeholder needs.