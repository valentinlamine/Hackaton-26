import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCheckbox, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, arrowBack, trash, heart, heartOutline, menu, checkmark } from 'ionicons/icons';
import { PhotoService, PhotoMetadata } from '../services/photo';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCheckbox, IonModal],
})
export class Tab1Page implements OnInit, OnDestroy, ViewWillEnter {
  selectionMode = false;
  selectedFilepaths = new Set<string>();
  viewerOpen = false;
  currentIndex = 0;
  viewerControlsVisible = true;
  
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
    addIcons({ camera, arrowBack, trash, heart, heartOutline, menu, checkmark });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    // Request motion permissions and add shake detection
    await this.requestMotionPermissions();
    this.addShakeListener();
  }

  ionViewWillEnter(): void {
    // Refresh photos when entering the tab
    this.photoService.loadSaved();
  }

  addPhotoToGallery(): void {
    this.photoService.addNewToGallery();
  }

  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedFilepaths.clear();
    }
  }

  enterSelectionMode(filepath: string): void {
    this.selectionMode = true;
    this.selectedFilepaths.add(filepath);
  }

  toggleSelect(filepath: string): void {
    if (!this.selectionMode) return;
    if (this.selectedFilepaths.has(filepath)) {
      this.selectedFilepaths.delete(filepath);
    } else {
      this.selectedFilepaths.add(filepath);
    }
  }

  isSelected(filepath: string): boolean {
    return this.selectedFilepaths.has(filepath);
  }

  async deleteSelected(): Promise<void> {
    if (this.selectedFilepaths.size === 0) return;
    await this.photoService.deletePhotos(Array.from(this.selectedFilepaths));
    this.selectedFilepaths.clear();
    this.selectionMode = false;
  }

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

  toggleViewerControls(): void {
    this.viewerControlsVisible = !this.viewerControlsVisible;
  }

  // Method to ensure controls stay visible after actions
  keepControlsVisible(): void {
    this.viewerControlsVisible = true;
  }

  onViewerClick(event: Event): void {
    // Only toggle controls if clicking on the image area, not on buttons
    const target = event.target as HTMLElement;
    if (!target.closest('.viewer-header') && !target.closest('.viewer-footer') && !target.closest('.viewer-actions')) {
      this.toggleViewerControls();
    }
  }

  closeMetadataPanel(): void {
    this.metadataVisible = false;
    this.verticalOffset = 0;
    this.metadataOffset = 200;
    this.verticalTransition = 'transform 0.3s ease-out';
    this.metadataTransition = 'transform 0.3s ease-out';
  }

  onMetadataTouchStart(event: TouchEvent): void {
    this.metadataScrollStartY = event.touches[0].clientY;
    this.isMetadataScrollGesture = false;
  }

  private isAtTopOfMetadataContent(): boolean {
    const metadataPanel = document.querySelector('.metadata-panel');
    if (!metadataPanel) return false;
    
    // Check if we're at the very top of the scrollable content
    return metadataPanel.scrollTop <= 5; // Small tolerance for precision
  }

  onMetadataTouchMove(event: TouchEvent): void {
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.metadataScrollStartY;
    
    // Only close if we're at the very top of content AND user is swiping up significantly
    if (this.isAtTopOfMetadataContent() && deltaY > 25) {
      // User is trying to scroll up when already at top
      this.isMetadataScrollGesture = true;
      event.preventDefault(); // Prevent default scroll behavior
    }
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    if (this.isMetadataScrollGesture) {
      const currentY = event.changedTouches[0].clientY;
      const deltaY = currentY - this.metadataScrollStartY;
      
      // Only close if we're still at the top and user swiped up significantly
      if (this.isAtTopOfMetadataContent() && deltaY > 60) {
        this.closeMetadataPanel();
      }
    }
    
    this.isMetadataScrollGesture = false;
    this.metadataScrollStartY = 0;
  }

  nextPhoto(): void {
    if (this.currentIndex < this.photoService.photos.length - 1) {
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
    return this.currentIndex < this.photoService.photos.length - 1;
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
    
    // Determine if this is a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this.isSwipeGesture = true;
      
      // Limit swipe based on available photos
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
        // Swipe right - go to previous photo
        this.prevPhoto();
      } else {
        // Swipe left - go to next photo
        this.nextPhoto();
      }
    } else {
      // Snap back to center
      this.swipeOffset = 0;
    }
    
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  onVerticalTouchStart(event: TouchEvent): void {
    // Only handle if we're not in a metadata panel scroll
    if (this.metadataVisible) {
      const target = event.target as HTMLElement;
      if (target.closest('.metadata-panel')) {
        return; // Let the panel handle its own scrolling
      }
    }
    
    this.verticalTouchStartY = event.touches[0].clientY;
    this.isVerticalGesture = false;
    this.verticalTransition = 'none';
    this.metadataTransition = 'none';
  }

  onVerticalTouchMove(event: TouchEvent): void {
    if (!this.verticalTouchStartY) return;
    
    // Don't interfere with metadata panel scrolling
    if (this.metadataVisible) {
      const target = event.target as HTMLElement;
      if (target.closest('.metadata-panel')) {
        return;
      }
    }
    
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.verticalTouchStartY;
    
    // Only handle upward swipes (negative deltaY) when panel is hidden
    if (deltaY < -10 && !this.metadataVisible) {
      this.isVerticalGesture = true;
      const maxOffset = -200; // Maximum upward movement
      const offset = Math.max(deltaY, maxOffset);
      
      this.verticalOffset = offset;
      this.metadataOffset = Math.max(0, -offset - 200); // Panel slides up
    }
    // Handle downward swipes when panel is visible
    else if (deltaY > 10 && this.metadataVisible) {
      this.isVerticalGesture = true;
      const maxOffset = 200; // Maximum downward movement
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
      // Panel is visible, check if we should hide it
      if (deltaY > -100) {
        // Hide metadata panel
        this.verticalOffset = 0;
        this.metadataOffset = 200;
        this.metadataVisible = false;
      } else {
        // Keep panel visible
        this.verticalOffset = -200;
        this.metadataOffset = 0;
      }
    } else {
      // Panel is hidden, check if we should show it
      if (deltaY < -100) {
        // Show metadata panel
        this.verticalOffset = -200;
        this.metadataOffset = 0;
        this.metadataVisible = true;
      } else {
        // Keep panel hidden
        this.verticalOffset = 0;
        this.metadataOffset = 200;
      }
    }
    
    this.verticalTouchStartY = 0;
  }

  async deleteCurrentPhoto(): Promise<void> {
    if (this.photoService.photos[this.currentIndex]) {
      const filepath = this.photoService.photos[this.currentIndex].filepath;
      await this.photoService.deletePhotos([filepath]);
      
      // Adjust current index if needed
      if (this.currentIndex >= this.photoService.photos.length) {
        this.currentIndex = Math.max(0, this.photoService.photos.length - 1);
      }
      
      // Keep viewer controls visible after deletion
      this.viewerControlsVisible = true;
      
      // Close viewer if no photos left
      if (this.photoService.photos.length === 0) {
        this.closeViewer();
      }
    }
  }

  async toggleLike(filepath: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    await this.photoService.toggleLike(filepath);
    
    // Keep viewer controls visible after liking
    if (this.viewerOpen) {
      this.viewerControlsVisible = true;
    }
  }

  isLiked(filepath: string): boolean {
    const photo = this.photoService.photos.find(p => p.filepath === filepath);
    return photo?.liked || false;
  }

  getPhotoDate(filepath: string): string {
    // Extract timestamp from filename (format: timestamp.jpeg)
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
    // Show location section if we have GPS data OR if we're still calculating
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

  // DEBUG: Check if debug mode is enabled
  isDebugMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugStorage = localStorage.getItem('photo-debug-mode');
    return debugParam === 'true' || debugStorage === 'true';
  }

  // DEBUG: Shake gesture to toggle debug mode
  private shakeThreshold = 25; // Much higher threshold for shake (was 15)
  private shakeTimeout: any = null;
  private lastShakeTime = 0;
  private shakeCount = 0; // Count consecutive shakes
  private requiredShakes = 3; // Need 3 strong shakes
  private shakeWindow = 3000; // 3 seconds window for multiple shakes


  private async requestMotionPermissions(): Promise<void> {
    // Request permission for device motion (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          console.log('[Tab1] Motion permissions granted');
        } else {
          console.log('[Tab1] Motion permissions denied');
        }
      } catch (error) {
        console.log('[Tab1] Error requesting motion permissions:', error);
      }
    }
  }

  ngOnDestroy(): void {
    // Remove shake detection
    this.removeShakeListener();
  }

  private addShakeListener(): void {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.onDeviceMotion.bind(this));
    }
  }

  private removeShakeListener(): void {
    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', this.onDeviceMotion.bind(this));
    }
  }

  private onDeviceMotion(event: DeviceMotionEvent): void {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;

    const accelerationMagnitude = Math.sqrt(x * x + y * y + z * z);
    const currentTime = Date.now();

    // Check if it's a strong shake
    if (accelerationMagnitude > this.shakeThreshold) {
      // Reset counter if too much time has passed
      if (currentTime - this.lastShakeTime > this.shakeWindow) {
        this.shakeCount = 0;
      }
      
      // Only count if enough time has passed since last shake
      if (currentTime - this.lastShakeTime > 500) { // 500ms between shakes
        this.shakeCount++;
        this.lastShakeTime = currentTime;
        
        console.log(`[Tab1] Shake detected (${this.shakeCount}/${this.requiredShakes})`);
        
        // Show visual feedback for each shake
        this.showShakeFeedback();
        
        // Check if we have enough shakes
        if (this.shakeCount >= this.requiredShakes) {
          this.onShakeDetected();
          this.shakeCount = 0; // Reset counter
        }
      }
    }
  }

  private onShakeDetected(): void {
    console.log('[Tab1] Shake detected - toggling debug mode');
    
    // Add visual feedback
    this.showShakeFeedback();
    
    // Toggle debug mode
    this.toggleDebugMode();
  }

  private showShakeFeedback(): void {
    // Add visual feedback to the entire header
    const header = document.querySelector('.main-header ion-toolbar');
    if (header) {
      header.classList.add('shake-feedback');
      setTimeout(() => {
        header.classList.remove('shake-feedback');
      }, 300);
    }
  }

  onTitleClick(): void {
    // Keep title clickable but without triple-tap logic
    console.log('[Tab1] Title clicked - use shake gesture for debug mode');
  }

  // DEBUG: Toggle debug mode
  toggleDebugMode(): void {
    const currentMode = this.isDebugMode();
    if (currentMode) {
      localStorage.removeItem('photo-debug-mode');
      console.log('[Tab1] DEBUG mode disabled');
    } else {
      localStorage.setItem('photo-debug-mode', 'true');
      console.log('[Tab1] DEBUG mode enabled - next photos will use fake locations');
    }
  }
}
