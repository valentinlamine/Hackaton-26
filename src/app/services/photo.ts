import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CapacitorPhoto, PermissionStatus } from '@capacitor/camera';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];

  public async addNewToGallery(): Promise<void> {
    try {
      const perm: PermissionStatus = await Camera.requestPermissions();
      if (perm.camera !== 'granted') {
        // Give up early if user denied permission
        console.warn('[Camera] Permission not granted:', perm);
        return;
      }

      const capturedPhoto: CapacitorPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
        webUseInput: false
      });

      if (!capturedPhoto || (!capturedPhoto.webPath && !capturedPhoto.path)) {
        console.warn('[Camera] No photo returned');
        return;
      }

      this.photos.unshift({
        filepath: 'soon...',
        webviewPath: capturedPhoto.webPath
      });
    } catch (err) {
      console.error('[Camera] Error capturing photo:', err);
    }
  }
}
