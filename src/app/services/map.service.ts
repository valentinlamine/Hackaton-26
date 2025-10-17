import { Injectable } from '@angular/core';
import { PhotoService, UserPhoto } from './photo';
import { Geolocation } from '@capacitor/geolocation';

export interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  photos: UserPhoto[];
  previewPhoto: UserPhoto;
  zoom: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  photo: UserPhoto;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: any = null;
  private clusters: MapCluster[] = [];
  private markers: MapMarker[] = [];
  private readonly MIN_DISTANCE = 50; // 50m minimum distance between markers
  private readonly CLUSTER_RADIUS = 100; // 100m radius for clustering (increased for better grouping)
  private userLocation: { latitude: number; longitude: number } | null = null;

  constructor(private photoService: PhotoService) {}

  // Get user location with caching
  async getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    // Return cached location if available
    if (this.userLocation) {
      return this.userLocation;
    }

    try {
      // Check if location is cached in localStorage
      const cachedLocation = localStorage.getItem('userLocation');
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        // Check if cache is less than 1 hour old
        if (Date.now() - location.timestamp < 3600000) {
          this.userLocation = { latitude: location.latitude, longitude: location.longitude };
          return this.userLocation;
        }
      }

      // Get current location
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });

      const location = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };

      // Cache the location
      this.userLocation = location;
      localStorage.setItem('userLocation', JSON.stringify({
        ...location,
        timestamp: Date.now()
      }));

      return location;
    } catch (error) {
      console.warn('Could not get user location:', error);
      return null;
    }
  }

  // Center map on user location
  async centerMapOnUserLocation(): Promise<void> {
    if (!this.map) return;

    const location = await this.getUserLocation();
    if (location) {
      this.map.setCenter([location.longitude, location.latitude]);
      this.map.setZoom(12); // Zoom level for city view
    }
  }

  initializeMap(container: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Dynamically import mapbox-gl
      import('mapbox-gl').then((mapboxgl) => {
        mapboxgl.default.accessToken = token;
        
        this.map = new mapboxgl.default.Map({
          container: container,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark style
          center: [5.3698, 43.2965], // Aix-en-Provence center (fallback)
          zoom: 10
        });

        this.map.on('load', async () => {
          // Try to center on user location
          await this.centerMapOnUserLocation();
          resolve(this.map);
        });

        this.map.on('error', (error: any) => {
          reject(error);
        });
      }).catch(reject);
    });
  }

  updatePhotos(): void {
    if (!this.map) return;

    const photosWithLocation = this.photoService.photos.filter(photo => 
      photo.metadata?.latitude && photo.metadata?.longitude
    );

    console.log('[MapService] Total photos:', this.photoService.photos.length);
    console.log('[MapService] Photos with location:', photosWithLocation.length);
    console.log('[MapService] Photos with location data:', photosWithLocation);

    this.createClusters(photosWithLocation);
    this.updateMapMarkers();
  }

  private createClusters(photos: UserPhoto[]): void {
    this.clusters = [];
    this.markers = [];

    console.log('[MapService] Creating clusters from', photos.length, 'photos');

    // Group photos by proximity
    const processedPhotos = new Set<string>();
    
    for (const photo of photos) {
      if (processedPhotos.has(photo.filepath)) continue;

      const nearbyPhotos = this.findNearbyPhotos(photo, photos, processedPhotos);
      
      console.log('[MapService] Photo', photo.filepath, 'has', nearbyPhotos.length, 'nearby photos');
      
      if (nearbyPhotos.length > 1) {
        // Create cluster
        const cluster = this.createCluster(nearbyPhotos);
        this.clusters.push(cluster);
        console.log('[MapService] Created cluster with', cluster.photos.length, 'photos');
        nearbyPhotos.forEach(p => processedPhotos.add(p.filepath));
      } else {
        // Create individual marker
        const marker = this.createMarker(photo);
        this.markers.push(marker);
        console.log('[MapService] Created individual marker for', photo.filepath);
        processedPhotos.add(photo.filepath);
      }
    }

    console.log('[MapService] Final clusters:', this.clusters.length);
    console.log('[MapService] Final markers:', this.markers.length);
  }

  private findNearbyPhotos(centerPhoto: UserPhoto, allPhotos: UserPhoto[], processed: Set<string>): UserPhoto[] {
    const nearby: UserPhoto[] = [centerPhoto];
    
    for (const photo of allPhotos) {
      if (processed.has(photo.filepath) || photo.filepath === centerPhoto.filepath) continue;
      
      const distance = this.calculateDistance(
        centerPhoto.metadata!.latitude!,
        centerPhoto.metadata!.longitude!,
        photo.metadata!.latitude!,
        photo.metadata!.longitude!
      );
      
      if (distance <= this.CLUSTER_RADIUS) {
        nearby.push(photo);
      }
    }
    
    return nearby;
  }

  private createCluster(photos: UserPhoto[]): MapCluster {
    // Calculate center of cluster
    const avgLat = photos.reduce((sum, p) => sum + p.metadata!.latitude!, 0) / photos.length;
    const avgLng = photos.reduce((sum, p) => sum + p.metadata!.longitude!, 0) / photos.length;
    
    // Get random preview photo
    const previewPhoto = photos[Math.floor(Math.random() * photos.length)];
    
    return {
      id: `cluster_${Date.now()}_${Math.random()}`,
      latitude: avgLat,
      longitude: avgLng,
      photos: photos,
      previewPhoto: previewPhoto,
      zoom: this.map.getZoom()
    };
  }

  private createMarker(photo: UserPhoto): MapMarker {
    return {
      id: `marker_${photo.filepath}`,
      latitude: photo.metadata!.latitude!,
      longitude: photo.metadata!.longitude!,
      photo: photo
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing sources and layers
    if (this.map.getSource('clusters')) {
      this.map.removeLayer('cluster-labels');
      this.map.removeLayer('cluster-count');
      this.map.removeLayer('unclustered-point');
      this.map.removeSource('clusters');
    }

    // Add clusters as GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: [
        ...this.clusters.map(cluster => ({
          type: 'Feature',
          properties: {
            id: cluster.id,
            photoCount: cluster.photos.length,
            previewPhoto: JSON.stringify(cluster.previewPhoto),
            photos: JSON.stringify(cluster.photos),
            isCluster: true
          },
          geometry: {
            type: 'Point',
            coordinates: [cluster.longitude, cluster.latitude]
          }
        })),
        ...this.markers.map(marker => ({
          type: 'Feature',
          properties: {
            id: marker.id,
            photo: JSON.stringify(marker.photo),
            isCluster: false
          },
          geometry: {
            type: 'Point',
            coordinates: [marker.longitude, marker.latitude]
          }
        }))
      ]
    };

    this.map.addSource('clusters', {
      type: 'geojson',
      data: geojson,
      cluster: false
    });

    // Add cluster markers
    this.map.addLayer({
      id: 'cluster-count',
      type: 'circle',
      source: 'clusters',
      filter: ['==', ['get', 'isCluster'], true],
      paint: {
        'circle-color': '#6366f1',
        'circle-radius': 20,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add cluster labels
    this.map.addLayer({
      id: 'cluster-labels',
      type: 'symbol',
      source: 'clusters',
      filter: ['==', ['get', 'isCluster'], true],
      layout: {
        'text-field': ['get', 'photoCount'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });

    // Add individual markers
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'clusters',
      filter: ['==', ['get', 'isCluster'], false],
      paint: {
        'circle-color': '#ef4444',
        'circle-radius': 15,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handlers
    this.map.on('click', 'cluster-count', (e: any) => {
      const features = e.features;
      if (features.length > 0) {
        const cluster = features[0].properties;
        this.onClusterClick(cluster);
      }
    });

    this.map.on('click', 'cluster-labels', (e: any) => {
      const features = e.features;
      if (features.length > 0) {
        const cluster = features[0].properties;
        this.onClusterClick(cluster);
      }
    });

    this.map.on('click', 'unclustered-point', (e: any) => {
      const features = e.features;
      if (features.length > 0) {
        const marker = features[0].properties;
        this.onMarkerClick(marker);
      }
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'cluster-count', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'cluster-count', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', 'cluster-labels', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'cluster-labels', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private onClusterClick(cluster: any): void {
    // Emit event or call callback for cluster click
    console.log('[MapService] Cluster clicked:', cluster);
    console.log('[MapService] Cluster photos:', cluster.photos);
    console.log('[MapService] Cluster photo count:', cluster.photoCount);
    if (this.onClusterClickCallback) {
      this.onClusterClickCallback(cluster);
    }
  }

  private onMarkerClick(marker: any): void {
    // Emit event or call callback for marker click
    console.log('[MapService] Marker clicked:', marker);
    console.log('[MapService] Marker photo:', marker.photo);
    if (this.onMarkerClickCallback) {
      this.onMarkerClickCallback(marker);
    }
  }

  // Callbacks for click events
  private onClusterClickCallback?: (cluster: any) => void;
  private onMarkerClickCallback?: (marker: any) => void;

  setClusterClickCallback(callback: (cluster: any) => void): void {
    this.onClusterClickCallback = callback;
  }

  setMarkerClickCallback(callback: (marker: any) => void): void {
    this.onMarkerClickCallback = callback;
  }

  getMap(): any {
    return this.map;
  }

  // Public method to center map on user location
  async centerOnUserLocation(): Promise<void> {
    await this.centerMapOnUserLocation();
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
