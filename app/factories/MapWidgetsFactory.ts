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

// ===============================
// Map Widgets Factory
// ===============================
export class MapWidgetsFactory {
  // -------------------------
  // Core Map & View
  // -------------------------
  static createMap(basemap: string = "streets-vector"): Map {
    return new Map({ basemap });
  }

  static createMapView(
    container: HTMLDivElement,
    map: Map,
    config: { center?: [number, number]; zoom?: number } = {}
  ): MapView {
    return new MapView({
      container,
      map,
      center: config.center || [31.2, 28.0],
      zoom: config.zoom || 6,
    });
  }

  static createGraphicsLayer(id: string): GraphicsLayer {
    return new GraphicsLayer({ id });
  }

  // -------------------------
  // Widgets Creators
  // -------------------------
  static createHomeWidget(view: MapView) {
    return new Home({ view });
  }

  static createCompassWidget(view: MapView) {
    return new Compass({ view });
  }

  static createLocateWidget(view: MapView) {
    return new Locate({
      view,
      goToOverride: (view, options) => {
        options.target.scale = 1500;
        return view.goTo(options.target);
      },
    });
  }

  static createSearchWidget(view: MapView) {
    return new Search({
      view,
      popupEnabled: false,
      resultGraphicEnabled: true,
    });
  }

  static createScaleBarWidget(view: MapView) {
    return new ScaleBar({
      view,
      unit: "metric",
      style: "line",
    });
  }

  static createFullscreenWidget(view: MapView) {
    return new Fullscreen({ view });
  }

  static createBasemapGallery(view: MapView) {
    return new BasemapGallery({ view });
  }

  static createCoordinateConversionWidget(view: MapView) {
    return new CoordinateConversion({ view });
  }

  static createMeasurementWidget(view: MapView) {
    return new Measurement({ view });
  }

  static createSketchWidget(view: MapView, layer: GraphicsLayer) {
    return new Sketch({
      view,
      layer,
      creationMode: "update",
    });
  }

  // -------------------------
  // Widgets Setup (NO UI logic)
  // -------------------------
  static setupAllWidgets(
    view: MapView,
    graphicsLayer?: GraphicsLayer
  ): WidgetsState {
    const home = this.createHomeWidget(view);
    const compass = this.createCompassWidget(view);
    const locate = this.createLocateWidget(view);
    const search = this.createSearchWidget(view);
    const scaleBar = this.createScaleBarWidget(view);
    const fullscreen = this.createFullscreenWidget(view);
    const basemapGallery = this.createBasemapGallery(view);
    const coordinateConversion = this.createCoordinateConversionWidget(view);
    const measurement = this.createMeasurementWidget(view);

    const sketch = graphicsLayer
      ? this.createSketchWidget(view, graphicsLayer)
      : undefined;

    // Default UI widgets only
    view.ui.add(home, "top-left");
    view.ui.add(compass, "top-left");
    view.ui.add(locate, "top-left");
    view.ui.add(search, "top-right");
    view.ui.add(fullscreen, "top-right");
    view.ui.add(scaleBar, "bottom-right");
    view.ui.add(coordinateConversion, "bottom-left");

    return {
      home,
      compass,
      locate,
      search,
      scaleBar,
      fullscreen,
      basemapGallery,
      coordinateConversion,
      measurement,
      sketch,
    };
  }

  // -------------------------
  // Cleanup
  // -------------------------
  static destroyWidgets(widgets: any[]) {
    widgets.forEach((w) => w?.destroy?.());
  }
}

// ===============================
// Type Exports
// ===============================
export type MapViewType = MapView;
export type WidgetsStateType = WidgetsState;
export type MapType = Map;
