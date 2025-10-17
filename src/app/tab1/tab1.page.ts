import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonButtons, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, menu, checkmark, trash } from 'ionicons/icons';
import { PhotoService } from '../services/photo';
import { DebugService } from '../services/debug.service';
import { GalleryService } from '../services/gallery.service';
import { ViewerService } from '../services/viewer.service';
import { PhotoGridComponent } from '../components/photo-grid/photo-grid.component';
import { PhotoViewerComponent } from '../components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
    PhotoGridComponent, PhotoViewerComponent
  ],
})
export class Tab1Page implements OnInit, OnDestroy, ViewWillEnter {
  headerVisible = false;

  constructor(
    public photoService: PhotoService,
    private debugService: DebugService,
    public galleryService: GalleryService,
    public viewerService: ViewerService
  ) {
    addIcons({ camera, menu, checkmark, trash });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    await this.debugService.requestMotionPermissions();
    this.debugService.addShakeListener();
  }

  ionViewWillEnter(): void {
    this.photoService.loadSaved();
  }

  ngOnDestroy(): void {
    this.debugService.removeShakeListener();
  }

  // Debug mode
  isDebugMode(): boolean {
    return this.debugService.isDebugEnabled();
  }

  onTitleClick(): void {
    console.log('[Tab1] Title clicked - use shake gesture for debug mode');
  }

  // Handle scroll to show/hide header
  onScroll(event: any): void {
    let scrollTop = 0;
    
    // Handle different event types
    if (event.detail && event.detail.scrollTop !== undefined) {
      scrollTop = event.detail.scrollTop;
    } else if (event.target && event.target.scrollTop !== undefined) {
      scrollTop = event.target.scrollTop;
    }
    
    console.log('[Tab1] Scroll detected:', scrollTop); // Debug log
    this.headerVisible = scrollTop > 20; // Show title after 20px scroll
  }

  // Photo actions
  async addPhotoToGallery(): Promise<void> {
    await this.photoService.addNewToGallery();
  }

  // Gallery actions
  toggleSelectionMode(): void {
    this.galleryService.toggleSelectionMode();
  }

  enterSelectionMode(filepath: string): void {
    this.galleryService.enterSelectionMode(filepath);
  }

  toggleSelect(filepath: string): void {
    this.galleryService.toggleSelect(filepath);
  }

  async deleteSelected(): Promise<void> {
    await this.galleryService.deleteSelected();
  }

  isSelected(filepath: string): boolean {
    return this.galleryService.isSelected(filepath);
  }

  hasSelectedPhotos(): boolean {
    return this.galleryService.hasSelectedPhotos();
  }

  // Photo interactions
  openViewer(index: number): void {
    this.viewerService.openViewer(index);
  }

  closeViewer(): void {
    this.viewerService.closeViewer();
  }

  toggleLike(filepath: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.photoService.toggleLike(filepath);
  }

  isLiked(filepath: string): boolean {
    return this.photoService.isLiked(filepath);
  }

  // Viewer events
  onViewerClick(event: MouseEvent): void {
    this.viewerService.onViewerClick(event);
  }

  onTouchStart(event: TouchEvent): void {
    this.viewerService.onTouchStart(event);
  }

  onTouchMove(event: TouchEvent): void {
    this.viewerService.onTouchMove(event);
  }

  onTouchEnd(event: TouchEvent): void {
    this.viewerService.onTouchEnd(event);
  }


  onMetadataTouchStart(event: TouchEvent): void {
    this.viewerService.onMetadataTouchStart(event);
  }

  onMetadataTouchMove(event: TouchEvent): void {
    this.viewerService.onMetadataTouchMove(event);
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    this.viewerService.onMetadataTouchEnd(event);
  }

  nextPhoto(): void {
    this.viewerService.nextPhoto();
  }

  prevPhoto(): void {
    this.viewerService.prevPhoto();
  }

  canSwipeLeft(): boolean {
    return this.viewerService.canSwipeLeft();
  }

  canSwipeRight(): boolean {
    return this.viewerService.canSwipeRight();
  }

  async deleteCurrentPhoto(): Promise<void> {
    await this.viewerService.deleteCurrentPhoto();
  }

  // Metadata helpers
  getPhotoDate(filepath: string): string {
    const photo = this.photoService.photos.find((p: any) => p.filepath === filepath);
    if (!photo?.metadata) return 'Date inconnue';
    
    const date = new Date(photo.metadata.timestamp || Date.now());
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDeviceModel(metadata?: any): string {
    if (!metadata?.deviceModel) return 'Appareil inconnu';
    return metadata.deviceModel;
  }

  getPhotoResolution(metadata?: any): string {
    if (!metadata?.width || !metadata?.height) return '';
    return `${metadata.width} × ${metadata.height}`;
  }

  hasLocationData(metadata?: any): boolean {
    return !!(metadata?.latitude && metadata?.longitude);
  }

  getGPSCoordinates(metadata?: any): string {
    if (!metadata?.latitude || !metadata?.longitude) return 'Non disponible';
    return `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
  }

  getAltitude(metadata?: any): string {
    if (metadata?.altitude === undefined) return '';
    return `${Math.round(metadata.altitude)} m`;
  }
}