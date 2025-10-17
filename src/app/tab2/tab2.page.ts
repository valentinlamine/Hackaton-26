import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonButton, IonModal, IonButtons, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { PhotoViewerComponent } from '../components/photo-viewer/photo-viewer.component';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp, close, locate } from 'ionicons/icons';
import { PhotoService, UserPhoto, PhotoMetadata } from '../services/photo';
import { MapService } from '../services/map.service';
import { MapStateService } from '../services/map-state.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonButton, IonModal, IonButtons, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, PhotoViewerComponent]
})
export class Tab2Page implements OnInit, ViewWillEnter, OnDestroy {
  isLoading = true;
  selectionMode = false;
  
  // Touch handling properties
  touchStartX = 0;
  touchStartY = 0;
  isSwipeGesture = false;
  private metadataScrollStartY = 0;
  private isMetadataScrollGesture = false;

  private readonly MAPBOX_TOKEN = 'pk.eyJ1IjoidGhvbWFzYW5kZXJzb24yNSIsImEiOiJjbWd0Njdvc20wMHJnMnFyMTRjazlmNWU3In0.x8kTm2CxnCXVJZf-aJo83w';

  constructor(
    public photoService: PhotoService,
    private mapService: MapService,
    public mapState: MapStateService
  ) {
    addIcons({ arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp, close, locate });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    await this.initializeMap();
  }

  ionViewWillEnter(): void {
    // Update map when entering the tab
    this.mapService.updatePhotos();
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
    this.mapState.reset();
  }

  private async initializeMap(): Promise<void> {
    try {
      this.isLoading = true;
      await this.mapService.initializeMap('map', this.MAPBOX_TOKEN);
      
      // Set up click callbacks
      this.mapService.setClusterClickCallback((cluster) => {
        this.onClusterClick(cluster);
      });
      
      this.mapService.setMarkerClickCallback((marker) => {
        this.onMarkerClick(marker);
      });
      
      this.mapService.updatePhotos();
      this.isLoading = false;
    } catch (error) {
      console.error('Error initializing map:', error);
      this.isLoading = false;
    }
  }

  // Center map on user location
  async centerOnUserLocation(): Promise<void> {
    try {
      await this.mapService.centerOnUserLocation();
    } catch (error) {
      console.error('Error centering map on user location:', error);
    }
  }

  // Map click handlers
  private onClusterClick(cluster: any): void {
    console.log('[Tab2] Cluster clicked:', cluster);
    console.log('[Tab2] Cluster photos:', cluster.photos);
    console.log('[Tab2] Cluster photo count:', cluster.photoCount);
    
    // Parse photos if they are stored as JSON string
    let photos = cluster.photos || [];
    if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch (e) {
        console.error('Error parsing cluster photos:', e);
        photos = [];
      }
    }
    
    console.log('[Tab2] Parsed photos:', photos);
    console.log('[Tab2] Photos to show:', photos.length);
    
    // Open photos list
    this.mapState.openPhotosList(photos);
  }

  private onMarkerClick(marker: any): void {
    console.log('[Tab2] Marker clicked:', marker);
    console.log('[Tab2] Marker photo:', marker.photo);
    
    // Parse photo if it's stored as JSON string
    let photo = marker.photo;
    if (typeof photo === 'string') {
      try {
        photo = JSON.parse(photo);
      } catch (e) {
        console.error('Error parsing marker photo:', e);
        return;
      }
    }
    
    console.log('[Tab2] Parsed photo:', photo);
    
    // Open viewer directly for single photo
    this.mapState.openViewer([photo], 0);
  }

  // Photos list modal methods
  closePhotosList(): void {
    this.mapState.closePhotosList();
  }

  openViewer(index: number): void {
    // Open viewer from photos list
    this.mapState.openViewer(this.mapState.photosListPhotos, index);
  }

  // Viewer methods
  closeViewer(): void {
    this.mapState.closeViewer();
  }

  onViewerClick(event: Event): void {
    // This will be handled by the photo-viewer component
  }

  // Navigation methods
  nextPhoto(): void {
    this.mapState.nextPhoto();
  }

  prevPhoto(): void {
    this.mapState.prevPhoto();
  }

  // Touch handling methods
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.isSwipeGesture = false;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && !this.isSwipeGesture) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      
      // Determine if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        this.isSwipeGesture = true;
        this.mapState.setSwipeOffset(deltaX);
        this.mapState.setSwipeTransition('none');
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.isSwipeGesture) {
      const deltaX = this.mapState.viewerSwipeOffset;
      const threshold = 100;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && this.mapState.canSwipeRight()) {
          // Swipe right - previous photo
          this.mapState.setSwipeTransition('transform 0.3s ease-out');
          this.mapState.setSwipeOffset(window.innerWidth);
          setTimeout(() => {
            this.prevPhoto();
            this.mapState.setSwipeOffset(0);
            this.mapState.setSwipeTransition('none');
          }, 300);
        } else if (deltaX < 0 && this.mapState.canSwipeLeft()) {
          // Swipe left - next photo
          this.mapState.setSwipeTransition('transform 0.3s ease-out');
          this.mapState.setSwipeOffset(-window.innerWidth);
          setTimeout(() => {
            this.nextPhoto();
            this.mapState.setSwipeOffset(0);
            this.mapState.setSwipeTransition('none');
          }, 300);
        } else {
          // Snap back
          this.mapState.setSwipeTransition('transform 0.3s ease-out');
          this.mapState.setSwipeOffset(0);
        }
      } else {
        // Snap back
        this.mapState.setSwipeTransition('transform 0.3s ease-out');
        this.mapState.setSwipeOffset(0);
      }
      
      this.isSwipeGesture = false;
    }
  }

  onMetadataTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.metadataScrollStartY = event.touches[0].clientY;
      this.isMetadataScrollGesture = false;
    }
  }

  onMetadataTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaY = touch.clientY - this.metadataScrollStartY;
      
      // Only handle if we're dragging the handle or header
      const target = event.target as HTMLElement;
      if (target.closest('.metadata-handle') || target.closest('.metadata-header')) {
        this.isMetadataScrollGesture = true;
        this.mapState.setMetadataOffset(Math.max(0, deltaY));
        this.mapState.setMetadataTransition('none');
      }
    }
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    if (this.isMetadataScrollGesture) {
      const deltaY = this.mapState.viewerMetadataOffset;
      const threshold = 50;
      
      if (deltaY > threshold) {
        // Hide metadata
        this.mapState.setMetadataVisible(false);
        this.mapState.setMetadataOffset(0);
        this.mapState.setMetadataTransition('transform 0.3s ease-out');
      } else {
        // Snap back
        this.mapState.setMetadataOffset(0);
        this.mapState.setMetadataTransition('transform 0.3s ease-out');
      }
      
      this.isMetadataScrollGesture = false;
    }
  }

  // Photo actions
  toggleLike(filepath: string): void {
    this.photoService.toggleLike(filepath);
  }

  isLiked(filepath: string): boolean {
    return this.photoService.isLiked(filepath);
  }

  async deleteCurrentPhoto(): Promise<void> {
    const currentPhoto = this.mapState.getCurrentPhoto();
    if (currentPhoto) {
      await this.photoService.deletePhotos([currentPhoto.filepath]);

      // Remove from current photos list
      const updatedPhotos = this.mapState.viewerPhotos.filter(p => p.filepath !== currentPhoto.filepath);
      
      if (updatedPhotos.length === 0) {
        // No more photos, close everything
        this.mapState.closeViewer();
        this.mapState.closePhotosList();
      } else {
        // Update the viewer with remaining photos
        const newIndex = Math.min(this.mapState.viewerCurrentIndex, updatedPhotos.length - 1);
        this.mapState.openViewer(updatedPhotos, newIndex);
      }
    }
  }
}