import { Injectable } from '@angular/core';
import { PhotoService, UserPhoto } from './photo';

@Injectable({
  providedIn: 'root'
})
export class ViewerService {
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

  constructor(private photoService: PhotoService) {}

  // Open viewer at specific index
  openViewer(index: number): void {
    this.currentIndex = index;
    this.viewerOpen = true;
    this.viewerControlsVisible = true;
    this.resetViewerState();
  }

  // Close viewer
  closeViewer(): void {
    this.viewerOpen = false;
    this.resetViewerState();
  }

  // Reset viewer state
  private resetViewerState(): void {
    this.swipeOffset = 0;
    this.swipeTransition = 'none';
    this.verticalOffset = 0;
    this.verticalTransition = 'none';
    this.metadataVisible = false;
    this.metadataOffset = 0;
    this.metadataTransition = 'none';
    this.isSwipeGesture = false;
    this.isVerticalGesture = false;
    this.isMetadataScrollGesture = false;
  }

  // Navigation methods
  nextPhoto(): void {
    if (this.canSwipeLeft()) {
      this.currentIndex++;
      this.resetSwipeState();
    }
  }

  prevPhoto(): void {
    if (this.canSwipeRight()) {
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

  private resetSwipeState(): void {
    this.swipeOffset = 0;
    this.swipeTransition = 'transform 0.3s ease-out';
    setTimeout(() => {
      this.swipeTransition = 'none';
    }, 300);
  }

  // Touch handling for swipe
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwipeGesture = false;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.touchStartX || !this.touchStartY) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const diffX = this.touchStartX - currentX;
    const diffY = this.touchStartY - currentY;

    // Determine if this is a horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      this.isSwipeGesture = true;
      this.swipeOffset = -diffX;
      this.swipeTransition = 'none';
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isSwipeGesture) return;

    const diffX = this.touchStartX - event.changedTouches[0].clientX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && this.canSwipeLeft()) {
        this.nextPhoto();
      } else if (diffX < 0 && this.canSwipeRight()) {
        this.prevPhoto();
      }
    }

    this.swipeOffset = 0;
    this.swipeTransition = 'transform 0.3s ease-out';
    setTimeout(() => {
      this.swipeTransition = 'none';
    }, 300);

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSwipeGesture = false;
  }

  // Vertical touch handling for metadata
  onVerticalTouchStart(event: TouchEvent): void {
    this.verticalTouchStartY = event.touches[0].clientY;
    this.isVerticalGesture = false;
  }

  onVerticalTouchMove(event: TouchEvent): void {
    if (!this.verticalTouchStartY) return;

    const currentY = event.touches[0].clientY;
    const diffY = this.verticalTouchStartY - currentY;

    if (Math.abs(diffY) > 10) {
      this.isVerticalGesture = true;
      this.verticalOffset = 0; // Keep image centered, don't move it
      this.verticalTransition = 'none';
    }
  }

  onVerticalTouchEnd(event: TouchEvent): void {
    if (!this.isVerticalGesture) return;

    const diffY = this.verticalTouchStartY - event.changedTouches[0].clientY;
    const threshold = 100;

    if (diffY > threshold) {
      this.showMetadata();
    } else {
      this.hideMetadata();
    }

    this.verticalTouchStartY = 0;
    this.isVerticalGesture = false;
  }

  // Metadata panel methods
  showMetadata(): void {
    this.metadataVisible = true;
    this.metadataOffset = 0;
    this.verticalOffset = 0; // Keep image centered
    this.verticalTransition = 'transform 0.3s ease-out';
    this.metadataTransition = 'transform 0.3s ease-out';
  }

  hideMetadata(): void {
    this.metadataVisible = false;
    this.metadataOffset = 100; // Slide down to hide
    this.verticalOffset = 0; // Keep image centered
    this.verticalTransition = 'transform 0.3s ease-out';
    this.metadataTransition = 'transform 0.3s ease-out';
  }

  // Metadata touch handling
  onMetadataTouchStart(event: TouchEvent): void {
    this.metadataScrollStartY = event.touches[0].clientY;
    this.isMetadataScrollGesture = false;
  }

  onMetadataTouchMove(event: TouchEvent): void {
    if (!this.metadataScrollStartY) return;

    const currentY = event.touches[0].clientY;
    const diffY = this.metadataScrollStartY - currentY;

    if (Math.abs(diffY) > 10) {
      this.isMetadataScrollGesture = true;
      this.metadataOffset = Math.max(0, diffY);
      this.metadataTransition = 'none';
    }
  }

  onMetadataTouchEnd(event: TouchEvent): void {
    if (!this.isMetadataScrollGesture) return;

    const diffY = this.metadataScrollStartY - event.changedTouches[0].clientY;
    const threshold = 50;

    if (diffY > threshold) {
      this.hideMetadata();
    } else {
      this.showMetadata();
    }

    this.metadataScrollStartY = 0;
    this.isMetadataScrollGesture = false;
  }

  // Viewer click handling
  onViewerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      this.viewerControlsVisible = !this.viewerControlsVisible;
    }
  }

  // Delete current photo
  async deleteCurrentPhoto(): Promise<void> {
    if (this.photoService.photos[this.currentIndex]) {
      const photo = this.photoService.photos[this.currentIndex];
      await this.photoService.deletePhotos([photo.filepath]);
      
      // Adjust current index if needed
      if (this.currentIndex >= this.photoService.photos.length) {
        this.currentIndex = this.photoService.photos.length - 1;
      }
      
      // Close viewer if no more photos
      if (this.photoService.photos.length === 0) {
        this.closeViewer();
      }
    }
  }
}
