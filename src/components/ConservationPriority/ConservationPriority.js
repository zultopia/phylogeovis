// src/components/ConservationPriority/ConservationPriority.js
// Enhanced Conservation priority component with individual GBIF occurrence point mapping and detailed area info

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Rectangle,
  useMap, // Import useMap hook for map interaction
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dataService from "../../services/dataService";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper component to access map instance
const MapContent = ({ children, mapRef, selectedArea }) => {
  const map = useMap(); // This hook must be called inside MapContainer's direct child

  useEffect(() => {
    // Fit map to selected area bounds when an area is selected
    if (selectedArea && map) {
      const bounds = [
        [selectedArea.bounds.south, selectedArea.bounds.west],
        [selectedArea.bounds.north, selectedArea.bounds.east],
      ];
      map.fitBounds(bounds, { padding: [50, 50] }); // Add padding
    } else if (!selectedArea && map) { // Changed condition to use 'map' instead of 'mapRef.current'
      // Reset map view if no area is selected
      map.setView([-0.7893, 113.9213], 5);
    }
  }, [selectedArea, map, mapRef]); // mapRef is not strictly necessary in dependencies if not used for view manipulation inside the effect

  // Pass the map instance to children if needed, or let them use hooks directly if they are descendants
  return (
    <>
      {children}
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => map.setZoom(map.getZoom() + 1)}
          className="block w-10 h-10 bg-white hover:bg-gray-100 border-b border-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
        >
          +
        </button>
        <button
          onClick={() => map.setZoom(map.getZoom() - 1)}
          className="block w-10 h-10 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
        >
          −
        </button>
      </div>
    </>
  );
};


// Individual Point Map Component with Density Analysis
const IndividualPointMap = ({
  individualPoints,
  densityAnalysis,
  conservationAreas,
  selectedSpecies,
  viewMode,
  showDensityZones,
  selectedPoint,
  onPointSelect,
  onAreaSelect, // New prop for area selection
  selectedArea, // New prop for selected area
}) => {
  // mapRef is now used for direct map manipulation in MapContent
  // The map instance for fitting bounds is handled by MapContent's useMap hook and useEffect
  // and passed down implicitly or by allowing MapContent to handle it.

  // Filter points based on selected species
  const filteredPoints =
    selectedSpecies === "all"
      ? individualPoints
      : individualPoints.filter((point) => point.species === selectedSpecies);

  // Filter conservation areas
  const filteredAreas =
    selectedSpecies === "all"
      ? conservationAreas
      : conservationAreas.filter((area) =>
          area.species.includes(selectedSpecies)
        );

  /**
   * Create custom marker icon based on point characteristics
   */
  const createPointIcon = (point) => {
    const densityColors = {
      very_high: "#8B0000", // Dark red
      high: "#FF0000", // Red
      medium: "#FFA500", // Orange
      low: "#FFD700", // Gold
      very_low: "#90EE90", // Light green
    };

    const speciesColors = {
      "Pongo abelii": "#FF6B6B", // Red-pink
      "Pongo pygmaeus": "#4ECDC4", // Teal
      "Pongo tapanuliensis": "#45B7D1", // Blue
    };

    const color = densityColors[point.densityCategory] || "#666666";
    const borderColor = speciesColors[point.species] || "#333333";

    // Size based on density category
    const sizes = {
      very_high: 14,
      high: 12,
      medium: 10,
      low: 8,
      very_low: 6,
    };
    const size = sizes[point.densityCategory] || 8;

    // Shape based on data quality
    const shape =
      point.dataQuality === "excellent" || point.dataQuality === "good"
        ? "circle"
        : "square";

    return L.divIcon({
      className: `custom-point-marker ${
        selectedPoint?.id === point.id ? "ring-2 ring-offset-2 ring-blue-500" : ""
      }`,
      html: `<div style="
        background-color: ${color};
        border: 2px solid ${borderColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${shape === "circle" ? "50%" : "2px"};
        opacity: 0.8;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "
      onmouseover="this.style.transform='scale(1.5)'; this.style.zIndex='1000';"
      onmouseout="this.style.transform='scale(1)'; this.style.zIndex='100';"
      ></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  /**
   * Create density zone circle
   */
  const createDensityZone = (cluster) => {
    const colors = {
      very_high: "#8B0000",
      high: "#FF0000",
      medium: "#FFA500",
      low: "#FFD700",
      very_low: "#90EE90",
    };

    const radius = Math.max(cluster.avgDensity * 500, 2000); // Minimum 2km radius

    return {
      center: [cluster.center.lat, cluster.center.lng],
      radius: radius,
      pathOptions: {
        color: colors[cluster.densityLevel],
        fillColor: colors[cluster.densityLevel],
        fillOpacity: 0.2,
        weight: 2,
        opacity: 0.6,
        dashArray: "10, 5",
      },
    };
  };

  /**
   * Create conservation area boundaries
   */
  const createConservationAreaBoundary = (area) => {
    const priorityColors = {
      critical: "#DC2626", // Red
      high: "#EA580C", // Orange
      medium: "#CA8A04", // Yellow-orange
      low: "#16A34A", // Green
    };

    const color = priorityColors[area.priority] || "#6B7280"; // Gray for unknown

    return {
      bounds: area.bounds,
      pathOptions: {
        color: color,
        fillColor: color,
        fillOpacity: selectedArea?.id === area.id ? 0.3 : 0.1, // Highlight selected area
        weight: selectedArea?.id === area.id ? 4 : 3,
        opacity: 0.8,
        dashArray: area.type === "density_cluster" ? "5, 5" : "solid",
      },
    };
  };

  const indonesiaBounds = [
    [-11.0, 95.0],
    [6.0, 141.0],
  ];

  if (!individualPoints || individualPoints.length === 0) {
    return (
      <div className="relative h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">
            No individual occurrence data available
          </div>
          <div className="text-sm text-gray-400">
            Loading GBIF occurrence points...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 z-10">
      <MapContainer
        center={[-0.7893, 113.9213]}
        zoom={5}
        minZoom={4}
        maxZoom={15}
        style={{ height: "100%", width: "100%" }}
        maxBounds={indonesiaBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
      >
        <MapContent mapRef={null} selectedArea={selectedArea}> {/* Pass mapRef and selectedArea here */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Density zones (if enabled) */}
          {showDensityZones &&
            densityAnalysis?.clusters &&
            densityAnalysis.clusters.map((cluster, index) => {
              const zone = createDensityZone(cluster);
              return (
                <Circle
                  key={`density-zone-${index}`}
                  center={zone.center}
                  radius={zone.radius}
                  pathOptions={zone.pathOptions}
                />
              );
            })}

          {/* Conservation area boundaries */}
          {(viewMode === "areas" || viewMode === "mixed") &&
            filteredAreas.map((area, index) => {
              const boundary = createConservationAreaBoundary(area);
              const bounds = [
                [boundary.bounds.south, boundary.bounds.west],
                [boundary.bounds.north, boundary.bounds.east],
              ];

              return (
                <Rectangle
                  key={`area-boundary-${area.id}-${index}`}
                  bounds={bounds}
                  pathOptions={boundary.pathOptions}
                  eventHandlers={{
                    click: () => onAreaSelect && onAreaSelect(area),
                  }}
                >
                  <Popup closeButton={false} className="area-popup" maxWidth={350}>
                    <div className="p-3">
                      <h4 className="font-bold text-base text-gray-900 mb-2">
                        {area.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Type:{" "}
                        {area.type === "density_cluster"
                          ? "Density Cluster"
                          : "Isolated Point"}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Species</div>
                          <div className="font-bold text-blue-600 text-xs">
                            {area.species.join(", ").replace(/Pongo (abelii|pygmaeus|tapanuliensis)/g, (match, p1) => {
                              switch (p1) {
                                case 'abelii': return 'Sumatran';
                                case 'pygmaeus': return 'Bornean';
                                case 'tapanuliensis': return 'Tapanuli';
                                default: return '';
                              }
                            })}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Priority</div>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              area.priority === "critical"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : area.priority === "high"
                                ? "bg-orange-100 text-orange-800 border border-orange-300"
                                : area.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                : "bg-green-100 text-green-800 border border-green-300"
                            }`}
                          >
                            {area.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Est. Population</div>
                          <div className="font-bold text-green-600 text-sm">
                            {area.populationSize?.toLocaleString() || "N/A"}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Area (Ha)</div>
                          <div className="font-bold text-orange-600 text-sm">
                            {area.area?.toLocaleString() || "N/A"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onAreaSelect(area)}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600 w-full"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Rectangle>
              );
            })}

          {/* Individual occurrence points */}
          {(viewMode === "points" || viewMode === "mixed") && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              {filteredPoints.map((point, index) => (
                <Marker
                  key={`point-${point.id}-${index}`}
                  position={[point.coordinates.lat, point.coordinates.lng]}
                  icon={createPointIcon(point)}
                  eventHandlers={{
                    click: () => onPointSelect(point),
                  }}
                >
                  <Popup
                    closeButton={false}
                    className="point-popup"
                    maxWidth={350}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-base text-gray-900">
                            {point.species.split(" ")[1]} Orangutan
                          </h4>
                          <p className="text-xs text-gray-600">
                            {point.locality ||
                              point.stateProvince ||
                              point.country}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              point.densityCategory === "very_high"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : point.densityCategory === "high"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : point.densityCategory === "medium"
                                ? "bg-orange-100 text-orange-800 border border-orange-300"
                                : point.densityCategory === "low"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                : "bg-green-100 text-green-800 border border-green-300"
                            }`}
                          >
                            {point.densityCategory
                              .replace("_", " ")
                              .toUpperCase()}
                          </span>
                          <span
                            className={`mt-1 px-2 py-1 text-xs rounded ${
                              point.dataQuality === "excellent"
                                ? "bg-green-100 text-green-800"
                                : point.dataQuality === "good"
                                ? "bg-blue-100 text-blue-800"
                                : point.dataQuality === "fair"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {point.dataQuality} quality
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Coordinates</div>
                          <div className="font-bold text-blue-600 text-xs">
                            {point.coordinates.lat.toFixed(6)},{" "}
                            {point.coordinates.lng.toFixed(6)}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">
                            Nearby Points
                          </div>
                          <div className="font-bold text-purple-600 text-lg">
                            {point.nearbyPointsCount}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">
                            Observation Year
                          </div>
                          <div className="font-bold text-green-600 text-sm">
                            {point.year || "Unknown"}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-gray-600 text-xs">Precision</div>
                          <div className="font-bold text-orange-600 text-xs">
                            {point.coordinateUncertaintyInMeters
                              ? `±${(
                                  point.coordinateUncertaintyInMeters / 1000
                                ).toFixed(1)}km`
                              : "Unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <div className="text-xs text-gray-600 space-y-1">
                          {point.recordedBy && (
                            <div>
                              <strong>Recorded by:</strong> {point.recordedBy}
                            </div>
                          )}
                          {point.institutionCode && (
                            <div>
                              <strong>Institution:</strong>{" "}
                              {point.institutionCode}
                            </div>
                          )}
                          {point.eventDate && (
                            <div>
                              <strong>Date:</strong> {point.eventDate}
                            </div>
                          )}
                          <div>
                            <strong>GBIF Key:</strong> {point.gbifKey}
                          </div>
                          {point.clusterAssignment && (
                            <div>
                              <strong>Cluster:</strong> {point.clusterAssignment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}
        </MapContent>
      </MapContainer>

      {/* Legend for Individual Points & Areas */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <h4 className="font-bold text-gray-900 mb-2 text-sm">
          {viewMode === "points"
            ? "Individual Occurrences"
            : viewMode === "areas"
            ? "Conservation Areas"
            : "Map Legend"}
        </h4>

        {(viewMode === "points" || viewMode === "mixed") && (
          <div className="space-y-2 text-xs mb-3">
            <div className="text-gray-700 font-medium">Density Categories:</div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-800 rounded-full mr-2 border"></div>
              <span>Very High (50+ nearby)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2 border"></div>
              <span>High (20-49 nearby)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2 border"></div>
              <span>Medium (10-19 nearby)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2 border"></div>
              <span>Low (3-9 nearby)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-300 rounded-full mr-2 border"></div>
              <span>Very Low (1-2 nearby)</span>
            </div>
          </div>
        )}

        {(viewMode === "points" || viewMode === "mixed") && (
          <div className="border-t pt-2 mb-2">
            <div className="text-gray-700 font-medium text-xs mb-1">
              Point Species:
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 border-2 border-red-300 rounded-full"></div>
                <span>Pongo abelii</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 border-2 border-teal-400 rounded-full"></div>
                <span>Pongo pygmaeus</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 border-2 border-blue-400 rounded-full"></div>
                <span>Pongo tapanuliensis</span>
              </div>
            </div>
          </div>
        )}

        {(viewMode === "areas" || viewMode === "mixed") && (
          <div className="border-t pt-2 mb-2">
            <div className="text-gray-700 font-medium text-xs mb-1">
              Area Priority:
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-4 h-2 bg-red-600 mr-2 border"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-2 bg-orange-600 mr-2 border"></div>
                <span>High</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-2 bg-yellow-600 mr-2 border"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-2 bg-green-600 mr-2 border"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-2">
          <div className="text-xs text-gray-600">
            {(viewMode === "points" || viewMode === "mixed") && (
              <>
                <div>
                  <strong>○</strong> = High quality point data
                </div>
                <div>
                  <strong>□</strong> = Lower quality point data
                </div>
              </>
            )}
            {(viewMode === "areas" || viewMode === "mixed") && (
              <>
                <div>
                  <strong>Solid Line</strong> = Isolated Point Area
                </div>
                <div>
                  <strong>Dashed Line</strong> = Density Cluster Area
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Map Summary */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {filteredPoints.length}
            </div>
            <div className="text-xs text-gray-600">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {
                filteredPoints.filter(
                  (p) =>
                    p.densityCategory === "very_high" ||
                    p.densityCategory === "high"
                ).length
              }
            </div>
            <div className="text-xs text-gray-600">High Density</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {
                filteredPoints.filter((p) => p.densityCategory === "medium")
                  .length
              }
            </div>
            <div className="text-xs text-gray-600">Medium Density</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {
                filteredPoints.filter(
                  (p) =>
                    p.dataQuality === "excellent" || p.dataQuality === "good"
                ).length
              }
            </div>
            <div className="text-xs text-gray-600">High Quality</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {densityAnalysis?.clusters?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Clusters</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Conservation Priority Component
const ConservationPriority = () => {
  const [conservationData, setConservationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState("individual_points");
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  const [viewMode, setViewMode] = useState("points"); // points, areas, mixed
  const [showDensityZones, setShowDensityZones] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null); // New state for selected area
  const [dataSource, setDataSource] = useState("loading");
  const [gbifStatus, setGbifStatus] = useState("checking");

  useEffect(() => {
    loadConservationData();
  }, []);

  const loadConservationData = async () => {
    try {
      setLoading(true);
      setError(null);
      setGbifStatus("loading");

      // Check if GBIF data is available
      const isGBIFIntegrated = dataService.isGBIFIntegrated();

      if (!isGBIFIntegrated) {
        // Try to initialize GBIF data
        const success = await dataService.refreshFromGBIF();
        setGbifStatus(success ? "connected" : "fallback");
      } else {
        setGbifStatus("connected");
      }

      const data = await dataService.getConservationAnalysis();
      setConservationData(data);
      setDataSource(data.dataSource || "Unknown");
    } catch (error) {
      console.error("Error loading conservation data:", error);
      setError(error.message);
      setGbifStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const refreshGBIFData = async () => {
    try {
      setLoading(true);
      setGbifStatus("refreshing");
      setSelectedPoint(null); // Clear selected point/area on refresh
      setSelectedArea(null);

      const success = await dataService.refreshFromGBIF();
      setGbifStatus(success ? "connected" : "fallback");

      const data = await dataService.getConservationAnalysis();
      setConservationData(data);
      setDataSource(data.dataSource || "Unknown");
    } catch (error) {
      console.error("Error refreshing GBIF data:", error);
      setError(error.message);
      setGbifStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePointSelect = (point) => {
    setSelectedPoint(point);
    setSelectedArea(null); // Clear selected area when a point is selected
  };

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    setSelectedPoint(null); // Clear selected point when an area is selected
  };

  const renderDataSourceStatus = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                gbifStatus === "connected"
                  ? "bg-green-500"
                  : gbifStatus === "fallback"
                  ? "bg-yellow-500"
                  : gbifStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            ></div>
            <div>
              <div className="font-medium text-gray-900">
                Data Source: {dataSource}
              </div>
              <div className="text-sm text-gray-600">
                {gbifStatus === "connected" &&
                  "Real-time GBIF individual points data"}
                {gbifStatus === "fallback" &&
                  "Using fallback data (GBIF unavailable)"}
                {gbifStatus === "error" && "Error connecting to GBIF"}
                {gbifStatus === "loading" && "Loading GBIF data..."}
                {gbifStatus === "refreshing" && "Refreshing from GBIF..."}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshGBIFData}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {gbifStatus === "refreshing" ? "Refreshing..." : "Refresh GBIF"}
            </button>
          </div>
        </div>

        {conservationData?.hasIndividualPoints && (
          <div className="mt-2 text-xs text-gray-500">
            Individual points: {conservationData.individualPoints?.length || 0}{" "}
            | Density clusters:{" "}
            {conservationData.densityAnalysis?.clusters?.length || 0} | Last
            updated: {new Date(conservationData.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  const renderDensityAnalysisStats = () => {
    if (!conservationData?.densityAnalysis) return null;

    const analysis = conservationData.densityAnalysis;

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Density Analysis Overview
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">
              {analysis.densityCategories.very_high.length +
                analysis.densityCategories.high.length}
            </div>
            <div className="text-sm text-gray-600">High Density Points</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {analysis.densityCategories.medium.length}
            </div>
            <div className="text-sm text-gray-600">Medium Density</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.densityCategories.low.length}
            </div>
            <div className="text-sm text-gray-600">Low Density</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {analysis.densityCategories.very_low.length}
            </div>
            <div className="text-sm text-gray-600">Isolated Points</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {analysis.clusters.length}
            </div>
            <div className="text-sm text-gray-600">Density Clusters</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Species Distribution:</h4>
          {Object.entries(analysis.speciesDistribution).map(
            ([species, data]) => (
              <div
                key={species}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="font-medium">{species}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-red-600">
                    High:{" "}
                    {data.densityCategories.high +
                      data.densityCategories.very_high}
                  </span>
                  <span className="text-orange-600">
                    Medium: {data.densityCategories.medium}
                  </span>
                  <span className="text-yellow-600">
                    Low: {data.densityCategories.low}
                  </span>
                  <span className="text-green-600">
                    Very Low: {data.densityCategories.very_low}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderIndividualPointsMap = () => {
    if (!conservationData?.individualPoints) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Geographic Distribution
          </h3>
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  setSelectedPoint(null);
                  setSelectedArea(null);
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="points">Individual Points</option>
                <option value="areas">Conservation Areas</option>
                <option value="mixed">Mixed View</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="density-zones"
                checked={showDensityZones}
                onChange={(e) => setShowDensityZones(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="density-zones" className="text-sm text-gray-700">
                Show Density Zones
              </label>
            </div>
            {(selectedPoint || selectedArea) && (
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  setSelectedArea(null);
                }}
                className="mt-6 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Reset Selection
              </button>
            )}
          </div>
        </div>

        <IndividualPointMap
          individualPoints={conservationData.individualPoints}
          densityAnalysis={conservationData.densityAnalysis}
          conservationAreas={conservationData.conservationLocations}
          selectedSpecies={selectedSpecies}
          viewMode={viewMode}
          showDensityZones={showDensityZones}
          selectedPoint={selectedPoint}
          onPointSelect={handlePointSelect}
          selectedArea={selectedArea}
          onAreaSelect={handleAreaSelect}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-gray-600">
            {gbifStatus === "loading"
              ? "Loading GBIF individual points..."
              : gbifStatus === "refreshing"
              ? "Refreshing from GBIF..."
              : "Loading conservation data..."}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={loadConservationData}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!conservationData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No conservation data available</p>
        <button
          onClick={loadConservationData}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Load Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Data Source Status */}
      {renderDataSourceStatus()}

      {/* Controls */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis View
              </label>
              <select
                value={selectedView}
                onChange={(e) => {
                  setSelectedView(e.target.value);
                  setSelectedPoint(null); // Clear selections when changing main view
                  setSelectedArea(null);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="individual_points">
                  Geographic Distribution
                </option>
                <option value="density_overview">Density Overview</option>
                <option value="conservation_areas">Conservation Areas Table</option>
              </select>
            </div>

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
                <option value="Pongo abelii">Sumatran Orangutan</option>
                <option value="Pongo pygmaeus">Bornean Orangutan</option>
                <option value="Pongo tapanuliensis">Tapanuli Orangutan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on selected view */}
      {selectedView === "individual_points" && renderIndividualPointsMap()}
      {selectedView === "density_overview" && renderDensityAnalysisStats()}
      {selectedView === "conservation_areas" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Density-Based Conservation Areas Table
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Species
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area (Ha)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Population
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ext. Risk
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conservationData.conservationLocations
                  ?.filter((area) =>
                    selectedSpecies === "all"
                      ? true
                      : area.species.includes(selectedSpecies)
                  )
                  .map((area, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {area.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {area.type === "density_cluster"
                          ? "Cluster"
                          : area.type === "isolated_point"
                          ? "Isolated"
                          : "Area"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {area.species.map(s => s.split(" ")[1]).join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {area.totalOccurrences}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {area.area?.toLocaleString() || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            area.priority === "critical"
                              ? "bg-red-100 text-red-800"
                              : area.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : area.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {area.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {area.populationSize?.toLocaleString() || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(area.extinctionRisk * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Point Details: {selectedPoint.species}
            </h3>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {selectedPoint.coordinates.lat.toFixed(6)},{" "}
                {selectedPoint.coordinates.lng.toFixed(6)}
              </div>
              <div className="text-sm text-gray-600">Coordinates</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {selectedPoint.nearbyPointsCount}
              </div>
              <div className="text-sm text-gray-600">Nearby Points (25km)</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {selectedPoint.year || "Unknown"}
              </div>
              <div className="text-sm text-gray-600">Observation Year</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 capitalize">
                {selectedPoint.dataQuality.replace("_", " ")}
              </div>
              <div className="text-sm text-gray-600">Data Quality</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Location Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium">{selectedPoint.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Province:</span>
                  <span className="font-medium">
                    {selectedPoint.stateProvince || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locality:</span>
                  <span className="font-medium">
                    {selectedPoint.locality || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Density Category:</span>
                  <span
                    className={`font-medium capitalize ${
                      selectedPoint.densityCategory === "very_high" ||
                      selectedPoint.densityCategory === "high"
                        ? "text-red-600"
                        : selectedPoint.densityCategory === "medium"
                        ? "text-orange-600"
                        : selectedPoint.densityCategory === "low"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedPoint.densityCategory.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Data Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recorded By:</span>
                  <span className="font-medium">
                    {selectedPoint.recordedBy || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Institution:</span>
                  <span className="font-medium">
                    {selectedPoint.institutionCode || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Basis of Record:</span>
                  <span className="font-medium">
                    {selectedPoint.basisOfRecord || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordinate Uncertainty:</span>
                  <span className="font-medium">
                    {selectedPoint.coordinateUncertaintyInMeters
                      ? `±${(
                          selectedPoint.coordinateUncertaintyInMeters / 1000
                        ).toFixed(1)}km`
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GBIF Key:</span>
                  <span className="font-medium">{selectedPoint.gbifKey}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Area Details */}
      {selectedArea && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Area Details: {selectedArea.name}
            </h3>
            <button
              onClick={() => setSelectedArea(null)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {selectedArea.area?.toLocaleString() || "N/A"}
              </div>
              <div className="text-sm text-gray-600">Area (Hectares)</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {selectedArea.populationSize?.toLocaleString() || "N/A"}
              </div>
              <div className="text-sm text-gray-600">Est. Population Size</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(selectedArea.extinctionRisk * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Extinction Risk</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 capitalize">
                {selectedArea.priority.replace("_", " ")}
              </div>
              <div className="text-sm text-gray-600">Conservation Priority</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Area Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {selectedArea.type === "density_cluster"
                      ? "Density Cluster"
                      : "Isolated Point Habitat"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Species:</span>
                  <span className="font-medium">
                    {selectedArea.species.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium">
                    {selectedArea.countries?.[0] || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Province:</span>
                  <span className="font-medium">
                    {selectedArea.provinces?.[0] || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Occurrences:</span>
                  <span className="font-medium">
                    {selectedArea.totalOccurrences}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Observation Density:</span>
                  <span className="font-medium">
                    {selectedArea.observationDensity?.toFixed(2)} occurrences/km²
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Analysis Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Genetic Diversity:</span>
                  <span className="font-medium">
                    {(selectedArea.geneticDiversity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency Score:</span>
                  <span className="font-medium">
                    {(selectedArea.urgency * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threat Level:</span>
                  <span className="font-medium capitalize">
                    {selectedArea.threatLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temporal Coverage:</span>
                  <span className="font-medium">
                    {selectedArea.temporalCoverage.minYear} -{" "}
                    {selectedArea.temporalCoverage.maxYear} (
                    {selectedArea.temporalCoverage.span} years)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Quality:</span>
                  <span className="font-medium capitalize">
                    {selectedArea.dataQuality.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Protection Status:</span>
                  <span className="font-medium">
                    {selectedArea.protectionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Recommendations:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {conservationData.conservationActions
                .filter(action => action.location === selectedArea.name)
                .map((action, idx) => (
                  <li key={idx}>
                    <span className="font-bold capitalize">{action.priority}:</span> {action.action} (Reason: {action.rationale})
                  </li>
                ))}
              {conservationData.conservationActions.filter(action => action.location === selectedArea.name).length === 0 && (
                <li>No specific recommendations for this area at this time.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-blue-600">
            {conservationData.individualPoints?.length || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">
            Total Individual Points
          </div>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-green-600">
            {conservationData.conservationLocations?.length || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">
            Identified Conservation Areas
          </div>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-red-600">
            {conservationData.densityAnalysis?.densityCategories?.very_high
              ?.length +
              conservationData.densityAnalysis?.densityCategories?.high
                ?.length || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">
            High Density Occurrences
          </div>
        </div>

        <div className="bg-white p-3 lg:p-4 rounded-lg shadow text-center">
          <div className="text-xl lg:text-2xl font-bold text-purple-600">
            {conservationData.densityAnalysis?.clusters?.length || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">
            Total Density Clusters
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h4 className="text-sm lg:text-base font-medium text-gray-900 mb-2 sm:mb-0">
            Export Conservation Report
          </h4>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => {
                const data = JSON.stringify(conservationData, null, 2);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "conservation_analysis.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Download Report
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Print Summary
            </button>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Conservation Insights & Recommendations
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Density Insights */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Density Analysis Insights
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {conservationData?.densityAnalysis?.clusters?.length > 0 ? (
                <>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>
                        {(
                          conservationData.densityAnalysis.densityCategories
                            .high.length +
                          conservationData.densityAnalysis.densityCategories
                            .very_high.length
                        ).toLocaleString()}
                      </strong>{" "}
                      high density points identified across{" "}
                      {conservationData.densityAnalysis.clusters.length}{" "}
                      clusters
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>
                        {conservationData.densityAnalysis.densityCategories.very_low.length.toLocaleString()}
                      </strong>{" "}
                      isolated occurrences need special monitoring
                    </span>
                  </li>
                  {Object.entries(
                    conservationData.densityAnalysis.speciesDistribution
                  ).map(([species, data]) => (
                    <li key={species} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>
                        <strong>{species.split(" ")[1]}:</strong>{" "}
                        {data.densityCategories.high +
                          data.densityCategories.very_high}{" "}
                        high density areas
                      </span>
                    </li>
                  ))}
                </>
              ) : (
                <li className="text-gray-500">
                  No density clusters available for analysis
                </li>
              )}
            </ul>
          </div>

          {/* Genetic Diversity Insights */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="font-medium text-green-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Genetic Diversity Insights
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {Object.entries(conservationData?.genomicData || {}).map(
                ([species, samples]) => {
                  const avgDiversity =
                    samples.reduce(
                      (sum, sample) => sum + sample.geneticDiversity,
                      0
                    ) / samples.length;
                  return (
                    <li key={species} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>
                        <strong>{species.split(" ")[1]}:</strong> Genetic
                        diversity{" "}
                        {avgDiversity < 0.5 ? (
                          <span className="text-red-600">
                            low ({avgDiversity.toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-green-600">
                            moderate ({avgDiversity.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                }
              )}
            </ul>
          </div>

          {/* Priority Recommendations */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Priority Conservation Actions
            </h4>
            <ul className="space-y-3">
              {conservationData?.conservationActions
                ?.slice(0, 3)
                .map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span
                      className={`flex-shrink-0 mt-1 mr-2 ${
                        action.priority === "critical"
                          ? "text-red-500"
                          : action.priority === "high"
                          ? "text-orange-500"
                          : "text-yellow-500"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="font-medium">{action.action}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {action.rationale}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Monitoring Recommendations */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Monitoring Recommendations
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>
                  Increase monitoring in isolated occurrence areas (n=
                  {conservationData?.densityAnalysis?.densityCategories
                    ?.very_low?.length || 0}
                  )
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Validate high density clusters with field surveys</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>
                  Improve data quality for points marked as low precision
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConservationPriority;