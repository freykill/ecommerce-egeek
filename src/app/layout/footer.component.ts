import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../core/services/store-context.service';
import { IconComponent } from '../shared/ui/icon.component';

/** Pie de página: CTA, contacto, horarios, redes y formas de pago/entrega. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <!-- Banda CTA -->
    <section class="surface-page pt-20">
      <div
        class="overflow-hidden rounded-[var(--radius-lg)] bg-ink px-6 py-12 sm:px-12 sm:py-16"
      >
        <div class="grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
          <div>
            <p class="font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/50">
              {{ store.storeName() }}
            </p>
            <h2
              class="mt-3 max-w-xl text-3xl font-[650] leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl"
            >
              ¿Listo para armar tu pedido?
            </h2>
            <p class="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/60">
              Elige tus productos y cierra la compra por WhatsApp. Te confirmamos todo al
              instante.
            </p>
          </div>
          <div class="flex flex-wrap gap-3 lg:justify-end">
            <a routerLink="/" class="btn btn-lg bg-surface text-ink hover:bg-surface-sunken">
              Ver catálogo
            </a>
            @if (store.whatsapp()) {
              <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa btn-lg">
                <app-icon name="whatsapp" [size]="18" /> Escríbenos
              </a>
            }
          </div>
        </div>
      </div>
    </section>

    <footer class="mt-20 border-t border-line">
      <div class="surface-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Marca -->
        <div>
          <div class="flex items-center gap-2.5">
            @if (store.logoUrl()) {
              <img
                [src]="store.logoUrl()"
                [alt]="store.storeName()"
                class="h-8 w-auto max-w-[150px] object-contain"
              />
            } @else {
              <span
                class="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-brand text-brand-contrast"
              >
                <app-icon name="store" [size]="16" />
              </span>
              <span class="text-[1.05rem] font-semibold tracking-tight text-ink">
                {{ store.storeName() }}
              </span>
            }
          </div>
          @if (settings()?.bannerText) {
            <p class="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              {{ settings()!.bannerText }}
            </p>
          }
          <!-- Métodos de pago / entrega -->
          <div class="mt-5 flex flex-wrap gap-1.5">
            @if (settings()?.acceptCash) {
              <span class="pill border border-line text-ink-soft">Efectivo</span>
            }
            @if (settings()?.acceptBankTransfer) {
              <span class="pill border border-line text-ink-soft">Transferencia</span>
            }
            @if (settings()?.allowDelivery) {
              <span class="pill border border-line text-ink-soft">Delivery</span>
            }
            @if (settings()?.allowPickup) {
              <span class="pill border border-line text-ink-soft">Retiro</span>
            }
          </div>
        </div>

        <!-- Contacto -->
        <div>
          <h4 class="mb-4 font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Contacto
          </h4>
          <ul class="space-y-3 text-sm text-ink-soft">
            @if (store.whatsapp()) {
              <li>
                <a
                  [href]="waLink()"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 transition-colors hover:text-ink"
                >
                  <app-icon name="whatsapp" [size]="15" /> {{ store.whatsapp() }}
                </a>
              </li>
            }
            @if (settings()?.email) {
              <li>
                <a
                  [href]="'mailto:' + settings()!.email"
                  class="inline-flex items-center gap-2 transition-colors hover:text-ink"
                >
                  <app-icon name="mail" [size]="15" /> {{ settings()!.email }}
                </a>
              </li>
            }
            @if (settings()?.address) {
              <li class="flex items-start gap-2">
                <app-icon name="pin" [size]="15" /> <span>{{ settings()!.address }}</span>
              </li>
            }
          </ul>
        </div>

        <!-- Horarios / compra -->
        <div>
          <h4 class="mb-4 font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Tu compra
          </h4>
          <ul class="space-y-3 text-sm text-ink-soft">
            @if (settings()?.businessHours) {
              <li class="flex items-start gap-2">
                <app-icon name="clock" [size]="15" /> <span>{{ settings()!.businessHours }}</span>
              </li>
            }
            @if (settings()?.allowDelivery) {
              <li class="flex items-center gap-2">
                <app-icon name="truck" [size]="15" /> Delivery disponible
              </li>
            }
            @if (settings()?.allowPickup) {
              <li class="flex items-center gap-2">
                <app-icon name="store" [size]="15" /> Retiro en tienda
              </li>
            }
            <li class="flex items-center gap-2">
              <app-icon name="whatsapp" [size]="15" /> Pedido por WhatsApp
            </li>
          </ul>
        </div>

        <!-- Redes -->
        <div>
          <h4 class="mb-4 font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Síguenos
          </h4>
          <div class="flex gap-2">
            @if (settings()?.facebookUrl) {
              <a
                [href]="settings()!.facebookUrl"
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
                class="social"
              >
                <app-icon name="facebook" [size]="17" />
              </a>
            }
            @if (settings()?.instagramUrl) {
              <a
                [href]="settings()!.instagramUrl"
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                class="social"
              >
                <app-icon name="instagram" [size]="17" />
              </a>
            }
            @if (settings()?.tiktokUrl) {
              <a
                [href]="settings()!.tiktokUrl"
                target="_blank"
                rel="noopener"
                aria-label="TikTok"
                class="social"
              >
                <app-icon name="tiktok" [size]="17" />
              </a>
            }
          </div>
        </div>
      </div>

      <div class="border-t border-line">
        <div
          class="surface-page flex flex-col items-center justify-between gap-2 py-6 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-ink-mute sm:flex-row"
        >
          <span>© {{ year }} {{ store.storeName() }} · Todos los derechos reservados</span>
          <span class="inline-flex items-center gap-1.5">
            <app-icon name="shield" [size]="13" /> Precios confirmados por la tienda
          </span>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .social {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--radius-sm);
        background: var(--surface);
        color: var(--ink);
        border: 1px solid var(--line-strong);
        transition:
          border-color 0.15s ease,
          background 0.15s ease,
          color 0.15s ease;
      }
      .social:hover {
        background: var(--ink);
        border-color: var(--ink);
        color: var(--surface);
      }
    `,
  ],
})
export class FooterComponent {
  protected readonly store = inject(StoreContextService);
  protected readonly settings = this.store.settings;
  protected readonly year = new Date().getFullYear();

  protected readonly waLink = computed(() => {
    const num = (this.store.whatsapp() ?? '').replace(/[^\d]/g, '');
    return num ? `https://wa.me/${num}` : '#';
  });
}
