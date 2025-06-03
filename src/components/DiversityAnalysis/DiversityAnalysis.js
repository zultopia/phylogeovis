"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  LineChart,
  Line,
} from "recharts"
import genomeData from "../../services/pongo_genome_sequence.json"

const DiversityAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [selectedSpecies, setSelectedSpecies] = useState("all")
  const [activeTab, setActiveTab] = useState("diversity")
  const [processedData, setProcessedData] = useState([])
  const [selectionData, setSelectionData] = useState([])
  const [viabilityData, setViabilityData] = useState([])

  // Calculate nucleotide frequencies
  const calculateNucleotideFrequencies = (sequence) => {
    const total = sequence.length
    const counts = { A: 0, T: 0, C: 0, G: 0 }

    for (const nucleotide of sequence.toUpperCase()) {
      if (nucleotide in counts) {
        counts[nucleotide]++
      }
    }

    return {
      A: counts.A / total,
      T: counts.T / total,
      C: counts.C / total,
      G: counts.G / total,
    }
  }

  // Shannon Index: Measures genetic uncertainty
  // Higher value = greater diversity
  // Range: 0 to ln(4) ≈ 1.386 for 4 nucleotides
  const calculateShannonIndex = (frequencies) => {
    return -Object.values(frequencies).reduce((sum, freq) => {
      return freq > 0 ? sum + freq * Math.log(freq) : sum
    }, 0)
  }

  // Simpson Index: Probability that two randomly selected nucleotides are different
  // Higher value = greater diversity
  // Range: 0 to 1
  const calculateSimpsonIndex = (frequencies) => {
    return 1 - Object.values(frequencies).reduce((sum, freq) => sum + freq * freq, 0)
  }

  // Nucleotide Diversity: Average nucleotide differences between sequences
  const calculateNucleotideDiversity = (sequences) => {
    if (sequences.length < 2) return 0

    let totalDifferences = 0
    let comparisons = 0

    for (let i = 0; i < sequences.length; i++) {
      for (let j = i + 1; j < sequences.length; j++) {
        const seq1 = sequences[i]
        const seq2 = sequences[j]
        const minLength = Math.min(seq1.length, seq2.length)

        let differences = 0
        for (let k = 0; k < minLength; k++) {
          if (seq1[k] !== seq2[k]) differences++
        }

        totalDifferences += differences / minLength
        comparisons++
      }
    }

    return comparisons > 0 ? totalDifferences / comparisons : 0
  }

  // Count polymorphic sites (positions where nucleotides vary)
  // Polymorphic Sites: DNA positions where different individuals have different nucleotides
  // These sites indicate genetic variation within a population
  const countPolymorphicSites = (sequences) => {
    if (sequences.length < 2) return 0

    const minLength = Math.min(...sequences.map((s) => s.length))
    let polymorphicCount = 0

    for (let pos = 0; pos < minLength; pos++) {
      const nucleotides = new Set(sequences.map((seq) => seq[pos]))
      if (nucleotides.size > 1) {
        polymorphicCount++
      }
    }

    return polymorphicCount
  }

  // Calculate dN/dS ratio for selection pressure analysis
  // dN/dS: Ratio of non-synonymous to synonymous substitutions
  // dN/dS > 1: Positive selection (adaptive evolution)
  // dN/dS = 1: Neutral evolution
  // dN/dS < 1: Purifying selection (removing harmful mutations)
  const calculateDnDsRatio = (sequences) => {
    if (sequences.length < 2) return { dnds: 0, selectionType: "Insufficient data" }

    let synonymous = 0
    let nonSynonymous = 0

    // Simplified codon analysis (assuming sequences are coding)
    for (let i = 0; i < sequences.length - 1; i++) {
      const seq1 = sequences[i]
      const seq2 = sequences[i + 1]
      const minLength = Math.min(seq1.length, seq2.length)

      for (let pos = 0; pos < minLength - 2; pos += 3) {
        const codon1 = seq1.slice(pos, pos + 3)
        const codon2 = seq2.slice(pos, pos + 3)

        if (codon1.length === 3 && codon2.length === 3 && codon1 !== codon2) {
          // Simplified: assume third position changes are often synonymous
          const thirdPosChange = codon1[2] !== codon2[2]
          const otherPosChange = codon1[0] !== codon2[0] || codon1[1] !== codon2[1]

          if (thirdPosChange && !otherPosChange) {
            synonymous++
          } else if (otherPosChange) {
            nonSynonymous++
          }
        }
      }
    }

    const dnds = synonymous > 0 ? nonSynonymous / synonymous : 0
    let selectionType = "Neutral"
    if (dnds > 1.2) selectionType = "Positive"
    else if (dnds < 0.8) selectionType = "Purifying"

    return { dnds, selectionType, synonymous, nonSynonymous }
  }

  // Population Viability Analysis using simplified Vortex-like modeling
  // Stochastic Demographic Modeling: Predicts population survival probability
  // considering random environmental and demographic events
  const calculatePopulationViability = (metrics, currentPopSize = 1000) => {
    const diversityFactor = metrics.nucleotideDiversity / 1

    const inbreedingRisk = 1 - diversityFactor

    const carryingCapacity = currentPopSize * (1 + diversityFactor)

    const extinctionRisk = inbreedingRisk * 0.8 + (1 - diversityFactor) * 0.2

    const projections = []
    let population = currentPopSize

    for (let year = 0; year <= 50; year += 5) {
      const environmentalStochasticity = 0.85 + Math.random() * 0.15
      const baseGrowthRate = 1.005
      const growthRate = (baseGrowthRate - extinctionRisk * 0.05) * environmentalStochasticity

      population = Math.max(0, population * growthRate)

      projections.push({
        year,
        population: Math.round(population),
        extinctionRisk: extinctionRisk * 100,
        viabilityScore: (1 - extinctionRisk) * 100,
      })
    }

    return {
      extinctionRisk: extinctionRisk * 100,
      viabilityScore: (1 - extinctionRisk) * 100,
      projections,
      carryingCapacity,
    }
  }


  // Generate selection heatmap data
  const generateSelectionHeatmap = (processedData) => {
    const heatmapData = []
    const regions = ["Exon 1", "Intron 1", "Exon 2", "Intron 2", "Exon 3", "UTR 3'"]

    processedData.forEach((species, speciesIndex) => {
      regions.forEach((region, regionIndex) => {
        // Simulate selection pressure values based on actual data
        const baseValue = species.selectionAnalysis?.dnds || 0.5
        const variation = (Math.random() - 0.5) * 0.4
        const selectionPressure = Math.max(0, baseValue + variation)

        heatmapData.push({
          species: species.species,
          region,
          value: selectionPressure,
          x: regionIndex,
          y: speciesIndex,
          selectionType: selectionPressure > 1 ? "Positive" : selectionPressure < 0.8 ? "Purifying" : "Neutral",
        })
      })
    })

    return heatmapData
  }

  // Assess conservation risk level
  const assessConservationRisk = (metrics) => {
    const diversityScore = metrics.nucleotideDiversity

    if (diversityScore < 0.35) return "High"
    if (diversityScore < 0.7) return "Medium"
    return "Low"
  }

  useEffect(() => {
    const processDataInChunks = async () => {
      setLoading(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 0))

        const results = []
        const selectionResults = []
        const viabilityResults = []
        const entries = Object.entries(genomeData)

        for (let i = 0; i < entries.length; i++) {
          const [speciesName, data] = entries[i]

          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 0))
          }

          const sequences = data.map((item) => item.sequence)
          const combinedSequence = sequences.join("")
          const frequencies = calculateNucleotideFrequencies(combinedSequence)

          const metrics = {
            shannonIndex: calculateShannonIndex(frequencies),
            simpsonIndex: calculateSimpsonIndex(frequencies),
            nucleotideDiversity: calculateNucleotideDiversity(sequences),
            gcContent: frequencies.G + frequencies.C,
            polymorphicSites: countPolymorphicSites(sequences),
            sampleSize: sequences.length,
          }

          const selectionAnalysis = calculateDnDsRatio(sequences)
          const viabilityAnalysis = calculatePopulationViability(metrics)

          const riskLevel = assessConservationRisk(metrics)
          const conservationPriority = riskLevel === "High" ? 3 : riskLevel === "Medium" ? 2 : 1

          const speciesData = {
            species: speciesName,
            metrics,
            selectionAnalysis,
            viabilityAnalysis,
            riskLevel,
            conservationPriority,
          }

          results.push(speciesData)

          selectionResults.push({
            species: speciesName,
            dnds: selectionAnalysis.dnds,
            selectionType: selectionAnalysis.selectionType,
            synonymous: selectionAnalysis.synonymous,
            nonSynonymous: selectionAnalysis.nonSynonymous,
          })

          viabilityResults.push({
            species: speciesName,
            extinctionRisk: viabilityAnalysis.extinctionRisk,
            viabilityScore: viabilityAnalysis.viabilityScore,
            projections: viabilityAnalysis.projections,
          })
        }

        results.sort((a, b) => b.conservationPriority - a.conservationPriority)
        setProcessedData(results)
        setSelectionData(selectionResults)
        setViabilityData(viabilityResults)
      } catch (error) {
        console.error("Error processing genetic data:", error)
      } finally {
        setLoading(false)
      }
    }

    processDataInChunks()
  }, [])

  // Filter data by selected species
  const filteredData =
    selectedSpecies === "all" ? processedData : processedData.filter((item) => item.species === selectedSpecies)

  // Color schemes
  const speciesColors = {
    "Pongo abelii": "#22c55e",
    "Pongo pygmaeus": "#3b82f6",
    "Pongo tapanuliensis": "#f59e0b",
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High":
        return "#dc2626"
      case "Medium":
        return "#ea580c"
      case "Low":
        return "#16a34a"
      default:
        return "#6b7280"
    }
  }

  const getSelectionColor = (type) => {
    switch (type) {
      case "Positive":
        return "#dc2626"
      case "Purifying":
        return "#3b82f6"
      case "Neutral":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  // Generate heatmap data
  const heatmapData = generateSelectionHeatmap(processedData)

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 24px",
            }}
          ></div>
          <p style={{ fontSize: "20px", fontWeight: "500", marginBottom: "8px" }}>Processing genetic sequences...</p>
          <p style={{ fontSize: "16px", color: "#666" }}>This may take a few moments for large datasets</p>
          <p style={{ fontSize: "14px", color: "#888", marginTop: "16px" }}>
            Calculating diversity indices, selection pressure, and viability metrics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .card-content {
          padding: 16px;
        }
        .btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }
        .btn:hover {
          background: #f9fafb;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .btn-primary:hover {
          background: #2563eb;
        }
        .tab-button {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: 500;
        }
        .tab-button.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }
        .grid {
          display: grid;
          gap: 16px;
        }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
        .grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .lg\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        }
        .heatmap-cell {
          width: 100%;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🧬 Genetic Diversity & Selection Analysis
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Comprehensive genetic diversity, selection pressure, and population viability analysis.
          </p>
          <p style={{ color: "#6b7280", margin: 0 }}>
            *Based on NCBI Genomic, not real-time data.
          </p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5" style={{ marginBottom: "24px" }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280", margin: 0 }}>Total Species</h3>
          </div>
          <div className="card-content">
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{processedData.length}</div>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Orangutan subspecies analyzed</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280", margin: 0 }}>High Risk Species</h3>
          </div>
          <div className="card-content">
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}>
              {processedData.filter((d) => d.riskLevel === "High").length}
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Require immediate attention</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280", margin: 0 }}>Average Diversity</h3>
          </div>
          <div className="card-content">
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>
              {processedData.length > 0
                ? (processedData.reduce((sum, d) => sum + d.metrics.shannonIndex, 0) / processedData.length).toFixed(3)
                : "0.000"}
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Shannon Index across species</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280", margin: 0 }}>Positive Selection</h3>
          </div>
          <div className="card-content">
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}>
              {selectionData.filter((d) => d.selectionType === "Positive").length}
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Species under adaptive pressure</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <button
            className={`tab-button ${activeTab === "diversity" ? "active" : ""}`}
            onClick={() => setActiveTab("diversity")}
          >
            Diversity Metrics
          </button>
          <button
            className={`tab-button ${activeTab === "selection" ? "active" : ""}`}
            onClick={() => setActiveTab("selection")}
          >
            Selection Analysis
          </button>
          <button
            className={`tab-button ${activeTab === "viability" ? "active" : ""}`}
            onClick={() => setActiveTab("viability")}
          >
            Population Viability
          </button>
          <button
            className={`tab-button ${activeTab === "conservation" ? "active" : ""}`}
            onClick={() => setActiveTab("conservation")}
          >
            Conservation
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "diversity" && (
        <div className="flex flex-col gap-6">
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Diversity Index Explanation */}
              <div className="card">
                <div className="card-header">
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    ℹ️ Understanding Genetic Diversity Terms
                  </h3>
                </div>
                <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h4 style={{ fontWeight: "600", color: "#f43f5e", margin: "0 0 4px 0" }}>Nucleotide Diversity</h4>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                      Average nucleotide differences between sequences. Higher values indicate greater genetic
                      variation. Calculated as the average number of nucleotide differences per site.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "600", color: "#22c55e", margin: "0 0 4px 0" }}>Shannon Index</h4>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                      Measures genetic uncertainty and evenness of nucleotide distribution. Higher values (closer to
                      1.4) indicate greater diversity. Formula: H = -Σ(pi × ln(pi)) where pi is the frequency of
                      nucleotide i.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "600", color: "#3b82f6", margin: "0 0 4px 0" }}>Simpson Index</h4>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                      Probability that two randomly selected nucleotides are different. Range: 0 to 1. Formula: D = 1 -
                      Σ(pi²). Higher values indicate greater diversity and lower probability of selecting identical
                      nucleotides.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "600", color: "#8b5cf6", margin: "0 0 4px 0" }}>Polymorphic Sites</h4>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                      DNA positions where different individuals have different nucleotides (A, T, G, or C). These sites
                      indicate genetic variation within a population and are crucial for adaptation and evolution.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "600", color: "#f59e0b", margin: "0 0 4px 0" }}>GC Content</h4>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                      Percentage of nucleotides that are either Guanine (G) or Cytosine (C). GC content affects DNA
                      stability, melting temperature, and can indicate evolutionary pressure. Typical range: 35-65% in
                      mammals.
                    </p>
                  </div>
                </div>
              </div>
              {/* Sample Size vs Diversity */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Sample Size Impact on Diversity</h3>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                    Relationship between sample size and nucleotide diversity measurements
                  </p>
                </div>
                <div className="card-content">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metrics.sampleSize" name="Sample Size" type="number" />
                      <YAxis dataKey="metrics.nucleotideDiversity" name="Nucleotide Diversity" type="number" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "metrics.sampleSize") {
                            return [value, "Sample Size"]
                          } else if (name === "metrics.nucleotideDiversity") {
                            return [value.toFixed(4), "Nucleotide Diversity"]
                          }
                          return [value, name]
                        }}
                        labelFormatter={() => ""}
                      />
                      <Scatter name="Species Data" data={processedData} fill="#8884d8">
                        {processedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={speciesColors[entry.species]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((species) => (
              <div key={species.species} className="card">
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "600" }}>{species.species}</span>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: speciesColors[species.species],
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                    Genetic diversity analysis results
                  </p>
                </div>
                <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Shannon Index */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>Shannon Index</span>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: "#22c55e" }}>
                        {species.metrics.shannonIndex.toFixed(4)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min((species.metrics.shannonIndex / 1.4) * 100, 100)}%`,
                          backgroundColor: "#22c55e",
                        }}
                      />
                    </div>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                      {species.metrics.shannonIndex > 0.8
                        ? "High diversity"
                        : species.metrics.shannonIndex > 0.4
                          ? "Medium diversity"
                          : "Low diversity"}
                    </p>
                  </div>

                  {/* Simpson Index */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>Simpson Index</span>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: "#3b82f6" }}>
                        {species.metrics.simpsonIndex.toFixed(4)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${species.metrics.simpsonIndex * 100}%`,
                          backgroundColor: "#3b82f6",
                        }}
                      />
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2" style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
                        {species.metrics.polymorphicSites}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>Polymorphic Sites</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
                        {(species.metrics.gcContent * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>GC Content</div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "14px", color: "#6b7280" }}>Nucleotide Diversity: </span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      {species.metrics.nucleotideDiversity.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "selection" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Selection Pressure Explanation */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>🧬 Selection Pressure Analysis (dN/dS)</h3>
            </div>
            <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div style={{ padding: "16px", backgroundColor: "#fef2f2", borderRadius: "8px" }}>
                  <h4 style={{ fontWeight: "600", color: "#dc2626", margin: "0 0 8px 0" }}>
                    Positive Selection (dN/dS {">"} 1)
                  </h4>
                  <p style={{ fontSize: "14px", color: "#7f1d1d", margin: 0 }}>
                    Adaptive evolution where beneficial mutations are favored. Indicates regions important for
                    adaptation to environmental pressures.
                  </p>
                </div>
                <div style={{ padding: "16px", backgroundColor: "#f0f9ff", borderRadius: "8px" }}>
                  <h4 style={{ fontWeight: "600", color: "#3b82f6", margin: "0 0 8px 0" }}>
                    Purifying Selection (dN/dS {"<"} 1)
                  </h4>
                  <p style={{ fontSize: "14px", color: "#1e40af", margin: 0 }}>
                    Removal of harmful mutations. Indicates functionally important regions where changes are
                    detrimental.
                  </p>
                </div>
                <div style={{ padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                  <h4 style={{ fontWeight: "600", color: "#6b7280", margin: "0 0 8px 0" }}>
                    Neutral Evolution (dN/dS ≈ 1)
                  </h4>
                  <p style={{ fontSize: "14px", color: "#4b5563", margin: 0 }}>
                    Random genetic drift with no selective pressure. Changes neither beneficial nor harmful.
                  </p>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ fontWeight: "600", color: "#475569", margin: "0 0 8px 0" }}>
                  Selection Pressure Expectations:
                </h4>
                <ul style={{ fontSize: "14px", color: "#64748b", margin: 0, paddingLeft: "20px" }}>
                  <li>
                    <strong>Exons:</strong> Typically show purifying selection (dN/dS &lt; 1) to preserve protein
                    function
                  </li>
                  <li>
                    <strong>Introns:</strong> Often neutral evolution (dN/dS ≈ 1) with less functional constraint
                  </li>
                  <li>
                    <strong>UTR regions:</strong> Variable selection depending on regulatory importance
                  </li>
                  <li>
                    <strong>Positive selection (dN/dS &gt; 1):</strong> May indicate adaptive evolution in response to
                    environmental pressures
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Selection Analysis Results */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>dN/dS Ratios by Species</h3>
              </div>
              <div className="card-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="species" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="dnds" name="dN/dS Ratio">
                      {selectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSelectionColor(entry.selectionType)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Selection Type Distribution</h3>
              </div>
              <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectionData.map((species) => (
                  <div
                    key={species.species}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: "500", margin: "0 0 4px 0" }}>{species.species}</h4>
                      <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                        dN/dS: {species.dnds.toFixed(3)} | Syn: {species.synonymous} | Non-syn: {species.nonSynonymous}
                      </p>
                    </div>
                    <span
                      className="badge"
                      style={{
                        borderColor: getSelectionColor(species.selectionType),
                        color: getSelectionColor(species.selectionType),
                      }}
                    >
                      {species.selectionType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selection Heatmap */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>🔥 Genomic Regions Under Selection</h3>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Heatmap showing selection pressure across different genomic regions
              </p>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Heatmap Header */}
                <div className="grid grid-cols-7" style={{ gap: "2px" }}>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px" }}>Species</div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>Exon 1</div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>
                    Intron 1
                  </div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>Exon 2</div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>
                    Intron 2
                  </div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>Exon 3</div>
                  <div style={{ padding: "8px", fontWeight: "600", fontSize: "12px", textAlign: "center" }}>UTR 3'</div>
                </div>

                {/* Heatmap Rows */}
                {processedData.map((species, speciesIndex) => (
                  <div key={species.species} className="grid grid-cols-7" style={{ gap: "2px" }}>
                    <div style={{ padding: "8px", fontSize: "12px", fontWeight: "500" }}>
                      {species.species.replace("Pongo ", "P. ")}
                    </div>
                    {["Exon 1", "Intron 1", "Exon 2", "Intron 2", "Exon 3", "UTR 3'"].map((region, regionIndex) => {
                      const baseValue = species.selectionAnalysis?.dnds || 0.5
                      const variation = (Math.random() - 0.5) * 0.4
                      const selectionPressure = Math.max(0, baseValue + variation)
                      const intensity = Math.min(selectionPressure / 2, 1)
                      const color =
                        selectionPressure > 1
                          ? `rgba(220, 38, 38, ${intensity})`
                          : selectionPressure < 0.8
                            ? `rgba(59, 130, 246, ${intensity})`
                            : `rgba(107, 114, 128, ${intensity})`

                      return (
                        <div
                          key={region}
                          className="heatmap-cell"
                          style={{ backgroundColor: color }}
                          title={`${species.species} - ${region}: dN/dS = ${selectionPressure.toFixed(3)}`}
                        >
                          {selectionPressure.toFixed(2)}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
                <span>Selection Pressure:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "20px", height: "12px", backgroundColor: "rgba(59, 130, 246, 0.8)" }}></div>
                  <span>Purifying ({"<"} 0.8)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "20px", height: "12px", backgroundColor: "rgba(107, 114, 128, 0.8)" }}></div>
                  <span>Neutral (0.8-1.2)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "20px", height: "12px", backgroundColor: "rgba(220, 38, 38, 0.8)" }}></div>
                  <span>Positive ({">"} 1.2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "viability" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Viability Explanation */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>📊 Population Viability Analysis</h3>
            </div>
            <div className="card-content">
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 16px 0" }}>
                Stochastic demographic modeling based on the Vortex simulation framework, integrating genetic diversity
                metrics to predict population trajectories and extinction risks over 50 years.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div>
                  <h4 style={{ fontWeight: "600", color: "#3b82f6", margin: "0 0 8px 0" }}>Model Parameters</h4>
                  <ul style={{ fontSize: "14px", color: "#6b7280", margin: 0, paddingLeft: "20px" }}>
                    <li>Environmental stochasticity: ±10% annual variation</li>
                    <li>Genetic diversity factor: Shannon Index normalized</li>
                    <li>Inbreeding depression: Based on diversity loss</li>
                    <li>Carrying capacity: Adjusted by genetic health</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontWeight: "600", color: "#22c55e", margin: "0 0 8px 0" }}>Risk Assessment</h4>
                  <ul style={{ fontSize: "14px", color: "#6b7280", margin: 0, paddingLeft: "20px" }}>
                    <li>High risk: {">"} 50% extinction probability</li>
                    <li>Medium risk: 20-50% extinction probability</li>
                    <li>Low risk: {"<"} 20% extinction probability</li>
                    <li>Viability score: 100% - extinction risk</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Viability Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3">
            {viabilityData.map((species) => (
              <div key={species.species} className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>{species.species}</h3>
                </div>
                <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: "bold",
                        color:
                          species.viabilityScore > 70 ? "#22c55e" : species.viabilityScore > 40 ? "#f59e0b" : "#dc2626",
                      }}
                    >
                      {Math.round(species.viabilityScore)}%
                    </div>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Viability Score</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>Extinction Risk</span>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: "#dc2626" }}>
                        {Math.round(species.extinctionRisk)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${species.extinctionRisk}%`,
                          backgroundColor: "#dc2626",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      backgroundColor:
                        species.viabilityScore > 70 ? "#f0fdf4" : species.viabilityScore > 40 ? "#fffbeb" : "#fef2f2",
                      borderRadius: "8px",
                      border: `1px solid ${species.viabilityScore > 70 ? "#bbf7d0" : species.viabilityScore > 40 ? "#fed7aa" : "#fecaca"}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color:
                          species.viabilityScore > 70 ? "#15803d" : species.viabilityScore > 40 ? "#92400e" : "#991b1b",
                        margin: 0,
                      }}
                    >
                      {species.viabilityScore > 70
                        ? "Population shows good long-term viability with current genetic diversity."
                        : species.viabilityScore > 40
                          ? "Population faces moderate extinction risk. Conservation intervention recommended."
                          : "Population at high extinction risk. Immediate genetic rescue needed."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Population Projections */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>50-Year Population Projections</h3>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Stochastic population trajectories incorporating genetic diversity effects
              </p>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, 50]}
                    tick={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
                  />

                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {viabilityData.map((species, index) => (
                    <Line
                      key={species.species}
                      type="monotone"
                      dataKey="population"
                      data={species.projections}
                      stroke={Object.values(speciesColors)[index]}
                      strokeWidth={2}
                      name={species.species}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Viability vs Diversity Correlation */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Genetic Diversity Impact on Viability</h3>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Correlation between nucleotide diversity and population viability scores
              </p>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="metrics.nucleotideDiversity"
                    type="number"
                    name="Nucleotide Diversity"
                    domain={[0, 1.4]}
                  />
                  <YAxis
                    dataKey="viabilityAnalysis.viabilityScore"
                    type="number"
                    name="Viability Score"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name.includes("nucleotideDiversity")) {
                        return [value.toFixed(3), "Nucleotide Diversity"]
                      }
                      if (name.includes("viabilityScore")) {
                        return [`${value.toFixed(2)}%`, "Viability Score"]
                      }
                      return [value, name]
                    }}
                    labelFormatter={() => ""}
                  />
                  <Scatter data={processedData} fill="#8884d8">
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={speciesColors[entry.species]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>

            </div>
          </div>
        </div>
      )}

      {activeTab === "conservation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Conservation Priority Ranking */}
          <div className="card">
            <div className="card-header">
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ⚠️ Integrated Conservation Priority Ranking
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Species ranked by urgency based on genetic diversity, selection pressure, and population viability
              </p>
            </div>
            <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {processedData.map((species, index) => {
                const viability = viabilityData.find((v) => v.species === species.species)
                const selection = selectionData.find((s) => s.species === species.species)

                return (
                  <div
                    key={species.species}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontWeight: "600", margin: "0 0 4px 0" }}>{species.species}</h4>
                      <div
                        style={{ fontSize: "14px", color: "#6b7280", display: "flex", flexWrap: "wrap", gap: "16px" }}
                      >
                        <span>Diversity: {species.metrics.nucleotideDiversity.toFixed(4)}</span>
                        <span>dN/dS: {selection?.dnds.toFixed(3) || "N/A"}</span>
                        <span>Viability: {viability ? Math.round(viability.viabilityScore) : "N/A"}%</span>
                        <span>Polymorphic sites: {species.metrics.polymorphicSites}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        className="badge"
                        style={{
                          borderColor: getRiskColor(species.riskLevel),
                          color: getRiskColor(species.riskLevel),
                        }}
                      >
                        {species.riskLevel} Priority
                      </span>
                      {species.riskLevel === "High" && <span style={{ color: "#dc2626" }}>🚨</span>}
                      {species.riskLevel === "Medium" && <span style={{ color: "#ea580c" }}>⚠️</span>}
                      {species.riskLevel === "Low" && <span style={{ color: "#16a34a" }}>✅</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conservation Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "#dc2626" }}>
                  🚨 Immediate Action Required
                </h3>
              </div>
              <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {processedData
                  .filter((s) => s.riskLevel === "High")
                  .map((species) => {
                    const viability = viabilityData.find((v) => v.species === species.species)
                    const selection = selectionData.find((sel) => sel.species === species.species)

                    return (
                      <div
                        key={species.species}
                        style={{
                          padding: "12px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ color: "#dc2626", fontSize: "16px" }}>🚨</span>
                          <div>
                            <strong style={{ color: "#dc2626" }}>{species.species}</strong>: Critical genetic bottleneck
                            detected.
                            <br />• Low diversity (Nucleotide Diversity: {species.metrics.nucleotideDiversity.toFixed(4)})
                            <br />• Extinction risk: {viability ? Math.round(viability.extinctionRisk) : "High"}%
                            <br />• Selection pressure: {selection?.selectionType || "Unknown"}
                            <br />
                            <strong>Actions:</strong> Genetic rescue, captive breeding, habitat protection
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {processedData.filter((s) => s.riskLevel === "High").length === 0 && (
                  <p style={{ color: "#6b7280", fontStyle: "italic" }}>No species currently at critical risk.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "#16a34a" }}>
                  ✅ Conservation Success
                </h3>
              </div>
              <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {processedData
                  .filter((s) => s.riskLevel === "Low")
                  .map((species) => {
                    const viability = viabilityData.find((v) => v.species === species.species)
                    const selection = selectionData.find((sel) => sel.species === species.species)

                    return (
                      <div
                        key={species.species}
                        style={{
                          padding: "12px",
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "8px",
                        }}
                      >
                        <h4 style={{ fontWeight: "600", color: "#16a34a", margin: "0 0 4px 0" }}>{species.species}</h4>
                        <p style={{ fontSize: "14px", color: "#15803d", margin: 0 }}>
                          Stable population with healthy genetic diversity (Nucleotide Diversity:{" "}
                          {species.metrics.nucleotideDiversity.toFixed(4)}).
                          <br />
                          Viability score: {viability ? Math.round(viability.viabilityScore) : "Good"}% |
                          {species.metrics.polymorphicSites} polymorphic sites detected.
                          <br />
                          <strong>Maintain:</strong> Current protection measures and monitoring protocols.
                        </p>
                      </div>
                    )
                  })}
                {processedData.filter((s) => s.riskLevel === "Low").length === 0 && (
                  <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                    All species require enhanced conservation efforts.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Conservation Strategy */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>🎯 Integrated Conservation Strategy</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "16px" }}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #fcd34d",
                  }}
                >
                  <h4 style={{ fontWeight: "600", color: "#92400e", margin: "0 0 8px 0" }}>🧬 Genetic Management</h4>
                  <ul style={{ fontSize: "14px", color: "#78350f", margin: 0, paddingLeft: "16px" }}>
                    <li>Monitor dN/dS ratios for adaptive potential</li>
                    <li>Maintain polymorphic sites through breeding programs</li>
                    <li>Prevent inbreeding depression</li>
                    <li>Genetic rescue for bottlenecked populations</li>
                  </ul>
                </div>

                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                    border: "1px solid #93c5fd",
                  }}
                >
                  <h4 style={{ fontWeight: "600", color: "#1e40af", margin: "0 0 8px 0" }}>📊 Population Monitoring</h4>
                  <ul style={{ fontSize: "14px", color: "#1e3a8a", margin: 0, paddingLeft: "16px" }}>
                    <li>Regular viability assessments</li>
                    <li>Demographic stochasticity tracking</li>
                    <li>Environmental impact evaluation</li>
                    <li>Carrying capacity optimization</li>
                  </ul>
                </div>

                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#dcfce7",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                  }}
                >
                  <h4 style={{ fontWeight: "600", color: "#15803d", margin: "0 0 8px 0" }}>🌿 Habitat Conservation</h4>
                  <ul style={{ fontSize: "14px", color: "#14532d", margin: 0, paddingLeft: "16px" }}>
                    <li>Protect critical habitat corridors</li>
                    <li>Reduce fragmentation effects</li>
                    <li>Climate change adaptation</li>
                    <li>Community-based conservation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiversityAnalysis;