import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonButton, IonModal, IonButtons, IonGrid, IonRow, IonCol, IonImg } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp, close } from 'ionicons/icons';
import { PhotoService, UserPhoto, PhotoMetadata } from '../services/photo';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner, IonButton, IonModal, IonButtons, IonGrid, IonRow, IonCol, IonImg]
})
export class Tab2Page implements OnInit, ViewWillEnter, OnDestroy {
  isLoading = true;
  viewerOpen = false;
  photosListOpen = false;
  currentIndex = 0;
  viewerControlsVisible = true;
  photosToShow: UserPhoto[] = [];
  selectionMode = false;
  
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

  private readonly MAPBOX_TOKEN = 'pk.eyJ1IjoidGhvbWFzYW5kZXJzb24yNSIsImEiOiJjbWd0Njdvc20wMHJnMnFyMTRjazlmNWU3In0.x8kTm2CxnCXVJZf-aJo83w';

  constructor(
    public photoService: PhotoService,
    private mapService: MapService
  ) {
    addIcons({ arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp, close });
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
        console.error('[Tab2] Error parsing photos JSON:', e);
        photos = [];
      }
    }
    
    // Set photos to show from cluster
    this.photosToShow = photos;
    console.log('[Tab2] Photos to show:', this.photosToShow.length);
    console.log('[Tab2] Photos to show data:', this.photosToShow);
    
    if (this.photosToShow.length > 0) {
      this.photosListOpen = true; // Open photos list modal
      console.log('[Tab2] Opening photos list modal');
    } else {
      console.log('[Tab2] No photos to show, not opening modal');
    }
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
        console.error('[Tab2] Error parsing photo JSON:', e);
        return;
      }
    }
    
    // Set photos to show from marker
    this.photosToShow = [photo];
    console.log('[Tab2] Photos to show (marker):', this.photosToShow.length);
    console.log('[Tab2] Photo data:', this.photosToShow[0]);
    
    if (this.photosToShow.length > 0) {
      this.openViewer(0); // Open the single photo directly
      console.log('[Tab2] Opening viewer for single photo');
    } else {
      console.log('[Tab2] No photo to show, not opening viewer');
    }
  }

  // Viewer methods (copied from Tab1 and Tab3)
  openViewer(index: number): void {
    this.currentIndex = index;
    this.viewerOpen = true;
    this.viewerControlsVisible = true;
    this.resetSwipeState();
    this.resetVerticalState();
  }

  closeViewer(): void {
    this.viewerOpen = false;
  }

  closePhotosList(): void {
    this.photosListOpen = false;
  }

  toggleViewerControls(): void {
    this.viewerControlsVisible = !this.viewerControlsVisible;
  }

  onViewerClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.viewer-header') && !target.closest('.viewer-footer') && !target.closest('.viewer-actions')) {
      this.toggleViewerControls();
    }
  }

  // Navigation methods
  nextPhoto(): void {
    if (this.currentIndex < this.photosToShow.length - 1) {
      this.currentIndex++;
      this.resetSwipeState();
    }
  }

  prevPhoto(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetSwipeState();
    }
  }

  canSwipeLeft(): boolean {
    return this.currentIndex < this.photosToShow.length - 1;
  }

  canSwipeRight(): boolean {
    return this.currentIndex > 0;
  }

  resetSwipeState(): void {
    this.swipeOffset = 0;
    this.swipeTransition = 'none';
    this.isSwipeGesture = false;
  }

  resetVerticalState(): void {
    this.verticalOffset = 0;
    this.verticalTransition = 'none';
    this.metadataVisible = false;
    this.metadataOffset = 0;
    this.metadataTransition = 'none';
    this.isVerticalGesture = false;
  }

  // Touch handlers for swipe
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwipeGesture = false;
    this.swipeTransition = 'none';
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.touchStartX) return;
    
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.touchStartX;
    const deltaY = currentY - this.touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this.isSwipeGesture = true;
      
      if (deltaX > 0 && !this.canSwipeRight()) {
        this.swipeOffset = 0;
      } else if (deltaX < 0 && !this.canSwipeLeft()) {
        this.swipeOffset = 0;
      } else {
        this.swipeOffset = deltaX;
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isSwipeGesture) return;
    
    const deltaX = this.swipeOffset;
    const threshold = 100;
    
    this.swipeTransition = 'transform 0.3s ease-out';
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        this.prevPhoto();
      } else {
        this.nextPhoto();
      }
    } else {
      this.swipeOffset = 0;
    }
    
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  // Metadata panel methods
  onVerticalTouchStart(event: TouchEvent): void {
    if (this.metadataVisible) {
      const target = event.target as HTMLElement;
      if (target.closest('.metadata-panel')) {
        return;
      }
    }
    
    this.verticalTouchStartY = event.touches[0].clientY;
    this.isVerticalGesture = false;
    this.verticalTransition = 'none';
    this.metadataTransition = 'none';
  }

  onVerticalTouchMove(event: TouchEvent): void {
    if (!this.verticalTouchStartY) return;
    
    if (this.metadataVisible) {
      const target = event.target as HTMLElement;
      if (target.closest('.metadata-panel')) {
        return;
      }
    }
    
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.verticalTouchStartY;
    
    if (deltaY < -10 && !this.metadataVisible) {
      this.isVerticalGesture = true;
      const maxOffset = -200;
      const offset = Math.max(deltaY, maxOffset);
      
      this.verticalOffset = offset;
      this.metadataOffset = Math.max(0, -offset - 200);
    }
    else if (deltaY > 10 && this.metadataVisible) {
      this.isVerticalGesture = true;
      const maxOffset = 200;
      const offset = Math.min(deltaY, maxOffset);
      
      this.verticalOffset = -200 + offset;
      this.metadataOffset = Math.max(0, -offset);
    }
  }

  onVerticalTouchEnd(event: TouchEvent): void {
    if (!this.isVerticalGesture) return;
    
    const deltaY = this.verticalOffset;
    
    this.verticalTransition = 'transform 0.3s ease-out';
    this.metadataTransition = 'transform 0.3s ease-out';
    
    if (this.metadataVisible) {
      if (deltaY > -100) {
        this.verticalOffset = 0;
        this.metadataOffset = 200;
        this.metadataVisible = false;
      } else {
        this.verticalOffset = -200;
        this.metadataOffset = 0;
      }
    } else {
      if (deltaY < -100) {
        this.verticalOffset = -200;
        this.metadataOffset = 0;
        this.metadataVisible = true;
      } else {
        this.verticalOffset = 0;
        this.metadataOffset = 200;
      }
    }
    
    this.verticalTouchStartY = 0;
  }

  onMetadataTouchStart(event: TouchEvent): void {
    this.metadataScrollStartY = event.touches[0].clientY;
    this.isMetadataScrollGesture = false;
  }

  private isAtTopOfMetadataContent(): boolean {
    const metadataPanel = document.querySelector('.metadata-panel');
    if (!metadataPanel) return false;
    return metadataPanel.scrollTop <= 5;
  }

  onMetadataTouchMove(event: TouchEvent): void {
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.metadataScrollStartY;
    
    if (this.isAtTopOfMetadataContent() && deltaY > 25) {
      this.isMetadataScrollGesture = true;
      event.preventDefault();
    }
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    if (this.isMetadataScrollGesture) {
      const currentY = event.changedTouches[0].clientY;
      const deltaY = currentY - this.metadataScrollStartY;
      
      if (this.isAtTopOfMetadataContent() && deltaY > 60) {
        this.closeMetadataPanel();
      }
    }
    
    this.isMetadataScrollGesture = false;
    this.metadataScrollStartY = 0;
  }

  closeMetadataPanel(): void {
    this.metadataVisible = false;
    this.verticalOffset = 0;
    this.metadataOffset = 200;
    this.verticalTransition = 'transform 0.3s ease-out';
    this.metadataTransition = 'transform 0.3s ease-out';
  }

  // Photo actions
  async deleteCurrentPhoto(): Promise<void> {
    if (this.photosToShow[this.currentIndex]) {
      const filepath = this.photosToShow[this.currentIndex].filepath;
      await this.photoService.deletePhotos([filepath]);
      
      this.photosToShow = this.photosToShow.filter(p => p.filepath !== filepath);
      
      if (this.currentIndex >= this.photosToShow.length) {
        this.currentIndex = Math.max(0, this.photosToShow.length - 1);
      }
      
      this.viewerControlsVisible = true;
      
      if (this.photosToShow.length === 0) {
        this.closeViewer();
      }
    }
  }

  async toggleLike(filepath: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    await this.photoService.toggleLike(filepath);
    
    if (this.viewerOpen) {
      this.viewerControlsVisible = true;
    }
  }

  isLiked(filepath: string): boolean {
    const photo = this.photoService.photos.find(p => p.filepath === filepath);
    return photo?.liked || false;
  }

  // Metadata display methods
  getPhotoDate(filepath: string): string {
    const filename = filepath.split('/').pop() || '';
    const timestamp = filename.split('.')[0];
    const date = new Date(parseInt(timestamp));
    
    if (isNaN(date.getTime())) {
      return 'Date inconnue';
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDeviceModel(metadata?: PhotoMetadata): string {
    return metadata?.deviceModel || 'Appareil inconnu';
  }

  getPhotoResolution(metadata?: PhotoMetadata): string {
    if (metadata?.width && metadata?.height) {
      return `${metadata.width} x ${metadata.height}`;
    }
    return '';
  }

  hasLocationData(metadata?: PhotoMetadata): boolean {
    return !!(metadata?.latitude && metadata?.longitude) || 
           (metadata?.latitude === undefined && metadata?.longitude === undefined);
  }

  getGPSCoordinates(metadata?: PhotoMetadata): string {
    if (metadata?.latitude && metadata?.longitude) {
      return `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
    }
    if (metadata?.latitude === undefined && metadata?.longitude === undefined) {
      return 'Calcul en cours...';
    }
    return 'Non disponible';
  }

  getAltitude(metadata?: PhotoMetadata): string {
    if (metadata?.altitude) {
      return `${metadata.altitude.toFixed(1)} m`;
    }
    if (metadata?.latitude === undefined && metadata?.longitude === undefined) {
      return 'Calcul en cours...';
    }
    return '';
  }
}
