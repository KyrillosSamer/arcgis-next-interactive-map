"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import Graphic from "@arcgis/core/Graphic";
import { PencilRuler, Layers, AlertCircle } from "lucide-react";
import { MapWidgetsFactory, MapViewType, WidgetsStateType } from "../factories/MapWidgetsFactory";
import pointsData from "../data/data.json";

interface MapComponentProps {
  mapId?: string;
  onMapClick?: (event: __esri.ViewClickEvent) => void;
  onExtentChange?: (extent: __esri.Extent) => void;
}

const POINT_SIZE = 15;
const MAP_TITLE = "Interactive Map";

// Memoized constants outside component
const POINT_SYMBOL = {
  type: "simple-marker" as const,
  style: "circle" as const,
  color: "red",
  size: POINT_SIZE,
  outline: { color: "white", width: 2 },
};

const POPUP_TEMPLATE = {
  title: "{name}",
  content: "ID: {id}",
};

export default function MapComponent({ mapId, onMapClick, onExtentChange }: MapComponentProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapViewType | null>(null);
  const widgetsRef = useRef<WidgetsStateType>({});
  const toolsOpenRef = useRef(false);
  const basemapOpenRef = useRef(false);
  
  // Use state only for UI re-renders
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [basemapOpen, setBasemapOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // -------------------------
  // Calculate Bounds Safely
  // -------------------------
  const calculateBounds = useCallback((points: typeof pointsData) => {
    if (!points || points.length === 0) {
      throw new Error("No points data available");
    }

    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;

    points.forEach((point) => {
      if (!point.coordinates || point.coordinates.length < 2) {
        console.warn("Invalid point coordinates:", point);
        return;
      }

      const [lon, lat] = point.coordinates;

      if (typeof lon !== 'number' || typeof lat !== 'number' || 
          isNaN(lon) || isNaN(lat)) {
        console.warn("Invalid coordinate values:", point);
        return;
      }

      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (!isFinite(minLon) || !isFinite(maxLon) || 
        !isFinite(minLat) || !isFinite(maxLat)) {
      throw new Error("Invalid bounds calculated from points");
    }

    return [[minLon, minLat], [maxLon, maxLat]];
  }, []);

  // -------------------------
  // Add Points to Layer
  // -------------------------
  const addPointsToLayer = useCallback((graphicsLayer: __esri.GraphicsLayer) => {
    pointsData.forEach((point) => {
      if (!point.coordinates || point.coordinates.length < 2) {
        console.warn("Skipping invalid point:", point);
        return;
      }

      const [lon, lat] = point.coordinates;

      if (typeof lon !== 'number' || typeof lat !== 'number' || 
          isNaN(lon) || isNaN(lat)) {
        console.warn("Skipping point with invalid coordinates:", point);
        return;
      }

      graphicsLayer.add(new Graphic({
        geometry: { type: "point", longitude: lon, latitude: lat },
        symbol: POINT_SYMBOL,
        attributes: point,
        popupTemplate: POPUP_TEMPLATE,
      }));
    });

    return calculateBounds(pointsData);
  }, [calculateBounds]);

  // -------------------------
  // Initialize Map
  // -------------------------
  const initializeMap = useCallback(async () => {
    if (!mapDivRef.current) {
      throw new Error("Map container not found");
    }

    try {
      const map = MapWidgetsFactory.createMap("streets-vector");
      const graphicsLayer = MapWidgetsFactory.createGraphicsLayer("draw-layer");
      map.add(graphicsLayer);

      const mapView = MapWidgetsFactory.createMapView(mapDivRef.current, map);
      const createdWidgets = MapWidgetsFactory.createAllWidgets(mapView, graphicsLayer);

      // Store in refs
      viewRef.current = mapView;
      widgetsRef.current = createdWidgets;

      // Add default widgets to UI
      mapView.ui.add(createdWidgets.home!, "top-left");
      mapView.ui.add(createdWidgets.compass!, "top-left");
      mapView.ui.add(createdWidgets.locate!, "top-left");
      mapView.ui.add(createdWidgets.search!, "top-right");
      mapView.ui.add(createdWidgets.fullscreen!, "top-right");
      mapView.ui.add(createdWidgets.scaleBar!, "bottom-right");
      mapView.ui.add(createdWidgets.coordinateConversion!, "bottom-left");

      return { mapView, graphicsLayer };
    } catch (err) {
      throw new Error(`Map initialization failed: ${err}`);
    }
  }, []);

  // -------------------------
  // Effect: Initialize Map & Points
  // -------------------------
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        setLoading(true);
        setError(null);

        const mapData = await initializeMap();
        if (!mapData || !mounted) return;

        const { mapView, graphicsLayer } = mapData;
        const bounds = addPointsToLayer(graphicsLayer);

        // Event listeners
        if (onMapClick) {
          mapView.on("click", onMapClick);
        }
        
        if (onExtentChange) {
          mapView.watch("extent", (ext) => onExtentChange(ext));
        }

        // Zoom to bounds
        await mapView.when();
        if (mounted) {
          await mapView.goTo({ target: bounds });
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error occurred");
          setLoading(false);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      // Proper cleanup
      if (widgetsRef.current) {
        MapWidgetsFactory.destroyWidgets(widgetsRef.current);
        widgetsRef.current = {};
      }
      if (viewRef.current) {
        MapWidgetsFactory.destroyView(viewRef.current);
        viewRef.current = null;
      }
    };
  }, [initializeMap, addPointsToLayer, onMapClick, onExtentChange]);

  // -------------------------
  // Effect: Toggle Basemap Gallery
  // -------------------------
  useEffect(() => {
    const view = viewRef.current;
    const basemapGallery = widgetsRef.current.basemapGallery;
    
    if (!view || !basemapGallery) return;

    if (basemapOpen) {
      view.ui.add(basemapGallery, "bottom-right");
    } else {
      view.ui.remove(basemapGallery);
    }

    basemapOpenRef.current = basemapOpen;
  }, [basemapOpen]);

  // -------------------------
  // Effect: Toggle Measurement & Sketch
  // -------------------------
  useEffect(() => {
    const view = viewRef.current;
    const measurement = widgetsRef.current.measurement;
    const sketch = widgetsRef.current.sketch;
    
    if (!view || !measurement || !sketch) return;

    if (toolsOpen) {
      view.ui.add(measurement, "bottom-right");
      view.ui.add(sketch, "bottom-right");
    } else {
      view.ui.remove(measurement);
      view.ui.remove(sketch);
    }

    toolsOpenRef.current = toolsOpen;
  }, [toolsOpen]);

  // -------------------------
  // Handlers
  // -------------------------
  const handleToolsToggle = useCallback(() => {
    setToolsOpen(prev => !prev);
  }, []);

  const handleBasemapToggle = useCallback(() => {
    setBasemapOpen(prev => !prev);
  }, []);

  // -------------------------
  // Render
  // -------------------------
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Map Loading Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading Map...</p>
          </div>
        </div>
      )}

      {/* Map Title */}
      <div className="absolute top-0 left-0 w-full bg-blue-900 text-white text-2xl font-bold text-center py-2 shadow-md z-40">
        {MAP_TITLE}
      </div>

      {/* Map Container */}
      <div 
        ref={mapDivRef} 
        id={mapId || "mapDiv"} 
        className="absolute top-12 w-full h-[calc(100%-3rem)]" 
      />

      {/* Tools Button */}
      <button
        onClick={handleToolsToggle}
        className="absolute bottom-20 right-5 w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-md hover:bg-gray-100 z-40 transition-colors"
        title="Measurement & Drawing"
        aria-label="Toggle measurement and drawing tools"
      >
        <PencilRuler 
          size={22} 
          className={toolsOpen ? "text-blue-600" : "text-gray-800"} 
          strokeWidth={2} 
        />
      </button>

      {/* Basemap Gallery Button */}
      <button
        onClick={handleBasemapToggle}
        className="absolute bottom-32 right-5 w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-md hover:bg-gray-100 z-40 transition-colors"
        title="Basemap Gallery"
        aria-label="Toggle basemap gallery"
      >
        <Layers 
          size={22} 
          className={basemapOpen ? "text-blue-600" : "text-gray-800"}
        />
      </button>
    </div>
  );
}
