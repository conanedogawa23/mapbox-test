import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../config/logger';
import { 
  OptimizedRouteResponse, 
  ElevationResponse, 
  GeocodeResult, 
  DistanceMatrixResponse 
} from '../types/mapbox.types';

class MapboxService {
  private readonly MAPBOX_BASE_URL = 'https://api.mapbox.com';
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      logger.error('Mapbox access token not provided');
      throw new Error('Mapbox access token is required');
    }
    this.accessToken = accessToken;

    // Configure axios-retry for robust API calls
    axiosRetry(axios, {
      retries: 3, 
      retryDelay: axiosRetry.exponentialDelay, 
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               error.response?.status === 429; 
      },
      onRetry: (retryCount, error) => {
        logger.warn(`Retry attempt ${retryCount} for Mapbox API call`);
      }
    });
  }

  /**
   * Optimize a route with given waypoints
   * @param waypoints Array of [longitude, latitude] coordinates
   * @returns Optimized route response
   */
  async getOptimizedRoute(
    waypoints: [number, number][] 
  ): Promise<OptimizedRouteResponse> {
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      throw new Error('Invalid waypoints. Minimum 2 coordinates required.');
    }

    const coordinates = waypoints.map((coord) => coord.join(',')).join(';');
    const url = `${this.MAPBOX_BASE_URL}/optimized-trips/v1/mapbox/driving/${coordinates}`;

    try {
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          geometries: 'geojson',
        },
      });
      logger.info(`Route optimized for ${waypoints.length} waypoints`);
      return response.data;
    } catch (error: any) {
      logger.error(`Route optimization error: ${error.message}`, {
        waypoints,
        status: error.response?.status
      });
      throw new Error('Failed to optimize route'); 
    }
  }

  /**
   * Get elevation for a specific coordinate
   * @param longitude 
   * @param latitude 
   * @returns Elevation in meters
   */
  async getElevation(
    longitude: number, 
    latitude: number
  ): Promise<number> {
    const url = `${this.MAPBOX_BASE_URL}/v4/mapbox.mapbox-terrain-v2/tilequery/${longitude},${latitude}.json`;

    try {
      const response = await axios.get<ElevationResponse>(url, {
        params: {
          access_token: this.accessToken,
          layers: 'contour',
          limit: 1,
        },
      });
      
      const features = response.data.features;
      if (features.length > 0) {
        return features[0].properties.ele;
      }
      
      logger.warn(`No elevation data for coordinates: ${longitude}, ${latitude}`);
      return 0; // Default to 0 if no elevation found
    } catch (error: any) {
      logger.error(`Elevation fetch error: ${error.message}`, {
        coordinates: `${longitude}, ${latitude}`,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch elevation`); 
    }
  }

  /**
   * Batch geocode multiple locations
   * @param locations Array of location names or addresses
   * @returns Geocoded results
   */
  async batchGeocode(
    locations: string[]
  ): Promise<GeocodeResult[]> {
    if (!Array.isArray(locations) || locations.length === 0) {
      throw new Error('Invalid locations. Non-empty array required.');
    }

    const url = `${this.MAPBOX_BASE_URL}/geocoding/v5/mapbox.places-permanent`;

    try {
      const geocodePromises = locations.map(async (location) => {
        const response = await axios.get(url, {
          params: {
            access_token: this.accessToken,
            q: location,
            limit: 1,
          },
        });
        return response.data.features[0];
      });

      const results = await Promise.all(geocodePromises);
      logger.info(`Geocoded ${results.length} locations`);
      return results;
    } catch (error: any) {
      logger.error(`Batch geocoding error: ${error.message}`, {
        locationCount: locations.length,
        status: error.response?.status
      });
      throw new Error('Failed to geocode locations');
    }
  }

  /**
   * Calculate distance matrix between points
   * @param points Array of [longitude, latitude] coordinates
   * @returns Distance matrix response
   */
  async getDistanceMatrix(
    points: [number, number][]
  ): Promise<DistanceMatrixResponse> {
    if (!Array.isArray(points) || points.length < 2) {
      throw new Error('Invalid points. Minimum 2 coordinates required.');
    }

    const coordinates = points.map((coord) => coord.join(',')).join(';');
    const url = `${this.MAPBOX_BASE_URL}/distances/v1/mapbox/driving/${coordinates}`;

    try {
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          annotations: 'duration,distance',
        },
      });
      logger.info(`Distance matrix calculated for ${points.length} points`);
      return response.data;
    } catch (error: any) {
      logger.error(`Distance matrix error: ${error.message}`, {
        pointCount: points.length,
        status: error.response?.status
      });
      throw new Error('Failed to fetch distance matrix');
    }
  }
}

export default MapboxService;