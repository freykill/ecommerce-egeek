import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Branding, StoreSettings } from '../models';

/**
 * Aplica el branding de la tienda (colores dinámicos del backend) a las CSS
 * custom properties que usa todo el sistema de diseño. Los tonos derivados
 * (soft / contrast) se calculan aquí o vía color-mix en styles.css.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  apply(branding: Branding | null, settings: StoreSettings | null): void {
    const primary = branding?.primaryColor ?? settings?.primaryColor ?? null;
    const secondary = branding?.secondaryColor ?? settings?.secondaryColor ?? null;
    const root = this.doc.documentElement;

    if (primary) {
      root.style.setProperty('--brand-primary', primary);
      root.style.setProperty('--brand-primary-contrast', this.contrast(primary));
    }
    if (secondary) {
      root.style.setProperty('--brand-secondary', secondary);
      root.style.setProperty('--brand-secondary-contrast', this.contrast(secondary));
    }
  }

  /** Devuelve blanco o casi-negro según la luminancia del color de fondo. */
  private contrast(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return '#ffffff';
    // Luminancia relativa percibida (sRGB).
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? '#1c1917' : '#ffffff';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    let clean = hex.trim().replace('#', '');
    if (clean.length === 3) {
      clean = clean
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (clean.length !== 6) return null;
    const num = Number.parseInt(clean, 16);
    if (Number.isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
}
