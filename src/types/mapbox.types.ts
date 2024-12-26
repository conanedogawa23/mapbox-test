// Mapbox API Response Types

export interface Coordinate {
  longitude: number;
  latitude: number;
}

export interface OptimizedRouteResponse {
  code: string;
  waypoints: Array<{
    location: [number, number];
    name: string;
    trips_index: number;
    waypoint_index: number;
  }>;
  trips: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
      type: string;
    };
    duration: number;
    distance: number;
    weight: number;
    weight_name: string;
  }>;
}

export interface ElevationResponse {
  features: Array<{
    type: string;
    properties: {
      ele: number;
    };
    geometry: {
      type: string;
      coordinates: [number, number];
    };
  }>;
}

export interface GeocodeResult {
  type: string;
  id: string;
  place_name: string;
  place_type: string[];
  relevance: number;
  properties: {
    short_code?: string;
    wikidata?: string;
  };
  text: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
    wikidata?: string;
  }>;
}

export interface DistanceMatrixResponse {
  code: string;
  destinations: Array<{
    name: string;
    location: [number, number];
  }>;
  sources: Array<{
    name: string;
    location: [number, number];
  }>;
  distances: number[][];
  durations: number[][];
  annotations?: {
    distance?: number[][];
    duration?: number[][];
    speed?: number[][];
  };
}

export interface MapboxErrorResponse {
  code: string;
  message: string;
}

export interface MapboxRequestOptions {
  accessToken: string;
  profile?: "driving" | "walking" | "cycling";
  geometries?: "geojson" | "polyline" | "polyline6";
  overview?: "simplified" | "full" | "false";
  annotations?: string[];
}
