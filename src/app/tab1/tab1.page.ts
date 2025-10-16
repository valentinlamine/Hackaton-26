import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCheckbox, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
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

  constructor(public photoService: PhotoService) {
    addIcons({ camera });
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
  }

  closeViewer(): void {
    this.viewerOpen = false;
  }
}
