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
import Logo from '../../assets/images/logo.svg';

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
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

  // Color schemes
  const speciesColors = {
    "Pongo abelii": "#22c55e",
    "Pongo pygmaeus": "#3b82f6",
    "Pongo tapanuliensis": "#f59e0b",
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img src={Logo} alt="PhyloGeoVis" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PhyloGeoVis</h1>
                <p className="text-sm text-gray-600">Orangutan Conservation Prioritization</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
};

export default Dashboard;