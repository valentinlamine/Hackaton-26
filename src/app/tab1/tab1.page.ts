import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCheckbox, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, arrowBack, trash } from 'ionicons/icons';
import { PhotoService } from '../services/photo';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCheckbox, IonModal],
})
export class Tab1Page implements OnInit {
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

  constructor(public photoService: PhotoService) {
    addIcons({ camera, arrowBack, trash });
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
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
  }

  closeViewer(): void {
    this.viewerOpen = false;
  }

  toggleViewerControls(): void {
    this.viewerControlsVisible = !this.viewerControlsVisible;
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

  resetSwipeState(): void {
    this.swipeOffset = 0;
    this.swipeTransition = 'none';
    this.isSwipeGesture = false;
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
      this.swipeOffset = deltaX;
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

  async deleteCurrentPhoto(): Promise<void> {
    if (this.photoService.photos[this.currentIndex]) {
      const filepath = this.photoService.photos[this.currentIndex].filepath;
      await this.photoService.deletePhotos([filepath]);
      
      // Adjust current index if needed
      if (this.currentIndex >= this.photoService.photos.length) {
        this.currentIndex = Math.max(0, this.photoService.photos.length - 1);
      }
      
      // Close viewer if no photos left
      if (this.photoService.photos.length === 0) {
        this.closeViewer();
      }
    }
  }
}
