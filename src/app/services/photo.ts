import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CapacitorPhoto, PermissionStatus } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  liked?: boolean;
  metadata?: PhotoMetadata;
}

export interface PhotoMetadata {
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  timestamp?: number;
  deviceModel?: string;
  orientation?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private cachedLocation: {latitude: number, longitude: number, altitude?: number} | null = null;

  public async addNewToGallery(): Promise<void> {
    try {
      const isWeb = Capacitor.getPlatform() === 'web';
      if (!isWeb) {
        const perm: PermissionStatus = await Camera.requestPermissions();
        if (perm.camera !== 'granted') {
          console.warn('[Camera] Permission not granted:', perm);
          return;
        }
      }

      // Request location permissions and start getting location in background
      await this.requestLocationPermissions();
      this.getLocationInBackground();

      const capturedPhoto: CapacitorPhoto = await Camera.getPhoto({
        resultType: isWeb ? CameraResultType.DataUrl : CameraResultType.Uri,
        source: isWeb ? CameraSource.Camera : CameraSource.Camera,
        quality: 100,
        webUseInput: isWeb ? false : false
      });

      if (!capturedPhoto || (!capturedPhoto.webPath && !capturedPhoto.path)) {
        console.warn('[Camera] No photo returned');
        return;
      }

      const savedFilepath = await this.savePhoto(capturedPhoto);

      // Create photo object immediately with basic metadata
      const photo: UserPhoto = {
        filepath: savedFilepath,
        webviewPath: await this.getDisplayPath(savedFilepath),
        liked: false,
        metadata: {
          timestamp: Date.now(),
          deviceModel: this.getDeviceModel(),
          latitude: undefined, // Will be updated when GPS is ready
          longitude: undefined,
          altitude: undefined
        }
      };

      // Add photo immediately to display
      this.photos.unshift(photo);
      await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });

      // Extract full metadata in background (including GPS)
      this.extractMetadataInBackground(capturedPhoto, photo);
    } catch (err) {
      console.error('[Camera] Error capturing photo:', err);
    }
  }

  public async loadSaved(): Promise<void> {
    const { value } = await Preferences.get({ key: 'photos' });
    const stored: UserPhoto[] = value ? (JSON.parse(value) as UserPhoto[]) : [];
    const validPhotos: UserPhoto[] = [];

    for (const p of stored) {
      try {
        const display = await this.getDisplayPath(p.filepath);
        if (display && typeof display === 'string') {
          validPhotos.push({ 
            filepath: p.filepath, 
            webviewPath: display, 
            liked: p.liked || false,
            metadata: p.metadata || {}
          });
        }
      } catch {
        // Skip unreadable/missing files
      }
    }

    this.photos = validPhotos;
    await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
  }

  private async savePhoto(photo: CapacitorPhoto): Promise<string> {
    const base64Data = photo.dataUrl
      ? (photo.dataUrl.split(',')[1] ?? photo.dataUrl)
      : await this.readAsBase64(photo);
    const fileName = `${new Date().getTime()}.jpeg`;
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });
    return writeResult.uri ?? fileName;
  }

  private async readAsBase64(photo: CapacitorPhoto): Promise<string> {
    if (Capacitor.getPlatform() === 'web') {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      const dataUrl = await this.convertBlobToBase64(blob);
      // Strip the data URL header so we keep pure base64 for Filesystem.writeFile
      const base64 = dataUrl.split(',')[1] ?? dataUrl;
      return base64;
    } else {
      const file = await Filesystem.readFile({ path: photo.path! });
      // Ensure we return only the base64 payload (strip header if present)
      return typeof file.data === 'string' ? (file.data.includes(',') ? file.data.split(',')[1] : file.data) : String(file.data);
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  private async getDisplayPath(filepathInput: string): Promise<string> {
    const filepath = String(filepathInput);
    if (Capacitor.getPlatform() === 'web') {
      // On web, read back and use data URL
      const fileName = filepath.split('/').pop();
      if (fileName) {
        const contents = await Filesystem.readFile({ path: fileName, directory: Directory.Data }).catch(async () => {
          // Some web impls store only name; try without directory
          return Filesystem.readFile({ path: fileName });
        });
        const dataUrl = await this.toDataUrl(contents.data);
        return dataUrl;
      }
    }
    return Capacitor.convertFileSrc(filepath);
  }

  private async toDataUrl(data: string | Blob): Promise<string> {
    if (typeof data === 'string') {
      return data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
    }
    return await this.convertBlobToBase64(data);
  }

  public async deletePhotos(filepaths: string[]): Promise<void> {
    const remaining: UserPhoto[] = [];
    for (const photo of this.photos) {
      if (filepaths.includes(photo.filepath)) {
        try {
          // Extract just the filename from the full path
          const fileName = photo.filepath.split('/').pop();
          if (fileName) {
            await Filesystem.deleteFile({ 
              path: fileName, 
              directory: Directory.Data 
            });
          }
        } catch (e) {
          console.log(`[PhotoService] Could not delete file ${photo.filepath}:`, e);
          // Continue even if deletion fails
        }
      } else {
        remaining.push(photo);
      }
    }
    this.photos = remaining;
    await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
  }

  public async toggleLike(filepath: string): Promise<void> {
    const photo = this.photos.find(p => p.filepath === filepath);
    if (photo) {
      photo.liked = !photo.liked;
      await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
    }
  }

  private async extractMetadataInBackground(capturedPhoto: CapacitorPhoto, photo: UserPhoto): Promise<void> {
    try {
      // Extract EXIF data from the photo if available
      if (capturedPhoto.exif) {
        console.log('[PhotoService] EXIF data:', capturedPhoto.exif);
        
        // Get dimensions from EXIF
        if (capturedPhoto.exif.PixelXDimension) {
          photo.metadata!.width = capturedPhoto.exif.PixelXDimension;
        }
        if (capturedPhoto.exif.PixelYDimension) {
          photo.metadata!.height = capturedPhoto.exif.PixelYDimension;
        }

        // Get GPS data from EXIF
        if (capturedPhoto.exif.GPSLatitude && capturedPhoto.exif.GPSLongitude) {
          photo.metadata!.latitude = this.parseGPSCoordinate(capturedPhoto.exif.GPSLatitude, capturedPhoto.exif.GPSLatitudeRef);
          photo.metadata!.longitude = this.parseGPSCoordinate(capturedPhoto.exif.GPSLongitude, capturedPhoto.exif.GPSLongitudeRef);
        }
        if (capturedPhoto.exif.GPSAltitude) {
          photo.metadata!.altitude = parseFloat(capturedPhoto.exif.GPSAltitude);
        }

        // Get device info from EXIF
        if (capturedPhoto.exif.LensModel) {
          photo.metadata!.deviceModel = capturedPhoto.exif.LensModel;
        }
        if (capturedPhoto.exif.Orientation) {
          photo.metadata!.orientation = capturedPhoto.exif.Orientation;
        }
      }

      // Fallback: try to get current location if no GPS in EXIF
      if (!photo.metadata!.latitude || !photo.metadata!.longitude) {
        // Use cached location if available, otherwise get fresh location
        if (this.cachedLocation) {
          photo.metadata!.latitude = this.cachedLocation.latitude;
          photo.metadata!.longitude = this.cachedLocation.longitude;
          photo.metadata!.altitude = this.cachedLocation.altitude;
        } else {
          try {
            const location = await this.getCurrentLocation();
            if (location) {
              photo.metadata!.latitude = location.latitude;
              photo.metadata!.longitude = location.longitude;
              photo.metadata!.altitude = location.altitude;
            }
          } catch (e) {
            console.log('[PhotoService] Could not get location data:', e);
          }
        }
      }

      // Save updated metadata
      await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
    } catch (e) {
      console.log('[PhotoService] Error extracting metadata in background:', e);
    }
  }

  private parseGPSCoordinate(coord: any, ref: string): number {
    if (typeof coord === 'number') {
      return ref === 'S' || ref === 'W' ? -coord : coord;
    }
    
    // Handle DMS format (Degrees, Minutes, Seconds)
    if (Array.isArray(coord) && coord.length >= 3) {
      const degrees = parseFloat(coord[0]);
      const minutes = parseFloat(coord[1]);
      const seconds = parseFloat(coord[2]);
      const decimal = degrees + (minutes / 60) + (seconds / 3600);
      return ref === 'S' || ref === 'W' ? -decimal : decimal;
    }
    
    return 0;
  }

  private getDeviceModel(): string {
    if (Capacitor.getPlatform() === 'ios') {
      return 'iPhone (iOS)';
    } else if (Capacitor.getPlatform() === 'android') {
      return 'Android Device';
    } else {
      return 'Web Browser';
    }
  }

  private async requestLocationPermissions(): Promise<void> {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== 'granted') {
          console.warn('[Geolocation] Permission not granted:', permissions);
        }
      }
    } catch (e) {
      console.warn('[Geolocation] Error requesting permissions:', e);
    }
  }

  private async getLocationInBackground(): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        this.cachedLocation = location;
        console.log('[PhotoService] Location cached:', location);
      }
    } catch (e) {
      console.log('[PhotoService] Could not cache location:', e);
    }
  }

  private async getCurrentLocation(): Promise<{latitude: number, longitude: number, altitude?: number} | null> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        // For web, try to get location using browser geolocation
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude || undefined
                });
              },
              (error) => {
                console.warn('[Geolocation] Web geolocation error:', error);
                resolve(null);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
          } else {
            resolve(null);
          }
        });
      } else {
        // For native platforms, use Capacitor Geolocation
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined
        };
      }
    } catch (e) {
      console.warn('[Geolocation] Error getting location:', e);
      return null;
    }
  }
}
