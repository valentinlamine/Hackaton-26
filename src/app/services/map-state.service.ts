import { Injectable } from '@angular/core';
import { UserPhoto } from './photo';

export interface MapViewerState {
  isOpen: boolean;
  photos: UserPhoto[];
  currentIndex: number;
  controlsVisible: boolean;
  swipeOffset: number;
  swipeTransition: string;
  verticalOffset: number;
  verticalTransition: string;
  metadataVisible: boolean;
  metadataOffset: number;
  metadataTransition: string;
}

export interface MapPhotosListState {
  isOpen: boolean;
  photos: UserPhoto[];
}

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  // Viewer state
  private viewerState: MapViewerState = {
    isOpen: false,
    photos: [],
    currentIndex: 0,
    controlsVisible: true,
    swipeOffset: 0,
    swipeTransition: 'none',
    verticalOffset: 0,
    verticalTransition: 'none',
    metadataVisible: false,
    metadataOffset: 0,
    metadataTransition: 'none'
  };

  // Photos list state
  private photosListState: MapPhotosListState = {
    isOpen: false,
    photos: []
  };

  // Viewer getters
  get viewerOpen(): boolean {
    return this.viewerState.isOpen;
  }

  get viewerPhotos(): UserPhoto[] {
    return this.viewerState.photos;
  }

  get viewerCurrentIndex(): number {
    return this.viewerState.currentIndex;
  }

  get viewerControlsVisible(): boolean {
    return this.viewerState.controlsVisible;
  }

  get viewerSwipeOffset(): number {
    return this.viewerState.swipeOffset;
  }

  get viewerSwipeTransition(): string {
    return this.viewerState.swipeTransition;
  }

  get viewerVerticalOffset(): number {
    return this.viewerState.verticalOffset;
  }

  get viewerVerticalTransition(): string {
    return this.viewerState.verticalTransition;
  }

  get viewerMetadataVisible(): boolean {
    return this.viewerState.metadataVisible;
  }

  get viewerMetadataOffset(): number {
    return this.viewerState.metadataOffset;
  }

  get viewerMetadataTransition(): string {
    return this.viewerState.metadataTransition;
  }

  // Photos list getters
  get photosListOpen(): boolean {
    return this.photosListState.isOpen;
  }

  get photosListPhotos(): UserPhoto[] {
    return this.photosListState.photos;
  }

  // Viewer actions
  openViewer(photos: UserPhoto[], index: number = 0): void {
    this.viewerState = {
      isOpen: true,
      photos: [...photos], // Copy array to avoid reference issues
      currentIndex: index,
      controlsVisible: true,
      swipeOffset: 0,
      swipeTransition: 'none',
      verticalOffset: 0,
      verticalTransition: 'none',
      metadataVisible: false,
      metadataOffset: 0,
      metadataTransition: 'none'
    };
    // Close photos list when opening viewer
    this.photosListState.isOpen = false;
  }

  closeViewer(): void {
    this.viewerState.isOpen = false;
    // If we have multiple photos, return to the photos list
    if (this.viewerState.photos.length > 1) {
      this.openPhotosList(this.viewerState.photos);
    }
  }

  setViewerIndex(index: number): void {
    if (index >= 0 && index < this.viewerState.photos.length) {
      this.viewerState.currentIndex = index;
    }
  }

  nextPhoto(): void {
    if (this.viewerState.currentIndex < this.viewerState.photos.length - 1) {
      this.viewerState.currentIndex++;
    }
  }

  prevPhoto(): void {
    if (this.viewerState.currentIndex > 0) {
      this.viewerState.currentIndex--;
    }
  }

  toggleViewerControls(): void {
    this.viewerState.controlsVisible = !this.viewerState.controlsVisible;
  }

  // Swipe handling
  setSwipeOffset(offset: number): void {
    this.viewerState.swipeOffset = offset;
  }

  setSwipeTransition(transition: string): void {
    this.viewerState.swipeTransition = transition;
  }

  // Metadata handling
  setMetadataVisible(visible: boolean): void {
    this.viewerState.metadataVisible = visible;
  }

  setMetadataOffset(offset: number): void {
    this.viewerState.metadataOffset = offset;
  }

  setMetadataTransition(transition: string): void {
    this.viewerState.metadataTransition = transition;
  }

  setVerticalOffset(offset: number): void {
    this.viewerState.verticalOffset = offset;
  }

  setVerticalTransition(transition: string): void {
    this.viewerState.verticalTransition = transition;
  }

  // Photos list actions
  openPhotosList(photos: UserPhoto[]): void {
    this.photosListState = {
      isOpen: true,
      photos: [...photos] // Copy array to avoid reference issues
    };
  }

  closePhotosList(): void {
    this.photosListState.isOpen = false;
    this.photosListState.photos = [];
  }

  // Utility methods
  canSwipeLeft(): boolean {
    return this.viewerState.currentIndex < this.viewerState.photos.length - 1;
  }

  canSwipeRight(): boolean {
    return this.viewerState.currentIndex > 0;
  }

  getCurrentPhoto(): UserPhoto | undefined {
    return this.viewerState.photos[this.viewerState.currentIndex];
  }

  // Reset all states
  reset(): void {
    this.viewerState = {
      isOpen: false,
      photos: [],
      currentIndex: 0,
      controlsVisible: true,
      swipeOffset: 0,
      swipeTransition: 'none',
      verticalOffset: 0,
      verticalTransition: 'none',
      metadataVisible: false,
      metadataOffset: 0,
      metadataTransition: 'none'
    };
    this.photosListState = {
      isOpen: false,
      photos: []
    };
  }
}
