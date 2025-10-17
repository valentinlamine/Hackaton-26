import { Injectable } from '@angular/core';
import { PhotoService, UserPhoto } from './photo';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  selectionMode = false;
  selectedFilepaths = new Set<string>();

  constructor(private photoService: PhotoService) {}

  // Toggle selection mode
  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedFilepaths.clear();
    }
  }

  // Enter selection mode with a specific photo
  enterSelectionMode(filepath: string): void {
    this.selectionMode = true;
    this.selectedFilepaths.add(filepath);
  }

  // Toggle photo selection
  toggleSelect(filepath: string): void {
    if (this.selectedFilepaths.has(filepath)) {
      this.selectedFilepaths.delete(filepath);
    } else {
      this.selectedFilepaths.add(filepath);
    }
  }

  // Check if photo is selected
  isSelected(filepath: string): boolean {
    return this.selectedFilepaths.has(filepath);
  }

  // Delete selected photos
  async deleteSelected(): Promise<void> {
    const selectedArray = Array.from(this.selectedFilepaths);
    await this.photoService.deletePhotos(selectedArray);
    this.selectedFilepaths.clear();
    this.selectionMode = false;
  }

  // Get selected count
  getSelectedCount(): number {
    return this.selectedFilepaths.size;
  }

  // Check if any photos are selected
  hasSelectedPhotos(): boolean {
    return this.selectedFilepaths.size > 0;
  }
}
