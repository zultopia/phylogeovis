import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import pongoGenomeData from '../../services/pongo_genome_sequence.json';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Info, 
  Filter,
  BarChart3,
  TreePine,
  Menu,
  X,
  Play,
  Settings,
  RefreshCw
} from 'lucide-react';

const PhylogeneticTree = () => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBootstrap, setShowBootstrap] = useState(true);
  const [showBranchLength, setShowBranchLength] = useState(true);
  const [highlightSpecies, setHighlightSpecies] = useState('all');
  const [treeLayout, setTreeLayout] = useState('rectangular');
  const [showDiversityMetrics, setShowDiversityMetrics] = useState(false);
  const [genomicData, setGenomicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        const processedData = processGenomicSequences(pongoGenomeData);
        setGenomicData(processedData);
        console.log("Berhasil Yeay");
      } catch (error) {
        console.error('Error processing genomic data:', error);
        setGenomicData(processMockData());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); 

  const processMockData = () => {
    return {
      "Pongo abelii": Array.from({length: 20}, (_, i) => ({
        id: i + 1,
        species: "Pongo abelii",
        sequence: "ATGCGATCGTAGCTAGCTAGCTAG" + "CGAT".repeat(i * 10),
        location: i < 10 ? "Northern Sumatra" : "Southern Sumatra",
        populationSize: 8000 - i * 100,
        geneticDiversity: 0.72 - i * 0.01
      })),
      "Pongo pygmaeus": Array.from({length: 25}, (_, i) => ({
        id: i + 21,
        species: "Pongo pygmaeus", 
        sequence: "ATGCGATCGTAGCTAGCTAGCTAG" + "GCAT".repeat(i * 8),
        location: ["Northwest Borneo", "Central Borneo", "East Borneo"][i % 3],
        populationSize: 35000 - i * 200,
        geneticDiversity: 0.74 - i * 0.005
      })),
      "Pongo tapanuliensis": Array.from({length: 8}, (_, i) => ({
        id: i + 46,
        species: "Pongo tapanuliensis",
        sequence: "ATGCGATCGTAGCTAGCTAGCTAG" + "TACG".repeat(i * 6),
        location: "Batang Toru, North Sumatra",
        populationSize: 800 - i * 10,
        geneticDiversity: 0.58 - i * 0.01
      }))
    };
  };

  const processGenomicSequences = (data) => {
    const processedData = {};
    Object.keys(data).forEach(species => {
      processedData[species] = data[species].map(sample => {
        const diversity = calculateSequenceDiversity(sample.sequence);
        const populationData = getPopulationData(species, sample.id);
        return {
          ...sample,
          geneticDiversity: diversity,
          ...populationData
        };
      });
    });
    return processedData;
  };

  const calculateSequenceDiversity = (sequence) => {
    if (!sequence || sequence.length === 0) return 0;
    const gcCount = (sequence.match(/[GC]/gi) || []).length;
    const gcContent = gcCount / sequence.length;
    const bases = { A: 0, T: 0, G: 0, C: 0 };
    for (let base of sequence.toUpperCase()) {
      if (bases.hasOwnProperty(base)) bases[base]++;
    }
    const total = sequence.length;
    let shannon = 0;
    Object.values(bases).forEach(count => {
      if (count > 0) {
        const freq = count / total;
        shannon -= freq * Math.log2(freq);
      }
    });
    return Math.min(shannon / 2, 1);
  };

  const getPopulationData = (species, sampleId) => {
    const populationMap = {
      "Pongo abelii": { location: sampleId <= 10 ? "Northern Sumatra" : "Southern Sumatra", populationSize: sampleId <= 10 ? 8000 : 6000, threatLevel: "Critical" },
      "Pongo pygmaeus": { location: sampleId <= 35 ? "Northwest Borneo" : sampleId <= 70 ? "Central Borneo" : "East Borneo", populationSize: sampleId <= 35 ? 35000 : sampleId <= 70 ? 45000 : 25000, threatLevel: "Endangered" },
      "Pongo tapanuliensis": { location: "Batang Toru, North Sumatra", populationSize: 800, threatLevel: "Critically Endangered" }
    };
    return populationMap[species] || {};
  };

  const generatePhylogeneticData = (genomicData) => {
    if (!genomicData) return null;

    const speciesStats = {};
    Object.keys(genomicData).forEach(species => {
      const samples = genomicData[species];
      const avgDiversity = samples.reduce((sum, sample) => sum + sample.geneticDiversity, 0) / samples.length;
      const totalPop = samples[0]?.populationSize || 0;
      
      speciesStats[species] = {
        avgDiversity,
        populationSize: totalPop,
        sampleCount: samples.length,
        location: samples[0]?.location || "",
        threatLevel: samples[0]?.threatLevel || ""
      };
    });

    return {
      name: "Root",
      branchLength: 0,
      bootstrap: 100,
      children: [
        {
          name: "Outgroup",
          branchLength: 0.15,
          bootstrap: 95,
          species: "outgroup",
          geneticDiversity: 0.65,
          populationSize: null
        },
        {
          name: "Pongo Clade",
          branchLength: 0.05,
          bootstrap: 98,
          children: [
            {
              name: "Pongo abelii Clade",
              branchLength: 0.08,
              bootstrap: 92,
              children: [
                {
                  name: "P. abelii North",
                  branchLength: 0.03,
                  bootstrap: 87,
                  species: "Pongo abelii",
                  geneticDiversity: speciesStats["Pongo abelii"]?.avgDiversity || 0.72,
                  populationSize: Math.floor(speciesStats["Pongo abelii"]?.populationSize * 0.6) || 8000,
                  location: "Northern Sumatra",
                  threatLevel: "Critical"
                },
                {
                  name: "P. abelii South", 
                  branchLength: 0.04,
                  bootstrap: 84,
                  species: "Pongo abelii",
                  geneticDiversity: speciesStats["Pongo abelii"]?.avgDiversity * 0.95 || 0.68,
                  populationSize: Math.floor(speciesStats["Pongo abelii"]?.populationSize * 0.4) || 6000,
                  location: "Southern Sumatra",
                  threatLevel: "Critical"
                }
              ]
            },
            {
              name: "Bornean-Tapanuli Clade",
              branchLength: 0.06,
              bootstrap: 89,
              children: [
                {
                  name: "Pongo tapanuliensis",
                  branchLength: 0.12,
                  bootstrap: 91,
                  species: "Pongo tapanuliensis",
                  geneticDiversity: speciesStats["Pongo tapanuliensis"]?.avgDiversity || 0.58,
                  populationSize: speciesStats["Pongo tapanuliensis"]?.populationSize || 800,
                  location: "Batang Toru, North Sumatra",
                  threatLevel: "Critically Endangered"
                },
                {
                  name: "Pongo pygmaeus Clade",
                  branchLength: 0.07,
                  bootstrap: 94,
                  children: [
                    {
                      name: "P. p. pygmaeus",
                      branchLength: 0.05,
                      bootstrap: 88,
                      species: "Pongo pygmaeus",
                      subspecies: "pygmaeus",
                      geneticDiversity: speciesStats["Pongo pygmaeus"]?.avgDiversity || 0.74,
                      populationSize: Math.floor(speciesStats["Pongo pygmaeus"]?.populationSize * 0.35) || 35000,
                      location: "Northwest Borneo",
                      threatLevel: "Endangered"
                    },
                    {
                      name: "Central Bornean Clade",
                      branchLength: 0.03,
                      bootstrap: 86,
                      children: [
                        {
                          name: "P. p. wurmbii",
                          branchLength: 0.04,
                          bootstrap: 82,
                          species: "Pongo pygmaeus",
                          subspecies: "wurmbii", 
                          geneticDiversity: speciesStats["Pongo pygmaeus"]?.avgDiversity * 0.96 || 0.71,
                          populationSize: Math.floor(speciesStats["Pongo pygmaeus"]?.populationSize * 0.45) || 45000,
                          location: "Central Borneo",
                          threatLevel: "Endangered"
                        },
                        {
                          name: "P. p. morio",
                          branchLength: 0.06,
                          bootstrap: 79,
                          species: "Pongo pygmaeus",
                          subspecies: "morio",
                          geneticDiversity: speciesStats["Pongo pygmaeus"]?.avgDiversity * 0.93 || 0.69,
                          populationSize: Math.floor(speciesStats["Pongo pygmaeus"]?.populationSize * 0.20) || 25000,
                          location: "East Borneo",
                          threatLevel: "Endangered"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  };

  const speciesColors = {
    'Pongo abelii': '#e74c3c',     
    'Pongo tapanuliensis': '#f39c12', 
    'Pongo pygmaeus': '#3498db',   
    'outgroup': '#95a5a6'    
  };

  const getThreatColor = (threatLevel) => {
    switch(threatLevel) {
      case 'Critically Endangered': return '#c0392b';
      case 'Critical': return '#e74c3c';
      case 'Endangered': return '#f39c12';
      default: return '#27ae60';
    }
  };

  useEffect(() => {
    if (genomicData) {
      drawTree();
    }
  }, [genomicData, zoomLevel, showBootstrap, showBranchLength, highlightSpecies, treeLayout]);

  const drawTree = () => {
    if (!genomicData) return;
    
    const phylogeneticData = generatePhylogeneticData(genomicData);
    if (!phylogeneticData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = isMobile ? window.innerWidth - 40 : 800;
    const containerHeight = isMobile ? 400 : 600;
    const margin = isMobile 
      ? { top: 20, right: 80, bottom: 20, left: 20 }
      : { top: 20, right: 150, bottom: 20, left: 20 };

    const width = containerWidth;
    const height = containerHeight;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const root = d3.hierarchy(phylogeneticData);
    tree(root);

    if (treeLayout === 'phylogram') {
      const maxDistance = d3.max(root.descendants(), d => d.data.branchLength || 0);
      const xScale = d3.scaleLinear()
        .domain([0, maxDistance])
        .range([0, width - margin.left - margin.right]);
      
      root.descendants().forEach(d => {
        d.y = d.parent ? d.parent.y + xScale(d.data.branchLength || 0) : 0;
      });
    }

    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const links = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .style("fill", "none")
      .style("stroke", d => {
        if (highlightSpecies !== 'all') {
          const targetSpecies = d.target.data.species;
          return targetSpecies === highlightSpecies ? speciesColors[targetSpecies] : "#ddd";
        }
        return d.target.data.species ? speciesColors[d.target.data.species] : "#666";
      })
      .style("stroke-width", d => {
        const diversity = d.target.data.geneticDiversity;
        return diversity ? Math.max(1, diversity * 4) : 2;
      })
      .style("opacity", d => {
        if (highlightSpecies !== 'all') {
          return d.target.data.species === highlightSpecies ? 1 : 0.3;
        }
        return 1;
      });

    if (showBranchLength && !isMobile) {
      g.selectAll(".branch-length")
        .data(root.descendants().filter(d => d.parent))
        .enter().append("text")
        .attr("class", "branch-length")
        .attr("x", d => (d.y + d.parent.y) / 2)
        .attr("y", d => d.x - 5)
        .style("font-size", "10px")
        .style("fill", "#666")
        .style("text-anchor", "middle")
        .text(d => d.data.branchLength ? d.data.branchLength.toFixed(3) : "");
    }

    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d.data);
        if (isMobile) {
          setMobileMenuOpen(false);
        }
      });

    nodes.append("circle")
      .attr("r", d => {
        if (d.data.populationSize) {
          return Math.max(4, Math.log(d.data.populationSize) * (isMobile ? 1.5 : 2));
        }
        return d.children ? 4 : 6;
      })
      .style("fill", d => {
        if (d.data.species) {
          return d.data.threatLevel ? getThreatColor(d.data.threatLevel) : speciesColors[d.data.species];
        }
        return d.children ? "#fff" : "#666";
      })
      .style("stroke", d => d.data.species ? speciesColors[d.data.species] : "#666")
      .style("stroke-width", 2)
      .style("opacity", d => {
        if (highlightSpecies !== 'all') {
          return d.data.species === highlightSpecies || !d.data.species ? 1 : 0.3;
        }
        return 1;
      });

    if (showBootstrap && !isMobile) {
      nodes.filter(d => d.data.bootstrap && d.children)
        .append("text")
        .attr("dx", -15)
        .attr("dy", -10)
        .style("font-size", "10px")
        .style("fill", "#e74c3c")
        .style("font-weight", "bold")
        .text(d => d.data.bootstrap);
    }

    nodes.append("text")
      .attr("dx", d => d.children ? -8 : 8)
      .attr("dy", ".35em")
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("font-size", isMobile ? "10px" : "12px")
      .style("font-weight", d => d.data.species ? "bold" : "normal")
      .style("fill", d => d.data.species ? speciesColors[d.data.species] : "#333")
      .text(d => {
        if (isMobile && d.data.name.length > 12) {
          return d.data.name.substring(0, 10) + "...";
        }
        return d.data.name;
      });

    if (showDiversityMetrics && !isMobile) {
      nodes.filter(d => d.data.geneticDiversity)
        .append("rect")
        .attr("x", 10)
        .attr("y", 8)
        .attr("width", d => d.data.geneticDiversity * 30)
        .attr("height", 4)
        .style("fill", "#27ae60")
        .style("opacity", 0.7);
    }
  };

  const resetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
    setZoomLevel(1);
  };

  const exportSVG = () => {
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orangutan_phylogeny.svg';
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading genomic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" />
          <span className="hidden sm:inline">Phylogenetic Tree - Orangutan Species</span>
          <span className="sm:hidden">Phylogenetic Tree</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden md:inline">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </span>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isMobile && mobileMenuOpen && (
        <div className="absolute inset-0 bg-white z-50 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Tree Controls</h3>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species Filter
              </label>
              <select
                value={highlightSpecies}
                onChange={(e) => setHighlightSpecies(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="all">All species</option>
                <option value="Pongo abelii">Sumatran (P. abelii)</option>
                <option value="Pongo tapanuliensis">Tapanuli (P. tapanuliensis)</option>
                <option value="Pongo pygmaeus">Bornean (P. pygmaeus)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tree Layout
              </label>
              <select
                value={treeLayout}
                onChange={(e) => setTreeLayout(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="rectangular">Cladogram</option>
                <option value="phylogram">Phylogram</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBootstrap}
                  onChange={(e) => setShowBootstrap(e.target.checked)}
                />
                <span className="text-sm">Bootstrap values</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBranchLength}
                  onChange={(e) => setShowBranchLength(e.target.checked)}
                />
                <span className="text-sm">Branch lengths</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 3))}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <ZoomIn className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.1))}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <ZoomOut className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={resetZoom}
                className="flex-1 p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <RotateCcw className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <button
              onClick={exportSVG}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export Tree
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 3))}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.1))}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showBootstrap}
                onChange={(e) => setShowBootstrap(e.target.checked)}
              />
              <span className="text-sm">Bootstrap values</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showBranchLength}
                onChange={(e) => setShowBranchLength(e.target.checked)}
              />
              <span className="text-sm">Branch lengths</span>
            </label>
          </div>

          <select
            value={highlightSpecies}
            onChange={(e) => setHighlightSpecies(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All species</option>
            <option value="Pongo abelii">Sumatran (P. abelii)</option>
            <option value="Pongo tapanuliensis">Tapanuli (P. tapanuliensis)</option>
            <option value="Pongo pygmaeus">Bornean (P. pygmaeus)</option>
          </select>

          <select
            value={treeLayout}
            onChange={(e) => setTreeLayout(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="rectangular">Cladogram</option>
            <option value="phylogram">Phylogram</option>
          </select>

          <button
            onClick={exportSVG}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <div className="flex-1 relative">
          <svg
            ref={svgRef}
            className="w-full border-r"
            style={{ height: isMobile ? '400px' : '600px' }}
          />
          
          {genomicData && (
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded border shadow-sm">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Genomic Data</h4>
              <div className="space-y-1 text-xs">
                <div>P. abelii: {genomicData["Pongo abelii"]?.length || 0} samples</div>
                <div>P. pygmaeus: {genomicData["Pongo pygmaeus"]?.length || 0} samples</div>
                <div>P. tapanuliensis: {genomicData["Pongo tapanuliensis"]?.length || 0} samples</div>
              </div>
            </div>
          )}
        </div>

        <div className={`${isMobile ? 'w-full' : 'w-80'} p-4 bg-gray-50 ${isMobile ? 'border-t' : 'border-l'}`}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {selectedNode ? 'Node Information' : 'Species Information'}
          </h3>

          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-lg">{selectedNode.name}</h4>
                {selectedNode.species && (
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: speciesColors[selectedNode.species] }}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedNode.species === 'Pongo abelii' ? 'Sumatran Orangutan' :
                       selectedNode.species === 'Pongo tapanuliensis' ? 'Tapanuli Orangutan' :
                       selectedNode.species === 'Pongo pygmaeus' ? 'Bornean Orangutan' : 'Outgroup'}
                    </span>
                  </div>
                )}
              </div>

              {selectedNode.location && (
                <div>
                  <span className="font-medium">Location:</span>
                  <p className="text-sm text-gray-600">{selectedNode.location}</p>
                </div>
              )}

              {selectedNode.populationSize && (
                <div>
                  <span className="font-medium">Population Size:</span>
                  <p className="text-sm text-gray-600">{selectedNode.populationSize.toLocaleString()} individuals</p>
                </div>
              )}

              {selectedNode.geneticDiversity && (
                <div>
                  <span className="font-medium">Genetic Diversity:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedNode.geneticDiversity * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{(selectedNode.geneticDiversity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {selectedNode.threatLevel && (
                <div>
                  <span className="font-medium">Conservation Status:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getThreatColor(selectedNode.threatLevel) }}
                    />
                    <span className="text-sm">{selectedNode.threatLevel}</span>
                  </div>
                </div>
              )}

              {selectedNode.bootstrap && (
                <div>
                  <span className="font-medium">Bootstrap Support:</span>
                  <p className="text-sm text-gray-600">{selectedNode.bootstrap}%</p>
                </div>
              )}

              {selectedNode.branchLength && (
                <div>
                  <span className="font-medium">Branch Length:</span>
                  <p className="text-sm text-gray-600">{selectedNode.branchLength}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedNode(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Close Details
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Click on a node to view detailed information about the species or population.
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-medium mb-2">Species Legend</h4>
            <div className="space-y-2">
              {Object.entries(speciesColors).map(([species, color]) => (
                <div key={species} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">
                    {species === 'Pongo abelii' ? 'Sumatran' :
                     species === 'Pongo tapanuliensis' ? 'Tapanuli' :
                     species === 'Pongo pygmaeus' ? 'Bornean' : 'Outgroup'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 bg-yellow-50 rounded border">
            <h4 className="font-medium text-yellow-800 mb-2">Conservation Insights</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Tapanuli orangutan shows lowest genetic diversity</li>
              <li>• Population sizes indicate urgent conservation needs</li>
              <li>• Branch lengths reflect evolutionary divergence</li>
              <li>• Bootstrap values show phylogenetic confidence</li>
              {genomicData && (
                <li>• Data based on {Object.values(genomicData).flat().length} genomic samples</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhylogeneticTree;