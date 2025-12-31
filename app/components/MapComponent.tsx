"use client";

import React, { useEffect, useRef, useState } from "react";
import Graphic from "@arcgis/core/Graphic";
import { PencilRuler, Layers } from "lucide-react";
import { MapWidgetsFactory, MapViewType, WidgetsStateType } from "../factories/MapWidgetsFactory";
import pointsData from "../data/data.json";

interface MapComponentProps {
  mapId?: string;
  onMapClick?: (event: __esri.ViewClickEvent) => void;
  onExtentChange?: (extent: __esri.Extent) => void;
}

export default function MapComponent({ mapId, onMapClick, onExtentChange }: MapComponentProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapViewType | null>(null);
  const [widgets, setWidgets] = useState<WidgetsStateType>({});
  const [toolsOpen, setToolsOpen] = useState(false);
  const [basemapOpen, setBasemapOpen] = useState(false);

  const POINT_SIZE = 15;
  const MAP_TITLE = "Interactive Map";

  // -------------------------
  // Initialize Map
  // -------------------------
  const initializeMap = () => {
    if (!mapDivRef.current) return null;

    const map = MapWidgetsFactory.createMap("streets-vector");
    const graphicsLayer = MapWidgetsFactory.createGraphicsLayer("draw-layer");
    map.add(graphicsLayer);

    const mapView = MapWidgetsFactory.createMapView(mapDivRef.current!, map);
    const createdWidgets = MapWidgetsFactory.setupAllWidgets(mapView, graphicsLayer);

    setView(mapView);
    setWidgets(createdWidgets);

    return { mapView, graphicsLayer };
  };

  // -------------------------
  // Add Points and Calculate Bounds
  // -------------------------
  const addPointsToLayer = (graphicsLayer: __esri.GraphicsLayer) => {
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

    pointsData.forEach((point) => {
      const [lon, lat] = point.coordinates;

      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);

      graphicsLayer.add(new Graphic({
        geometry: { type: "point", longitude: lon, latitude: lat },
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "red",
          size: POINT_SIZE,
          outline: { color: "white", width: 2 },
        },
        attributes: point,
        popupTemplate: { title: "{name}", content: "ID: {id}" },
      }));
    });

    return [[minLon, minLat], [maxLon, maxLat]];
  };

  // -------------------------
  // Effect: Initialize Map & Points
  // -------------------------
  useEffect(() => {
    const mapData = initializeMap();
    if (!mapData) return;

    const { mapView, graphicsLayer } = mapData;
    const bounds = addPointsToLayer(graphicsLayer);

    if (onMapClick) mapView.on("click", onMapClick);
    if (onExtentChange) mapView.watch("extent", (ext) => onExtentChange(ext));

    mapView.when(() => {
      mapView.goTo({ target: bounds });
    });

    return () => {
      MapWidgetsFactory.destroyWidgets(Object.values(widgets));
      mapView.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Effect: Toggle Basemap Gallery
  // -------------------------
  useEffect(() => {
    if (!view || !widgets.basemapGallery) return;

    basemapOpen
      ? view.ui.add(widgets.basemapGallery, "bottom-right")
      : view.ui.remove(widgets.basemapGallery);
  }, [basemapOpen, view, widgets.basemapGallery]);

  // -------------------------
  // Effect: Toggle Measurement & Sketch
  // -------------------------
  useEffect(() => {
    if (!view || !widgets.measurement || !widgets.sketch) return;

    toolsOpen
      ? (view.ui.add(widgets.measurement, "bottom-right"), view.ui.add(widgets.sketch, "bottom-right"))
      : (view.ui.remove(widgets.measurement), view.ui.remove(widgets.sketch));
  }, [toolsOpen, view, widgets.measurement, widgets.sketch]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="relative w-full h-screen">
      {/* Map Title */}
      <div className="absolute top-0 left-0 w-full bg-blue-900 text-white text-2xl font-bold text-center py-2 shadow-md z-50">
        {MAP_TITLE}
      </div>

      {/* Map Container */}
      <div ref={mapDivRef} id={mapId || "mapDiv"} className="absolute top-12 w-full h-[calc(100%-3rem)]" />

      {/* Tools Button */}
      <button
        onClick={() => setToolsOpen((v) => !v)}
        className="absolute bottom-20 right-5 w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-md hover:bg-gray-100 z-50"
        title="Measurement & Drawing"
      >
        <PencilRuler size={22} className={toolsOpen ? "text-blue-600" : "text-gray-800"} strokeWidth={2} />
      </button>

      {/* Basemap Gallery Button */}
      <button
        onClick={() => setBasemapOpen((v) => !v)}
        className="absolute bottom-32 right-5 w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-md hover:bg-gray-100 z-50"
        title="Basemap Gallery"
      >
        <Layers size={22} />
      </button>
    </div>
  );
}
