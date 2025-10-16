import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CapacitorPhoto, PermissionStatus } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

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
      const isWeb = Capacitor.getPlatform() === 'web';
      if (!isWeb) {
        const perm: PermissionStatus = await Camera.requestPermissions();
        if (perm.camera !== 'granted') {
          console.warn('[Camera] Permission not granted:', perm);
          return;
        }
      }

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

      this.photos.unshift({
        filepath: savedFilepath,
        webviewPath: await this.getDisplayPath(savedFilepath)
      });

      await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
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
          validPhotos.push({ filepath: p.filepath, webviewPath: display });
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
      const fileName = filepath.startsWith('file://') ? filepath.replace('file://', '') : filepath;
      const contents = await Filesystem.readFile({ path: fileName, directory: Directory.Data }).catch(async () => {
        // Some web impls store only name; try without directory
        return Filesystem.readFile({ path: fileName });
      });
      const dataUrl = await this.toDataUrl(contents.data);
      return dataUrl;
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
          const path = photo.filepath.startsWith('file://') ? photo.filepath.replace('file://', '') : photo.filepath;
          await Filesystem.deleteFile({ path, directory: Directory.Data }).catch(async () => {
            // Try without directory context
            await Filesystem.deleteFile({ path });
          });
        } catch {
          // Ignore delete failures, we will still drop it from the list
        }
      } else {
        remaining.push(photo);
      }
    }
    this.photos = remaining;
    await Preferences.set({ key: 'photos', value: JSON.stringify(this.photos) });
  }
}
