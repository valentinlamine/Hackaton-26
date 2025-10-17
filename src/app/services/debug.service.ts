import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private isDebugMode = false;
  private shakeThreshold = 25; // Much higher threshold for shake
  private shakeTimeout: any = null;
  private lastShakeTime = 0;
  private shakeCount = 0; // Count consecutive shakes
  private requiredShakes = 3; // Need 3 strong shakes
  private shakeWindow = 3000; // 3 seconds window for multiple shakes

  constructor() {
    this.loadDebugState();
  }

  // Check if debug mode is enabled
  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }

  // Toggle debug mode
  toggleDebugMode(): void {
    this.isDebugMode = !this.isDebugMode;
    this.saveDebugState();
    
    if (this.isDebugMode) {
      console.log('[DebugService] DEBUG mode enabled - next photos will use fake locations');
    } else {
      console.log('[DebugService] DEBUG mode disabled');
    }
  }

  // Load debug state from localStorage
  private loadDebugState(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugStorage = localStorage.getItem('photo-debug-mode');
    this.isDebugMode = debugParam === 'true' || debugStorage === 'true';
  }

  // Save debug state to localStorage
  private saveDebugState(): void {
    if (this.isDebugMode) {
      localStorage.setItem('photo-debug-mode', 'true');
    } else {
      localStorage.removeItem('photo-debug-mode');
    }
  }

  // Request motion permissions (iOS 13+)
  async requestMotionPermissions(): Promise<void> {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          console.log('[DebugService] Motion permissions granted');
        } else {
          console.log('[DebugService] Motion permissions denied');
        }
      } catch (error) {
        console.log('[DebugService] Error requesting motion permissions:', error);
      }
    }
  }

  // Add shake detection listener
  addShakeListener(): void {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.onDeviceMotion.bind(this));
    }
  }

  // Remove shake detection listener
  removeShakeListener(): void {
    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', this.onDeviceMotion.bind(this));
    }
  }

  // Handle device motion events
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
        
        console.log(`[DebugService] Shake detected (${this.shakeCount}/${this.requiredShakes})`);
        
        // Check if we have enough shakes
        if (this.shakeCount >= this.requiredShakes) {
          this.onShakeDetected();
          this.shakeCount = 0; // Reset counter
        }
      }
    }
  }

  // Handle successful shake detection
  private onShakeDetected(): void {
    console.log('[DebugService] Shake detected - toggling debug mode');
    
    // Toggle debug mode
    this.toggleDebugMode();
  }

  // Show visual feedback for shake
  private showShakeFeedback(): void {
    // Add visual feedback to the entire header
    const header = document.querySelector('.main-header');
    if (header) {
      header.classList.add('shake-feedback');
      setTimeout(() => {
        header.classList.remove('shake-feedback');
      }, 300);
    }
  }

  // Get random test locations for debug mode
  getRandomTestLocation(): {latitude: number, longitude: number, altitude?: number} {
    const testLocations = [
      // Aix-en-Provence center
      { latitude: 43.5297, longitude: 5.4474, altitude: 150 },
      // Aix-en-Provence - Cours Mirabeau
      { latitude: 43.5267, longitude: 5.4444, altitude: 145 },
      // Aix-en-Provence - Parc Jourdan
      { latitude: 43.5317, longitude: 5.4414, altitude: 155 },
      // Marseille - Vieux Port
      { latitude: 43.2951, longitude: 5.3761, altitude: 10 },
      // Marseille - Notre-Dame de la Garde
      { latitude: 43.2841, longitude: 5.3711, altitude: 150 },
      // Nice - Promenade des Anglais
      { latitude: 43.6959, longitude: 7.2644, altitude: 5 },
      // Cannes - Croisette
      { latitude: 43.5528, longitude: 7.0174, altitude: 8 },
      // Avignon - Palais des Papes
      { latitude: 43.9493, longitude: 4.8055, altitude: 20 },
      // Arles - Amphithéâtre
      { latitude: 43.6766, longitude: 4.6277, altitude: 15 },
      // Nîmes - Arènes
      { latitude: 43.8367, longitude: 4.3601, altitude: 40 }
    ];

    const randomIndex = Math.floor(Math.random() * testLocations.length);
    const location = testLocations[randomIndex];
    
    // Add small random offset to create clusters
    const offsetLat = (Math.random() - 0.5) * 0.01; // ~500m max offset
    const offsetLng = (Math.random() - 0.5) * 0.01;
    
    console.log('[DebugService] Using fake location:', location);
    
    return {
      latitude: location.latitude + offsetLat,
      longitude: location.longitude + offsetLng,
      altitude: location.altitude + (Math.random() - 0.5) * 20
    };
  }
}
