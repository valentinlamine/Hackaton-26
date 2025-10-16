import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { PhotoService } from '../services/photo';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon]
})
export class Tab2Page {

  constructor(public photoService: PhotoService) {
    addIcons({ camera });
  }

  addPhotoToGallery(): void {
    console.log('[Tab2] addPhotoToGallery clicked');
    this.photoService.addNewToGallery();
  }

}
