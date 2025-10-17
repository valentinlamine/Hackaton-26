import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heart, heartOutline, calendar, heart as heartIcon, camera, settings, location, arrowUp } from 'ionicons/icons';
import { UserPhoto, PhotoMetadata } from '../../services/photo';

@Component({
  selector: 'app-photo-viewer',
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss'],
  imports: [CommonModule, IonModal, IonButton, IonIcon],
})
export class PhotoViewerComponent {
  @Input() isOpen = false;
  @Input() currentIndex = 0;
  @Input() photos: UserPhoto[] = [];
  @Input() viewerControlsVisible = true;
  @Input() swipeOffset = 0;
  @Input() swipeTransition = 'none';
  @Input() verticalOffset = 0;
  @Input() verticalTransition = 'none';
  @Input() metadataVisible = false;
  @Input() metadataOffset = 0;
  @Input() metadataTransition = 'none';
  @Input() likedFilepaths = new Set<string>();

  @Output() close = new EventEmitter<void>();
  @Output() nextPhoto = new EventEmitter<void>();
  @Output() prevPhoto = new EventEmitter<void>();
  @Output() canSwipeLeft = new EventEmitter<boolean>();
  @Output() canSwipeRight = new EventEmitter<boolean>();
  @Output() viewerClick = new EventEmitter<MouseEvent>();
  @Output() touchStart = new EventEmitter<TouchEvent>();
  @Output() touchMove = new EventEmitter<TouchEvent>();
  @Output() touchEnd = new EventEmitter<TouchEvent>();
  @Output() verticalTouchStart = new EventEmitter<TouchEvent>();
  @Output() verticalTouchMove = new EventEmitter<TouchEvent>();
  @Output() verticalTouchEnd = new EventEmitter<TouchEvent>();
  @Output() metadataTouchStart = new EventEmitter<TouchEvent>();
  @Output() metadataTouchMove = new EventEmitter<TouchEvent>();
  @Output() metadataTouchEnd = new EventEmitter<TouchEvent>();
  @Output() toggleLike = new EventEmitter<string>();
  @Output() deleteCurrent = new EventEmitter<void>();

  constructor() {
    addIcons({ arrowBack, trash, heart, heartOutline, calendar, heartIcon, camera, settings, location, arrowUp });
  }

  onClose(): void {
    this.close.emit();
  }

  onNextPhoto(): void {
    this.nextPhoto.emit();
  }

  onPrevPhoto(): void {
    this.prevPhoto.emit();
  }

  onViewerClick(event: MouseEvent): void {
    this.viewerClick.emit(event);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStart.emit(event);
  }

  onTouchMove(event: TouchEvent): void {
    this.touchMove.emit(event);
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEnd.emit(event);
  }

  onVerticalTouchStart(event: TouchEvent): void {
    this.verticalTouchStart.emit(event);
  }

  onVerticalTouchMove(event: TouchEvent): void {
    this.verticalTouchMove.emit(event);
  }

  onVerticalTouchEnd(event: TouchEvent): void {
    this.verticalTouchEnd.emit(event);
  }

  onMetadataTouchStart(event: TouchEvent): void {
    this.metadataTouchStart.emit(event);
  }

  onMetadataTouchMove(event: TouchEvent): void {
    this.metadataTouchMove.emit(event);
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    this.metadataTouchEnd.emit(event);
  }

  onToggleLike(filepath: string): void {
    this.toggleLike.emit(filepath);
  }

  onDeleteCurrent(): void {
    this.deleteCurrent.emit();
  }

  isLiked(filepath: string): boolean {
    return this.likedFilepaths.has(filepath);
  }

  getCurrentPhoto(): UserPhoto | undefined {
    return this.photos[this.currentIndex];
  }

  // Metadata helper methods
  getPhotoDate(filepath: string): string {
    const photo = this.photos.find(p => p.filepath === filepath);
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

  getDeviceModel(metadata?: PhotoMetadata): string {
    if (!metadata?.deviceModel) return 'Appareil inconnu';
    return metadata.deviceModel;
  }

  getPhotoResolution(metadata?: PhotoMetadata): string {
    if (!metadata?.width || !metadata?.height) return '';
    return `${metadata.width} × ${metadata.height}`;
  }

  hasLocationData(metadata?: PhotoMetadata): boolean {
    return !!(metadata?.latitude && metadata?.longitude);
  }

  getGPSCoordinates(metadata?: PhotoMetadata): string {
    if (!metadata?.latitude || !metadata?.longitude) return 'Non disponible';
    return `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
  }

  getAltitude(metadata?: PhotoMetadata): string {
    if (metadata?.altitude === undefined) return '';
    return `${Math.round(metadata.altitude)} m`;
  }
}
