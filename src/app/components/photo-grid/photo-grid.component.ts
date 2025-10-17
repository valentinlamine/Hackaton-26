import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonImg, IonCheckbox, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';
import { UserPhoto } from '../../services/photo';

@Component({
  selector: 'app-photo-grid',
  templateUrl: './photo-grid.component.html',
  styleUrls: ['./photo-grid.component.scss'],
  imports: [CommonModule, IonGrid, IonRow, IonCol, IonImg, IonCheckbox, IonButton, IonIcon],
})
export class PhotoGridComponent {
  @Input() photos: UserPhoto[] = [];
  @Input() selectionMode = false;
  @Input() selectedFilepaths = new Set<string>();
  @Input() likedFilepaths = new Set<string>();

  @Output() photoClick = new EventEmitter<number>();
  @Output() photoLongPress = new EventEmitter<string>();
  @Output() toggleSelect = new EventEmitter<string>();
  @Output() toggleLike = new EventEmitter<{filepath: string, event: Event}>();

  constructor() {
    addIcons({ heart, heartOutline });
  }

  onPhotoClick(index: number): void {
    this.photoClick.emit(index);
  }

  onPhotoLongPress(filepath: string): void {
    this.photoLongPress.emit(filepath);
  }

  onToggleSelect(filepath: string): void {
    this.toggleSelect.emit(filepath);
  }

  onToggleLike(filepath: string, event: Event): void {
    event.stopPropagation();
    this.toggleLike.emit({ filepath, event });
  }

  isSelected(filepath: string): boolean {
    return this.selectedFilepaths.has(filepath);
  }

  isLiked(filepath: string): boolean {
    return this.likedFilepaths.has(filepath);
  }
}
