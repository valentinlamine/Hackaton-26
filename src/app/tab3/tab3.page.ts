import { Component, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonIcon, IonButtons, IonButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp } from 'ionicons/icons';
import { PhotoService, PhotoMetadata, UserPhoto } from '../services/photo';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonIcon, IonButton, IonModal],
})
export class Tab3Page implements OnInit, ViewWillEnter {
  likedPhotos: UserPhoto[] = [];
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
    addIcons({ arrowBack, trash, heart, heartOutline, calendar, camera, settings, location, arrowUp });
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

  keepControlsVisible(): void {
    this.viewerControlsVisible = true;
  }

  onViewerClick(event: Event): void {
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

  nextPhoto(): void {
    if (this.currentIndex < this.likedPhotos.length - 1) {
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
    return this.currentIndex < this.likedPhotos.length - 1;
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

  async deleteCurrentPhoto(): Promise<void> {
    if (this.likedPhotos[this.currentIndex]) {
      const filepath = this.likedPhotos[this.currentIndex].filepath;
      await this.photoService.deletePhotos([filepath]);
      
      this.updateLikedPhotos();
      
      if (this.currentIndex >= this.likedPhotos.length) {
        this.currentIndex = Math.max(0, this.likedPhotos.length - 1);
      }
      
      this.viewerControlsVisible = true;
      
      if (this.likedPhotos.length === 0) {
        this.closeViewer();
      }
    }
  }

  async toggleLike(filepath: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    await this.photoService.toggleLike(filepath);
    this.updateLikedPhotos();
    
    if (this.viewerOpen) {
      this.viewerControlsVisible = true;
    }
  }

  isLiked(filepath: string): boolean {
    const photo = this.photoService.photos.find(p => p.filepath === filepath);
    return photo?.liked || false;
  }

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
