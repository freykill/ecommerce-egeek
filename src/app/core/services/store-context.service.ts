import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Branding, StoreSettings } from '../models';
import { ThemeService } from './theme.service';

/**
 * Estado global de la tienda: branding + settings. Se carga una sola vez al
 * arrancar la app (provideAppInitializer) y expone signals que consumen el
 * header, footer, checkout, pipe de moneda, etc.
 *
 * Si el backend no responde, NO rompe la app: deja los valores por defecto y
 * marca `loadError` para que la UI pueda avisar.
 */
@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly titleSrv = inject(Title);

  readonly branding = signal<Branding | null>(null);
  readonly settings = signal<StoreSettings | null>(null);
  readonly loaded = signal(false);
  readonly loadError = signal(false);

  readonly storeName = computed(
    () => this.settings()?.storeName ?? this.branding()?.storeName ?? 'Tienda',
  );
  readonly logoUrl = computed(
    () => this.branding()?.logoUrl ?? this.settings()?.logoUrl ?? null,
  );
  readonly currencySymbol = computed(() => this.settings()?.currencySymbol ?? 'S/');
  readonly whatsapp = computed(() => this.settings()?.whatsapp ?? null);
  readonly maintenanceMode = computed(() => this.settings()?.maintenanceMode ?? false);

  /** Llamado por provideAppInitializer antes de renderizar. */
  async load(): Promise<void> {
    try {
      const [branding, settings] = await Promise.all([
        firstValueFrom(this.api.get<Branding>('/public/branding')).catch(() => null),
        firstValueFrom(this.api.get<StoreSettings>('/store/settings')).catch(() => null),
      ]);

      if (branding) this.branding.set(branding);
      if (settings) this.settings.set(settings);
      this.theme.apply(branding, settings);

      if (branding || settings) {
        this.titleSrv.setTitle(this.storeName());
      } else {
        this.loadError.set(true);
      }
    } catch {
      this.loadError.set(true);
    } finally {
      this.loaded.set(true);
    }
  }
}
