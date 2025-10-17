import { Component, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonIcon, IonButtons, IonButton, IonCheckbox } from '@ionic/angular/standalone';
import { PhotoViewerComponent } from '../components/photo-viewer/photo-viewer.component';
import { addIcons } from 'ionicons';
import { menu, checkmark } from 'ionicons/icons';
import { PhotoService, PhotoMetadata, UserPhoto } from '../services/photo';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonIcon, IonButton, IonCheckbox, IonButtons, PhotoViewerComponent],
})
export class Tab3Page implements OnInit, ViewWillEnter {
  likedPhotos: UserPhoto[] = [];
  viewerOpen = false;
  currentIndex = 0;
  viewerControlsVisible = true;
  
  // Selection mode
  selectionMode = false;
  selectedFilepaths = new Set<string>();
  
  // Swipe navigation
  swipeOffset = 0;
  swipeTransition = 'none';
  touchStartX = 0;
  touchStartY = 0;
  isSwipeGesture = false;

  // Vertical scroll for metadata
  verticalOffset = 0;
  verticalTransition = 'none';
  metadataVisible = false;
  metadataOffset = 0;
  metadataTransition = 'none';
  verticalTouchStartY = 0;
  isVerticalGesture = false;
  private metadataScrollStartY = 0;
  private isMetadataScrollGesture = false;

  constructor(public photoService: PhotoService) {
    addIcons({ menu, checkmark });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    this.updateLikedPhotos();
  }

  ionViewWillEnter(): void {
    // Update liked photos every time we enter this tab
    this.updateLikedPhotos();
  }

  updateLikedPhotos(): void {
    this.likedPhotos = this.photoService.photos.filter(photo => photo.liked);
  }

  // Selection mode methods
  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedFilepaths.clear();
    }
  }

  enterSelectionMode(filepath: string): void {
    this.selectionMode = true;
    this.toggleSelect(filepath);
  }

  toggleSelect(filepath: string): void {
    if (this.selectedFilepaths.has(filepath)) {
      this.selectedFilepaths.delete(filepath);
    } else {
      this.selectedFilepaths.add(filepath);
    }
  }

  getSelectedCount(): number {
    return this.selectedFilepaths.size;
  }

  async deleteSelected(): Promise<void> {
    const selectedArray = Array.from(this.selectedFilepaths);
    await this.photoService.deletePhotos(selectedArray);
    this.selectedFilepaths.clear();
    this.selectionMode = false;
    this.updateLikedPhotos(); // Refresh the liked photos list
  }

  // Viewer methods
  openViewer(index: number): void {
    this.currentIndex = index;
    this.viewerOpen = true;
    this.viewerControlsVisible = true;
  }

  closeViewer(): void {
    this.viewerOpen = false;
  }

  onViewerClick(event: Event): void {
    // This will be handled by the photo-viewer component
  }

  // Navigation methods
  nextPhoto(): void {
    if (this.currentIndex < this.likedPhotos.length - 1) {
      this.currentIndex++;
    }
  }

  prevPhoto(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  // Touch handling methods (delegated to photo-viewer component)
  onTouchStart(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  onTouchMove(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  onTouchEnd(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  onMetadataTouchStart(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  onMetadataTouchMove(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    // Handled by photo-viewer component
  }

  // Photo actions
  toggleLike(filepath: string): void {
    this.photoService.toggleLike(filepath);
    this.updateLikedPhotos(); // Refresh the liked photos list
  }

  isLiked(filepath: string): boolean {
    return this.photoService.isLiked(filepath);
  }

  async deleteCurrentPhoto(): Promise<void> {
    if (this.likedPhotos[this.currentIndex]) {
      const photo = this.likedPhotos[this.currentIndex];
      await this.photoService.deletePhotos([photo.filepath]);
      this.updateLikedPhotos(); // Refresh the liked photos list

      // Adjust current index if needed
      if (this.currentIndex >= this.likedPhotos.length) {
        this.currentIndex = this.likedPhotos.length - 1;
      }

      // Close viewer if no more photos
      if (this.likedPhotos.length === 0) {
        this.closeViewer();
      }
    }
  }

  // Metadata helper methods
  getPhotoDate(filepath: string): string {
    const photo = this.photoService.photos.find(p => p.filepath === filepath);
    if (!photo?.metadata?.timestamp) return 'Non disponible';
    
    const date = new Date(photo.metadata.timestamp);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDeviceModel(metadata: PhotoMetadata | undefined): string {
    return metadata?.deviceModel || 'Non disponible';
  }

  getPhotoResolution(metadata: PhotoMetadata | undefined): string {
    if (!metadata?.width || !metadata?.height) return '';
    return `${metadata.width} × ${metadata.height}`;
  }

  hasLocationData(metadata: PhotoMetadata | undefined): boolean {
    return !!(metadata?.latitude && metadata?.longitude);
  }

  getGPSCoordinates(metadata: PhotoMetadata | undefined): string {
    if (!metadata?.latitude || !metadata?.longitude) return 'Non disponible';
    return `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
  }

  getAltitude(metadata: PhotoMetadata | undefined): string {
    if (!metadata?.altitude) return '';
    return `${metadata.altitude.toFixed(1)} m`;
  }
}