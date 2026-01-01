import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import Home from "@arcgis/core/widgets/Home";
import Compass from "@arcgis/core/widgets/Compass";
import Locate from "@arcgis/core/widgets/Locate";
import Search from "@arcgis/core/widgets/Search";
import ScaleBar from "@arcgis/core/widgets/ScaleBar";
import Fullscreen from "@arcgis/core/widgets/Fullscreen";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import CoordinateConversion from "@arcgis/core/widgets/CoordinateConversion";
import Measurement from "@arcgis/core/widgets/Measurement";
import Sketch from "@arcgis/core/widgets/Sketch";

// ===============================
// Widget Types
// ===============================
export interface WidgetsState {
  home?: Home;
  compass?: Compass;
  locate?: Locate;
  search?: Search;
  scaleBar?: ScaleBar;
  fullscreen?: Fullscreen;
  basemapGallery?: BasemapGallery;
  coordinateConversion?: CoordinateConversion;
  measurement?: Measurement;
  sketch?: Sketch;
}

export interface MapConfig {
  center?: [number, number];
  zoom?: number;
}

export interface MapInitResult {
  map: Map;
  view: MapView;
  graphicsLayer: GraphicsLayer;
}

// ===============================
// Map Widgets Factory
// ===============================
export class MapWidgetsFactory {
  // -------------------------
  // Core Map & View
  // -------------------------
  static createMap(basemap: string = "streets-vector"): Map {
    try {
      return new Map({ basemap });
    } catch (error) {
      throw new Error(`Failed to create map: ${error}`);
    }
  }

  static createMapView(
    container: HTMLDivElement,
    map: Map,
    config: MapConfig = {}
  ): MapView {
    try {
      return new MapView({
        container,
        map,
        center: config.center || [31.2, 28.0],
        zoom: config.zoom || 6,
      });
    } catch (error) {
      throw new Error(`Failed to create map view: ${error}`);
    }
  }

  static createGraphicsLayer(id: string): GraphicsLayer {
    try {
      return new GraphicsLayer({ id });
    } catch (error) {
      throw new Error(`Failed to create graphics layer: ${error}`);
    }
  }

  // -------------------------
  // Widgets Creators (Pure Factory - No UI Logic)
  // -------------------------
  static createHomeWidget(view: MapView): Home {
    try {
      return new Home({ view });
    } catch (error) {
      throw new Error(`Failed to create home widget: ${error}`);
    }
  }

  static createCompassWidget(view: MapView): Compass {
    try {
      return new Compass({ view });
    } catch (error) {
      throw new Error(`Failed to create compass widget: ${error}`);
    }
  }

  static createLocateWidget(view: MapView): Locate {
    try {
      return new Locate({
        view,
        goToOverride: (view, options) => {
          options.target.scale = 1500;
          return view.goTo(options.target);
        },
      });
    } catch (error) {
      throw new Error(`Failed to create locate widget: ${error}`);
    }
  }

  static createSearchWidget(view: MapView): Search {
    try {
      return new Search({
        view,
        popupEnabled: false,
        resultGraphicEnabled: true,
      });
    } catch (error) {
      throw new Error(`Failed to create search widget: ${error}`);
    }
  }

  static createScaleBarWidget(view: MapView): ScaleBar {
    try {
      return new ScaleBar({
        view,
        unit: "metric",
        style: "line",
      });
    } catch (error) {
      throw new Error(`Failed to create scale bar widget: ${error}`);
    }
  }

  static createFullscreenWidget(view: MapView): Fullscreen {
    try {
      return new Fullscreen({ view });
    } catch (error) {
      throw new Error(`Failed to create fullscreen widget: ${error}`);
    }
  }

  static createBasemapGallery(view: MapView): BasemapGallery {
    try {
      return new BasemapGallery({ view });
    } catch (error) {
      throw new Error(`Failed to create basemap gallery: ${error}`);
    }
  }

  static createCoordinateConversionWidget(view: MapView): CoordinateConversion {
    try {
      return new CoordinateConversion({ view });
    } catch (error) {
      throw new Error(`Failed to create coordinate conversion widget: ${error}`);
    }
  }

  static createMeasurementWidget(view: MapView): Measurement {
    try {
      return new Measurement({ view });
    } catch (error) {
      throw new Error(`Failed to create measurement widget: ${error}`);
    }
  }

  static createSketchWidget(view: MapView, layer: GraphicsLayer): Sketch {
    try {
      return new Sketch({
        view,
        layer,
        creationMode: "update",
      });
    } catch (error) {
      throw new Error(`Failed to create sketch widget: ${error}`);
    }
  }

  // -------------------------
  // Widgets Setup (Only Creates - NO UI Positioning)
  // -------------------------
  static createAllWidgets(
    view: MapView,
    graphicsLayer?: GraphicsLayer
  ): WidgetsState {
    try {
      const widgets: WidgetsState = {
        home: this.createHomeWidget(view),
        compass: this.createCompassWidget(view),
        locate: this.createLocateWidget(view),
        search: this.createSearchWidget(view),
        scaleBar: this.createScaleBarWidget(view),
        fullscreen: this.createFullscreenWidget(view),
        basemapGallery: this.createBasemapGallery(view),
        coordinateConversion: this.createCoordinateConversionWidget(view),
        measurement: this.createMeasurementWidget(view),
      };

      if (graphicsLayer) {
        widgets.sketch = this.createSketchWidget(view, graphicsLayer);
      }

      return widgets;
    } catch (error) {
      throw new Error(`Failed to create widgets: ${error}`);
    }
  }

  // -------------------------
  // Cleanup with Type Safety
  // -------------------------
  static destroyWidgets(widgets: WidgetsState): void {
    Object.values(widgets).forEach((widget) => {
      try {
        if (widget && typeof widget.destroy === 'function') {
          widget.destroy();
        }
      } catch (error) {
        console.error('Failed to destroy widget:', error);
      }
    });
  }

  static destroyView(view: MapView | null): void {
    if (view && typeof view.destroy === 'function') {
      try {
        view.destroy();
      } catch (error) {
        console.error('Failed to destroy view:', error);
      }
    }
  }
}

// ===============================
// Type Exports
// ===============================
export type MapViewType = MapView;
export type WidgetsStateType = WidgetsState;
export type MapType = Map;
